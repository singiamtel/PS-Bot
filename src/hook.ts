import { Webhook } from 'discord-webhook-node';
import path from 'path';

import dotenv from 'dotenv';
import { rootDir } from './bot';

dotenv.config({ path: path.join(rootDir, '../.env') });

const discord_webhook = process.env.discord_webhook;
if (!discord_webhook) throw new Error('No discord webhook provided');

const hook = new Webhook(discord_webhook);

hook.setUsername(process.env.botusername || 'zxc\'s roomba');

export { hook };
