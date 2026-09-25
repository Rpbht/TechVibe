import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { TECHNOLOGIES } from '../src/data/technologies.ts';

const PROJECT_DIRECTORY = resolve(import.meta.dirname, '..');
const QUESTION_TYPES = new Set([
  'conceptual', 'code-explanation', 'debugging', 'scenario',
  'comparison', 'algorithm', 'system-design',
]);

test('source registry covers every category with HTTPS references', () => {
  const registry = JSON.parse(readFileSync(join(PROJECT_DIRECTORY, 'content', 'sources.json'), 'utf8')) as {
    categories: Record<string, Array<{ title: string; url: string }>>;
  };
  const expectedIds = TECHNOLOGIES.map(({ id }) => id).sort();
  assert.deepEqual(Object.keys(registry.categories).sort(), expectedIds);
  for (const [categoryId, sources] of Object.entries(registry.categories)) {
    assert.ok(sources.length > 0, `${categoryId} must have at least one source`);
    for (const source of sources) {
      assert.ok(source.title.trim(), `${categoryId} has a source without a title`);
      assert.equal(new URL(source.url).protocol, 'https:');
    }
  }
});

test('versioned content batches contain unique, sourced questions', () => {
  const directory = join(PROJECT_DIRECTORY, 'content', 'batches');
  const categoryIds = new Set(TECHNOLOGIES.map(({ id }) => id));
  const questionIds = new Set<string>();
  for (const filename of readdirSync(directory).filter((name) => name.endsWith('.json'))) {
    const batch = JSON.parse(readFileSync(join(directory, filename), 'utf8')) as {
      questions?: Array<{
        id: string;
        technology: string;
        title: string;
        questionType: string;
        explanation: string[];
        source: { title: string; url: string };
      }>;
    };
    for (const question of batch.questions ?? []) {
      assert.ok(!questionIds.has(question.id), `Duplicate versioned question ID: ${question.id}`);
      questionIds.add(question.id);
      assert.ok(categoryIds.has(question.technology), `Unknown category: ${question.technology}`);
      assert.ok(question.title.trim());
      assert.ok(QUESTION_TYPES.has(question.questionType), `Unknown question type: ${question.questionType}`);
      assert.ok(question.explanation.length > 0);
      assert.ok(question.source.title.trim());
      assert.equal(new URL(question.source.url).protocol, 'https:');
    }
  }
  assert.ok(questionIds.size > 0);
});
