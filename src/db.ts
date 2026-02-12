import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { rootDir } from './utils.js';

const db = new DatabaseSync(path.join(rootDir, '../db.sqlite'));

db.exec('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
db.exec('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, economic REAL, social REAL)');
db.exec('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
db.exec('CREATE TABLE IF NOT EXISTS word_highlights (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, discord_id TEXT NOT NULL, word TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

export default db;
