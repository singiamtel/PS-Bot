import namer from 'color-namer';
import { determineColour, hexColorDelta } from '../namecolour.js';
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';
import { toID } from 'ps-client/tools.js';
import { isCmd } from '../utils.js';


export function nameColour(message: Message, username: string | undefined) {
    if (isCmd(message, ['namecolour', 'namecolor'])) {
        const displayname = toID(message.content.split(' ').slice(1).join(' '));
        const nameColour = determineColour(displayname);
        const colour = namer(nameColour).ntc[0];
        if (message.type === 'chat' && message.target instanceof Room && username && message.target.auth['*'].includes(toID(username))) {
            const delta = hexColorDelta(nameColour, '000000');
            const fixedDelta = (delta * 100).toFixed(2);
            return message.reply(`/adduhtml NAMECOLOUR-${displayname}, <username>${displayname}</username>: ${colour.name} (${fixedDelta}% match)`);
        } else { return message.reply(`I think that's ${colour.name} (#${colour.hex})`); }
    } else if (isCmd(message, 'comparecolours')) {
        const [name1, name2] = message.content.split(' ').slice(1).join(' ').split(',');
        const colour1 = determineColour(toID(name1));
        const colour2 = determineColour(toID(name2));
        const delta = hexColorDelta(colour1, colour2);
        const fixedDelta = (delta * 100).toFixed(2);
        return message.reply(`${name1} (${colour1}) and ${name2} (${colour2}) are ~${fixedDelta}% similar`);
    }
}
