// streams the chat to a file
// Every time there is a new message, we call the saveChat function

import fs from 'fs';
import path from 'node:path';
import type { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';

import { formatDate, rootDir } from '../utils.js';
import { logger } from '../logger.js';

const pathToChat = path.join(rootDir, '../chat.txt');
const stream = fs.createWriteStream(pathToChat, { flags: 'a' });
logger.info({ cmd: 'saveChat', message: 'Chat stream created', path: pathToChat });

export const saveChat = (message: Message, username: string) => {
    // YYYY-MM-DD HH:MM:SS
    const logFriendlyDate = formatDate(new Date(message.time / 1000));
    const where = message.target instanceof Room ? message.target.roomid : 'pm';
    stream.write(`${logFriendlyDate} ${username}@${where}: ${message.content}\n`);
};
