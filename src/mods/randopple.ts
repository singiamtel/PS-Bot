import { Message } from 'ps-client';
import { isCmd } from '../utils.js';
import { config } from '../bot.js';

const TTPurl = config.imageCDN + '/opples/';
const nOpples = 25;
export function randopple(message:Message) {
    if (isCmd(message, 'randopple')) {
        const num = Math.floor(Math.random() * nOpples) + 1;
        message.reply(`!show ${TTPurl}{num}.png`);
    }
}
