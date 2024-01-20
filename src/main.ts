import fs from 'fs';

import { isAuth, usernameify } from './utils.js';
import { whitelist } from './config.js';
import { loadCustomColors } from './namecolour.js';
import bot from './bot.js';

// Mods
import { apologyCounter, apologyShower } from './mods/apologies.js';
import { politicalCompass } from './mods/political_compass.js';
import { nameColour } from './mods/namecolour.js';
import { addCustom, answerToCustoms } from './mods/customs.js';
import { saveChat } from './mods/saveChat.js';
import { ttp, ttp2 } from './mods/ttp.js';
import { randopple } from './mods/randopple.js';
import { hook } from './hook.js';
import { MBaddPoints, MBcreateQuestion, MBleaderboard, MBrank } from './mods/mysterybox.js';

bot.on('message', (message) => {
    if (message.isIntro || message.author?.name === bot.status.username) return;
    const who = usernameify(message.author?.name);
    console.log(`message from ${who}: ${message.content}`);

    if (who === 'unknown') return; // System messages

    // Public for all
    saveChat(message, who);
    apologyCounter(message, who);
    MBrank(message);

    // Not voice
    if (message.msgRank !== ' ') {
        answerToCustoms(message);
    }
    // Auth-only
    MBcreateQuestion(message);
    if (isAuth(message) || whitelist.includes(who)) {
        MBleaderboard(message);
        MBaddPoints(message);
        addCustom(message);
        randopple(message);
        ttp(message);
        ttp2(message);
        nameColour(message, bot.status.username);
        apologyShower(message);
    }

    if (!whitelist.includes(who)) return;
    // Me only

    politicalCompass(message, who);

    if (message.content.startsWith('#eval')) {
        const code = message.content.split(' ').slice(1).join(' ');
        try {
            const result = eval(code);
            message.reply(result);
        } catch (err) {
            console.log(err);
            message.reply((err as Error)?.message || 'Eval failed');
        }
    } else if (message.content.startsWith('#ping')) {
        message.reply('Pong!');
    }
});

// async function check(username) {
//   console.log("Checking...");
//   const userd = await Bot.getUserDetails(username);
//   console.log(userd);
// }

// 2 minutes
const timer = setTimeout(
    () => {
        hook.send('<@&1196484431062515752> Bad');
    },
    1000 * 60 * 2,
);

let config = {
    rooms: [],
};
try {
    const data = fs.readFileSync('config.json', 'utf8');
    config = JSON.parse(data);
} catch (err) {
    console.log('No config.json file found. Creating one...');
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
}

bot.on('login', () => {
    console.log('Connected to chat');
    clearTimeout(timer);
    loadCustomColors();
    bot.send(`|/autojoin ${config.rooms.join(',')}`);
    // check('zarel');
});
