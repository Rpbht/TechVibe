import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createTechVibeServer } from './index.ts';

test('serves content and persists an authenticated user category order', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'techvibe-api-'));
  const contentApiKey = 'test-content-api-key-that-is-longer-than-32-characters';
  const server = createTechVibeServer(join(directory, 'test.db'), contentApiKey);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: 'ok' });

    const technologyResponse = await fetch(`${baseUrl}/api/technologies`);
    const technologies = await technologyResponse.json() as Array<{ id: string; questionCount: number }>;
    assert.equal(technologyResponse.status, 200);
    assert.equal(technologies.find(({ id }) => id === 'react')?.questionCount, 3);

    const unauthorizedImportResponse = await fetch(`${baseUrl}/api/content/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': 'incorrect-key' },
      body: JSON.stringify({ questions: [] }),
    });
    assert.equal(unauthorizedImportResponse.status, 401);

    const importResponse = await fetch(`${baseUrl}/api/content/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': contentApiKey },
      body: JSON.stringify({
        category: {
          id: 'web-performance',
          name: 'Web Performance',
          description: 'Browser and application performance engineering.',
          iconName: 'Globe',
          subtopics: ['Core Web Vitals', 'Rendering'],
        },
        questions: [{
          id: 'web-performance-1',
          technology: 'web-performance',
          title: 'What is Largest Contentful Paint?',
          questionType: 'conceptual',
          summary: 'Explain the LCP user experience metric.',
          explanation: ['LCP measures when the largest visible content element finishes rendering.'],
          source: {
            title: 'Largest Contentful Paint (LCP) - web.dev',
            url: 'https://web.dev/articles/lcp',
          },
        }],
      }),
    });
    assert.equal(importResponse.status, 201);
    assert.deepEqual(await importResponse.json(), { categoriesAdded: 1, questionsAdded: 1 });

    const importedTechnologyResponse = await fetch(`${baseUrl}/api/technologies`);
    const importedTechnologies = await importedTechnologyResponse.json() as Array<{ id: string; questionCount: number }>;
    assert.equal(importedTechnologies.find(({ id }) => id === 'web-performance')?.questionCount, 1);

    const importedQuestionResponse = await fetch(`${baseUrl}/api/questions?technology=web-performance`);
    const importedQuestions = await importedQuestionResponse.json() as {
      total: number;
      data: Array<{ id: string; questionType: string; source: { url: string } }>;
    };
    assert.equal(importedQuestions.total, 1);
    assert.equal(importedQuestions.data[0]?.id, 'web-performance-1');
    assert.equal(importedQuestions.data[0]?.questionType, 'conceptual');
    assert.equal(importedQuestions.data[0]?.source.url, 'https://web.dev/articles/lcp');

    const duplicateContentResponse = await fetch(`${baseUrl}/api/content/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': contentApiKey },
      body: JSON.stringify({
        questions: [{
          id: 'web-performance-duplicate',
          technology: 'web-performance',
          title: 'What is Largest Contentful Paint?',
          questionType: 'conceptual',
          explanation: ['LCP measures when the largest visible content element finishes rendering.'],
          source: {
            title: 'Largest Contentful Paint (LCP) - web.dev',
            url: 'https://web.dev/articles/lcp',
          },
        }],
      }),
    });
    assert.equal(duplicateContentResponse.status, 409);

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'engineer@example.com',
        password: 'secure-password',
      }),
    });
    assert.equal(registerResponse.status, 200);
    const sessionCookie = registerResponse.headers.get('set-cookie')?.split(';')[0];
    assert.ok(sessionCookie?.startsWith('techvibe_session='));

    const reversedIds = importedTechnologies.map(({ id }) => id).reverse();
    const saveOrderResponse = await fetch(`${baseUrl}/api/profile/category-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ categoryIds: reversedIds }),
    });
    assert.equal(saveOrderResponse.status, 200);

    const personalizedResponse = await fetch(`${baseUrl}/api/technologies`, {
      headers: { Cookie: sessionCookie },
    });
    const personalized = await personalizedResponse.json() as Array<{ id: string }>;
    assert.equal(personalized[0]?.id, reversedIds[0]);

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie } });
    const me = await meResponse.json() as { user: { email: string } | null };
    assert.equal(me.user?.email, 'engineer@example.com');

    const questionResponse = await fetch(`${baseUrl}/api/questions?technology=system-design&page=2&limit=1`);
    const questionPage = await questionResponse.json() as { total: number; data: Array<{ id: string }> };
    assert.equal(questionResponse.status, 200);
    assert.equal(questionPage.total, 2);
    assert.equal(questionPage.data[0]?.id, 'sd-2');

    const invalidResponse = await fetch(`${baseUrl}/api/questions?page=0&limit=500`);
    assert.equal(invalidResponse.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
});
