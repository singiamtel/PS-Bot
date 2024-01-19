// const fs = require("fs");
import fs from 'fs';
import { whitelist } from '../config.js';
import { usernameify } from '../utils.js';
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';

// Load and parse the customs.json file
let customs : {[key: string]: string} = {};
try {
    const data = fs.readFileSync('customs.json', 'utf8');
    customs = JSON.parse(data);
} catch (err) {
    console.log('No customs.json file found. Creating one...');
    fs.writeFileSync('customs.json', JSON.stringify(customs, null, 2), 'utf8');
}

// Function to get response for a message
export function answerToCustoms(message: Message) {
    const text = message.content;
    if (!(message.target instanceof Room)) return;

    if (message.target.roomid !== 'botdevelopment' && message.target.roomid !== 'dreamyard') {
        return;
    }
    if (customs[text]) return message.reply(customs[text]);
}

// Function to add a custom message-response pair
export function addCustom(message : Message) {
    if (message.msgRank !== '#' && !whitelist.includes(usernameify(message.author?.name))) {
        return;
    }
    if (message.content.startsWith('#addcustom')) {
        const args = message.content.split(' ').slice(1).join(' ').split(',');
        if (customs[args[0]]) return message.reply('That custom already exists.');
        const [key, value] = [args[0].trim(), args.slice(1).join(',').trim()];
        if (!key || !value) return message.reply('Invalid format. Use #addcustom key,value');
        if (value.startsWith('/') || value.startsWith('!')) {
            const cmd = value.slice(1).split(' ')[0];
            if (!['show', 'me', 'code'].includes(cmd)) return message.reply('No commands allowed.');
        }
        customs[key] = value;
        // Save the updated customs to the file
        fs.writeFileSync('customs.json', JSON.stringify(customs, null, 2), 'utf8');
        return message.reply('Custom added.');
    } else if (message.content.startsWith('#delcustom')) {
        // Delete a custom
        const args = message.content.split(' ').slice(1).join(' ').split(',');
        if (!customs[args[0]]) return message.reply('That custom doesn\'t exist.');
        delete customs[args[0]];
        // Save the updated customs to the file
        fs.writeFileSync('customs.json', JSON.stringify(customs, null, 2), 'utf8');
        return message.reply('Custom deleted.');
    } else if (message.content.startsWith('#showcustom') || message.content.startsWith('#customs') || message.content.startsWith('#listcustom')) {
        console.log('showing customs');
        return message.reply(`!code ${Object.keys(customs).join(`
`)
        }`);
    }
}
