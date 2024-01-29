import fs from 'fs';

import { loadCustomColors } from './namecolour.js';
import client, { config, isAuth } from './bot.js';

// Mods
import { apologyCounter, apologyShower } from './mods/apologies.js';
import { politicalCompass } from './mods/political_compass.js';
import { nameColour } from './mods/namecolour.js';
import { addCustom, answerToCustoms } from './mods/customs.js';
import { saveChat } from './mods/saveChat.js';
import { ttp, ttp2 } from './mods/ttp.js';
import { randopple } from './mods/randopple.js';
import { hook } from './hook.js';
import { MBaddPoints, MBanswerQuestion, MBgetAnswers, MBleaderboard, MBrank, MBsetAnswer, leaderboard } from './mods/mysterybox.js';
import { toID } from 'ps-client/tools.js';
import { isCmd } from './utils.js';

import express from 'express';
import morgan from 'morgan';

client.on('message', (message) => {
    if (message.isIntro || message.author?.name === client.status.username) return;
    const username = toID(message.author?.name);

    if (!username) return; // System messages
    console.log(`message from ${username}: ${message.content}`);

    // Public for all
    saveChat(message, username);
    apologyCounter(message, username);
    MBrank(message);

    // Not voice
    if (message.msgRank !== ' ') {
        answerToCustoms(message);
    }
    // Auth-only
    MBanswerQuestion(message);
    if (isAuth(message) || config.whitelist.includes(username)) {
        MBleaderboard(message);
        MBaddPoints(message);
        MBsetAnswer(message);
        addCustom(message);
        randopple(message);
        ttp(message);
        ttp2(message);
        nameColour(message, client.status.username);
        apologyShower(message);
    }

    if (!config.whitelist.includes(username)) return;
    // Me only

    politicalCompass(message, username);

    if (isCmd(message, 'eval')) {
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

let __config = {
    rooms: [],
};
try {
    const data = fs.readFileSync('config.json', 'utf8');
    __config = JSON.parse(data);
} catch (err) {
    console.log('No config.json file found. Creating one...');
    fs.writeFileSync('config.json', JSON.stringify(__config, null, 2), 'utf8');
}

client.on('login', () => {
    console.log('Connected to chat');
    clearTimeout(timer);
    loadCustomColors();
    client.send(`|/autojoin ${__config.rooms.join(',')}`);
    // check('zarel');
});

const app = express();

app.use(morgan('combined'));

app.get('/roomba', (_req, res) => {
    res.redirect('/roomba/mysterybox/leaderboard');
});

app.get('/roomba/mysterybox/leaderboard', async (_req, res) => {
    const lb = await new Promise((resolve) => {
        leaderboard(resolve, 1000);
    });
    res.send(lb);
});

app.get('/roomba/mysterybox/currentAnswers', (_req, res) => {
    const answers = MBgetAnswers();
    res.send(`<h1>Current Answers: ${answers.length}</h1>
  ${answers.map((a) => `<p>${a}</p>`).join('\n')}
  `);
});

app.listen(13337, () => {
});
