// const db = require('../db.js').db;
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';
import db from '../db.js';
import { usernameify } from '../utils.js';
import { URL } from 'node:url';

export function politicalCompass(message: Message, username: string) {
    if (username === 'unknown') {
        console.log('Unknown user: ' + message.author.name);
        return;
    }
    if (/#addpc/.test(message.content)) {
        // ec = economic
        // so = social
        let user = message.content.split(' ')[1];
        user = usernameify(user);
        const curr_url_tmp = message.content.split(' ')[2];
        if (curr_url_tmp === undefined) {
            message.reply('You need to provide a URL! (fill https://www.politicalcompass.org/test and paste the URL with your results when you are done)');
            return;
        }
        const curr_url = new URL(curr_url_tmp);
        if (!(curr_url.hostname === 'www.politicalcompass.org' || curr_url.hostname === 'politicalcompass.org')) {
            message.reply('That is not a valid political compass URL!');
            console.log('Invalid political compass hostname: ' + curr_url);
            return;
        }
        const params = curr_url.searchParams;
        const ec = Number(params.get('ec'));
        const soc = Number(params.get('soc'));
        if (!ec || !soc || isNaN(ec) || isNaN(soc) || ec < -10 || ec > 10 || soc < -10 || soc > 10) {
            message.reply('That is not a valid political compass URL!');
            console.log('Invalid political compass URL ec/soc: ' + curr_url + ' ec: ' + ec + ' soc: ' + soc);
            return;
        }
        // find the user in the database
        db.get('SELECT * FROM pc WHERE name = ?', [user], (err, row) => {
            if (err) {
                console.log(err);
                return;
            }
            if (row === undefined) {
                // add the user to the database
                db.run('INSERT INTO pc (name, economic, social) VALUES (?, ?, ?)', [user, ec, soc], (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    message.reply('Political compass has been added!');
                });
            } else {
                // update the user's political compass
                db.run('UPDATE pc SET economic = ?, social = ? WHERE name = ?', [ec, soc, user], (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    message.reply('Political compass has been updated!');
                });
            }
        });
    } else if (/#pc /.test(message.content)) {
        // find the user in the database
        const user = message.content.split(' ').slice(1).join(' ');
        const username = usernameify(user);
        db.get('SELECT * FROM pc WHERE name = ?', [username], (err, row) => {
            if (err) {
                console.log(err);
                return;
            }
            if (!row) {
                message.reply(user + 'has not added their political compass yet!');
            } else {
                // https://www.politicalcompass.org/analysis2?ec=-11&soc=-4.36
                const econ = (row as any).economic;
                const soc = (row as any).social;
                message.reply(`${user} political compass is ${econ}, ${soc}. https://www.politicalcompass.org/analysis2?ec=${econ}&soc=${soc}`);
            }
        });
    } else if (/#pcall/.test(message.content)) {
        //check the type of channel
        if (!(message.target instanceof Room)) { return; }
        if (message.target.type !== 'chat') {
            message.reply('This command can only be used in chat!');
            return;
        }
        const onlineUsers = JSON.parse(JSON.stringify(message.target.users));
        onlineUsers.forEach((user: any, index: any) => {
            // remove the user's first character and usernameify it
            onlineUsers[index] = usernameify(user.slice(1));
        });
        // find all users in the database
        db.all('SELECT * FROM pc', [], (err, rows) => {
            if (err) {
                console.log(err);
                return;
            }
            if (rows === undefined) {
                message.reply('No users have added their political compass yet!');
            } else {
                // https://www.politicalcompass.org/crowdchart2?spots=10%7C10%7Ceight8x6,1%7C1%7Cjuan
                const base_url = 'https://www.politicalcompass.org/crowdchart2?spots=';
                let reply = '';
                let any = false;
                for (const row of rows) {
                    // check if the user is online
                    console.log(`row ${(row as any).name}`);
                    if (!onlineUsers.includes(usernameify((row as any).name))) {
                        console.log('User not currently in server: ' + (row as any).name);
                        continue;
                    }
                    any = true;
                    reply += `${(row as any).economic}%7C${(row as any).social}%7C${(row as any).name},`;
                }
                if (!any) {
                    message.reply('No online users have added their political compass yet!');
                    return;
                }
                reply = reply.slice(0, -1); // remove the last comma
                message.reply(`${base_url}${reply}`);
            }
        });
    }
}
