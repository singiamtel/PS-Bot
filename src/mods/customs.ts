import fs from 'fs';
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';
import { config } from '../bot.js';
import { toID } from 'ps-client/tools.js';
import { isCmd, rootDir } from '../utils.js';
import { logger } from '../logger.js';

import path from 'path';

const customsPath = path.join(rootDir, '../customs.json');
// Load and parse the customs file
let customs : {[key: string]: string} = {};
try {
    const data = fs.readFileSync(customsPath, 'utf8');
    customs = JSON.parse(data);
} catch (err) {
    logger.verbose({ cmd: 'customs', message: 'No customs.json file found. Creating one in', path: customsPath });
    fs.writeFileSync(customsPath, JSON.stringify(customs, null, 2), 'utf8');
}

// Function to get response for a message
export function answerToCustoms(message: Message) {
    const text = message.content.trim().toLowerCase();
    if (!(message.target instanceof Room)) return;

    if (message.target.roomid !== 'botdevelopment' && message.target.roomid !== 'dreamyard') {
        return;
    }
    if (customs[text]) return message.reply(customs[text]);
}

// Function to add a custom message-response pair
export function addCustom(message : Message) {
    const isRoomOwner = message.msgRank === '#';
    if (!isRoomOwner && !config.whitelist.includes(toID(message.author?.name))) {
        return;
    }
    if (isCmd(message, 'addcustom')) {
        const args = message.content.split(' ').slice(1).join(' ').split(',');
        if (customs[args[0]]) return message.reply('That custom already exists.');
        const [key, value] = [args[0].trim().toLowerCase(), args.slice(1).join(',').trim()];
        if (!key || !value) return message.reply('Invalid format. Use #addcustom key,value');
        if (value.startsWith('/') || value.startsWith('!')) {
            const cmd = value.slice(1).split(' ')[0];
            if (!['show', 'me', 'code'].includes(cmd)) return message.reply('No commands allowed.');
        }
        customs[key] = value;
        // Save the updated customs to the file
        fs.writeFileSync(customsPath, JSON.stringify(customs, null, 2), 'utf8');
        return message.reply('Custom added.');
    } else if (isCmd(message, ['deletecustom', 'removecustom', 'delcustom'])) {
        // Delete a custom
        const args = message.content.split(' ').slice(1).join(' ').split(',');
        if (!customs[args[0]]) return message.reply('That custom doesn\'t exist.');
        delete customs[args[0]];
        // Save the updated customs to the file
        fs.writeFileSync(customsPath, JSON.stringify(customs, null, 2), 'utf8');
        return message.reply('Custom deleted.');
    } else if (isCmd(message, ['showcustom', 'customs', 'listcustom'])) {
        return message.reply(`!code ${Object.keys(customs).join(`
`)
        }`);
    }
}
