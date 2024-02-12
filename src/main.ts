
import { determineColour, loadCustomColors } from './namecolour.js';
import client, { config, isAuth } from './bot.js';

// Mods
import { apologyCounter, apologyShower } from './mods/apologies.js';
import { politicalCompass } from './mods/political_compass.js';
import { nameColour } from './mods/namecolour.js';
import { addCustom, answerToCustoms } from './mods/customs.js';
import { ttp, ttp2 } from './mods/ttp.js';
import { randopple } from './mods/randopple.js';
import { hook } from './hook.js';
import { MBaddPoints, MBanswerQuestion, MBgetAnswers, MBleaderboard, MBrank, MBsetAnswer, MBshowAnswerBox, MBtestAuth, leaderboard } from './mods/mysterybox.js';
import { toID } from 'ps-client/tools.js';
import { isCmd, isRoom } from './utils.js';

import express from 'express';
import morgan from 'morgan';
import { logger } from './logger.js';
import { saveChat } from './mods/saveChat.js';

client.on('message', (message) => {
    if (message.isIntro || message.author?.name === client.status.username) return;
    const username = toID(message.author?.name);

    if (!username) return; // System messages
    const target = isRoom(message.target) ? message.target.roomid : 'pm';
    logger.verbose(`Message from ${username}@${target}: ${message.content}`);

    // Public for all
    saveChat(message, username);
    apologyCounter(message, username);
    MBrank(message);
    MBshowAnswerBox(message);
    MBleaderboard(message);
    MBtestAuth(message);

    // Not voice
    if (message.msgRank !== ' ') {
        answerToCustoms(message);
    }
    // Auth-only
    MBanswerQuestion(message);
    const isRoomAuth = isRoom(message.target) && isAuth(message, message.target.roomid);

    MBsetAnswer(message);
    if (isAuth(message) || isRoomAuth || config.whitelist.includes(username)) {
        MBaddPoints(message);
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
            logger.error(err);
            message.reply((err as Error)?.message || 'Eval failed');
        }
    } else if (isCmd(message, 'ping')) {
        message.reply('Pong!');
    }
});

// 2 minutes
const timer = setTimeout(
    () => {
        hook.send('<@&1196484431062515752> Bad');
    },
    1000 * 60 * 2,
);


client.on('login', () => {
    logger.info('Connected to chat');
    clearTimeout(timer);
    loadCustomColors();
    client.send(`|/autojoin ${config.rooms.join(',')}`);
});

const app = express();

app.use(morgan('combined'));

app.get('/roomba', (_req, res) => {
    res.redirect('/roomba/mysterybox/leaderboard');
});

app.get('/roomba/mysterybox/leaderboard', async (_req, res) => {
    const lb = await new Promise((resolve) => {
        leaderboard(resolve, { limit: 1000 });
    });
    res.send(lb);
});

app.get('/roomba/mysterybox/currentAnswers', (_req, res) => {
    const answers = MBgetAnswers();
    res.send(`<h1>Current Answers: ${answers.length}</h1>
  ${answers.map((a) => `<p style="color:${determineColour(a)}">${a}</p>`).join('\n')}
  `);
});

app.listen(13337, () => {
});
