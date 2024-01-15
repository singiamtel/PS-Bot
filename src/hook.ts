import { Webhook } from 'discord-webhook-node';

import dotenv from 'dotenv';
dotenv.config();

const discord_webhook = process.env.discord_webhook;
if (!discord_webhook) throw new Error('No discord webhook provided');

const hook = new Webhook(discord_webhook);

hook.setUsername(process.env.botusername || 'zxc\'s roomba');

export { hook };
