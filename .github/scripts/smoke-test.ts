#!/usr/bin/env tsx

import { Client } from 'ps-client';

const username = process.env.botusername;
const password = process.env.botpassword;

if (!username || !password) {
    console.error('Error: botusername and botpassword environment variables must be set');
    process.exit(1);
}

console.log('Starting Showdown connection smoke test...');
console.log(`Attempting to connect as user: ${username}`);

const client = new Client({
    username,
    password,
    avatar: 'supernerd',
    rooms: []
});

// Set a timeout for the connection attempt
const timeout = setTimeout(() => {
    console.error('Error: Connection timeout after 60 seconds');
    process.exit(1);
}, 60000);

client.on('login', () => {
    console.log('✓ Successfully connected to Showdown server');
    console.log(`✓ Logged in as: ${client.status.username}`);
    clearTimeout(timeout);

    // Disconnect and exit successfully
    setTimeout(() => {
        console.log('Disconnecting...');
        process.exit(0);
    }, 1000);
});

client.on('error', (error) => {
    console.error('Error during connection:', error);
    clearTimeout(timeout);
    process.exit(1);
});

try {
    client.connect();
} catch (error) {
    console.error('Failed to initiate connection:', error);
    clearTimeout(timeout);
    process.exit(1);
}
