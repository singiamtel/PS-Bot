import type { Message } from 'ps-client';
import db from '../db.js';
import { inAllowedRooms, isRoom, toOrdinal } from '../utils.js';
import client, { atLeast, privateHTML, reply, roomAtLeast } from '../bot.js';
import { config } from '../config.js';

import { toID } from 'ps-client/tools.js';
import { addCooldown, addWinner, endQuestion, getQuestion, isInCooldown, isQuestionOngoing, newQuestion, winners } from './mysterybox_db.js';
import { logger } from '../logger.js';

const legalDifficulties = ['easy', 'medium', 'hard'];
const hostRoom = config.hostRoom;

type HostRoomHTMLOptions = {
    name?: string;
    change?: boolean;
    notransform?: boolean;
};

export function MBtestAuth(message: Message<'chat' | 'pm'>) {
    return roomAtLeast('%', message, hostRoom) ? reply(message, `You are auth in ${hostRoom}.`) : reply(message, `You are not auth in ${hostRoom}.`);
}

export function MBendQuestion(message: Message<'chat' | 'pm'>) {
    if (!isQuestionOngoing()) return message.reply('There is no ongoing question.');
    endQuestion();
    message.reply('The question has been ended.');
}

export function MBdeclareQuestion(message: Message<'chat' | 'pm'>) {
    const room = client.rooms.get(hostRoom);
    const question = getQuestion();
    if (!room) {
        return;
    }
    if (!isQuestionOngoing()) return message.reply('There is no ongoing question.');
    room.send(`/declare A new ${question.difficulty} question has been posted in the Mystery Box!`);
    room.send(`!rfaq mysterybox`);
}

export function MBcreateQuestion(message: Message<'chat' | 'pm'>) {
    if (isQuestionOngoing()) return reply(message, `There is already an ongoing question. Please finish it with ${config.prefix}endquestion first.`);
    const text = message.content;
    const [_difficulty, ...newAnswertmp] = text.split(' ').slice(1).join(' ').split(',');
    if (!legalDifficulties.includes(_difficulty.toLowerCase().trim())) return message.reply('Please specify a valid difficulty (easy, medium, hard).');
    const newAnswer = newAnswertmp.join('');
    if (!newAnswer) return message.reply('Please specify an answer.');
    newQuestion(newAnswer, _difficulty);
    message.reply(`The answer has been set to ${newAnswer}.`);
}

const botMsg = /^\/botmsg /i;
export function MBanswerQuestion(message: Message<'chat' | 'pm'>) {
    const text = message.content;
    logger.info({ cmd: 'mysteryboxAnswer', message: 'Answering question', content: text });
    const question = getQuestion();
    const { answer, difficulty } = question;
    const answerInRoom = botMsg.test(text);
    const attempt = text.replace(botMsg, '').split(' ').slice(1).join('');
    if (isRoom(message.target)) {
        reply(message, 'Please answer the question in a private message!');
        message.reply(`/clearlines ${message.author.id}, 1, don't answer in the room :c`);
        return;
    }
    if (!isQuestionOngoing()) {
        return answerInRoom ? privateHostRoomHTML(message, 'There is no ongoing question.') : reply(message, 'There is no ongoing question.');
    }
    if (isInCooldown(message.author.id)) {
        return answerInRoom ? privateHostRoomHTML(message, 'You can only answer 3 times per hour.') : reply(message, 'You can only answer 3 times per hour.');
    }
    if (winners.includes(message.author.id)) return answerInRoom ? privateHostRoomHTML(message, 'You already answered correctly. Please wait for the next question.') : reply(message, 'You already answered correctly. Please wait for the next question.');
    if (answer === attempt.toLowerCase().trim()) {
        const points = difficulty === 'easy' ? 2 : difficulty === 'medium' ? winners.length <= 3 ? 6 - winners.length : 3 : winners.length <= 5 ? 9 - winners.length : 4;
        addWinner(message.author.id);
        addPointsToUser(message.author.id, points);
        const msgContent = `Correct answer! You were the ${toOrdinal(winners.length)} person to answer correctly. You have been awarded ${points} points.`;
        if (answerInRoom) {
            privateHostRoomHTML(message, msgContent);
        } else {
            reply(message, msgContent);
        }
        if (winners.length <= 3) {
            const room = client.rooms.get(hostRoom);
            if (!room) {
                logger.error({ cmd: 'mysteryboxAnswer', message: 'Can\'t declare winner, bot is not present in the host room', room: hostRoom, content: message.content });
                return;
            }
            room.sendHTML(`<div class="broadcast-blue"><center>${message.author.name} has answered in ${toOrdinal(winners.length)} place!</center></div>`, { name: `MB${winners.length}` });
        }
        return;
    } else {
        if (answerInRoom) {
            refreshAnswerBox(message, message.author.id);
            privateHostRoomHTML(message, 'Wrong answer, please try again.');
        } else {
            reply(message, 'Wrong answer, please try again.');
        }
        addCooldown(message.author.id);
        return;
    }
}

const answerBox = `<center><div style="padding: 10px; border-radius:15px;background-color: #ffeac9 ; color: #85071c; width:500px; border: 1px solid #85071c">  <h1>Enter your guess!</h1> <form data-submitsend="/msgroom ${config.hostRoom},/botmsg ${config.name}, ${config.prefix}answer {answer}"><input autofocus style="width: 400px; margin: 0 auto" autocomplete="off" name="answer" placeholder="Your guess goes here" style="width:60%;"><button style="display:block;margin: 10px;padding: 2px" class="button">Submit</button></form></div></center>`;

function privateHostRoomHTML(message: Message<'chat' | 'pm'>, content: string, options: HostRoomHTMLOptions = {}) {
    const room = client.rooms.get(hostRoom);
    if (!room) {
        logger.error({ cmd: 'mysteryboxPrivateHTML', message: 'Can\'t send private room HTML, bot is not present in the host room', room: hostRoom, content: message.content });
        return privateHTML(message, content, hostRoom, options);
    }
    return room.privateHTML(message.author.id, content, options) ?? privateHTML(message, content, hostRoom, options);
}

function refreshAnswerBox(message: Message<'chat' | 'pm'>, user: string | null) {
    const room = client.rooms.get(hostRoom);
    if (!room) {
        logger.error({ cmd: 'mysteryboxAnswerBox', message: 'Can\'t show answer box, bot is not present in the host room', room: hostRoom, content: message.content });
        return null;
    }
    if (user) {
        return room.privateHTML(user, answerBox, { name: 'answerbox' });
    }
    return room.sendHTML(answerBox, { name: 'answerbox' });
}

export function MBshowAnswerBox(message: Message<'chat' | 'pm'>) {
    const isBotMsg = botMsg.test(message.content);
    if (isBotMsg) {
        return refreshAnswerBox(message, message.author.id);
    }
    if (!isRoom(message.target)) {
        return reply(message, 'Please use this command in a room.');
    }
    if (!inAllowedRooms(message, [hostRoom])) {
        return;
    }
    if (!atLeast('+', message)) {
        return refreshAnswerBox(message, message.author.id);
    }
    refreshAnswerBox(message, null);
}

function addPointsToUser(user: string, points: number) {
    try {
        db.prepare('INSERT INTO mysterybox(name, points) VALUES(?, ?) ON CONFLICT(name) DO UPDATE SET points = points + excluded.points').run(user, points);
    } catch (err) {
        logger.error({ cmd: 'mysteryboxAddPoints', message: 'Error in addPointsToUser', user, points, error: err });
    }
}

export function MBaddPoints(message: Message<'chat' | 'pm'>) {
    const text = message.content;
    const args = text.split(' ').slice(1);
    const [name, _points] = args.join(' ').split(',');
    const points = Number(_points);
    if (isNaN(points)) return message.reply('Please specify a valid number of points.');
    if (!name) return message.reply('Please specify a user and points.');
    const user = toID(name);
    if (!user) return message.reply('Please specify a user.');
    addPointsToUser(user, points);
    message.reply(`Added ${points} points to ${name}.`);
}

const leaderboardCache: { table: string, time: number } = { table: '', time: 0 };
export function leaderboard({ limit = 10, html = true } = {}): string {
    if (leaderboardCache.time + 5 * 1000 > Date.now()) { // 5 seconds
        return leaderboardCache.table;
    }
    try {
        const rows = db.prepare('SELECT * FROM mysterybox ORDER BY points DESC LIMIT ?').all(limit) as unknown as Record<string, unknown>[];
        if (!html) { return rows.map((row) => `${row.points === rows[0].points ? '👑 ' : ''}${row.name}: ${row.points}`).join('\n'); }
        const htmlTable = `<table style="border-collapse: collapse"><tr><th style="border:1px solid; padding:3px;">Name</th><th style="border:1px solid; padding:3px">Points</th></tr>${rows.map((row) => `<tr><td style="border:1px solid; padding:3px">${row.points === rows[0].points ? '👑 ' : ''}${row.name}</td><td style="border:1px solid; padding:3px">${row.points}</td></tr>`).join('')}</table>`;
        leaderboardCache.table = htmlTable;
        leaderboardCache.time = Date.now();
        return htmlTable;
    } catch (err) {
        logger.error({ cmd: 'leaderboard', message: 'Error getting from db', error: err });
        return '';
    }
}


export function MBleaderboard(message: Message<'chat' | 'pm'>) {
    const isBotMsg = botMsg.test(message.content);
    if (isBotMsg) {
        const htmlTable = leaderboard();
        privateHostRoomHTML(message, htmlTable, { name: 'MBleaderboard' });
        return;
    }
    if (isRoom(message.target)) {
        if (!inAllowedRooms(message, [hostRoom]) || !atLeast('+', message)) {
            return;
        }
        const htmlTable = leaderboard();
        message.target.sendHTML(htmlTable, { name: 'MBleaderboard' });
        return;
    }
    if (!isRoom(message.target) || atLeast('+', message)) {
        const table = leaderboard({ html: false });
        return message.reply(`!code ${table}`);
    }
}

export function MBrank(message: Message<'chat' | 'pm'>) {
    if (isRoom(message.target) && !inAllowedRooms(message, [hostRoom])) {
        return;
    }
    const isBotMsg = botMsg.test(message.content);
    const displayname = message.content.replace(botMsg, '').split(' ').slice(1).join(' ') || message.author.name;
    const user = toID(displayname);
    if (!user) return message.reply('Please specify a user.');
    try {
        const rows = db.prepare('SELECT * FROM mysterybox WHERE name = ?').all(user) as unknown as Record<string, unknown>[];
        if (!rows || rows.length === 0) {
            if (!isRoom(message.target) || atLeast('+', message)) {
                return isBotMsg ? privateHostRoomHTML(message, `${displayname} has no points yet.`, { name: `MBrank-${user}` }) : message.reply(`${displayname} has no points yet.`);
            } else {
                // Pm the user
                return message.author.send(`This user has no points yet.`);
            }
        }
        const points = rows[0].points;
        if (isBotMsg) {
            return privateHostRoomHTML(message, `${displayname} has ${points} points.`, { name: `MBrank-${user}` });
        }
        if (!isRoom(message.target) || atLeast('+', message)) {
            return message.reply(`${displayname} has ${points} points.`);
        } else {
            // Pm the user
            return message.author.send(`You have ${points} points.`);
        }
    } catch (err) {
        logger.error({ cmd: 'mysteryboxRank', message: 'Error getting from db', user, error: err });
    }
}

export function MBgetAnswers() {
    return winners;
}
