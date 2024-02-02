import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,  economic REAL, social REAL)');
    db.run('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
});

export default db;
