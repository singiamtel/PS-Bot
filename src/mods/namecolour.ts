import namer from 'color-namer';
import { determineColour, hexColorDelta } from '../namecolour.js';
import type { Message } from 'ps-client';
import Room from 'ps-client/classes/room.js';
import { toID } from 'ps-client/tools.js';
import { config } from '../config.js';

function canUHTML(message: Message, username: string | undefined) {
    return message.type === 'chat' && message.target instanceof Room && username && message.target.auth && message.target.auth['*']?.includes(toID(config.name));
}

export function nameColour(message: Message, username: string | undefined) {
    const displayname = toID(message.content.split(' ').slice(1).join(' '));
    const nameColour = determineColour(displayname);
    const colour = namer(nameColour).ntc[0];
    if (canUHTML(message, username)) {
        const delta = hexColorDelta(nameColour, colour.hex);
        const fixedDelta = (delta * 100).toFixed(2);
        return message.reply(`/adduhtml NAMECOLOUR-${displayname}, <username>${displayname}</username>: ${nameColour}<br> I think that's <strong style="color:#${colour.hex}; ">${colour.name}</strong> (${fixedDelta}% match)`);
    } else { return message.reply(`I think that's ${colour.name} (#${colour.hex})`); }
}

export function compareColours(message: Message, username: string | undefined) {
    const [name1, name2] = message.content.split(' ').slice(1).join(' ').split(',');
    const colour1 = determineColour(toID(name1));
    const colour2 = determineColour(toID(name2));
    const delta = hexColorDelta(colour1, colour2);
    const fixedDelta = (delta * 100).toFixed(2);
    if (canUHTML(message, username)) {
        return message.reply(`/adduhtml COLOURCOMPARE-${name1}-${name2}, <username>${name1}</username> (${colour1}) and <username>${name2}</username> (${colour2}) are ~${fixedDelta}% similar`);
    } else { return message.reply(`${name1} (${colour1}) and ${name2} (${colour2}) are ~${fixedDelta}% similar`); }
}
