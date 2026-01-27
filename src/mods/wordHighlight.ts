import type { Message } from 'ps-client';
import db from '../db.js';
import { reply } from '../bot.js';
import { hook } from '../hook.js';
import { logger } from '../logger.js';
import { toID } from 'ps-client/tools.js';
import { config } from '../config.js';

interface Highlight {
    user: string;
    discord_id: string;
    word: string;
}

/**
 * Check messages for highlighted words and send Discord notifications
 */
export function checkHighlights(message: Message<'chat' | 'pm'>, authorUsername: string) {
    const content = message.content.toLowerCase();

    try {
        const rows = db.prepare('SELECT user, discord_id, word FROM word_highlights').all() as unknown as Highlight[];

        for (const highlight of rows) {
            // Don't highlight user's own messages
            if (toID(highlight.user) === authorUsername) continue;

            // Check if the word is in the message (case-insensitive, whole word match)
            const wordRegex = new RegExp(`\\b${escapeRegex(highlight.word)}\\b`, 'i');
            if (wordRegex.test(content)) {
                // Send Discord notification
                const roomInfo = message.target instanceof Object && 'roomid' in message.target ?
                    `room: ${message.target.roomid}` :
                    'PM';

                hook.send(`<@&${highlight.discord_id}> Your highlight word "${highlight.word}" was mentioned by ${message.author?.name} in ${roomInfo}: "${message.content}"`);

                logger.info({
                    cmd: 'wordHighlight',
                    user: highlight.user,
                    word: highlight.word,
                    author: message.author?.name,
                    content: message.content,
                });
            }
        }
    } catch (err) {
        logger.error({ cmd: 'checkHighlights', error: (err as Error).message });
    }
}

/**
 * Add a word to highlight for the current user
 */
export function addHighlight(message: Message<'chat' | 'pm'>) {
    // Parse command: #addhighlight <word>
    const parts = message.content.split(' ');

    if (parts.length < 2) {
        reply(message, 'Usage: addhighlight <word>. Example: addhighlight pizza');
        return;
    }

    const word = parts.slice(1).join(' ').toLowerCase().trim();

    if (!word || word.length < 2) {
        reply(message, 'Word must be at least 2 characters long.');
        return;
    }

    // Get Discord ID from environment variable
    const discordId = config.discordId;
    if (!discordId) {
        reply(message, 'Discord ID not configured. Please set discord_id environment variable.');
        logger.error({ cmd: 'addHighlight', error: 'discord_id not configured' });
        return;
    }

    const username = toID(message.author?.name);

    try {
        // Check if highlight already exists
        const row = db.prepare('SELECT * FROM word_highlights WHERE user = ? AND word = ?').get(username, word) as Highlight | undefined;

        if (row) {
            reply(message, `You already have a highlight for "${word}".`);
            return;
        }

        // Add the highlight
        db.prepare('INSERT INTO word_highlights (user, discord_id, word) VALUES (?, ?, ?)').run(username, discordId, word);
        reply(message, `Added highlight for "${word}". You'll be pinged on Discord when it's mentioned.`);
        logger.info({ cmd: 'addHighlight', user: username, discord_id: discordId, word });
    } catch (err) {
        logger.error({ cmd: 'addHighlight', error: (err as Error).message });
        reply(message, 'Error adding highlight.');
    }
}

/**
 * Remove a highlight word for the current user
 */
export function removeHighlight(message: Message<'chat' | 'pm'>) {
    // Parse command: #removehighlight <word>
    const parts = message.content.split(' ');

    if (parts.length < 2) {
        reply(message, 'Usage: removehighlight <word>');
        return;
    }

    const word = parts.slice(1).join(' ').toLowerCase().trim();
    const username = toID(message.author?.name);

    try {
        const result = db.prepare('DELETE FROM word_highlights WHERE user = ? AND word = ?').run(username, word);

        if (result.changes === 0) {
            reply(message, `You don't have a highlight for "${word}".`);
            return;
        }

        reply(message, `Removed highlight for "${word}".`);
        logger.info({ cmd: 'removeHighlight', user: username, word });
    } catch (err) {
        logger.error({ cmd: 'removeHighlight', error: (err as Error).message });
        reply(message, 'Error removing highlight.');
    }
}

/**
 * List all highlights for the current user
 */
export function listHighlights(message: Message<'chat' | 'pm'>) {
    const username = toID(message.author?.name);

    try {
        const rows = db.prepare('SELECT word, discord_id FROM word_highlights WHERE user = ? ORDER BY word').all(username) as unknown as Highlight[];

        if (rows.length === 0) {
            reply(message, 'You have no highlights set.');
            return;
        }

        const wordList = rows.map(r => r.word).join(', ');
        const discordId = rows[0].discord_id;
        reply(message, `Your highlights (pinging <@${discordId}>): ${wordList}`);
    } catch (err) {
        logger.error({ cmd: 'listHighlights', error: (err as Error).message });
        reply(message, 'Error fetching highlights.');
    }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
