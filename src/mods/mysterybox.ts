import { Message } from 'ps-client';
import db from '../db';
import { inAllowedRooms, isAuth, isRoom, usernameify } from '../utils';
import bot from '../bot';

import dotenv from 'dotenv';
dotenv.config();

// Function to get response for a message
let onGoingQuestion = false;
export function MBcreateQuestion(message: Message) {
    const hostRoom = 'botdevelopment';
    const text = message.content;
    if (!isAuth(message, 'petsanimals')) {
        return;
    }
    if (text.startsWith('#newquestion')) {
        if (onGoingQuestion) return message.reply('There is already a question being created. Please wait until it finishes.');
        const args = text.split(' ').slice(1).join(' ').split(',');
        let _type, image, question, answer;
        console.log(args);
        let host;
        switch (args[0]) {
            case 'text':
                [_type, question, answer] = args;
                onGoingQuestion = true;
                // send question to host room. the host room is not the room the command was sent in
                host = bot.getRoom(hostRoom);
                if (!host) return message.reply('Bot is not in host room. Please report this to an admin.');
                // bot.getRoom(hostRoom).send(`!htmlbox <b>${question}</b>`);
                host.send(`/adduhtml question, A new Mystery Box question has been created! <b>${question}</b><br>Please answer by sending me a PM with the answer with the following command: <code>#answer ${answer}</code>`);
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
                console.log('image', image);
                break;
            default:
                return message.reply('Please specify a valid question type. Valid types are: text, image');
        }
    }
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
        db.all('SELECT * FROM mysterybox WHERE name = ?', [user], (err, rows: any) => {
            if (err) {
                console.error('here', err, rows, user);
                return;
            }
            if (!rows || rows.length === 0) {
                const query = `INSERT INTO mysterybox(name, points) VALUES(? , ?)`;
                db.run(query, [user, points], err => {
                    if (err) {
                        console.error('here2', query, err);
                        return;
                    }
                    return message.reply(`Added ${points} points to ${name} for a total of ${points} points.`);
                });
            } else {
                db.run(`UPDATE mysterybox SET points = ? WHERE name = ?`, [points + (rows[0] as any).points, user], err => {
                    if (err) return console.error(err);
                    console.log(rows);
                    return message.reply(`Added ${points} points to ${name} for a total of ${Number((rows[0] as any).points) + Number(points)} points.`);
                });
            }
        });
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
