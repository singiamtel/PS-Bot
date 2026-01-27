import type { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';
import db from '../db.js';
import { URL } from 'node:url';
import { toID } from 'ps-client/tools.js';
import { logger } from '../logger.js';

export function politicalCompass(message: Message<'chat' | 'pm'>, username: string) {
    if (username === 'unknown') {
        logger.warn({ cmd: 'politicalCompass', message: 'Unknown user', user: message.author.name });
        return;
    }
    // find the user in the database
    const user = message.content.split(' ').slice(1).join(' ');
    const cleanUsername = toID(user);
    try {
        const row = db.prepare('SELECT * FROM pc WHERE name = ?').get(cleanUsername) as Record<string, unknown> | undefined;
        if (!row) {
            message.reply(user + 'has not added their political compass yet!');
        } else {
            // https://www.politicalcompass.org/analysis2?ec=-11&soc=-4.36
            const econ = row.economic;
            const soc = row.social;
            message.reply(`${user} political compass is ${econ}, ${soc}. https://www.politicalcompass.org/analysis2?ec=${econ}&soc=${soc}`);
        }
    } catch (err) {
        logger.error({ cmd: 'politicalCompass', message: 'Error getting from db', user, error: err });
    }
}

export function addPoliticalCompass(message: Message<'chat' | 'pm'>) {
    // ec = economic
    // so = social
    let user = message.content.split(' ')[1];
    user = toID(user);
    const curr_url_tmp = message.content.split(' ')[2];
    if (curr_url_tmp === undefined) {
        message.reply('You need to provide a URL! (fill https://www.politicalcompass.org/test and paste the URL with your results when you are done)');
        return;
    }
    const curr_url = new URL(curr_url_tmp);
    if (!(curr_url.hostname === 'www.politicalcompass.org' || curr_url.hostname === 'politicalcompass.org')) {
        message.reply('That is not a valid political compass URL!');
        return;
    }
    const params = curr_url.searchParams;
    const ec = Number(params.get('ec'));
    const soc = Number(params.get('soc'));
    if (!ec || !soc || isNaN(ec) || isNaN(soc) || ec < -10 || ec > 10 || soc < -10 || soc > 10) {
        message.reply('That is not a valid political compass URL!');
        return;
    }
    try {
        // find the user in the database
        const row = db.prepare('SELECT * FROM pc WHERE name = ?').get(user) as Record<string, unknown> | undefined;
        if (row === undefined) {
            // add the user to the database
            db.prepare('INSERT INTO pc (name, economic, social) VALUES (?, ?, ?)').run(user, ec, soc);
            message.reply('Political compass has been added!');
        } else {
            // update the user's political compass
            db.prepare('UPDATE pc SET economic = ?, social = ? WHERE name = ?').run(ec, soc, user);
            message.reply('Political compass has been updated!');
        }
    } catch (err) {
        logger.error({ cmd: 'politicalCompass', message: 'Error in political compass db operation', user, error: err });
    }
}

export function showCombinedPoliticalCompass(message: Message<'chat' | 'pm'>) {
    //check the type of channel
    if (!(message.target instanceof Room)) { return; }
    if (message.target.type !== 'chat') {
        message.reply('This command can only be used in chat!');
        return;
    }
    const onlineUsers = JSON.parse(JSON.stringify(message.target.users));
    onlineUsers.forEach((user: any, index: any) => {
    // remove the user's first character and usernameify it
        onlineUsers[index] = toID(user.slice(1));
    });
    try {
        // find all users in the database
        const rows = db.prepare('SELECT * FROM pc').all() as unknown as Record<string, unknown>[];
        if (rows === undefined || rows.length === 0) {
            message.reply('No users have added their political compass yet!');
        } else {
            // https://www.politicalcompass.org/crowdchart2?spots=10%7C10%7Ceight8x6,1%7C1%7Cjuan
            const base_url = 'https://www.politicalcompass.org/crowdchart2?spots=';
            let reply = '';
            let any = false;
            for (const row of rows) {
                // check if the user is online
                if (!onlineUsers.includes(toID(row.name as string))) {
                    continue;
                }
                any = true;
                reply += `${row.economic}%7C${row.social}%7C${row.name},`;
            }
            if (!any) {
                message.reply('No online users have added their political compass yet!');
                return;
            }
            reply = reply.slice(0, -1); // remove the last comma
            message.reply(`${base_url}${reply}`);
        }
    } catch (err) {
        logger.error({ cmd: 'politicalCompass', message: 'Error getting from db', error: err });
    }
}
