import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { TECHNOLOGIES } from '../src/data/technologies.ts';
import { QUESTIONS_DATA } from '../src/data/questionsData.ts';
import type { QuestionItem, QuestionSource, QuestionType, TechnologyMeta } from '../src/types/index.ts';

type QuestionRow = {
  id: string;
  technology_id: string;
  title: string;
  summary: string | null;
  code_language: string | null;
  code_snippet: string | null;
  time_complexity: string | null;
  space_complexity: string | null;
  question_type: QuestionType;
  source_title: string | null;
  source_url: string | null;
};

type OrderedTextRow = { question_id: string; content: string };

export type QuestionPage = {
  data: QuestionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  passwordSalt: string;
};

export type PublicUser = {
  id: number;
  email: string;
};

export type ContentCategoryInput = {
  id: string;
  name: string;
  iconName: string;
  description: string;
  subtopics: string[];
};

export type ContentQuestionInput = QuestionItem & {
  questionType: QuestionType;
  source: QuestionSource;
  contentFingerprint: string;
};

export class ContentImportError extends Error {
  readonly code: 'CATEGORY_EXISTS' | 'QUESTION_EXISTS' | 'QUESTION_DUPLICATE' | 'TECHNOLOGY_NOT_FOUND';

  constructor(
    code: 'CATEGORY_EXISTS' | 'QUESTION_EXISTS' | 'QUESTION_DUPLICATE' | 'TECHNOLOGY_NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'ContentImportError';
    this.code = code;
  }
}

export class TechVibeDatabase {
  readonly connection: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.connection = new DatabaseSync(databasePath);
    this.connection.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.migrate();
    this.seedWhenEmpty();
    this.applyContentMigrations();
  }

  private migrate() {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS technologies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS technology_subtopics (
        technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        PRIMARY KEY (technology_id, sort_order)
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        summary TEXT,
        code_language TEXT,
        code_snippet TEXT,
        time_complexity TEXT,
        space_complexity TEXT,
        question_type TEXT NOT NULL DEFAULT 'conceptual',
        source_title TEXT,
        source_url TEXT,
        content_fingerprint TEXT,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (technology_id, sort_order)
      );

      CREATE INDEX IF NOT EXISTS idx_questions_technology_order
        ON questions (technology_id, sort_order);

      CREATE TABLE IF NOT EXISTS question_explanations (
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        content TEXT NOT NULL,
        PRIMARY KEY (question_id, sort_order)
      );

      CREATE TABLE IF NOT EXISTS question_pseudo_code (
        question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        content TEXT NOT NULL,
        PRIMARY KEY (question_id, sort_order)
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_expiry
        ON sessions (user_id, expires_at);

      CREATE TABLE IF NOT EXISTS user_category_order (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        PRIMARY KEY (user_id, technology_id),
        UNIQUE (user_id, sort_order)
      );

    `);

    const version = this.connection.prepare('PRAGMA user_version').get() as { user_version: number };
    if (version.user_version === 0) this.connection.exec('PRAGMA user_version = 1');
  }

  private seedWhenEmpty() {
    const row = this.connection.prepare('SELECT COUNT(*) AS count FROM technologies').get() as { count: number };
    if (row.count > 0) return;

    const insertTechnology = this.connection.prepare(`
      INSERT INTO technologies (id, name, icon_name, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertSubtopic = this.connection.prepare(`
      INSERT INTO technology_subtopics (technology_id, sort_order, name) VALUES (?, ?, ?)
    `);
    const insertQuestion = this.connection.prepare(`
      INSERT INTO questions (
        id, technology_id, title, summary, code_language, code_snippet,
        time_complexity, space_complexity, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertExplanation = this.connection.prepare(`
      INSERT INTO question_explanations (question_id, sort_order, content) VALUES (?, ?, ?)
    `);
    const insertPseudoCode = this.connection.prepare(`
      INSERT INTO question_pseudo_code (question_id, sort_order, content) VALUES (?, ?, ?)
    `);

    this.connection.exec('BEGIN IMMEDIATE');
    try {
      TECHNOLOGIES.forEach((technology, technologyIndex) => {
        insertTechnology.run(
          technology.id,
          technology.name,
          technology.iconName,
          technology.description,
          technologyIndex,
        );
        technology.subtopics?.forEach((subtopic, subtopicIndex) => {
          insertSubtopic.run(technology.id, subtopicIndex, subtopic);
        });
      });

      const orderByTechnology = new Map<string, number>();
      QUESTIONS_DATA.forEach((question) => {
        const sortOrder = orderByTechnology.get(question.technology) ?? 0;
        orderByTechnology.set(question.technology, sortOrder + 1);
        insertQuestion.run(
          question.id,
          question.technology,
          question.title,
          question.summary ?? null,
          question.code?.language ?? null,
          question.code?.snippet ?? null,
          question.complexity?.time ?? null,
          question.complexity?.space ?? null,
          sortOrder,
        );
        question.explanation.forEach((paragraph, paragraphIndex) => {
          insertExplanation.run(question.id, paragraphIndex, paragraph);
        });
        question.pseudoCode?.forEach((step, stepIndex) => {
          insertPseudoCode.run(question.id, stepIndex, step);
        });
      });
      this.connection.exec('COMMIT');
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  private applyContentMigrations() {
    let version = this.connection.prepare('PRAGMA user_version').get() as { user_version: number };

    const insertSubtopic = this.connection.prepare(`
      INSERT OR IGNORE INTO technology_subtopics (technology_id, sort_order, name)
      VALUES (?, ?, ?)
    `);

    if (version.user_version < 3) {
      const insertTechnology = this.connection.prepare(`
        INSERT INTO technologies (id, name, icon_name, description, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET sort_order = excluded.sort_order
      `);

      this.connection.exec('BEGIN IMMEDIATE');
      try {
        this.connection.exec('UPDATE technologies SET sort_order = sort_order + 1000');
        TECHNOLOGIES.forEach((technology, technologyIndex) => {
          insertTechnology.run(
            technology.id,
            technology.name,
            technology.iconName,
            technology.description,
            technologyIndex,
          );
          technology.subtopics?.forEach((subtopic, subtopicIndex) => {
            insertSubtopic.run(technology.id, subtopicIndex, subtopic);
          });
        });
        this.connection.exec('PRAGMA user_version = 3');
        this.connection.exec('COMMIT');
      } catch (error) {
        this.connection.exec('ROLLBACK');
        throw error;
      }
      version = { user_version: 3 };
    }

    if (version.user_version < 4) {
      const dsaCategory = TECHNOLOGIES.find(({ id }) => id === 'dsa');
      if (!dsaCategory) throw new Error('DSA category is required for content migration 4.');

      this.connection.exec('BEGIN IMMEDIATE');
      try {
        this.connection.prepare('DELETE FROM technology_subtopics WHERE technology_id = ?').run('dsa');
        dsaCategory.subtopics?.forEach((subtopic, subtopicIndex) => {
          insertSubtopic.run('dsa', subtopicIndex, subtopic);
        });
        this.connection.exec('PRAGMA user_version = 4');
        this.connection.exec('COMMIT');
      } catch (error) {
        this.connection.exec('ROLLBACK');
        throw error;
      }
      version = { user_version: 4 };
    }

    if (version.user_version < 5) {
      this.connection.exec('PRAGMA user_version = 5');
      version = { user_version: 5 };
    }

    if (version.user_version < 6) {
      this.connection.exec('PRAGMA user_version = 6');
      version = { user_version: 6 };
    }

    if (version.user_version < 7) {
      const columns = this.connection.prepare('PRAGMA table_info(questions)').all() as Array<{ name: string }>;
      const columnNames = new Set(columns.map(({ name }) => name));
      if (!columnNames.has('question_type')) {
        this.connection.exec("ALTER TABLE questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'conceptual'");
      }
      if (!columnNames.has('source_title')) {
        this.connection.exec('ALTER TABLE questions ADD COLUMN source_title TEXT');
      }
      if (!columnNames.has('source_url')) {
        this.connection.exec('ALTER TABLE questions ADD COLUMN source_url TEXT');
      }
      if (!columnNames.has('content_fingerprint')) {
        this.connection.exec('ALTER TABLE questions ADD COLUMN content_fingerprint TEXT');
      }
      this.connection.exec(`
        UPDATE questions
        SET question_type = CASE WHEN code_snippet IS NOT NULL THEN 'code-explanation' ELSE 'conceptual' END,
            content_fingerprint = COALESCE(content_fingerprint, 'legacy:' || id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_content_fingerprint
          ON questions (content_fingerprint) WHERE content_fingerprint IS NOT NULL;
        PRAGMA user_version = 7;
      `);
    }
  }

  getTechnologies(userId?: number): TechnologyMeta[] {
    const technologies = this.connection.prepare(`
      SELECT t.id, t.name, t.icon_name, t.description, t.sort_order AS base_sort_order,
             COUNT(q.id) AS question_count
      FROM technologies t
      LEFT JOIN questions q ON q.technology_id = t.id
      GROUP BY t.id
      ORDER BY t.sort_order
    `).all() as Array<{
      id: string;
      name: string;
      icon_name: string;
      description: string;
      base_sort_order: number;
      question_count: number;
    }>;
    const subtopics = this.connection.prepare(`
      SELECT technology_id, name FROM technology_subtopics ORDER BY technology_id, sort_order
    `).all() as Array<{ technology_id: string; name: string }>;
    const subtopicsByTechnology = new Map<string, string[]>();
    subtopics.forEach(({ technology_id, name }) => {
      const values = subtopicsByTechnology.get(technology_id) ?? [];
      values.push(name);
      subtopicsByTechnology.set(technology_id, values);
    });

    const customOrder = new Map<string, number>();
    if (userId !== undefined) {
      const rows = this.connection.prepare(`
        SELECT technology_id, sort_order
        FROM user_category_order
        WHERE user_id = ?
      `).all(userId) as Array<{ technology_id: string; sort_order: number }>;
      rows.forEach(({ technology_id, sort_order }) => customOrder.set(technology_id, sort_order));
    }

    technologies.sort((left, right) => {
      const leftCustom = customOrder.get(left.id);
      const rightCustom = customOrder.get(right.id);
      if (leftCustom !== undefined && rightCustom !== undefined) return leftCustom - rightCustom;
      if (leftCustom !== undefined) return -1;
      if (rightCustom !== undefined) return 1;
      return left.base_sort_order - right.base_sort_order;
    });

    return technologies.map((technology) => ({
      id: technology.id,
      name: technology.name,
      iconName: technology.icon_name,
      description: technology.description,
      subtopics: subtopicsByTechnology.get(technology.id) ?? [],
      questionCount: technology.question_count,
    }));
  }

  createUser(
    email: string,
    passwordHash: string,
    passwordSalt: string,
  ): PublicUser {
    const result = this.connection.prepare(`
      INSERT INTO users (email, password_hash, password_salt)
      VALUES (?, ?, ?)
    `).run(email, passwordHash, passwordSalt);
    return { id: Number(result.lastInsertRowid), email };
  }

  findUserByEmail(email: string): UserRecord | null {
    const row = this.connection.prepare(`
      SELECT id, email, password_hash, password_salt
      FROM users WHERE email = ?
    `).get(email) as {
      id: number;
      email: string;
      password_hash: string;
      password_salt: string;
    } | undefined;
    return row ? {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
    } : null;
  }

  createSession(tokenHash: string, userId: number, expiresAt: number) {
    this.connection.prepare(`
      INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)
    `).run(tokenHash, userId, expiresAt);
  }

  findUserBySession(tokenHash: string, now: number): PublicUser | null {
    const row = this.connection.prepare(`
      SELECT u.id, u.email
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(tokenHash, now) as PublicUser | undefined;
    return row ?? null;
  }

  deleteSession(tokenHash: string) {
    this.connection.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }

  deleteExpiredSessions(now: number) {
    this.connection.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  }

  getTechnologyIds(): string[] {
    const rows = this.connection.prepare('SELECT id FROM technologies ORDER BY sort_order').all() as Array<{ id: string }>;
    return rows.map(({ id }) => id);
  }

  setUserCategoryOrder(userId: number, technologyIds: string[]) {
    const insertOrder = this.connection.prepare(`
      INSERT INTO user_category_order (user_id, technology_id, sort_order) VALUES (?, ?, ?)
    `);
    this.connection.exec('BEGIN IMMEDIATE');
    try {
      this.connection.prepare('DELETE FROM user_category_order WHERE user_id = ?').run(userId);
      technologyIds.forEach((technologyId, index) => insertOrder.run(userId, technologyId, index));
      this.connection.exec('COMMIT');
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  importContent(category: ContentCategoryInput | null, questions: ContentQuestionInput[]) {
    const insertTechnology = this.connection.prepare(`
      INSERT INTO technologies (id, name, icon_name, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertSubtopic = this.connection.prepare(`
      INSERT INTO technology_subtopics (technology_id, sort_order, name) VALUES (?, ?, ?)
    `);
    const insertQuestion = this.connection.prepare(`
      INSERT INTO questions (
        id, technology_id, title, summary, code_language, code_snippet,
        time_complexity, space_complexity, question_type, source_title, source_url,
        content_fingerprint, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertExplanation = this.connection.prepare(`
      INSERT INTO question_explanations (question_id, sort_order, content) VALUES (?, ?, ?)
    `);
    const insertPseudoCode = this.connection.prepare(`
      INSERT INTO question_pseudo_code (question_id, sort_order, content) VALUES (?, ?, ?)
    `);

    this.connection.exec('BEGIN IMMEDIATE');
    try {
      if (category) {
        const existing = this.connection.prepare('SELECT 1 FROM technologies WHERE id = ?').get(category.id);
        if (existing) {
          throw new ContentImportError('CATEGORY_EXISTS', `Category "${category.id}" already exists.`);
        }
        const nextOrder = this.connection.prepare(`
          SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM technologies
        `).get() as { next_order: number };
        insertTechnology.run(
          category.id,
          category.name,
          category.iconName,
          category.description,
          nextOrder.next_order,
        );
        category.subtopics.forEach((subtopic, index) => insertSubtopic.run(category.id, index, subtopic));
      }

      const nextOrders = new Map<string, number>();
      for (const question of questions) {
        const technologyExists = this.connection.prepare('SELECT 1 FROM technologies WHERE id = ?').get(question.technology);
        if (!technologyExists) {
          throw new ContentImportError(
            'TECHNOLOGY_NOT_FOUND',
            `Category "${question.technology}" does not exist.`,
          );
        }
        const questionExists = this.connection.prepare('SELECT 1 FROM questions WHERE id = ?').get(question.id);
        if (questionExists) {
          throw new ContentImportError('QUESTION_EXISTS', `Question "${question.id}" already exists.`);
        }
        const duplicateContent = this.connection.prepare(`
          SELECT id FROM questions WHERE content_fingerprint = ?
        `).get(question.contentFingerprint) as { id: string } | undefined;
        if (duplicateContent) {
          throw new ContentImportError(
            'QUESTION_DUPLICATE',
            `Question content duplicates existing question "${duplicateContent.id}".`,
          );
        }
        let sortOrder = nextOrders.get(question.technology);
        if (sortOrder === undefined) {
          const next = this.connection.prepare(`
            SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
            FROM questions WHERE technology_id = ?
          `).get(question.technology) as { next_order: number };
          sortOrder = next.next_order;
        }
        nextOrders.set(question.technology, sortOrder + 1);
        insertQuestion.run(
          question.id,
          question.technology,
          question.title,
          question.summary ?? null,
          question.code?.language ?? null,
          question.code?.snippet ?? null,
          question.complexity?.time ?? null,
          question.complexity?.space ?? null,
          question.questionType,
          question.source.title,
          question.source.url,
          question.contentFingerprint,
          sortOrder,
        );
        question.explanation.forEach((paragraph, index) => insertExplanation.run(question.id, index, paragraph));
        question.pseudoCode?.forEach((step, index) => insertPseudoCode.run(question.id, index, step));
      }
      this.connection.exec('COMMIT');
      return { categoriesAdded: category ? 1 : 0, questionsAdded: questions.length };
    } catch (error) {
      this.connection.exec('ROLLBACK');
      throw error;
    }
  }

  getQuestions(technology: string, page: number, limit: number): QuestionPage {
    const totalRow = this.connection.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE technology_id = ?
    `).get(technology) as { count: number };
    const rows = this.connection.prepare(`
      SELECT id, technology_id, title, summary, code_language, code_snippet,
             time_complexity, space_complexity, question_type, source_title, source_url
      FROM questions
      WHERE technology_id = ?
      ORDER BY sort_order, id
      LIMIT ? OFFSET ?
    `).all(technology, limit, (page - 1) * limit) as QuestionRow[];

    const explanations = this.getOrderedText('question_explanations', rows.map((row) => row.id));
    const pseudoCode = this.getOrderedText('question_pseudo_code', rows.map((row) => row.id));

    return {
      data: rows.map((row) => ({
        id: row.id,
        technology: row.technology_id,
        title: row.title,
        questionType: row.question_type,
        ...(row.summary ? { summary: row.summary } : {}),
        explanation: explanations.get(row.id) ?? [],
        ...(row.code_language && row.code_snippet
          ? { code: { language: row.code_language, snippet: row.code_snippet } }
          : {}),
        ...((pseudoCode.get(row.id)?.length ?? 0) > 0
          ? { pseudoCode: pseudoCode.get(row.id) }
          : {}),
        ...(row.time_complexity && row.space_complexity
          ? { complexity: { time: row.time_complexity, space: row.space_complexity } }
          : {}),
        ...(row.source_title && row.source_url
          ? { source: { title: row.source_title, url: row.source_url } }
          : {}),
      })),
      total: totalRow.count,
      page,
      limit,
      totalPages: totalRow.count === 0 ? 0 : Math.ceil(totalRow.count / limit),
    };
  }

  private getOrderedText(table: 'question_explanations' | 'question_pseudo_code', questionIds: string[]) {
    const result = new Map<string, string[]>();
    if (questionIds.length === 0) return result;
    const placeholders = questionIds.map(() => '?').join(', ');
    const rows = this.connection.prepare(`
      SELECT question_id, content FROM ${table}
      WHERE question_id IN (${placeholders})
      ORDER BY question_id, sort_order
    `).all(...questionIds) as OrderedTextRow[];
    rows.forEach(({ question_id, content }) => {
      const values = result.get(question_id) ?? [];
      values.push(content);
      result.set(question_id, values);
    });
    return result;
  }

  health() {
    const result = this.connection.prepare('SELECT 1 AS ok').get() as { ok: number };
    return result.ok === 1;
  }

  close() {
    this.connection.close();
  }
}
