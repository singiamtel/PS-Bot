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

function permsDeniedBox(rank: Rank) {
    return `<div style="border:1px solid #ba0000;background:#ffe0e0;padding:8px;border-radius:4px"><strong style="color:#ba0000">Permission Denied</strong><br>You need to be at least <strong>${rank}</strong> rank to use this command.</div>`;
}

export function roomAtLeast(minRank: Rank, message: Message<'chat' | 'pm'>, room: string) {
    if (config.whitelist.includes(message.author?.id)) { return true; }
    if (atLeast(minRank, message, true)) return true; // Global perms

    const authObject = client.getRoom(room)?.auth;
    if (!authObject) {
        logger.error({ cmd: 'bot', message: 'No auth object found in room', room });
        privateHTML(message, permsDeniedBox(minRank), room, { name: 'permission-denied' });
        return false;
    }
    const authList = Object.entries(authObject).filter(([rank, _userArray]) => rankOrder[rank as keyof typeof rankOrder] >= rankOrder[minRank]).map(([_rank, userArray]) => userArray).flat().map(toID);
    const hasPerms = authList.includes(toID(message.author.id));
    if (!hasPerms) privateHTML(message, permsDeniedBox(minRank), room, { name: 'permission-denied' });
    return hasPerms;
}


export function atLeast(rank: Rank, message: Message<'chat' | 'pm'>, quiet = false) {
    if (config.whitelist.includes(toID(message.author.name))) return true; // whitelist
    if (message.msgRank === undefined) {
        if (!quiet) privateHTML(message, permsDeniedBox(rank), isRoom(message.target) ? message.target.roomid : '', { name: 'permission-denied' });
        return false;
    }
    const hasPerms = rankOrder[message.msgRank] >= rankOrder[rank];
    if (!hasPerms && !quiet) {
        logger.warn({ cmd: 'chat', error: 'User does not have permission', username: toID(message.author.name), rank: message.msgRank, requiredRank: rank, message: message.content });
        privateHTML(message, permsDeniedBox(rank), isRoom(message.target) ? message.target.roomid : '', { name: 'permission-denied' });
    }
    return hasPerms;
}


export function reply(message: Message<'chat' | 'pm'>, content: string) {
    return message.reply(content);
}

type PrivateHTMLOptions = {
    name?: string;
    change?: boolean;
    notransform?: boolean;
};

export function privateHTML(message: Message<'chat' | 'pm'>, content: string, room: string, options: PrivateHTMLOptions = {}) {
    const htmlOptions = !isRoom(message.target) && room ? { ...options, room } : options;
    const sent = typeof message.replyHTML === 'function' ? message.replyHTML(content, htmlOptions) : null;
    if (sent) return sent;
    return message.author.send(content.replace(/\n\s*/g, ' '));
}

logger.info({ cmd: 'bot', message: 'Loaded config', config });
