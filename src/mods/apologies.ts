import type { Message } from 'ps-client';
import db from '../db.js';
import { toID } from 'ps-client/tools.js';
import { logger } from '../logger.js';
import { config } from '../config.js';

const apologies = ['sorry', 'apologize', 'apologies', 'apologise', 'apology', 'sry'];
const antiApologies = ['not sorry', 'not apologize', 'not apologies', 'not apologise', 'not apology', 'not sry', 'sorry but', 'sry but', 'won\'t apologise'];


export function apologyCounter(message: Message, username: string) {
    if (apologies.some(word => message.content.toLowerCase().includes(word))) {
        if (antiApologies.some(word => message.content.toLowerCase().includes(word))) return;
        if (message.content.startsWith(config.prefix)) return;
        db.get(`SELECT * FROM apologies WHERE name = '${username}'`, (err, row) => {
            if (err) return logger.error({ cmd: 'apologyCounter', message: 'Error getting from db', username, content: message.content, error: err });
            if (!row) {
                db.run(`INSERT INTO apologies(name, points) VALUES('${username}', 1)`, err => {
                    if (err) return logger.error({ cmd: 'apologyCounter', message: 'Error inserting into db', username, content: message.content, error: err });
                    logger.info({ cmd: 'apologyCounter', message: 'Apology received', username, content: message.content });
                });
            } else {
                db.run(`UPDATE apologies SET points = ${(row as any).points + 1} WHERE name = '${username}'`, err => {
                    if (err) return logger.error({ cmd: 'apologyCounter', message: 'Error updating points', username, content: message.content, error: err });
                    logger.info({ cmd: 'apologyCounter', message: 'Apology received', username, content: message.content });
                });
            }
        });
    }
}

export function showApologiesLeaderboard(message : Message) {
    db.all('SELECT * FROM apologies ORDER BY points DESC LIMIT 5', (err, rows:any) => {
        if (err) return logger.error({ cmd: 'apologyshow', message: 'Error getting from db', error: err });
        const htmlTable = `<table><tr><th>Name</th><th>Apologies</th></tr>${rows.map((row:any) => `<tr><td>${row.name}</td><td>${row.points}</td></tr>`).join('')}</table>`;
        message.reply(`!htmlbox ${htmlTable}`);
    });
}

export function showApologiesRank(message : Message) {
    // Allow spaces in usernames
    const displayname = message.content.split(' ').slice(1).join(' ');
    const user = toID(displayname);
    if (user === 'unknown') return message.reply('Please specify a user.');
    db.all('SELECT * FROM apologies WHERE name = ? ORDER BY points DESC LIMIT 10', [user], (err, rows: any) => {
        if (err) return logger.error({ cmd: 'apologyshow', message: 'Error getting from db', username: user, error: err });
        if (!rows || rows.length === 0) return message.reply('No apologies yet.');
        const apologies = rows[0].points;
        return message.reply(`Apologies by ${displayname}: ${apologies}`);
    });
}
