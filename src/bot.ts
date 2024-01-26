// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();

import { Client, Message } from 'ps-client';
import { toID } from 'ps-client/tools.js';

if (process.env.botusername === undefined || process.env.botpassword === undefined) {
    console.error('No username or password found in .env file. Exiting...');
    process.exit(1);
}

const client = new Client({ username: process.env.botusername, password: process.env.botpassword, debug: true, avatar: 'supernerd', rooms: [] });

console.log('Connecting to PS!');
client.connect();

export default client;

export const config = {
    prefix: process.env.prefix || '#',
    whitelist: process.env.whitelist?.split(',').map((x) => x.trim()) || [],
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
    if (room) {
        const authObject = client.getRoom(room).auth;
        if (authObject) {
            const authList = Object.entries(client.getRoom(room).auth).filter(([rank, _userArray]) => rankOrder[rank as keyof typeof rankOrder] > 4).map(([_rank, userArray]) => userArray).flat();
            return authList.includes(toID(message.author?.name));
        }
    }

    return (message.msgRank !== ' ' && message.msgRank !== '+') || config.whitelist.includes(toID(message.author?.name));
}

console.info('Loaded config: ', config);
