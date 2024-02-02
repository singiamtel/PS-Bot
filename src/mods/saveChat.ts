// streams the chat to a file
// Every time there is a new message, we call the saveChat function

import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';

import { formatDate } from '../utils.js';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stream = fs.createWriteStream(path.join(__dirname, 'chat.txt'), { flags: 'a' });
logger.info('Chat stream started in', path.join(__dirname, 'chat.txt'));

export const saveChat = (message: Message, username: string) => {
    // YYYY-MM-DD HH:MM:SS
    const logFriendlyDate = formatDate(new Date(message.time / 1000));
    const where = message.target instanceof Room ? message.target.roomid : 'pm';
    stream.write(`${logFriendlyDate} ${username}@${where}: ${message.content}\n`);
};
