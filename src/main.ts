import { determineColour, loadCustomColors } from './namecolour.js';
import { type Message } from 'ps-client';
import client, { atLeast, privateHTML, roomAtLeast } from './bot.js';
import { config } from './config.js';

// Mods
import { apologyCounter, showApologiesLeaderboard, showApologiesRank } from './mods/apologies.js';
import { compareColours, nameColour } from './mods/namecolour.js';
import { addCustom, answerToCustoms, deleteCustom, showCustoms } from './mods/customs.js';
import { randttp, ttp } from './mods/ttp.js';
import { randopple } from './mods/randopple.js';
import { randomTeam } from './mods/randomteam.js';
import { hook } from './hook.js';
import { MBaddPoints, MBanswerQuestion, MBgetAnswers, MBleaderboard, MBrank, MBcreateQuestion, MBshowAnswerBox, MBtestAuth, leaderboard, MBendQuestion, MBdeclareQuestion } from './mods/mysterybox.js';
import { toID } from 'ps-client/tools.js';
import { assertNever, isRoom, toCmd } from './utils.js';
import { addHighlight, checkHighlights, listHighlights, removeHighlight } from './mods/wordHighlight.js';
import { helpCommand } from './mods/help.js';

import express from 'express';
import { logger } from './logger.js';
import { saveChat } from './mods/saveChat.js';

const pmBotCooldown = new Map<string, number>();
const PM_BOT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

function whitelistDenied(message: Message<'chat' | 'pm'>) {
    const room = isRoom(message.target) ? message.target.roomid : '';
    privateHTML(message, '<div style="border:1px solid #ba0000;background:#ffe0e0;padding:8px;border-radius:4px"><strong style="color:#ba0000">Permission Denied</strong><br>You are not authorized to use this command.</div>', room);
}

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
    if (!cmd) {
        if (!isRoom(message.target)) {
            const now = Date.now();
            for (const [user, time] of pmBotCooldown) {
                if (now - time >= PM_BOT_COOLDOWN_MS) pmBotCooldown.delete(user);
            }
            const lastReply = pmBotCooldown.get(username) ?? 0;
            if (now - lastReply >= PM_BOT_COOLDOWN_MS) {
                pmBotCooldown.set(username, now);
                message.author.send(
                    `Hi, I'm a bot! My prefix is \`${config.prefix}\`. Try \`${config.prefix}help\` to see what I can do.`,
                );
            }
        }
        return;
    }
    // const hasPerms = getAuth(message) || isRoomAuth || config.whitelist.includes(username)

    logger.verbose({ cmd: 'dispatch', message: 'Command dispatched', command: cmd, username, target });

    try {
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
                if (!atLeast('+', message)) return;
                ttp(message, 1);
                break;

            case 'ttp2':
                if (!atLeast('+', message)) return;
                ttp(message, 2);
                break;

            case 'randttp':
                if (!atLeast('+', message)) return;
                randttp(message, 1);
                break;

            case 'randttp2':
                if (!atLeast('+', message)) return;
                randttp(message, 2);
                break;

            case 'randopple':
                if (!atLeast('+', message)) return;
                randopple(message);
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
                if (!config.whitelist.includes(username)) { whitelistDenied(message); return; }
                showApologiesLeaderboard(message);
                break;

            case 'apologies':
                if (!config.whitelist.includes(username)) { whitelistDenied(message); return; }
                showApologiesRank(message);
                break;

            case 'addhighlight':
            case 'highlight':
                if (!config.whitelist.includes(username)) { whitelistDenied(message); return; }
                addHighlight(message);
                break;

            case 'removehighlight':
            case 'delhighlight':
                if (!config.whitelist.includes(username)) { whitelistDenied(message); return; }
                removeHighlight(message);
                break;

            case 'listhighlight':
            case 'highlights':
                if (!config.whitelist.includes(username)) { whitelistDenied(message); return; }
                listHighlights(message);
                break;

            case 'randomteam':
            case 'randteam':
                if (!atLeast('+', message)) return;
                randomTeam(message);
                break;

            case 'help':
                helpCommand(message);
                break;

            default:
                assertNever(cmd);
        }
    } catch (e) {
        logger.error({ cmd: 'dispatch', error: (e as Error).message, command: cmd, username, target });
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

app.get('/', (_req, res) => {
    res.redirect('/mysterybox/leaderboard');
});

app.get('/mysterybox/leaderboard', (_req, res) => {
    const lb = leaderboard({ limit: 1000 });
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
