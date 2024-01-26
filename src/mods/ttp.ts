import { Message } from 'ps-client';
import { isCmd } from '../utils.js';

const TTPurl = process.env.TTPurl || 'https://home.showcord.com/TTP/';

export function ttp(message: Message) {
    if (isCmd(message, 'ttp')) {
        const num = message.content.split(' ')[1];
        if (!num) return message.reply('Please specify a card number.');
        message.reply(`!show ${TTPurl}card${num}.png`);
    } else if (isCmd(message, 'randttp')) {
    // cards are between 1 and 52
        const num = Math.floor(Math.random() * 52) + 1;
        message.reply(`!show ${TTPurl}card${num}.png, Card #${num}`);
    }
}

const TTP2url = process.env.TTP2url || 'https://home.showcord.com/TTP2/';

export function ttp2(message: Message) {
    if (isCmd(message, 'ttp2')) {
        const num = message.content.split(' ')[1];
        if (!num) return message.reply('Please specify a card number.');
        message.reply(`!show ${TTP2url}card${num}.png`);
    } else if (isCmd(message, 'randttp2')) {
    // cards are between 1 and 52
        const num = Math.floor(Math.random() * 32) + 1;
        message.reply(`!show ${TTP2url}card${num}.png, Card #${num}`);
    }
}
