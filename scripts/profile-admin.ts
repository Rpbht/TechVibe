import { randomBytes, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

const email = (process.env.PROFILE_EMAIL ?? '').trim().toLowerCase();
const password = process.env.PROFILE_PASSWORD ?? '';
const requestedOrder = process.env.PROFILE_ORDER?.split(',').map((id) => id.trim()).filter(Boolean);
const databasePath = resolve(process.env.DATABASE_PATH || 'server/data/techvibe.db');

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Set PROFILE_EMAIL to a valid email address.');
}
if (password.length < 12 || password.length > 128) {
  throw new Error('Set PROFILE_PASSWORD to a password between 12 and 128 characters.');
}

const database = new DatabaseSync(databasePath);
database.exec('PRAGMA foreign_keys = ON');

try {
  const technologyIds = (database.prepare('SELECT id FROM technologies ORDER BY sort_order').all() as Array<{ id: string }>).map(({ id }) => id);
  if (requestedOrder) {
    const uniqueIds = new Set(requestedOrder);
    const expectedIds = new Set(technologyIds);
    if (
      requestedOrder.length !== technologyIds.length
      || uniqueIds.size !== requestedOrder.length
      || requestedOrder.some((id) => !expectedIds.has(id))
    ) {
      throw new Error('PROFILE_ORDER must contain every technology ID exactly once.');
    }
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;

  database.exec('BEGIN IMMEDIATE');
  try {
    let userId: number;
    if (existing) {
      userId = existing.id;
      database.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(passwordHash, salt, userId);
    } else {
      const result = database.prepare('INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)').run(email, passwordHash, salt);
      userId = Number(result.lastInsertRowid);
    }

    const sessionsRevoked = Number(database.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId).changes);
    if (requestedOrder) {
      database.prepare('DELETE FROM user_category_order WHERE user_id = ?').run(userId);
      const insertOrder = database.prepare('INSERT INTO user_category_order (user_id, technology_id, sort_order) VALUES (?, ?, ?)');
      requestedOrder.forEach((technologyId, index) => insertOrder.run(userId, technologyId, index));
    }

    database.exec('COMMIT');
    console.log(JSON.stringify({
      databasePath,
      email,
      userCreated: !existing,
      passwordReset: true,
      sessionsRevoked,
      categoryOrderUpdated: requestedOrder?.length ?? 0,
    }, null, 2));
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
} finally {
  database.close();
}
