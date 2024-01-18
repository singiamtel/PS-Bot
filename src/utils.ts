import { Message, Room, User } from 'ps-client';
import { whitelist } from './config.js';
import bot from './bot';

export const usernameify = (username:string) =>
    username?.toLowerCase().replace(/[^a-z0-9]/g, '').trim() || 'unknown';

export function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

export const rankOrder = {
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    '^': 2,
};

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

export function isAuth(message: Message, room?: string) {
    if (room) {
        const authObject = bot.getRoom(room).auth;
        // console.log('authobj', authObject);
        if (authObject) {
            const authList = Object.entries(bot.getRoom(room).auth).filter(([rank, userArray]) => rankOrder[rank as keyof typeof rankOrder] > 4).map(([rank, userArray]) => userArray).flat();
            return authList.includes(usernameify(message.author?.name));
        }
    }

    return (message.msgRank !== ' ' && message.msgRank !== '+') || whitelist.includes(usernameify(message.author?.name));
}

export function isRoom(target: User | Room): target is Room {
    return target instanceof Room;
}

export function inAllowedRooms(message: Message, rooms: string[]) {
    rooms.push('botdevelopment'); // Allow bot development
    return isRoom(message.target) && rooms.includes(message.target.roomid);
}
