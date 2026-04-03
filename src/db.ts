import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { rootDir } from './utils.js';

const db = new DatabaseSync(path.join(rootDir, '../db.sqlite'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, points INTEGER NOT NULL) STRICT');
db.exec('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, economic REAL NOT NULL, social REAL NOT NULL) STRICT');
db.exec('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, points INTEGER NOT NULL) STRICT');
db.exec('CREATE TABLE IF NOT EXISTS word_highlights (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, discord_id TEXT NOT NULL, word TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT');

export default db;
