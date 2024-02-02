import { Message } from 'ps-client';
import db from '../db.js';
import { toID } from 'ps-client/tools.js';
import { isCmd } from '../utils.js';
import { logger } from '../logger.js';

const apologies = ['sorry', 'apologize', 'apologies', 'apologise', 'apology', 'sry'];
const antiApologies = ['not sorry', 'not apologize', 'not apologies', 'not apologise', 'not apology', 'not sry', 'sorry but', 'sry but', 'won\'t apologise'];


export function apologyCounter(message: Message, username: string) {
    if (apologies.some(word => message.content.toLowerCase().includes(word))) {
        if (antiApologies.some(word => message.content.toLowerCase().includes(word))) return;
        if (message.content[0] === '#') return;
        db.get(`SELECT * FROM apologies WHERE name = '${username}'`, (err, row) => {
            if (err) return logger.error(err);
            if (!row) {
                db.run(`INSERT INTO apologies(name, points) VALUES('${username}', 1)`, err => {
                    if (err) return logger.error(err);
                    logger.info('apology by ' + username + '. Message: ' + message.content);
                    return;
                });
            } else {
                db.run(`UPDATE apologies SET points = ${(row as any).points + 1} WHERE name = '${username}'`, err => {
                    if (err) return logger.error(err);
                    logger.info('apology by ' + username + '. Message: ' + message.content);
                    return;
                });
            }
        });
    }
}

export function apologyShower(message : Message) {
    if (isCmd(message, 'top')) {
        db.all('SELECT * FROM apologies ORDER BY points DESC LIMIT 5', (err, rows:any) => {
            if (err) return logger.error(err);
            const htmlTable = `<table><tr><th>Name</th><th>Apologies</th></tr>${rows.map((row:any) => `<tr><td>${row.name}</td><td>${row.points}</td></tr>`).join('')}</table>`;
            message.reply(`!htmlbox ${htmlTable}`);
        });
    }
    if (isCmd(message, 'apologies')) {
        // Allow spaces in usernames
        const displayname = message.content.split(' ').slice(1).join(' ');
        const user = toID(displayname);
        if (user === 'unknown') return message.reply('Please specify a user.');
        db.all('SELECT * FROM apologies WHERE name = ? ORDER BY points DESC LIMIT 10', [user], (err, rows: any) => {
            if (err) return logger.error(err);
            if (!rows || rows.length === 0) return message.reply('No apologies yet.');
            const apologies = rows[0].points;
            return message.reply(`Apologies by ${displayname}: ${apologies}`);
        });
    }
}
