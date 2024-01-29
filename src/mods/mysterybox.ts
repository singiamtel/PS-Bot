import { Message } from 'ps-client';
import db from '../db.js';
import { inAllowedRooms, isCmd, isRoom, toOrdinal } from '../utils.js';
import client, { config, isAuth } from '../bot.js';
import fs from 'fs';

import dotenv from 'dotenv';
import { toID } from 'ps-client/tools.js';
dotenv.config();

// stored in answer.txt, loaded on startup
// if file doesn't exist, it will be created
if (!fs.existsSync('./answer.txt')) {
    fs.writeFileSync('./answer.txt', '');
}
// remove spaces
let answer = fs.readFileSync('./answer.txt').toString().toLowerCase().replace(/ /g, '').trim();

if (!fs.existsSync('./winners.txt')) {
    fs.writeFileSync('./winners.txt', '');
}

const winners = fs.readFileSync('./winners.txt').toString().split('\n').map(toID).filter(Boolean);

function addWinner(id: string) {
    winners.push(id);
    fs.writeFileSync('./winners.txt', winners.join('\n'));
}

if (!fs.existsSync('./difficulty.txt')) {
    fs.writeFileSync('./difficulty.txt', '');
}

let difficulty : string = fs.readFileSync('./difficulty.txt').toString().toLowerCase().trim();

const hostRoom = 'petsanimals';
export function MBsetAnswer(message: Message) {
    if (isCmd(message, 'newquestion')) {
        if (!isAuth(message, 'petsanimals')) {
            return message.reply('You do not have permission to use this command.');
        }
        if (answer) return message.reply(`There is already an ongoing question. Please finish it with ${config.prefix}endquestion first.`);
        const text = message.content;
        const [_difficulty, ...newAnswertmp] = text.split(' ').slice(1).join(' ').split(',');
        const legalDifficulties = ['easy', 'medium', 'hard'];
        if (!legalDifficulties.includes(_difficulty.toLowerCase().trim())) return message.reply('Please specify a valid difficulty (easy, medium, hard).');
        const newAnswer = newAnswertmp.join('');
        if (!newAnswer) return message.reply('Please specify an answer.');
        fs.writeFileSync('./answer.txt', newAnswer.toLowerCase().trim());
        answer = newAnswer.toLowerCase().trim();
        fs.writeFileSync('./difficulty.txt', _difficulty.toLowerCase().trim());
        difficulty = _difficulty.toLowerCase().trim();
        message.reply(`The answer has been set to ${newAnswer}.`);
    } else if (isCmd(message, 'endquestion')) {
        if (!isAuth(message, 'petsanimals')) {
            return message.reply('You do not have permission to use this command.');
        }
        if (!answer) return message.reply('There is no ongoing question.');
        fs.writeFileSync('./answer.txt', '');
        answer = '';
        fs.writeFileSync('./winners.txt', '');
        winners.length = 0;
        message.reply('The question has been ended.');
    } else if (isCmd(message, 'declare')) {
        if (!isAuth(message, 'petsanimals')) {
            return message.reply('You do not have permission to use this command.');
        }
        const room = client.rooms.get(hostRoom);
        if (!room) {
            return;
        }
        if (!answer || !difficulty) return message.reply('There is no ongoing question.');
        room.send(`/declare A new ${difficulty} question has been posted in the Mystery Box!`);
        room.send(`!rfaq mysterybox`);
    }
}

// They can only answer 3 times per hour, so we need to keep track of that
let cooldowns: {[k: string]: Date}[] = [];
const cooldownTime = 60 * 60 * 1000; // 1 hour
// const cooldownTime = 30 * 1000; // 30 seconds

export function MBanswerQuestion(message: Message) {
    // const hostRoom = 'groupchat-itszxc-44323579';
    const text = message.content;
    if (isCmd(message, 'answer')) {
        const attempt = text.split(' ').slice(1).join('');
        if (isRoom(message.target)) {
            message.reply('Please answer the question in a private message!');
            message.reply(`/clearlines ${message.author.id}, 1`);
            return;
        }
        if (!answer) return message.reply('There is no ongoing question.');
        if (!difficulty) return message.reply('There is no ongoing question.');
        cooldowns = cooldowns.filter(x => x[message.author.id] && x[message.author.id].getTime() + cooldownTime > Date.now());
        // if the user appears 3 times in the cooldowns array, they can't answer anymore
        if (cooldowns.filter(x => x[message.author.id]).length >= 3) {
            message.reply('You can only answer 3 times per hour.');
            return;
        }

        if (winners.includes(message.author.id)) return message.reply('You already answered correctly. Please wait for the next question.');
        if (answer === attempt.toLowerCase().trim()) {
            const points = difficulty === 'easy' ? 2 : difficulty === 'medium' ? winners.length <= 3 ? 6 - winners.length : 3 : winners.length <= 5 ? 9 - winners.length : 4;
            addWinner(message.author.id);
            addPointsToUser(message.author.id, points, () => {});
            message.reply(`Correct answer! You were the ${toOrdinal(winners.length)} person to answer correctly. You have been awarded ${points} points.`);
            if (winners.length <= 3) {
                const room = client.rooms.get(hostRoom);
                if (!room) {
                    console.error('Room not found');
                    return;
                }
                room.send(`/adduhtml MB${winners.length}, <div class="broadcast-blue"><center>${message.author.name} has answered in ${toOrdinal(winners.length)} place!</center></div>`);
            }
            return;
        } else {
            message.reply('Wrong answer, please try again.');
            const now = new Date();
            cooldowns.push({ [message.author.id]: now });
            return;
        }
    }
}


function addPointsToUser(user: string, points: number, cb: () => void) {
    db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
        if (err) return console.error(err);
        if (!rows || rows.length === 0) {
            const query = `INSERT INTO mysterybox(name, points) VALUES(? , ?)`;
            db.run(query, [user, points], err => {
                if (err) {
                    console.error(err);
                    return;
                }
                cb();
            });
        } else {
            db.run(`UPDATE mysterybox SET points = ? WHERE name = ?`, [points + (rows[0] as any).points, user], err => {
                if (err) {
                    console.error(err);
                    return;
                }
                cb();
            });
        }
    });
}

export function MBaddPoints(message: Message) {
    const text = message.content;
    if (isCmd(message, 'addp')) {
        const args = text.split(' ').slice(1);
        const [name, _points] = args.join(' ').split(',');
        const points = Number(_points);
        if (isNaN(points)) return message.reply('Please specify a valid number of points.');
        if (!name || !points) return message.reply('Please specify a user and points.');
        const user = toID(name);
        if (user === 'unknown') return message.reply('Please specify a user.');
        // db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
        //     if (err) {
        //         console.error('here', err, rows, user);
        //         return;
        //     }
        //     if (!rows || rows.length === 0) {
        //         const query = `INSERT INTO mysterybox(name, points) VALUES(? , ?)`;
        //         db.run(query, [user, points], err => {
        //             if (err) {
        //                 console.error('here2', query, err);
        //                 return;
        //             }
        //             return message.reply(`Added ${points} points to ${name} for a total of ${points} points.`);
        //         });
        //     } else {
        //         db.run(`UPDATE mysterybox SET points = ? WHERE name = ?`, [points + (rows[0] as any).points, user], err => {
        //             if (err) return console.error(err);
        //             console.log(rows);
        //             return message.reply(`Added ${points} points to ${name} for a total of ${Number((rows[0] as any).points) + Number(points)} points.`);
        //         });
        //     }
        // });
        addPointsToUser(user, points, () => message.reply(`Added ${points} points to ${name}.`));
    }
}

const leaderboardCache: {table: string, time: number} = { table: '', time: 0 };
export function leaderboard(cb: (leaderboard: string) => void, limit = 10) {
    if (leaderboardCache.time + 5 * 1000 > Date.now()) { // 5 seconds
        console.log('Cached leaderboard');
        return cb(leaderboardCache.table);
    }
    db.all('SELECT * FROM mysterybox ORDER BY points DESC LIMIT ' + limit, (err, rows:any) => {
        if (err) return console.error(err);
        const htmlTable = `<table style="border-collapse: collapse"><tr><th style="border:1px solid; padding:3px;">Name</th><th style="border:1px solid; padding:3px">Points</th></tr>${rows.map((row:any, idx: number) => `<tr><td style="border:1px solid; padding:3px">${idx === 0 ? '👑 ' : ''}${row.name}</td><td style="border:1px solid; padding:3px">${row.points}</td></tr>`).join('')}</table>`;
        leaderboardCache.table = htmlTable;
        leaderboardCache.time = Date.now();
        cb(htmlTable);
    });
}


export function MBleaderboard(message: Message) {
    if (!isAuth(message)) {
        console.log('not auth');
        return;
    }
    if (isCmd(message, ['leaderboard', 'lb'])) {
        leaderboard(htmlTable => {
            message.reply(`!htmlbox ${htmlTable}`);
        });
    }
}

export function MBrank(message: Message) {
    if (isRoom(message.target) && !inAllowedRooms(message, ['petsanimals'])) {
        return;
    }
    if (isCmd(message, 'rank')) {
        const displayname = message.content.split(' ').slice(1).join(' ');
        const user = toID(displayname);
        if (user === 'unknown') return message.reply('Please specify a user.');
        db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
            if (err) return console.error(err);
            if (!rows || rows.length === 0) return message.reply('This user doesn\'t have any points yet.');
            const points = rows[0].points;
            // return message.reply(`${displayname} has ${points} points.`);
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
