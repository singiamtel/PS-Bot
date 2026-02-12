import type { Message } from 'ps-client';
import db from '../db.js';
import { toID } from 'ps-client/tools.js';
import { logger } from '../logger.js';
import { config } from '../config.js';

const apologies = ['sorry', 'apologize', 'apologies', 'apologise', 'apology', 'sry'];
const antiApologies = ['not sorry', 'not apologize', 'not apologies', 'not apologise', 'not apology', 'not sry', 'sorry but', 'sry but', 'won\'t apologise'];


export function apologyCounter(message: Message<'chat' | 'pm'>, username: string) {
    if (apologies.some(word => message.content.toLowerCase().includes(word))) {
        if (antiApologies.some(word => message.content.toLowerCase().includes(word))) return;
        if (message.content.startsWith(config.prefix)) return;
        try {
            const row = db.prepare('SELECT * FROM apologies WHERE name = ?').get(username) as Record<string, unknown> | undefined;
            if (!row) {
                db.prepare('INSERT INTO apologies(name, points) VALUES(?, 1)').run(username);
            } else {
                db.prepare('UPDATE apologies SET points = ? WHERE name = ?').run((row.points as number) + 1, username);
            }
            logger.info({ cmd: 'apologyCounter', message: 'Apology received', username, content: message.content });
        } catch (err) {
            logger.error({ cmd: 'apologyCounter', message: 'Error in apology counter', username, content: message.content, error: err });
        }
    }
}

export function showApologiesLeaderboard(message: Message<'chat' | 'pm'>) {
    try {
        const rows = db.prepare('SELECT * FROM apologies ORDER BY points DESC LIMIT 5').all() as Record<string, unknown>[];
        const htmlTable = `<table><tr><th>Name</th><th>Apologies</th></tr>${rows.map(row => `<tr><td>${row.name}</td><td>${row.points}</td></tr>`).join('')}</table>`;
        message.reply(`!htmlbox ${htmlTable}`);
    } catch (err) {
        logger.error({ cmd: 'apologyshow', message: 'Error getting from db', error: err });
    }
}

export function showApologiesRank(message: Message<'chat' | 'pm'>) {
    // Allow spaces in usernames
    const displayname = message.content.split(' ').slice(1).join(' ');
    const user = toID(displayname);
    if (user === 'unknown') return message.reply('Please specify a user.');
    try {
        const rows = db.prepare('SELECT * FROM apologies WHERE name = ? ORDER BY points DESC LIMIT 10').all(user) as Record<string, unknown>[];
        if (!rows || rows.length === 0) return message.reply('No apologies yet.');
        const apologies = rows[0].points;
        return message.reply(`Apologies by ${displayname}: ${apologies}`);
    } catch (err) {
        logger.error({ cmd: 'apologyshow', message: 'Error getting from db', username: user, error: err });
    }
}
