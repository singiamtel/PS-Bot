import { Client, type Message } from 'ps-client';
import { toID } from 'ps-client/tools.js';
import { logger } from './logger.js';
import { config } from './config.js';
import { isRoom } from './utils.js';

if (process.env.botusername === undefined || process.env.botpassword === undefined) {
    logger.error({ cmd: 'bot', message: 'No username or password found in .env file. Exiting...' });
    process.exit(1);
}

const client = new Client({ username: process.env.botusername, password: process.env.botpassword, avatar: 'supernerd', rooms: config.rooms });

logger.info({ cmd: 'bot', message: 'Connecting to PS...' });
client.connect();

export default client;

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

export function roomAtLeast(minRank: Rank, message: Message, room: string) {
    if (config.whitelist.includes(message.author?.id)) { return true; }
    if (atLeast(minRank, message, true)) return true; // Global perms

    const authObject = client.getRoom(room)?.auth;
    if (!authObject) {
        logger.error({ cmd: 'bot', message: 'No auth object found in room', room });
        return false;
    }
    const authList = Object.entries(authObject).filter(([rank, _userArray]) => rankOrder[rank as keyof typeof rankOrder] >= rankOrder[minRank]).map(([_rank, userArray]) => userArray).flat().map(toID);
    return authList.includes(toID(message.author.id));
}


export function atLeast(rank: Rank, message: Message, quiet = false) {
    if (config.whitelist.includes(toID(message.author.name))) return true; // whitelist
    console.log('atLeast', message.msgRank, rank);
    if (message.msgRank === undefined) {
        return false;
    }
    const hasPerms = rankOrder[message.msgRank] >= rankOrder[rank];
    if (!hasPerms && !quiet) {
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
