import { Message } from 'ps-client';
import { isCmd } from '../utils.js';

const TTPurl = 'https://home.showcord.com/opples/';
const nOpples = 3;
export function randopple(message:Message) {
    if (isCmd(message, 'randopple')) {
        const num = Math.floor(Math.random() * nOpples) + 1;
        message.reply(`!show ${TTPurl}opple${num}.png`);
    }
}
