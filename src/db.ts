import path from 'path';
import sqlite3 from 'sqlite3';
import { rootDir } from './utils.js';

const db = new sqlite3.Database(path.join(rootDir, '../db.sqlite'));

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,  economic REAL, social REAL)');
    db.run('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS word_highlights (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, discord_id TEXT NOT NULL, word TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

export default db;
