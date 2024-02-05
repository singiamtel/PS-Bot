import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

import { Client, Message } from 'ps-client';
import { toID } from 'ps-client/tools.js';
import { logger } from './logger.js';
import { isRoom } from './utils.js';

if (process.env.botusername === undefined || process.env.botpassword === undefined) {
    logger.error('No username or password found in .env file. Exiting...');
    process.exit(1);
}

const client = new Client({ username: process.env.botusername, password: process.env.botpassword, debug: true, avatar: 'supernerd', rooms: [] });

logger.info('Connecting to PS...');
client.connect();

export default client;

let __config = {
    rooms: [],
    hostRoom: undefined,
    imageCDN: undefined,
};
try {
    const data = fs.readFileSync('config.json', 'utf8');
    __config = JSON.parse(data);
} catch (err) {
    logger.info('No config.json file found. Creating one...');
    fs.writeFileSync('config.json', JSON.stringify(__config, null, 2), 'utf8');
}

export const config = {
    prefix: process.env.prefix ?? '#',
    whitelist: process.env.whitelist?.split(',').map((x) => x.trim()) || [],
    rooms: __config.rooms,
    hostRoom: __config.hostRoom ?? 'botdevelopment',
    imageCDN: __config.imageCDN ?? 'https://cdn.crob.at/',
    name: process.env.botusername,
};

export const rankOrder = {
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    '^': 2,
};

export function isAuth(message: Message, room?: string) {
    if (config.whitelist.includes(toID(message.author.id))) { return true; }
    if (room) {
        const authObject = client.getRoom(room)?.auth;
        if (authObject) {
            const authList = Object.entries(client.getRoom(room).auth).filter(([rank, _userArray]) => rankOrder[rank as keyof typeof rankOrder] > 4).map(([_rank, userArray]) => userArray).flat();
            return authList.includes(toID(message.author.id));
        } else {
            return false;
        }
    }

    return (message.msgRank !== ' ' && message.msgRank !== '+');
}

// take an optional settings object parameter with a default value of true
// if no settings object is provided, default to sending the message in PM
export function reply(message: Message, content: string, { inPm = true } : { inPm?: boolean } = {}) {
    if (inPm) {
        return message.author.send(content);
    }
    return message.reply(content);
}

export function privateHTML(message: Message, content: string, room: string) {
    if (!isRoom) return message.author.send(content);
    logger.verbose('Sending private HTML to ' + message.author.id + ': ' + content + ' in room ' + message.raw);
    return message.reply(`/msgroom ${room},/sendprivatehtmlbox  ${message.author.id}, ${content}`);
}

logger.info('Loaded config: ' + JSON.stringify(config));
