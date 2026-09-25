import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TechVibeDatabase,
  type ContentQuestionInput,
} from '../server/database.ts';
import type { QuestionItem, QuestionSource, QuestionType } from '../src/types/index.ts';

type BatchQuestion = QuestionItem & {
  questionType: QuestionType;
  source: QuestionSource;
};

type ContentBatch = {
  questions?: BatchQuestion[];
};

const databasePath = resolve(process.env.DATABASE_PATH || 'server/data/techvibe.db');
const batchDirectory = resolve(process.env.CONTENT_BATCH_DIRECTORY || 'content/batches');

if (existsSync(databasePath)) {
  throw new Error(`Refusing to overwrite existing database at ${databasePath}`);
}

const batchNumber = (fileName: string) => {
  const match = fileName.match(/-(\d+)\.json$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const files = readdirSync(batchDirectory)
  .filter((fileName) => fileName.endsWith('.json'))
  .sort((left, right) => batchNumber(left) - batchNumber(right) || left.localeCompare(right));

const fingerprint = (question: BatchQuestion) => {
  const normalized = [question.technology, question.title, ...question.explanation]
    .join('\n')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
};

const database = new TechVibeDatabase(databasePath);
let importedQuestions = 0;

try {
  for (const fileName of files) {
    const batch = JSON.parse(readFileSync(resolve(batchDirectory, fileName), 'utf8')) as ContentBatch;
    const questions: ContentQuestionInput[] = (batch.questions ?? []).map((question) => ({
      ...question,
      contentFingerprint: fingerprint(question),
    }));
    const result = database.importContent(null, questions);
    importedQuestions += result.questionsAdded;
  }
} finally {
  database.close();
}

console.log(JSON.stringify({ databasePath, batches: files.length, importedQuestions }, null, 2));
