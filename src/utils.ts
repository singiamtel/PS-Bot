import { Message, Room, User } from 'ps-client';
import { config } from './bot.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = __dirname;

export function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

export function formatDate(date: Date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
    ' ' +
    [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
    ].join(':')
    );
}

export function isRoom(target: User | Room): target is Room {
    return target instanceof Room;
}

export function inAllowedRooms(message: Message, rooms: string[]) {
    rooms.push('botdevelopment'); // Allow bot development
    return isRoom(message.target) && rooms.includes(message.target.roomid);
}

export function toOrdinal(num: number) {
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return num + 'th';
}

export function formatTop3(users: string[]) {
    // return the first 3 elements, with a comma between the first 2 and an 'and' before the last one. If there are only 2 elements, return them with an 'and' between them
    if (users.length === 0) return '';
    if (users.length === 1) return users[0];
    if (users.length === 2) return users.join(' and ');
    return users.slice(0, 2).join(', ') + ', and ' + users[2];
}

export const commands = [
    'namecolour', 'namecolor',
    'comparecolours', 'comparecolors', 'comparecolor', 'comparecolour', 'compare',
    'ttp',
    'ttp2',
    'randttp',
    'randttp2',
    'randopple',
    'rank',
    'answerbox',
    'leaderboard',
    'lb',
    'testauth',
    'answer',
    'newquestion',
    'endquestion',
    'declare',
    'addp',
    'addcustom',
    'deletecustom', 'removecustom', 'delcustom',
    'showcustom', 'customs', 'listcustom',
    'top', // Top apologies
    'apologies',
    'addpc',
    'pc',
    'pcall',
] as const;

export type Command = typeof commands[number];

function isCommand(message: string): message is Command {
    return commands.includes(message as Command);
}

// isCommand('ttp');

export function toCmd(message: Message): Command | false {
    // a cmd is a message that starts with the prefix and the cmd, followed by a space or the end of the message. or either but with /botmsg before the prefix
    // return message.content.startsWith(config.prefix + cmd + ' ') || message.content === config.prefix + cmd || message.content.startsWith('/botmsg ' + config.prefix + cmd + ' ') || message.content === '/botmsg ' + config.prefix + cmd;
    let command = message.content;
    if (command.startsWith('/botmsg')) {
        command = command.slice(8);
    }
    if (!command.startsWith(config.prefix)) return false;
    command = command.slice(config.prefix.length);
    command = command.split(' ')[0];
    if (isCommand(command)) return command;
    return false;
}

export function assertNever(x: never): asserts x is never {
    throw new Error('Unexpected object: ' + x);
}
