import { type Message } from 'ps-client';
import { config } from '../config.js';
import { isRoom } from '../utils.js';
import { privateHTML } from '../bot.js';

const repoUrl = 'https://github.com/singiamtel/PS-Bot';

export function helpCommand(message: Message<'chat' | 'pm'>) {
    if (isRoom(message.target)) {
        const htmlContent = `
            <div style="border: 1px solid #000; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0;">Available Commands:</h3>
                <p><strong>General:</strong></p>
                <ul>
                    <li><code>${config.prefix}help</code>: Show this help message.</li>
                    <li><code>${config.prefix}namecolour</code>: Get name color information.</li>
                    <li><code>${config.prefix}comparecolours</code>: Compare two name colors.</li>
                </ul>
                <p><strong>Fun & Games:</strong></p>
                <ul>
                    <li><code>${config.prefix}ttp</code>, <code>${config.prefix}ttp2</code>: See past Top Trumps Pets cards.</li>
                    <li><code>${config.prefix}randttp</code>, <code>${config.prefix}randttp2</code>: Random "Top Trumps Pets" card.</li>
                </ul>
                <p><strong>Mystery Box (Event):</strong></p>
                <ul>
                    <li><code>${config.prefix}rank</code>: Check your rank.</li>
                    <li><code>${config.prefix}leaderboard</code>: Show the leaderboard.</li>
                    <li><code>${config.prefix}answer &lt;answer&gt;</code>: Answer a question.</li>
                </ul>
                <p><strong>Customs:</strong></p>
                <ul>
                    <li><code>${config.prefix}customs</code>: List custom commands.</li>
                    <li><code>${config.prefix}addcustom</code>: Add a custom command (Auth only).</li>
                </ul>
                <p>For more details and source code, visit: <a href="${repoUrl}">${repoUrl}</a></p>
            </div>
        `;
        return privateHTML(message, htmlContent, message.target.roomid);
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
