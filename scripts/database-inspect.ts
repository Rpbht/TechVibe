import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = resolve(process.env.DATABASE_PATH || 'server/data/techvibe.db');

if (!existsSync(databasePath)) {
  throw new Error(`Database not found at ${databasePath}`);
}

const database = new DatabaseSync(databasePath, { readOnly: true });

try {
  const count = (table: string) => {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
    return row.count;
  };

  const categories = database.prepare(`
    SELECT t.id, t.name, COUNT(q.id) AS questions
    FROM technologies t
    LEFT JOIN questions q ON q.technology_id = t.id
    GROUP BY t.id, t.name
    ORDER BY t.sort_order
  `).all();

  console.log(JSON.stringify({
    databasePath,
    sizeBytes: statSync(databasePath).size,
    counts: {
      technologies: count('technologies'),
      questions: count('questions'),
      users: count('users'),
      activeSessions: count('sessions'),
      savedCategoryPositions: count('user_category_order'),
    },
    categories,
  }, null, 2));
} finally {
  database.close();
}
