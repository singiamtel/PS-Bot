import { Webhook } from 'discord-webhook-node';

import { logger } from './logger.js';

const discord_webhook = process.env.discord_webhook;
if (!discord_webhook) {
    logger.warn({ cmd: 'hook', message: 'No discord webhook found in .env file. Continuing without logging' });
}

const hook = discord_webhook ? new Webhook(discord_webhook) : {
    send: () => {
    },
    setUsername: () => {
    },
};

hook.setUsername(process.env.botusername || 'PS-Bot');

export { hook };
