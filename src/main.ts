import { determineColour, loadCustomColors } from './namecolour.js';
import client, { atLeast, roomAtLeast } from './bot.js';
import { config } from './config.js';

// Mods
import { apologyCounter, showApologiesLeaderboard, showApologiesRank } from './mods/apologies.js';
import { addPoliticalCompass, politicalCompass, showCombinedPoliticalCompass } from './mods/political_compass.js';
import { compareColours, nameColour } from './mods/namecolour.js';
import { addCustom, answerToCustoms, deleteCustom, showCustoms } from './mods/customs.js';
import { randttp, ttp } from './mods/ttp.js';
import { randopple } from './mods/randopple.js';
import { hook } from './hook.js';
import { MBaddPoints, MBanswerQuestion, MBgetAnswers, MBleaderboard, MBrank, MBcreateQuestion, MBshowAnswerBox, MBtestAuth, leaderboard, MBendQuestion, MBdeclareQuestion } from './mods/mysterybox.js';
import { toID } from 'ps-client/tools.js';
import { assertNever, isRoom, toCmd } from './utils.js';
import { addHighlight, checkHighlights, listHighlights, removeHighlight } from './mods/wordHighlight.js';

import express from 'express';
import morgan from 'morgan';
import { logger } from './logger.js';
import { saveChat } from './mods/saveChat.js';

client.on('message', (message) => {
    if (message.isIntro || message.author?.name === client.status.username || message.author?.name === undefined) return;
    const username = toID(message.author?.name);

    if (!username) return; // System messages
    const target = isRoom(message.target) ? message.target.roomid : 'pm';

    logger.verbose({ cmd: 'chat', message: message.content, username, target });
    saveChat(message, username);
    apologyCounter(message, username);
    checkHighlights(message, username);

    // Not voice
    if (message.msgRank !== ' ' && message.msgRank !== undefined) {
        answerToCustoms(message);
    }

    const cmd = toCmd(message);
    if (!cmd) return;
    // const hasPerms = getAuth(message) || isRoomAuth || config.whitelist.includes(username)
    console.log('cmd', cmd);

    switch (cmd) {
        // 'namecolour', 'namecolor',
        // 'comparecolours', 'comparecolors', 'comparecolor', 'comparecolour', 'compare',
        case 'namecolour':
        case 'namecolor':
            if (!atLeast('+', message)) return;
            nameColour(message, client.status.username);
            break;

        case 'comparecolours':
        case 'comparecolors':
        case 'comparecolor':
        case 'comparecolour':
        case 'compare':
            if (!atLeast('+', message)) return;
            compareColours(message, client.status.username);
            break;

        case 'ttp':
            console.log('ttp');
            if (!atLeast('+', message)) return;
            console.log('ttp past filter');
            ttp(message, 1);
            console.log('ttp');
            break;

        case 'ttp2':
            if (!atLeast('+', message)) return;
            ttp(message, 2);
            console.log('ttp2');
            break;

        case 'randttp':
            if (!atLeast('+', message)) return;
            randttp(message, 1);
            console.log('ttp2');
            break;

        case 'randttp2':
            if (!atLeast('+', message)) return;
            randttp(message, 2);
            console.log('ttp2');
            break;

        case 'randopple':
            if (!atLeast('+', message)) return;
            randopple(message);
            console.log('ttp2');
            break;

        case 'rank':
            MBrank(message);
            break;

        case 'answerbox':
            MBshowAnswerBox(message);
            break;

        case 'leaderboard':
        case 'lb':
            MBleaderboard(message);
            break;

        case 'testauth':
            MBtestAuth(message);
            break;

        case 'answer':
            MBanswerQuestion(message);
            break;

        case 'newquestion':
            if (!roomAtLeast('%', message, config.hostRoom)) return;
            MBcreateQuestion(message);
            break;

        case 'endquestion':
            if (!roomAtLeast('%', message, config.hostRoom)) return;
            MBendQuestion(message);
            break;

        case 'declare':
            if (!roomAtLeast('%', message, config.hostRoom)) return;
            MBdeclareQuestion(message);
            break;

        case 'addp':
            if (!roomAtLeast('%', message, config.hostRoom)) return;
            MBaddPoints(message);
            break;

        case 'addcustom':
            if (!atLeast('#', message)) return;
            addCustom(message);
            break;

        case 'deletecustom':
        case 'delcustom':
        case 'removecustom':
            if (!atLeast('#', message)) return;
            deleteCustom(message);
            break;

        case 'showcustom':
        case 'customs':
        case 'listcustom':
            if (!atLeast('%', message)) return;
            showCustoms(message);
            break;

        case 'top':
            if (!config.whitelist.includes(username)) return;
            showApologiesLeaderboard(message);
            break;

        case 'apologies':
            if (!config.whitelist.includes(username)) return;
            showApologiesRank(message);
            break;

        case 'addpc':
            if (!config.whitelist.includes(username)) return;
            addPoliticalCompass(message);
            break;

        case 'pc':
            if (!config.whitelist.includes(username)) return;
            politicalCompass(message, username);
            break;

        case 'pcall':
            if (!config.whitelist.includes(username)) return;
            showCombinedPoliticalCompass(message);
            break;

        case 'addhighlight':
        case 'highlight':
            if (!config.whitelist.includes(username)) return;
            addHighlight(message);
            break;

        case 'removehighlight':
        case 'delhighlight':
            if (!config.whitelist.includes(username)) return;
            removeHighlight(message);
            break;

        case 'listhighlight':
        case 'highlights':
            if (!config.whitelist.includes(username)) return;
            listHighlights(message);
            break;

        default:
            assertNever(cmd);
    }

    if (!config.whitelist.includes(username)) return;
});

// 1 minute
const timer = setTimeout(
    () => {
        hook.send(`<@&1196484431062515752> couldn't connect to showdown chat`);
    },
    1000 * 60 * 1,
);


client.on('login', () => {
    logger.info({ cmd: 'login', message: 'Connected to chat' });
    hook.send(`Connected to showdown chat`);
    clearTimeout(timer);
    loadCustomColors();
});

const app = express();

app.use(morgan('combined'));

app.get('/', (_req, res) => {
    res.redirect('/mysterybox/leaderboard');
});

app.get('/mysterybox/leaderboard', async (_req, res) => {
    const lb = await new Promise((resolve) => {
        leaderboard(resolve, { limit: 1000 });
    });
    res.send(lb);
});

app.get('/mysterybox/currentAnswers', (_req, res) => {
    const answers = MBgetAnswers();
    res.send(`<h1>Current Answers: ${answers.length}</h1>
  ${answers.map((a) => `<p style="color:${determineColour(a)}">${a}</p>`).join('\n')}
  `);
});

app.listen(13337, () => {
});
