import type { Message } from 'ps-client';
import { reply } from '../bot.js';
import { canUHTML } from '../utils.js';

export async function randomTeam(message: Message<'chat' | 'pm'>) {
    const format = message.content.split(' ')[1] || 'gen9ou';
    const url = `https://crob.at/api/random-team/${format}`;

    const response = await fetch(url);
    if (!response.ok) {
        return reply(message, `Failed to fetch random team for format: ${format}`);
    }

    const data = await response.json() as {
        slug: string;
        url: string;
        image: string;
        teamText: string;
        cardsHtml: string;
    };

    if (canUHTML(message)) {
        const html = `<div style="background:#0a0a0a;color:#e0e0e0;padding:10px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"><img src="${data.image}" width="1200" height="630" style="max-width:100%;width:100%;height:auto;margin-bottom:8px;border-radius:4px" />${data.cardsHtml}</div>`;
        message.reply(`/adduhtml ${html}`);
    } else {
        message.reply(`Random team: ${data.url}`);
    }
}
