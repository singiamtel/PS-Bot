// const sqlite3 = require('sqlite3').verbose();
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('db.sqlite');

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS apologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS pc (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,  economic REAL, social REAL)');
    db.run('CREATE TABLE IF NOT EXISTS mysterybox (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, points INTEGER)');
});

export default db;
