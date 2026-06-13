import namer from 'color-namer';
import { determineColour, getCustomColourDetails, hexColorDelta } from '../namecolour.js';
import type { Message } from 'ps-client';
import { toID } from 'ps-client/tools.js';
import { canUHTML } from '../utils.js';

function colourSwatch(colour: string) {
    return `<span style="display:inline-block;width:10px;height:10px;background:${colour};border:1px solid #888;vertical-align:-1px"></span> ${colour}`;
}

export function nameColour(message: Message<'chat' | 'pm'>, username: string | null | undefined) {
    const displayname = toID(message.content.split(' ').slice(1).join(' '));
    const nameColour = determineColour(displayname);
    const customColour = getCustomColourDetails(displayname);
    const colour = namer(nameColour).ntc[0];
    const delta = hexColorDelta(nameColour, colour.hex);
    const fixedDelta = (delta * 100).toFixed(2);
    if (canUHTML(message) && username) {
        const customColourHtml = customColour ?
            `<br>Custom colour: ${colourSwatch(customColour.oldColour)} -> ${colourSwatch(customColour.newColour)} (from ${customColour.source})` :
            '';
        return message.reply(`/adduhtml NAMECOLOUR-${displayname}, <username>${displayname}</username>: ${nameColour}${customColourHtml}<br> I think that's <strong style="color:#${colour.hex}; ">${colour.name}</strong> (${fixedDelta}% match)`);
    } else {
        const customColourText = customColour ?
            `${displayname} has a custom colour: ${customColour.oldColour} -> ${customColour.newColour} (from ${customColour.source}). ` :
            '';
        return message.reply(`${customColourText}I think that's ${colour.name} (#${colour.hex}) (${fixedDelta}% match)`);
    }
}

export function compareColours(message: Message<'chat' | 'pm'>, username: string | null | undefined) {
    const [name1, name2] = message.content.split(' ').slice(1).join(' ').split(',');
    const colour1 = determineColour(toID(name1));
    const colour2 = determineColour(toID(name2));
    const delta = hexColorDelta(colour1, colour2);
    const fixedDelta = (delta * 100).toFixed(2);
    if (canUHTML(message) && username) {
        return message.reply(`/adduhtml COLOURCOMPARE-${name1}-${name2}, <username>${name1}</username> (${colour1}) and <username>${name2}</username> (${colour2}) are ~${fixedDelta}% similar`);
    } else { return message.reply(`${name1} (${colour1}) and ${name2} (${colour2}) are ~${fixedDelta}% similar`); }
}
