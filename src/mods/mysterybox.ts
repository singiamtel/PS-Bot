import { Message } from 'ps-client';
import db from '../db.js';
import { inAllowedRooms, isCmd, isRoom, rootDir, toOrdinal } from '../utils.js';
import client, { config, isAuth, privateHTML, reply } from '../bot.js';

import dotenv from 'dotenv';
import { toID } from 'ps-client/tools.js';
import { addCooldown, addWinner, endQuestion, getQuestion, isInCooldown, isQuestionOngoing, newQuestion, winners } from './mysterybox_db.js';
import { logger } from '../logger.js';
import path from 'path';

dotenv.config({ path: path.join(rootDir, '../.env') });


const legalDifficulties = ['easy', 'medium', 'hard'];
const hostRoom = config.hostRoom;

export function MBtestAuth(message: Message) {
    if (isCmd(message, 'testauth')) {
        return isAuth(message, hostRoom) ? reply(message, `You are auth in ${hostRoom}.`) : reply(message, `You are not auth in ${hostRoom}.`);
    }
}

export function MBsetAnswer(message: Message) {
    if (!isAuth(message, hostRoom)) {
        return;
    }
    const question = getQuestion();
    if (isCmd(message, 'newquestion')) {
        if (isQuestionOngoing()) return reply(message, `There is already an ongoing question. Please finish it with ${config.prefix}endquestion first.`);
        const text = message.content;
        const [_difficulty, ...newAnswertmp] = text.split(' ').slice(1).join(' ').split(',');
        if (!legalDifficulties.includes(_difficulty.toLowerCase().trim())) return message.reply('Please specify a valid difficulty (easy, medium, hard).');
        const newAnswer = newAnswertmp.join('');
        if (!newAnswer) return message.reply('Please specify an answer.');
        newQuestion(newAnswer, _difficulty);
        message.reply(`The answer has been set to ${newAnswer}.`);
    } else if (isCmd(message, 'endquestion')) {
        if (!isQuestionOngoing()) return message.reply('There is no ongoing question.');
        endQuestion();
        message.reply('The question has been ended.');
    } else if (isCmd(message, 'declare')) {
        const room = client.rooms.get(hostRoom);
        if (!room) {
            return;
        }
        if (!isQuestionOngoing()) return message.reply('There is no ongoing question.');
        room.send(`/declare A new ${question.difficulty} question has been posted in the Mystery Box!`);
        room.send(`!rfaq mysterybox`);
    }
}
// const cooldownTime = 30 * 1000; // 30 seconds

const botMsg = /^\/botmsg /i;
export function MBanswerQuestion(message: Message) {
    // const hostRoom = 'groupchat-itszxc-44323579';
    const text = message.content;
    if (isCmd(message, 'answer')) {
        logger.verbose('Answering question: ' + text);
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
            return answerInRoom ? privateHTML(message, 'There is no ongoing question.', hostRoom) : reply(message, 'There is no ongoing question.');
        }
        if (isInCooldown(message.author.id)) {
            return answerInRoom ? privateHTML(message, 'You can only answer 3 times per hour.', hostRoom) : reply(message, 'You can only answer 3 times per hour.');
        }
        if (winners.includes(message.author.id)) return answerInRoom ? privateHTML(message, 'You already answered correctly. Please wait for the next question.', hostRoom) : reply(message, 'You already answered correctly. Please wait for the next question.');
        if (answer === attempt.toLowerCase().trim()) {
            const points = difficulty === 'easy' ? 2 : difficulty === 'medium' ? winners.length <= 3 ? 6 - winners.length : 3 : winners.length <= 5 ? 9 - winners.length : 4;
            addWinner(message.author.id);
            addPointsToUser(message.author.id, points, () => {});
            const msgContent = `Correct answer! You were the ${toOrdinal(winners.length)} person to answer correctly. You have been awarded ${points} points.`;
            if (answerInRoom) {
                privateHTML(message, msgContent, hostRoom);
            } else {
                reply(message, msgContent);
            }
            if (winners.length <= 3) {
                const room = client.rooms.get(hostRoom);
                if (!room) {
                    logger.error('Bot is not present in the host room ' + hostRoom + ' ' + message.content);
                    return;
                }
                room.send(`/adduhtml MB${winners.length}, <div class="broadcast-blue"><center>${message.author.name} has answered in ${toOrdinal(winners.length)} place!</center></div>`);
            }
            return;
        } else {
            console.log('text', text, 'answerInRoom', answerInRoom);
            if (answerInRoom) {
                refreshAnswerBox(message, message.author.id);
                privateHTML(message, 'Wrong answer, please try again.', hostRoom);
            } else {
                reply(message, 'Wrong answer, please try again.');
            }
            const now = new Date();
            // cooldowns.push({ [message.author.id]: now });
            addCooldown(message.author.id);
            return;
        }
    }
}

const answerBox = `<center><div style="padding: 10px; border-radius:15px;background-color: #ffeac9 ; color: #85071c; width:500px; border: 1px solid #85071c">  <h1>Enter your guess!</h1> <form data-submitsend="/msgroom ${config.hostRoom},/botmsg ${config.name}, ${config.prefix}answer {answer}"><input autofocus style="width: 400px; margin: 0 auto" autocomplete="off" name="answer" placeholder="Your guess goes here" style="width:60%;"><button style="display:block;margin: 10px;padding: 2px" class="button">Submit</button></form></div></center>`;

function refreshAnswerBox(message: Message, user: string | null) {
    if (user) {
        return message.reply(`/msgroom ${config.hostRoom},/sendprivateuhtml ${user},answerbox, ${answerBox}`);
    }
    message.reply(`/msgroom ${config.hostRoom},/adduhtml answerbox, ${answerBox}`);
}

export function MBshowAnswerBox(message: Message) {
    if (isCmd(message, 'answerbox')) {
        logger.verbose('Showing answer box: ' + message.content);
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
        if (!isAuth(message)) {
            return refreshAnswerBox(message, message.author.id);
        }
        refreshAnswerBox(message, null);
    }
}

function addPointsToUser(user: string, points: number, cb: () => void) {
    db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
        if (err) return logger.error(err);
        if (!rows || rows.length === 0) {
            const query = `INSERT INTO mysterybox(name, points) VALUES(? , ?)`;
            db.run(query, [user, points], err => {
                if (err) {
                    logger.error(err);
                    return;
                }
                cb();
            });
        } else {
            db.run(`UPDATE mysterybox SET points = ? WHERE name = ?`, [points + (rows[0] as any).points, user], err => {
                if (err) {
                    logger.error(err);
                    return;
                }
                cb();
            });
        }
    });
}

export function MBaddPoints(message: Message) {
    const text = message.content;
    if (!isAuth(message, hostRoom)) {
        return;
    }
    if (isCmd(message, 'addp')) {
        const args = text.split(' ').slice(1);
        const [name, _points] = args.join(' ').split(',');
        const points = Number(_points);
        if (isNaN(points)) return message.reply('Please specify a valid number of points.');
        if (!name || !points) return message.reply('Please specify a user and points.');
        const user = toID(name);
        if (user === 'unknown') return message.reply('Please specify a user.');
        addPointsToUser(user, points, () => message.reply(`Added ${points} points to ${name}.`));
    }
}

const leaderboardCache: {table: string, time: number} = { table: '', time: 0 };
export function leaderboard(cb: (leaderboard: string) => void, { limit = 10, html = true } = {}) {
    if (leaderboardCache.time + 5 * 1000 > Date.now()) { // 5 seconds
        return cb(leaderboardCache.table);
    }
    db.all('SELECT * FROM mysterybox ORDER BY points DESC LIMIT ' + limit, (err, rows:any) => {
        if (err) return logger.error(err);
        if (!html) { return cb(rows.map((row:any) => `${row.points === rows[0].points ? '👑 ' : ''}${row.name}: ${row.points}`).join('\n')); }
        const htmlTable = `<table style="border-collapse: collapse"><tr><th style="border:1px solid; padding:3px;">Name</th><th style="border:1px solid; padding:3px">Points</th></tr>${rows.map((row:any) => `<tr><td style="border:1px solid; padding:3px">${row.points === rows[0].points ? '👑 ' : ''}${row.name}</td><td style="border:1px solid; padding:3px">${row.points}</td></tr>`).join('')}</table>`;
        leaderboardCache.table = htmlTable;
        leaderboardCache.time = Date.now();
        cb(htmlTable);
    });
}


export function MBleaderboard(message: Message) {
    if (isCmd(message, ['leaderboard', 'lb'])) {
        const isBotMsg = botMsg.test(message.content);
        if (isBotMsg) {
            leaderboard(htmlTable => {
                privateHTML(message, htmlTable, hostRoom);
            });
            return;
        }
        if (isRoom(message.target)) {
            if (!inAllowedRooms(message, [hostRoom]) || !isAuth(message)) {
                return;
            }
            leaderboard(htmlTable => {
                message.reply(`/adduhtml MBleaderboard, ${htmlTable}`);
            });
            return;
        }
        if (!isRoom(message.target) || isAuth(message)) {
            return leaderboard(table => {
                message.reply(`!code ${table}`);
            }, { html: false });
        }
    }
}

export function MBrank(message: Message) {
    if (isRoom(message.target) && !inAllowedRooms(message, [hostRoom])) {
        return;
    }
    if (isCmd(message, 'rank')) {
        const isBotMsg = botMsg.test(message.content);
        const displayname = message.content.replace(botMsg, '').split(' ').slice(1).join(' ') || message.author.name;
        const user = toID(displayname);
        if (user === 'unknown') return message.reply('Please specify a user.');
        db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
            if (err) return logger.error(err);
            if (!rows || rows.length === 0) {
                if (!isRoom(message.target) || isAuth(message)) {
                    return isBotMsg ? privateHTML(message, `${displayname} has no points yet.`, hostRoom) : message.reply(`${displayname} has no points yet.`);
                } else {
                    // Pm the user
                    return message.author.send(`This user has no points yet.`);
                }
            }
            const points = rows[0].points;
            if (isBotMsg) {
                return privateHTML(message, `${displayname} has ${points} points.`, hostRoom);
            }
            if (!isRoom(message.target) || isAuth(message)) {
                return message.reply(`${displayname} has ${points} points.`);
            } else {
                // Pm the user
                return message.author.send(`You have ${points} points.`);
            }
        });
    }
}

export function MBgetAnswers() {
    return winners;
}
