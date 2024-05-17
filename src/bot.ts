import dotenv from 'dotenv';
import fs from 'fs';

import { Client, Message } from 'ps-client';
import { toID } from 'ps-client/tools.js';
import { logger } from './logger.js';
import { isRoom, rootDir } from './utils.js';
import path from 'path';
dotenv.config({ path: path.join(rootDir, '../.env') });

if (process.env.botusername === undefined || process.env.botpassword === undefined) {
    logger.error({ cmd: 'bot', message: 'No username or password found in .env file. Exiting...' });
    process.exit(1);
}

const client = new Client({ username: process.env.botusername, password: process.env.botpassword, avatar: 'supernerd', rooms: [] });

logger.info({ cmd: 'bot', message: 'Connecting to PS...' });
client.connect();

export default client;

let __config = {
    rooms: [],
    hostRoom: undefined,
    imageCDN: undefined,
};
const configPath = path.join(rootDir, '../config.json');
try {
    const data = fs.readFileSync(configPath, 'utf8');
    __config = JSON.parse(data);
} catch (err) {
    logger.info({ cmd: 'bot', message: 'No config.json file found. Creating one...' });
    fs.writeFileSync(configPath, JSON.stringify(__config, null, 2), 'utf8');
}

export const config = {
    prefix: process.env.prefix ?? '#',
    whitelist: process.env.whitelist?.split(',').map((x) => x.trim()) || [],
    rooms: __config.rooms,
    hostRoom: __config.hostRoom ?? 'botdevelopment',
    imageCDN: __config.imageCDN ?? 'https://cdn.crob.at/',
    name: process.env.botusername,
};

export type Rank = Exclude<Message['msgRank'], undefined>;

export const rankOrder: Record<Rank, number> = {
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    ' ': 2,
} as const;

export function atLeast(rank: Rank, message: Message) {
    if (config.whitelist.includes(toID(message.author.name))) return true; // whitelist
    if (message.msgRank === undefined) {
        return false;
    }
    const hasPerms = rankOrder[message.msgRank] >= rankOrder[rank];
    if (!hasPerms) {
        logger.warn({ cmd: 'chat', error: 'User does not have permission', username: toID(message.author.name), rank: message.msgRank, requiredRank: rank, message: message.content });
    }
    return hasPerms;
}


// take an optional settings object parameter with a default value of true
// if no settings object is provided, default to sending the message in PM
export function reply(message: Message, content: string, { inPm = true }: { inPm?: boolean } = {}) {
    if (inPm) {
        return message.author.send(content);
    }
    return message.reply(content);
}

export function privateHTML(message: Message, content: string, room: string) {
    if (!isRoom) return message.author.send(content);
    return message.reply(`/msgroom ${room},/sendprivatehtmlbox  ${message.author.id}, ${content}`);
}

logger.info({ cmd: 'bot', message: 'Loaded config', config });
