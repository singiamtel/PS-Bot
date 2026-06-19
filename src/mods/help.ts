import { type Message } from 'ps-client';
import { config } from '../config.js';
import { isRoom } from '../utils.js';
import { privateHTML } from '../bot.js';

const repoUrl = 'https://github.com/singiamtel/PS-Bot';

export function helpCommand(message: Message<'chat' | 'pm'>) {
    if (isRoom(message.target)) {
        const htmlContent = `
            <div style="background:#1a1a2e;color:#e0e0e0;padding:12px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:11px;line-height:1.5">
                <h3 style="margin:0 0 8px;color:#e94560;font-size:14px">Available Commands:</h3>
                <p style="margin:4px 0"><strong style="color:#f5c518">General:</strong></p>
                <ul style="margin:2px 0 6px;padding-left:18px">
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}help</code>: Show this help message.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}namecolour</code>: Get name color information.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}comparecolours</code>: Compare two name colors.</li>
                </ul>
                <p style="margin:4px 0"><strong style="color:#f5c518">Fun & Games:</strong></p>
                <ul style="margin:2px 0 6px;padding-left:18px">
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}ttp</code>, <code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}ttp2</code>: See past Top Trumps Pets cards.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randttp</code>, <code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randttp2</code>: Random Top Trumps Pets card.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randomteam</code>, <code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randteam</code>: Random competitive Pokemon team.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randompokemon</code>, <code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}randmon</code>: Generate a random fakemon.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}dt</code>, <code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}dex</code>: Compact Pokemon Dex lookup.</li>
                </ul>
                <p style="margin:4px 0"><strong style="color:#f5c518">Mystery Box (Event):</strong></p>
                <ul style="margin:2px 0 6px;padding-left:18px">
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}rank</code>: Check your rank.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}leaderboard</code>: Show the leaderboard.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}answer</code>: Answer a question.</li>
                </ul>
                <p style="margin:4px 0"><strong style="color:#f5c518">Customs:</strong></p>
                <ul style="margin:2px 0 6px;padding-left:18px">
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}customs</code>: List custom commands.</li>
                    <li><code style="background:#16213e;padding:1px 4px;border-radius:3px">${config.prefix}addcustom</code>: Add a custom command (Auth only).</li>
                </ul>
                <p style="margin:4px 0 0;font-size:10px;color:#aaa">Source: <a href="${repoUrl}" style="color:#4ea8de">${repoUrl.replace('https://', '')}</a></p>
            </div>
        `;
        return privateHTML(message, htmlContent, message.target.roomid, { name: 'help' });
    } else {
        const helpText = `
Available Commands:

General:
- ${config.prefix}help: Show this help message.
- ${config.prefix}namecolour: Get name color information.
- ${config.prefix}comparecolours: Compare two name colors.

Fun & Games:
- ${config.prefix}ttp, ${config.prefix}ttp2: See past Top Trumps Pets cards.
- ${config.prefix}randttp, ${config.prefix}randttp2: Random "Top Trumps Pets" card.
- ${config.prefix}randomteam, ${config.prefix}randteam: Random competitive Pokémon team.
- ${config.prefix}randompokemon, ${config.prefix}randmon: Generate a random fakemon.
- ${config.prefix}dt, ${config.prefix}dex: Compact Pokemon Dex lookup.

Mystery Box (Event):
- ${config.prefix}rank: Check your rank.
- ${config.prefix}leaderboard: Show the leaderboard.
- ${config.prefix}answer <answer>: Answer a question.

Customs:
- ${config.prefix}customs: List custom commands.
- ${config.prefix}addcustom: Add a custom command (Auth only).

For more details and source code, visit: ${repoUrl}
`;
        return message.reply(`!code ${helpText.trim()}`);
    }
}
