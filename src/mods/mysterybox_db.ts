// stored in answer.txt, loaded on startup
// if file doesn't exist, it will be created
import fs from 'fs';
import { toID } from 'ps-client/tools.js';

if (!fs.existsSync('./answer.txt')) {
    fs.writeFileSync('./answer.txt', '');
}

if (!fs.existsSync('./winners.txt')) {
    fs.writeFileSync('./winners.txt', '');
}

if (!fs.existsSync('./difficulty.txt')) {
    fs.writeFileSync('./difficulty.txt', '');
}

export const winners = fs.readFileSync('./winners.txt').toString().split('\n').map(toID).filter(Boolean);

let answer = fs.readFileSync('./answer.txt').toString().toLowerCase().replace(/ /g, '').trim();
let difficulty : string = fs.readFileSync('./difficulty.txt').toString().toLowerCase().trim();

export function addWinner(id: string) {
    winners.push(id);
    fs.writeFileSync('./winners.txt', winners.join('\n'));
}

export function newQuestion(newAnswer: string, newDifficulty: string) {
    answer = newAnswer.toLowerCase().replace(/ /g, '').trim();
    difficulty = newDifficulty.toLowerCase().trim();
    fs.writeFileSync('./answer.txt', answer);
    fs.writeFileSync('./difficulty.txt', difficulty);
}

export function endQuestion() {
    const date = new Date();
    fs.writeFileSync('./answer.txt', '');
    fs.writeFileSync('./difficulty.txt', '');
    const winnersCopy = fs.readFileSync('./winners.txt').toString();
    fs.writeFileSync(`./winners-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.txt`, winnersCopy);
    fs.writeFileSync('./winners.txt', '');
    winners.length = 0;
    answer = '';
    difficulty = '';
}

export function isQuestionOngoing(): boolean {
    return !!answer;
}

export function getQuestion() {
    return { answer, difficulty };
}
