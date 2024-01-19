import { Message } from 'ps-client';
import db from '../db.js';
import { formatTop3, inAllowedRooms, isAuth, isRoom, toOrdinal, usernameify } from '../utils.js';
import bot from '../bot.js';

import dotenv from 'dotenv';
dotenv.config();

// Function to get response for a message
type OnGoingQuestion = {question: string, answer: string, type: 'text', image?: string}
let onGoingQuestion : OnGoingQuestion | null = null;
const winners: string[] = [];

function endQuestion(hostRoom: string) {
    if (!onGoingQuestion) {
        console.error('Trying to end a question but there is no question being created.');
        return;
    }
    const host = bot.getRoom(hostRoom);
    if (!host) {
        console.error('Trying to end a question but bot is not in host room.');
        return;
    }
    if (winners.length === 0) {
        host.send(`/adduhtml question, The question has ended. No one answered correctly :(`);
        return;
    } else {
        // 5 points for first, 3 for second, 2 for third, 1 for everyone else
        winners.forEach((winner, idx) => {
            const points = idx === 0 ? 5 : idx === 1 ? 3 : idx === 2 ? 2 : 1;
            addPointsToUser(winner, points, () => {});
        });
        // announce the 3 first winners, and how many points everyone got
        host.send(`/adduhtml question, The question has ended. Congratulations to <b>${formatTop3(winners)}</b> for being the first to answer correctly! Everyone else who answered correctly also gets 1 point.`);
        winners.length = 0;
        return;
    }
}

function startQuestion(hostRoom: string, { question, answer, type, image }: OnGoingQuestion): boolean {
    if (onGoingQuestion) {
        console.error('Trying to start a question but there is already a question being created.');
        return false;
    }
    const host = bot.getRoom(hostRoom);
    if (!host) {
        console.error('Trying to start a question but bot is not in host room.');
        return false;
    }
    onGoingQuestion = { question, answer, type, image };
    // host.send(`/adduhtml question, A new Mystery Box question has been created! <b>${question}</b> <form data-submitsend="/msg ${process.env.botusername}, #answer {test}"><input name="test" type="text"/><button>Submit response</button></form>`);
    host.send(`/adduhtml question, A new Mystery Box question has been created! <b>${onGoingQuestion.question}</b> <br> Answer it with <code>/msg ${process.env.botusername}, #answer [answer]</code>`);
    setTimeout(() => {
        endQuestion(hostRoom);
    }, 15 * 1000);
    return true;
}


export function MBcreateQuestion(message: Message) {
    const hostRoom = 'botdevelopment'; // TODO: Change this to the real host room
    const text = message.content;
    if (text.startsWith('#answer')) {
        if (isRoom(message.target)) {
            message.reply('Please answer the question in a private message!');
            message.reply(`/clearlines ${message.author.id}, 1`);
            return;
        }
        if (!onGoingQuestion) return message.reply('There is no question being created. Please create one first.');
        const answer = text.split(' ').slice(1).join(' ');
        if (winners.includes(message.author.id)) return message.reply('You already answered correctly. Please wait for the next question.');
        if (answer.toLowerCase().trim() === onGoingQuestion.answer.toLowerCase().trim()) {
            winners.push(message.author.id);
            message.reply(`Correct answer! You were the ${toOrdinal(winners.length)} person to answer correctly.`);
            return;
        } else {
            message.reply('Wrong answer, please try again.');
            return;
        }
    }
    if (!isAuth(message, 'petsanimals')) {
        return;
    } else if (text.startsWith('#newquestion')) {
        if (onGoingQuestion) return message.reply('There is already a question being created. Please wait until it finishes.');
        const args = text.split(' ').slice(1).join(' ').split(',');
        let _type, image, question, answer;
        let host;
        switch (args[0]) {
            case 'text':
                [_type, question, answer] = args;
                startQuestion(hostRoom, { question, answer, type: 'text' });
                break;
            case 'help':
                message.reply(`!code #newquestion help

The mystery box is a game where users can earn points by answering questions.
The questions can be either text or image based.
To add a new text question, use the following command:
  #newquestion text, <question>, <answer>
For example:
  #newquestion text, What is the capital of the United States?, Washington

To add a new image question, use the following command:
  #newquestion image, <image url>, <question>, <answer>
For example:
  #newquestion image, https://i.imgur.com/0nZkQfF.jpg, What is the name of this animal?, cat
Make sure to use a direct link to the image, not a link to a page containing the image.
`);
                break;
            case 'image':
                [_type, image, question, answer] = args;
                break;
            default:
                return message.reply('Please specify a valid question type. Valid types are: text, image');
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
    if (text.startsWith('#addp')) {
        const args = text.split(' ').slice(1);
        const [name, _points] = args.join(' ').split(',');
        const points = Number(_points);
        if (isNaN(points)) return message.reply('Please specify a valid number of points.');
        if (!name || !points) return message.reply('Please specify a user and points.');
        const user = usernameify(name);
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
        addPointsToUser(user, points, () => message.reply(`Added ${points} points to ${name} for a total of ${points} points.`));
    }
}


export function MBleaderboard(message: Message) {
    const text = message.content;
    if (!isAuth(message)) {
        console.log('not auth');
        return;
    }
    if (text.startsWith('#leaderboard') || text.startsWith('#lb')) {
        db.all('SELECT * FROM mysterybox ORDER BY points DESC LIMIT 10', (err, rows:any) => {
            if (err) return console.error(err);
            const htmlTable = `<table style="border-collapse: collapse"><tr><th style="border:1px solid; padding:3px;">Name</th><th style="border:1px solid; padding:3px">Points</th></tr>${rows.map((row:any, idx: number) => `<tr><td style="border:1px solid; padding:3px">${idx === 0 ? '👑 ' : ''}${row.name}</td><td style="border:1px solid; padding:3px">${row.points}</td></tr>`).join('')}</table>`;
            message.reply(`!htmlbox ${htmlTable}`);
        });
    }
}

export function MBrank(message: Message) {
    const text = message.content;
    if (isRoom(message.target) && !inAllowedRooms(message, ['petsanimals'])) {
        return;
    }
    if (text.startsWith('#rank')) {
        const displayname = message.content.split(' ').slice(1).join(' ');
        const user = usernameify(displayname);
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
