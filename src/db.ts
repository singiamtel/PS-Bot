import path from 'path';
import sqlite3 from 'sqlite3';
import { rootDir } from './bot';

const db = new sqlite3.Database(path.join(rootDir, '../db.sqlite'));

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,  economic REAL, social REAL)');
    db.run('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
});

export default db;
