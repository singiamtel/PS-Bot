import { logger } from './logger.js';

const discord_webhook = process.env.discord_webhook;
if (!discord_webhook) {
    logger.warn({ cmd: 'hook', message: 'No discord webhook found in .env file. Continuing without logging' });
}

const username = process.env.botusername || 'PS-Bot';

class DiscordWebhook {
    private url: string;
    private username: string;

    constructor(url: string) {
        this.url = url;
        this.username = username;
    }

    setUsername(name: string): void {
        this.username = name;
    }

    async send(content: string): Promise<void> {
        if (!this.url) return;

        try {
            await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.username,
                    content,
                }),
            });
        } catch (error) {
            logger.error({ cmd: 'hook', message: 'Failed to send webhook', error });
        }
    }
}

const hook = discord_webhook
    ? new DiscordWebhook(discord_webhook)
    : { send: () => Promise.resolve(), setUsername: () => {} };

hook.setUsername(username);

export { hook };
