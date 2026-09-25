import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TechVibeDatabase } from './database.ts';

test('seeds and returns database-backed technologies and paginated questions', () => {
  const directory = mkdtempSync(join(tmpdir(), 'techvibe-'));
  const database = new TechVibeDatabase(join(directory, 'test.db'));

  try {
    const technologies = database.getTechnologies();
    assert.equal(technologies.length, 70);
    assert.deepEqual(
      technologies.slice(0, 5).map(({ id }) => id),
      ['general-engineering', 'java', 'spring-boot', 'react', 'angular'],
    );
    assert.equal(technologies[0]?.questionCount, 0);
    assert.equal(technologies[0]?.subtopics?.length, 4);
    assert.equal(technologies[3]?.questionCount, 3);
    const dataStructures = technologies.find(({ id }) => id === 'dsa');
    assert.equal(dataStructures?.subtopics?.length, 24);
    assert.ok(dataStructures?.subtopics?.includes('Concurrent & Lock-Free Data Structures'));

    const secondReactQuestion = database.getQuestions('react', 2, 1);
    assert.equal(secondReactQuestion.total, 3);
    assert.equal(secondReactQuestion.totalPages, 3);
    assert.equal(secondReactQuestion.data[0]?.id, 'react-2');
    assert.ok(secondReactQuestion.data[0]?.explanation.length);
    assert.ok(secondReactQuestion.data[0]?.code?.snippet);

    const unknownTechnology = database.getQuestions('unknown', 1, 10);
    assert.deepEqual(unknownTechnology.data, []);
    assert.equal(unknownTechnology.total, 0);
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
