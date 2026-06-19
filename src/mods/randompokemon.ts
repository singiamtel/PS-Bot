import type { Message } from 'ps-client';
import { escapeHTML } from 'ps-client/tools.js';

const types = [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
] as const;

const abilities = [
    'Adaptability',
    'Aftermath',
    'Analytic',
    'Battle Armor',
    'Chlorophyll',
    'Clear Body',
    'Competitive',
    'Compound Eyes',
    'Defiant',
    'Dry Skin',
    'Filter',
    'Flame Body',
    'Flash Fire',
    'Guts',
    'Heatproof',
    'Huge Power',
    'Ice Scales',
    'Illuminate',
    'Inner Focus',
    'Intimidate',
    'Iron Barbs',
    'Levitate',
    'Lightning Rod',
    'Magic Bounce',
    'Magic Guard',
    'Marvel Scale',
    'Mold Breaker',
    'Natural Cure',
    'No Guard',
    'Overcoat',
    'Poison Heal',
    'Prankster',
    'Pressure',
    'Protean',
    'Regenerator',
    'Rough Skin',
    'Sand Rush',
    'Sap Sipper',
    'Serene Grace',
    'Sheer Force',
    'Skill Link',
    'Solar Power',
    'Storm Drain',
    'Strong Jaw',
    'Sturdy',
    'Swift Swim',
    'Technician',
    'Tinted Lens',
    'Trace',
    'Unaware',
    'Water Absorb',
    'Wonder Skin',
] as const;

const nameStarts = [
    'Aero',
    'Aqua',
    'Arbo',
    'Belli',
    'Bronto',
    'Cind',
    'Cryo',
    'Draco',
    'Elek',
    'Ferro',
    'Flora',
    'Glim',
    'Hydra',
    'Ign',
    'Kora',
    'Lumi',
    'Maga',
    'Melo',
    'Necto',
    'Orbi',
    'Pyro',
    'Quilli',
    'Rava',
    'Sola',
    'Tera',
    'Umbra',
    'Veno',
    'Vol',
    'Wyr',
    'Zep',
] as const;

const nameMiddles = [
    '',
    '',
    'ba',
    'chu',
    'di',
    'ka',
    'lo',
    'ma',
    'mi',
    'na',
    'ra',
    'ri',
    'ro',
    'ta',
    'vi',
    'za',
] as const;

const nameEnds = [
    'bat',
    'bloom',
    'byte',
    'claw',
    'dra',
    'fang',
    'flare',
    'geist',
    'gon',
    'lisk',
    'mite',
    'moth',
    'naut',
    'pod',
    'puff',
    'rex',
    'rill',
    'saur',
    'shade',
    'shock',
    'thorn',
    'tide',
    'vane',
    'volt',
    'wisp',
] as const;

type StatName = 'HP' | 'Attack' | 'Defense' | 'Sp. Atk' | 'Sp. Def' | 'Speed';

type Stats = Record<StatName, number>;

export type RandomPokemon = {
    name: string;
    types: string[];
    ability: string;
    hiddenAbility: string;
    stats: Stats;
    bst: number;
    archetype: string;
};

type StatProfile = {
    name: string;
    weights: Record<StatName, number>;
};

type TypeName = typeof types[number];

const statNames: StatName[] = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
const minStat = 35;
const maxStat = 185;
const maxBst = 780;
const typeIconBaseUrl = 'https://play.pokemonshowdown.com/sprites/types/';

const statProfiles: StatProfile[] = [
    { name: 'Balanced', weights: { HP: 1, Attack: 1, Defense: 1, 'Sp. Atk': 1, 'Sp. Def': 1, Speed: 1 } },
    { name: 'Physical Attacker', weights: { HP: 0.95, Attack: 1.4, Defense: 0.9, 'Sp. Atk': 0.7, 'Sp. Def': 0.85, Speed: 1.2 } },
    { name: 'Special Attacker', weights: { HP: 0.9, Attack: 0.7, Defense: 0.85, 'Sp. Atk': 1.45, 'Sp. Def': 1, Speed: 1.1 } },
    { name: 'Bulky Wall', weights: { HP: 1.35, Attack: 0.75, Defense: 1.35, 'Sp. Atk': 0.75, 'Sp. Def': 1.3, Speed: 0.55 } },
    { name: 'Fast Support', weights: { HP: 0.95, Attack: 0.75, Defense: 0.85, 'Sp. Atk': 0.95, 'Sp. Def': 1, Speed: 1.5 } },
    { name: 'Mixed Attacker', weights: { HP: 0.9, Attack: 1.25, Defense: 0.8, 'Sp. Atk': 1.25, 'Sp. Def': 0.85, Speed: 1.15 } },
];

function choice<T>(items: readonly T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function typeIcon(type: string) {
    const sanitizedType = encodeURIComponent(type).replace(/\?/g, '%3f');
    return `<img src="${typeIconBaseUrl}${sanitizedType}.png" alt="${escapeHTML(type)}" height="14" width="32" style="image-rendering:pixelated;vertical-align:middle;margin-right:4px" />`;
}

function statBarStyle(stat: number) {
    const width = Math.min(stat, 180);
    const hue = Math.min(Math.floor(stat), 360);
    return {
        width,
        background: `hsl(${hue},85%,45%)`,
        borderColor: `hsl(${hue},85%,35%)`,
    };
}

function renderInfoRow(label: string, value: string) {
    return `<tr><td style="padding:2px 10px 2px 0;color:#64748b;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:.4px">${escapeHTML(label)}</td><td style="padding:2px 0;color:#111827;font-size:12px;font-weight:700">${escapeHTML(value)}</td></tr>`;
}

function generateName() {
    const start = choice(nameStarts);
    const middle = choice(nameMiddles);
    const end = choice(nameEnds);
    const name = `${start}${middle}${end}`;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function generateTypes() {
    const primaryType = choice(types);
    if (Math.random() < 0.48) {
        const secondaryTypes = types.filter(type => type !== primaryType);
        return [primaryType, choice(secondaryTypes)] satisfies TypeName[];
    }
    return [primaryType] satisfies TypeName[];
}

function generateBst() {
    const roll = Math.random();
    if (roll < 0.55) return randomInt(360, 499);
    if (roll < 0.9) return randomInt(500, 600);
    if (roll < 0.98) return randomInt(601, 680);
    return randomInt(681, maxBst);
}

function generateStats(bst: number, profile: StatProfile): Stats {
    const stats = Object.fromEntries(statNames.map(name => [name, minStat])) as Stats;
    let remaining = bst - statNames.length * minStat;
    const jitteredWeights = Object.fromEntries(
        statNames.map(name => [name, profile.weights[name] * (0.85 + Math.random() * 0.3)]),
    ) as Record<StatName, number>;

    while (remaining > 0) {
        const availableStats = statNames.filter(name => stats[name] < maxStat);
        const weightTotal = availableStats.reduce((total, name) => total + jitteredWeights[name], 0);
        let marker = Math.random() * weightTotal;
        const stat = availableStats.find((name) => {
            marker -= jitteredWeights[name];
            return marker <= 0;
        }) ?? availableStats[availableStats.length - 1];

        stats[stat]++;
        remaining--;
    }

    return stats;
}

export function generateRandomPokemon(): RandomPokemon {
    const ability = choice(abilities);
    const hiddenAbility = choice(abilities.filter(candidate => candidate !== ability));
    const bst = generateBst();
    const profile = choice(statProfiles);

    return {
        name: generateName(),
        types: generateTypes(),
        ability,
        hiddenAbility,
        stats: generateStats(bst, profile),
        bst,
        archetype: profile.name,
    };
}

export function renderRandomPokemonHTML(pokemon: RandomPokemon) {
    const typeBadges = pokemon.types.map(typeIcon).join('');
    const statRows = statNames.map((stat) => {
        const value = pokemon.stats[stat];
        const bar = statBarStyle(value);
        return `<tr><td style="padding:3px 8px 3px 0;color:#334155;text-align:right;font-size:12px">${escapeHTML(stat)}</td><td style="padding:3px 8px;font-weight:700;text-align:right;font-size:12px;color:#0f172a">${value}</td><td style="width:185px"><span style="margin:3px 0 0 5px;display:block;height:12px;width:${bar.width}px;background:${bar.background};border-bottom:3px solid ${bar.borderColor};border-right:1px solid ${bar.borderColor}"></span></td></tr>`;
    }).join('');

    return `<div style="width:520px;max-width:100%;background:#f8fafc;color:#111827;border:1px solid #94a3b8;border-radius:8px;padding:0;font-family:Arial,sans-serif;overflow:hidden">
        <table style="border-collapse:collapse;width:100%">
            <tr>
                <td style="padding:12px 14px 8px;background:#eaf1f8;border-bottom:1px solid #cbd5e1">
                    <div style="font-size:22px;line-height:1.05;font-weight:800;color:#0f172a;margin-bottom:6px">${escapeHTML(pokemon.name)}</div>
                    <div style="height:16px">${typeBadges}</div>
                </td>
                <td style="padding:12px 14px 8px;background:#eaf1f8;border-bottom:1px solid #cbd5e1;text-align:right;vertical-align:top;width:76px">
                    <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.5px">BST</div>
                    <div style="font-size:22px;line-height:1.05;font-weight:800;color:#0f172a">${pokemon.bst}</div>
                </td>
            </tr>
        </table>
        <table style="border-collapse:collapse;width:100%">
            <tr>
                <td style="padding:10px 14px 12px;vertical-align:top;width:190px;border-right:1px solid #e2e8f0">
                    <table style="border-collapse:collapse;width:100%;background:#ffffff;border:1px solid #dbe4ef;border-radius:6px">${renderInfoRow('Ability', pokemon.ability)}${renderInfoRow('Hidden', pokemon.hiddenAbility)}${renderInfoRow('Build', pokemon.archetype)}</table>
                </td>
                <td style="padding:9px 14px 12px;vertical-align:top">
                    <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.5px;margin:0 0 3px 5px">Base stats</div>
                    <table style="border-collapse:collapse;width:100%">${statRows}</table>
                </td>
            </tr>
        </table>
    </div>`.replace(/\n\s*/g, ' ');
}

export function randomPokemon(message: Message<'chat' | 'pm'>) {
    message.sendHTML(renderRandomPokemonHTML(generateRandomPokemon()));
}
