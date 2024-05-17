import { Message } from 'ps-client';
import { config } from '../bot.js';

const editions = {
  1: {
    url: config.imageCDN + '/TTP/',
    cards: 52,
  },
  2: {
    url: config.imageCDN + '/TTP2/',
    cards: 32,
  },
};

export function ttp(message: Message, edition: number){
    const url = editions[edition as keyof typeof editions]?.url;
    if(!url) return message.reply('Invalid edition');
    const num = message.content.split(' ')[1];
    if (!num) return message.reply('Please specify a card number.');
    message.reply(`!show ${url}card${num}.png`);
}

export function randttp(message: Message, edition: number){
    const config = editions[edition as keyof typeof editions]
    if(!config) return message.reply('Invalid edition');
    const num = Math.floor(Math.random() * config.cards) + 1;
    message.reply(`!show ${config.url}card${num}.png`);
}
