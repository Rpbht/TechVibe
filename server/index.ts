import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  ContentImportError,
  TechVibeDatabase,
  type ContentCategoryInput,
  type ContentQuestionInput,
  type PublicUser,
} from './database.ts';
import type { QuestionType } from '../src/types/index.ts';

const SERVER_DIRECTORY = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_DIRECTORY = resolve(SERVER_DIRECTORY, '..');
const DIST_DIRECTORY = join(PROJECT_DIRECTORY, 'dist');
const DEFAULT_DATABASE_PATH = join(SERVER_DIRECTORY, 'data', 'techvibe.db');
const SESSION_COOKIE = 'techvibe_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const CONTENT_IMPORT_LIMIT = 100;
const CONTENT_API_KEY_MINIMUM_LENGTH = 32;
const SUPPORTED_ICON_NAMES = new Set([
  'Atom', 'Globe', 'FileCode2', 'Server', 'Terminal', 'Cpu', 'Boxes',
  'Database', 'Network', 'BookOpen', 'Braces', 'Coffee', 'Leaf', 'Code2',
]);
const QUESTION_TYPES = new Set<QuestionType>([
  'conceptual', 'code-explanation', 'debugging', 'scenario',
  'comparison', 'algorithm', 'system-design',
]);
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keyLength: number) => Promise<Buffer>;

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

type LoginAttempt = { count: number; resetAt: number };

function sendJson(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function parsePositiveInteger(value: string | null, fallback: number, maximum: number) {
  if (value === null || value === '') return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

function parseCookies(request: IncomingMessage) {
  const cookies = new Map<string, string>();
  for (const part of (request.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    cookies.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return cookies;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionCookie(token: string, secure: boolean) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}

function clearSessionCookie(secure: boolean) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

function isSecureRequest(request: IncomingMessage) {
  return ('encrypted' in request.socket && request.socket.encrypted === true)
    || request.headers['x-forwarded-proto'] === 'https';
}

async function readJson(request: IncomingMessage, maximumSize = 16_384): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumSize) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_JSON');
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') throw error;
    throw new Error('INVALID_JSON');
  }
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function requiredText(value: unknown, field: string, maximum: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`INVALID_CONTENT:${field} must be a non-empty string of at most ${maximum} characters.`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string, maximum: number) {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredText(value, field, maximum);
}

function textArray(value: unknown, field: string, maximumItems: number, maximumLength: number, required = false) {
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value) || (required && value.length === 0) || value.length > maximumItems) {
    throw new Error(`INVALID_CONTENT:${field} must be an array with ${required ? '1' : '0'} to ${maximumItems} items.`);
  }
  return value.map((item, index) => requiredText(item, `${field}[${index}]`, maximumLength));
}

function objectValue(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`INVALID_CONTENT:${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function contentId(value: unknown, field: string) {
  const id = requiredText(value, field, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`INVALID_CONTENT:${field} must use lowercase letters, numbers, and single hyphens.`);
  }
  return id;
}

function sourceUrl(value: unknown, field: string) {
  const url = requiredText(value, field, 2_048);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('HTTPS_REQUIRED');
    return parsed.toString();
  } catch {
    throw new Error(`INVALID_CONTENT:${field} must be a valid HTTPS URL.`);
  }
}

function questionFingerprint(
  technology: string,
  title: string,
  explanation: string[],
) {
  const normalized = [technology, title, ...explanation]
    .join('\n')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}

function parseContentImport(body: Record<string, unknown>) {
  let category: ContentCategoryInput | null = null;
  if (body.category !== undefined && body.category !== null) {
    const value = objectValue(body.category, 'category');
    const iconName = optionalText(value.iconName, 'category.iconName', 40) ?? 'Code2';
    if (!SUPPORTED_ICON_NAMES.has(iconName)) {
      throw new Error(`INVALID_CONTENT:category.iconName must be one of ${[...SUPPORTED_ICON_NAMES].join(', ')}.`);
    }
    category = {
      id: contentId(value.id, 'category.id'),
      name: requiredText(value.name, 'category.name', 120),
      iconName,
      description: requiredText(value.description, 'category.description', 500),
      subtopics: textArray(value.subtopics, 'category.subtopics', 100, 120) ?? [],
    };
  }

  const questionValues = body.questions === undefined ? [] : body.questions;
  if (!Array.isArray(questionValues) || questionValues.length > CONTENT_IMPORT_LIMIT) {
    throw new Error(`INVALID_CONTENT:questions must be an array with no more than ${CONTENT_IMPORT_LIMIT} items.`);
  }
  if (!category && questionValues.length === 0) {
    throw new Error('INVALID_CONTENT:Provide a category, at least one question, or both.');
  }
  const seenQuestionIds = new Set<string>();
  const questions: ContentQuestionInput[] = questionValues.map((item, index) => {
    const value = objectValue(item, `questions[${index}]`);
    const id = contentId(value.id, `questions[${index}].id`);
    if (seenQuestionIds.has(id)) {
      throw new Error(`INVALID_CONTENT:Question ID "${id}" appears more than once in this request.`);
    }
    seenQuestionIds.add(id);
    const code = value.code === undefined ? undefined : objectValue(value.code, `questions[${index}].code`);
    const complexity = value.complexity === undefined
      ? undefined
      : objectValue(value.complexity, `questions[${index}].complexity`);
    const source = objectValue(value.source, `questions[${index}].source`);
    const questionType = requiredText(value.questionType, `questions[${index}].questionType`, 40) as QuestionType;
    if (!QUESTION_TYPES.has(questionType)) {
      throw new Error(`INVALID_CONTENT:questions[${index}].questionType must be one of ${[...QUESTION_TYPES].join(', ')}.`);
    }
    const technology = contentId(value.technology, `questions[${index}].technology`);
    const title = requiredText(value.title, `questions[${index}].title`, 300);
    const summary = optionalText(value.summary, `questions[${index}].summary`, 2_000);
    const explanation = textArray(value.explanation, `questions[${index}].explanation`, 30, 5_000, true) ?? [];
    return {
      id,
      technology,
      title,
      questionType,
      ...(summary ? { summary } : {}),
      explanation,
      ...(code ? {
        code: {
          language: requiredText(code.language, `questions[${index}].code.language`, 50),
          snippet: requiredText(code.snippet, `questions[${index}].code.snippet`, 50_000),
        },
      } : {}),
      ...((value.pseudoCode !== undefined) ? {
        pseudoCode: textArray(value.pseudoCode, `questions[${index}].pseudoCode`, 50, 1_000) ?? [],
      } : {}),
      ...(complexity ? {
        complexity: {
          time: requiredText(complexity.time, `questions[${index}].complexity.time`, 100),
          space: requiredText(complexity.space, `questions[${index}].complexity.space`, 100),
        },
      } : {}),
      source: {
        title: requiredText(source.title, `questions[${index}].source.title`, 200),
        url: sourceUrl(source.url, `questions[${index}].source.url`),
      },
      contentFingerprint: questionFingerprint(technology, title, explanation),
    };
  });
  return { category, questions };
}

function apiKeyMatches(request: IncomingMessage, configuredKey: string) {
  const header = request.headers['x-api-key'];
  const suppliedKey = Array.isArray(header) ? header[0] : header;
  if (!suppliedKey) return false;
  const expectedHash = createHash('sha256').update(configuredKey).digest();
  const suppliedHash = createHash('sha256').update(suppliedKey).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

async function hashPassword(password: string, salt: string) {
  return (await scryptAsync(password, salt, 64)).toString('hex');
}

function serveFrontend(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }
  const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const relativePath = requestPath === '/' ? 'index.html' : normalize(requestPath).replace(/^([/\\])+/, '');
  let filePath = resolve(DIST_DIRECTORY, relativePath);
  const pathFromDist = relative(DIST_DIRECTORY, filePath);
  if (pathFromDist.startsWith('..') || isAbsolute(pathFromDist)) {
    sendJson(response, 400, { error: 'Invalid path.' });
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) filePath = join(DIST_DIRECTORY, 'index.html');
  if (!existsSync(filePath)) {
    sendJson(response, 404, { error: 'Frontend build not found. Run npm run build first.' });
    return;
  }
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(response);
}

export function createTechVibeServer(
  databasePath = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH,
  contentApiKey = process.env.CONTENT_API_KEY ?? '',
) {
  const database = new TechVibeDatabase(databasePath);
  const loginAttempts = new Map<string, LoginAttempt>();
  const contentAuthAttempts = new Map<string, LoginAttempt>();

  function currentUser(request: IncomingMessage): PublicUser | null {
    const token = parseCookies(request).get(SESSION_COOKIE);
    return token ? database.findUserBySession(hashToken(token), Math.floor(Date.now() / 1000)) : null;
  }

  function createAuthenticatedSession(response: ServerResponse, request: IncomingMessage, user: PublicUser) {
    const token = randomBytes(32).toString('base64url');
    database.createSession(hashToken(token), user.id, Math.floor(Date.now() / 1000) + SESSION_SECONDS);
    sendJson(response, 200, { user }, { 'Set-Cookie': sessionCookie(token, isSecureRequest(request)) });
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const method = request.method ?? 'GET';
      const user = currentUser(request);

      if (url.pathname === '/api/health' && method === 'GET') {
        sendJson(response, 200, { status: database.health() ? 'ok' : 'unavailable' });
        return;
      }
      if (url.pathname === '/api/auth/me' && method === 'GET') {
        sendJson(response, 200, { user });
        return;
      }
      if (url.pathname === '/api/auth/register' && method === 'POST') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        if (!validEmail(email) || !validPassword(body.password)) {
          sendJson(response, 400, { error: 'Enter a valid email and a password between 8 and 128 characters.' });
          return;
        }
        if (database.findUserByEmail(email)) {
          sendJson(response, 409, { error: 'An account already exists for this email.' });
          return;
        }
        const salt = randomBytes(16).toString('hex');
        const createdUser = database.createUser(
          email,
          await hashPassword(body.password, salt),
          salt,
        );
        createAuthenticatedSession(response, request, createdUser);
        return;
      }
      if (url.pathname === '/api/auth/login' && method === 'POST') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        const password = typeof body.password === 'string' ? body.password : '';
        const attemptKey = `${request.socket.remoteAddress ?? 'local'}:${email}`;
        const now = Date.now();
        const attempts = loginAttempts.get(attemptKey);
        if (attempts && attempts.resetAt > now && attempts.count >= 5) {
          sendJson(response, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' });
          return;
        }
        const foundUser = database.findUserByEmail(email);
        const candidateHash = foundUser && validPassword(password)
          ? await hashPassword(password, foundUser.passwordSalt)
          : null;
        const passwordMatches = Boolean(
          foundUser && candidateHash && timingSafeEqual(Buffer.from(foundUser.passwordHash, 'hex'), Buffer.from(candidateHash, 'hex')),
        );
        if (!foundUser || !passwordMatches) {
          loginAttempts.set(attemptKey, {
            count: attempts && attempts.resetAt > now ? attempts.count + 1 : 1,
            resetAt: now + 15 * 60 * 1000,
          });
          sendJson(response, 401, { error: 'Invalid email or password.' });
          return;
        }
        loginAttempts.delete(attemptKey);
        createAuthenticatedSession(response, request, {
          id: foundUser.id,
          email: foundUser.email,
        });
        return;
      }
      if (url.pathname === '/api/auth/logout' && method === 'POST') {
        const token = parseCookies(request).get(SESSION_COOKIE);
        if (token) database.deleteSession(hashToken(token));
        sendJson(response, 200, { success: true }, { 'Set-Cookie': clearSessionCookie(isSecureRequest(request)) });
        return;
      }
      if (url.pathname === '/api/technologies' && method === 'GET') {
        const useDefaultOrder = url.searchParams.get('default') === 'true';
        sendJson(response, 200, database.getTechnologies(useDefaultOrder ? undefined : user?.id));
        return;
      }
      if (url.pathname === '/api/profile/category-order' && method === 'PUT') {
        if (!user) {
          sendJson(response, 401, { error: 'Sign in to save a category order.' });
          return;
        }
        const body = await readJson(request);
        const categoryIds = body.categoryIds;
        const expectedIds = database.getTechnologyIds();
        if (!Array.isArray(categoryIds) || categoryIds.some((id) => typeof id !== 'string')) {
          sendJson(response, 400, { error: 'Category order must be an array of category IDs.' });
          return;
        }
        const uniqueIds = new Set(categoryIds);
        if (categoryIds.length !== expectedIds.length || uniqueIds.size !== expectedIds.length || expectedIds.some((id) => !uniqueIds.has(id))) {
          sendJson(response, 400, { error: 'Category order must contain every category exactly once.' });
          return;
        }
        database.setUserCategoryOrder(user.id, categoryIds as string[]);
        sendJson(response, 200, { success: true });
        return;
      }
      if (url.pathname === '/api/questions' && method === 'GET') {
        const technology = url.searchParams.get('technology')?.trim();
        const page = parsePositiveInteger(url.searchParams.get('page'), 1, 1_000_000);
        const limit = parsePositiveInteger(url.searchParams.get('limit'), 20, 100);
        if (!technology) {
          sendJson(response, 400, { error: 'The technology query parameter is required.' });
          return;
        }
        if (page === null || limit === null) {
          sendJson(response, 400, { error: 'Page and limit must be positive integers; limit cannot exceed 100.' });
          return;
        }
        sendJson(response, 200, database.getQuestions(technology, page, limit));
        return;
      }
      if (url.pathname === '/api/content/import' && method === 'POST') {
        if (contentApiKey.length < CONTENT_API_KEY_MINIMUM_LENGTH) {
          sendJson(response, 503, { error: 'Content import is not configured.' });
          return;
        }
        const attemptKey = request.socket.remoteAddress ?? 'local';
        const now = Date.now();
        const attempts = contentAuthAttempts.get(attemptKey);
        if (attempts && attempts.resetAt > now && attempts.count >= 10) {
          sendJson(response, 429, { error: 'Too many invalid API key attempts. Try again later.' });
          return;
        }
        if (!apiKeyMatches(request, contentApiKey)) {
          contentAuthAttempts.set(attemptKey, {
            count: attempts && attempts.resetAt > now ? attempts.count + 1 : 1,
            resetAt: now + 15 * 60 * 1000,
          });
          sendJson(response, 401, { error: 'Invalid API key.' });
          return;
        }
        contentAuthAttempts.delete(attemptKey);
        const body = await readJson(request, 1_048_576);
        const { category, questions } = parseContentImport(body);
        const result = database.importContent(category, questions);
        sendJson(response, 201, result);
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        const knownPath = ['/api/health', '/api/auth/me', '/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/technologies', '/api/profile/category-order', '/api/questions', '/api/content/import'].includes(url.pathname);
        sendJson(response, knownPath ? 405 : 404, { error: knownPath ? 'Method not allowed.' : 'API route not found.' });
        return;
      }
      serveFrontend(request, response);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_JSON') {
        sendJson(response, 400, { error: 'Request body must be valid JSON.' });
        return;
      }
      if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
        sendJson(response, 413, { error: 'Request body is too large.' });
        return;
      }
      if (error instanceof Error && error.message.startsWith('INVALID_CONTENT:')) {
        sendJson(response, 400, { error: error.message.slice('INVALID_CONTENT:'.length) });
        return;
      }
      if (error instanceof ContentImportError) {
        sendJson(response, error.code === 'TECHNOLOGY_NOT_FOUND' ? 400 : 409, { error: error.message });
        return;
      }
      console.error(error);
      sendJson(response, 500, { error: 'Unexpected server error.' });
    }
  });

  database.deleteExpiredSessions(Math.floor(Date.now() / 1000));
  server.on('close', () => database.close());
  return server;
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  const port = Number(process.env.PORT || 5000);
  const server = createTechVibeServer();
  server.listen(port, () => console.log(`TechVibe is running at http://localhost:${port}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
