import { Message } from 'ps-client';

const TTPurl = 'https://home.showcord.com/opples/';
const nOpples = 3;
export function randopple(message:Message) {
    if (message.content.startsWith('#randopple')) {
        const num = Math.floor(Math.random() * nOpples) + 1;
        message.reply(`!show ${TTPurl}opple${num}.png`);
    }
}
