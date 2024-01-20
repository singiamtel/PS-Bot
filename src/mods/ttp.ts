import { Message } from 'ps-client';

const TTPurl = process.env.TTPurl || 'https://home.showcord.com/TTP/';

export function ttp(message: Message) {
    if (/#ttp /.test(message.content)) {
        const num = message.content.split(' ')[1];
        if (!num) return message.reply('Please specify a card number.');
        message.reply(`!show ${TTPurl}card${num}.png`);
    } else if (/#randttp$/.test(message.content)) {
    // cards are between 1 and 52
        const num = Math.floor(Math.random() * 52) + 1;
        message.reply(`!show ${TTPurl}card${num}.png, Card #${num}`);
    }
}

const TTP2url = process.env.TTP2url || 'https://home.showcord.com/TTP2/';

export function ttp2(message: Message) {
    if (/#ttp2/.test(message.content)) {
        const num = message.content.split(' ')[1];
        if (!num) return message.reply('Please specify a card number.');
        message.reply(`!show ${TTP2url}card${num}.png`);
    } else if (/#randttp2/.test(message.content)) {
    // cards are between 1 and 52
        const num = Math.floor(Math.random() * 32) + 1;
        message.reply(`!show ${TTP2url}card${num}.png, Card #${num}`);
    }
}
