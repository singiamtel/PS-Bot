import { type Message, Room, type User } from 'ps-client';
import { toID } from 'ps-client/tools.js';
import { config, rootDir } from './config.js';

export { rootDir, config };

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

export function canUHTML(message: Message<'chat' | 'pm'>) {
    return message.type === 'chat' && isRoom(message.target) && message.target.auth && message.target.auth['*']?.includes(toID(config.name));
}

export function inAllowedRooms(message: Message<'chat' | 'pm'>, rooms: string[]) {
    const allowedRooms = [...rooms, 'botdevelopment']; // Allow bot development
    return isRoom(message.target) && allowedRooms.includes(message.target.roomid);
}

export function toOrdinal(num: number) {
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return num + 'th';
}

export const commands = [
    'namecolour', 'namecolor',
    'comparecolours', 'comparecolors', 'comparecolor', 'comparecolour', 'compare',
    'ttp',
    'ttp2',
    'randttp',
    'randttp2',
    'randopple',
    'randomteam', 'randteam',
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
    'addhighlight', 'highlight',
    'removehighlight', 'delhighlight',
    'listhighlight', 'highlights',
    'help',
] as const;

export type Command = typeof commands[number];

function isCommand(message: string): message is Command {
    return commands.includes(message as Command);
}

// isCommand('ttp');

export function toCmd(message: Message<'chat' | 'pm'>): Command | false {
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
