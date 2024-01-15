// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();

import { Client } from 'ps-client';

if (process.env.botusername === undefined || process.env.botpassword === undefined) {
    console.error('No username or password found in .env file. Exiting...');
    process.exit(1);
}

const bot = new Client({ server: 'localhost', port: 8000, username: process.env.botusername, password: process.env.botpassword, debug: true, avatar: 'supernerd', rooms: [] });

console.log('Connecting to PS!');
bot.connect();

export default bot;
