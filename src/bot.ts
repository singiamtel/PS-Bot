import dotenv from 'dotenv';
import fs from 'fs';
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

let __config = {
    rooms: [],
    hostRoom: undefined,
};
try {
    const data = fs.readFileSync('config.json', 'utf8');
    __config = JSON.parse(data);
} catch (err) {
    console.log('No config.json file found. Creating one...');
    fs.writeFileSync('config.json', JSON.stringify(__config, null, 2), 'utf8');
}

export const config = {
    prefix: process.env.prefix ?? '#',
    whitelist: process.env.whitelist?.split(',').map((x) => x.trim()) || [],
    rooms: __config.rooms,
    hostRoom: __config.hostRoom ?? 'botdevelopment',
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
        const authObject = client.getRoom(room)?.auth;
        if (authObject) {
            const authList = Object.entries(client.getRoom(room).auth).filter(([rank, _userArray]) => rankOrder[rank as keyof typeof rankOrder] > 4).map(([_rank, userArray]) => userArray).flat();
            return authList.includes(toID(message.author?.name));
        } else {
            return false;
        }
    }

    return (message.msgRank !== ' ' && message.msgRank !== '+') || config.whitelist.includes(toID(message.author?.name));
}

console.info('Loaded config: ', config);
