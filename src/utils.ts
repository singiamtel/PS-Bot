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

export const isAuth = (user: string) => user && user[0] in rankOrder;

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
