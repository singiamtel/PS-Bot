import { Message } from 'ps-client';
import { config } from '../bot.js';

const TTPurl = config.imageCDN + '/opples/';
const nOpples = 23;
export function randopple(message: Message) {
    const num = Math.floor(Math.random() * nOpples) + 1;
    message.reply(`!show ${TTPurl}${num}.png`);
}
