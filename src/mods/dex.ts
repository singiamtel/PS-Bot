import { createRequire } from 'node:module';
import type { Message } from 'ps-client';
import { escapeHTML, toID } from 'ps-client/tools.js';
import { config } from '../config.js';
import { canUHTML } from '../utils.js';

const require = createRequire(import.meta.url);

type PokemonStats = {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
};

type PokemonData = {
    id: string;
    num: number;
    name: string;
    types: string[];
    abilities: Record<string, string>;
    baseStats: PokemonStats;
    heightm: number;
    weightkg: number;
    evos?: string[];
    tier?: string;
    bst?: number;
    gen?: number;
};

type FormatsData = {
    tier?: string;
};

const pokedex = require('ps-client/showdown/pokedex.json') as Record<string, PokemonData>;
const { BattleAliases } = require('ps-client/showdown/aliases.js') as { BattleAliases: Record<string, string> };
const { BattleFormatsData } = require('ps-client/showdown/formats-data.js') as { BattleFormatsData: Record<string, FormatsData> };

const typeIconBaseUrl = 'https://play.pokemonshowdown.com/sprites/types/';
const pokemonSpriteBaseUrl = 'https://play.pokemonshowdown.com/sprites/dex/';

function typeIcon(type: string) {
    const sanitizedType = encodeURIComponent(type).replace(/\?/g, '%3f');
    return `<img src="${typeIconBaseUrl}${sanitizedType}.png" alt="${escapeHTML(type)}" height="14" width="32" style="vertical-align:-2px;margin-right:3px" />`;
}

function pokemonSpriteId(pokemon: PokemonData) {
    if (!pokemon.name.includes('-')) return pokemon.id;
    return pokemon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-([xy])$/, '$1');
}

function commandArgs(message: Message<'chat' | 'pm'>) {
    let content = message.content.trim();
    if (content.startsWith('/botmsg')) content = content.slice('/botmsg'.length).trim();
    if (content.startsWith(config.prefix)) content = content.slice(config.prefix.length).trim();
    return content.split(/\s+/).slice(1).join(' ').trim();
}

function formatNumber(value: number) {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function abilityList(abilities: Record<string, string>) {
    return Object.entries(abilities)
        .sort(([a], [b]) => abilityOrder(a) - abilityOrder(b))
        .map(([slot, ability]) => slot === 'H' ? `<em>${escapeHTML(ability)}</em>` : escapeHTML(ability))
        .join(' / ');
}

function abilityOrder(slot: string) {
    if (slot === '0') return 0;
    if (slot === '1') return 1;
    if (slot === 'H') return 2;
    if (slot === 'S') return 3;
    return 4;
}

function statCell(label: string, value: number) {
    return `<span style="display:inline-block;min-width:30px;text-align:center;color:#111827"><span style="display:block;color:#8b8f96;font-size:10px;font-weight:700;line-height:12px">${label}</span><span style="display:block;font-size:13px;font-weight:700;line-height:15px">${value}</span></span>`;
}

function pokemonLink(pokemon: PokemonData) {
    return `https://dex.pokemonshowdown.com/pokemon/${encodeURIComponent(pokemon.id)}`;
}

export function findPokemon(query: string) {
    const id = toID(query);
    if (!id) return null;
    const alias = BattleAliases[id];
    return pokedex[id] ?? pokedex[toID(alias)] ?? null;
}

export function renderCompactDexHTML(pokemon: PokemonData) {
    const stats = pokemon.baseStats;
    const bst = pokemon.bst ?? Object.values(stats).reduce((total, stat) => total + stat, 0);
    const tier = BattleFormatsData[pokemon.id]?.tier ?? pokemon.tier ?? 'Illegal';
    const evolution = pokemon.evos?.length ? pokemon.evos.join(', ') : 'None';
    const spriteUrl = `${pokemonSpriteBaseUrl}${pokemonSpriteId(pokemon)}.png`;

    return `<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.25;max-width:980px">` +
        `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">` +
        `<span style="min-width:34px;color:#8b8f96;font-weight:700">${escapeHTML(tier)}</span>` +
        `<img src="${spriteUrl}" alt="${escapeHTML(pokemon.name)}" height="40" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated" />` +
        `<a href="${pokemonLink(pokemon)}" target="_blank" rel="noopener" style="font-size:17px;font-weight:700;color:#1f4f99;text-decoration:underline">${escapeHTML(pokemon.name)}</a>` +
        `<span>${pokemon.types.map(typeIcon).join('')}</span>` +
        `<span style="display:inline-flex;gap:5px;align-items:flex-end">${statCell('HP', stats.hp)}${statCell('Atk', stats.atk)}${statCell('Def', stats.def)}${statCell('SpA', stats.spa)}${statCell('SpD', stats.spd)}${statCell('Spe', stats.spe)}${statCell('BST', bst)}</span>` +
        `<span style="color:#4b5563;font-size:12px"><strong>Abilities:</strong> ${abilityList(pokemon.abilities)}</span>` +
        `</div>` +
        `<div style="border-top:1px solid #9ca3af;margin-top:3px;padding-top:3px;color:#4b5563;font-size:12px">` +
        `Dex#: <strong style="color:#111827">${pokemon.num}</strong> | Gen: <strong style="color:#111827">${pokemon.gen ?? '?'}</strong> | Height: <strong style="color:#111827">${formatNumber(pokemon.heightm)} m</strong> | Weight: <strong style="color:#111827">${formatNumber(pokemon.weightkg)} kg</strong> | Evolution: <strong style="color:#111827">${escapeHTML(evolution)}</strong>` +
        `</div>` +
        `</div>`;
}

export function renderCompactDexText(pokemon: PokemonData) {
    const stats = pokemon.baseStats;
    const bst = pokemon.bst ?? Object.values(stats).reduce((total, stat) => total + stat, 0);
    const tier = BattleFormatsData[pokemon.id]?.tier ?? pokemon.tier ?? 'Illegal';
    const evolution = pokemon.evos?.length ? pokemon.evos.join(', ') : 'None';
    const abilities = Object.entries(pokemon.abilities)
        .sort(([a], [b]) => abilityOrder(a) - abilityOrder(b))
        .map(([_slot, ability]) => ability)
        .join(' / ');

    return `${tier} ${pokemon.name} [${pokemon.types.join('/')}] ` +
        `HP ${stats.hp} Atk ${stats.atk} Def ${stats.def} SpA ${stats.spa} SpD ${stats.spd} Spe ${stats.spe} BST ${bst} | ` +
        `Abilities: ${abilities} | Dex#: ${pokemon.num} | Gen: ${pokemon.gen ?? '?'} | Height: ${formatNumber(pokemon.heightm)} m | Weight: ${formatNumber(pokemon.weightkg)} kg | Evolution: ${evolution}`;
}

export function compactDex(message: Message<'chat' | 'pm'>) {
    const query = commandArgs(message);
    if (!query) return message.reply(`Usage: ${config.prefix}dt <pokemon>`);

    const pokemon = findPokemon(query);
    if (!pokemon) return message.reply(`No Pokemon found for "${query}".`);

    if (canUHTML(message)) {
        return message.sendHTML(renderCompactDexHTML(pokemon), { name: `COMPACTDEX-${pokemon.id}` });
    }
    return message.reply(`!code ${renderCompactDexText(pokemon)}`);
}
