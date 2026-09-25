import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type ImportPayload = {
  category?: Record<string, unknown>;
  questions?: Array<Record<string, unknown>>;
};

const fileArgument = process.argv.find((argument) => !argument.startsWith('-') && argument !== process.argv[0] && argument !== process.argv[1]);
if (!fileArgument) {
  console.error('Usage: npm run content:import -- <content-batch.json> [--dry-run]');
  process.exit(1);
}

const filePath = resolve(fileArgument);
const payload = JSON.parse(await readFile(filePath, 'utf8')) as ImportPayload;
const questions = payload.questions ?? [];
if (!payload.category && questions.length === 0) {
  throw new Error('The content batch must contain a category, questions, or both.');
}

const chunks: Array<ImportPayload> = [];
if (questions.length === 0) {
  chunks.push({ category: payload.category, questions: [] });
} else {
  for (let index = 0; index < questions.length; index += 100) {
    chunks.push({
      ...(index === 0 && payload.category ? { category: payload.category } : {}),
      questions: questions.slice(index, index + 100),
    });
  }
}

if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ file: filePath, categories: payload.category ? 1 : 0, questions: questions.length, requests: chunks.length }, null, 2));
  process.exit(0);
}

const apiKey = process.env.CONTENT_API_KEY;
if (!apiKey) throw new Error('Set CONTENT_API_KEY before importing content.');
const apiBase = (process.env.CONTENT_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');

let categoriesAdded = 0;
let questionsAdded = 0;
for (let index = 0; index < chunks.length; index += 1) {
  const response = await fetch(`${apiBase}/content/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(chunks[index]),
  });
  const result = await response.json() as { categoriesAdded?: number; questionsAdded?: number; error?: string };
  if (!response.ok) {
    throw new Error(`Import request ${index + 1}/${chunks.length} failed (${response.status}): ${result.error ?? 'Unknown error'}`);
  }
  categoriesAdded += result.categoriesAdded ?? 0;
  questionsAdded += result.questionsAdded ?? 0;
  console.log(`Imported request ${index + 1}/${chunks.length}.`);
}

console.log(JSON.stringify({ categoriesAdded, questionsAdded }, null, 2));
