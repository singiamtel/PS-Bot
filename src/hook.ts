import { Webhook } from 'discord-webhook-node';
import path from 'path';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const discord_webhook = process.env.discord_webhook;
if (!discord_webhook) throw new Error('No discord webhook provided');

const hook = new Webhook(discord_webhook);

hook.setUsername(process.env.botusername || 'zxc\'s roomba');

export { hook };
