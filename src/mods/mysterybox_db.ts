// stored in answer.txt, loaded on startup
// if file doesn't exist, it will be created
import fs from 'fs';
import { toID } from 'ps-client/tools.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const answerPath = path.join(__dirname, '../answer.txt');
const difficultyPath = path.join(__dirname, '../difficulty.txt');
const winnersPath = path.join(__dirname, '../winners.txt');
if (!fs.existsSync(answerPath)) {
    fs.writeFileSync(answerPath, '');
}

if (!fs.existsSync(difficultyPath)) {
    fs.writeFileSync(difficultyPath, '');
}

if (!fs.existsSync(winnersPath)) {
    fs.writeFileSync(winnersPath, '');
}

export const winners = fs.readFileSync(winnersPath).toString().split('\n').map(toID).filter(Boolean);

let answer = fs.readFileSync(answerPath).toString().toLowerCase().replace(/ /g, '').trim();
let difficulty : string = fs.readFileSync(difficultyPath).toString().toLowerCase().trim();

export function addWinner(id: string) {
    winners.push(id);
    fs.writeFileSync(winnersPath, winners.join('\n'));
}

export function newQuestion(newAnswer: string, newDifficulty: string) {
    answer = newAnswer.toLowerCase().replace(/ /g, '').trim();
    difficulty = newDifficulty.toLowerCase().trim();
    fs.writeFileSync(answerPath, answer);
    fs.writeFileSync(difficultyPath, difficulty);
}

export function endQuestion() {
    const date = new Date();
    fs.writeFileSync(answerPath, '');
    fs.writeFileSync(difficultyPath, '');
    const winnersCopy = fs.readFileSync(winnersPath).toString();
    fs.writeFileSync(path.join(__dirname, `../winners-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.txt`), winnersCopy);
    fs.writeFileSync(winnersPath, '');
    winners.length = 0;
    answer = '';
    difficulty = '';
    cooldowns.length = 0;
}

export function isQuestionOngoing(): boolean {
    return !!answer;
}

export function getQuestion() {
    return { answer, difficulty };
}

// They can only answer 3 times per hour, so we need to keep track of that
let cooldowns: {[k: string]: Date}[] = [];
const cooldownTime = 60 * 60 * 1000; // 1 hour
export function updateCooldowns() {
    cooldowns = cooldowns.filter(x => {
        const now = new Date();
        const keys = Object.keys(x);
        const key = keys[0];
        const date = x[key];
        return now.getTime() - date.getTime() < cooldownTime;
    });
}

export function isInCooldown(user: string) {
    return cooldowns.filter(x => x[user]).length >= 3;
}

export function addCooldown(user: string) {
    const now = new Date();
    cooldowns.push({ [user]: now });
}

setInterval(updateCooldowns, 1000 * 60); // 1 minute
