import namer from 'color-namer';
import { determineColour, hexColorDelta } from '../namecolour.js';
import { usernameify } from '../utils.js';
import { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';


export function nameColour(message: Message, username: string | undefined) {
    if (message.content.startsWith('#namecolour') || message.content.startsWith('#namecolor')) {
        const displayname = usernameify(message.content.split(' ').slice(1).join(' '));
        const nameColour = determineColour(displayname);
        const colour = namer(nameColour).ntc[0];
        if (message.type === 'chat' && message.target instanceof Room && username && message.target.auth['*'].includes(usernameify(username))) {
            return message.reply(`/adduhtml NAMECOLOUR-${displayname}, <username>${displayname}</username>: ${colour.name}`);
        } else { return message.reply(`I think that's ${colour.name} (#${colour.hex})`); }
    } else if (message.content.startsWith('#comparecolours')) {
        const [name1, name2] = message.content.split(' ').slice(1).join(' ').split(',');
        const colour1 = determineColour(usernameify(name1));
        const colour2 = determineColour(usernameify(name2));
        const delta = hexColorDelta(colour1, colour2);
        const fixedDelta = (delta * 100).toFixed(2);
        return message.reply(`${name1}(${colour1}) and ${name2}(${colour2}) are ~${fixedDelta}% similar`);
    }
}
