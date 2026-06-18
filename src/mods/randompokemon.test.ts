import { describe, expect, it } from 'vitest';
import { generateRandomPokemon, renderRandomPokemonHTML } from './randompokemon.js';

describe('generateRandomPokemon', () => {
    it('generates Pokemon-like output with bounded typing, abilities, and stats', () => {
        for (let i = 0; i < 1000; i++) {
            const pokemon = generateRandomPokemon();
            const statValues = Object.values(pokemon.stats);
            const statTotal = statValues.reduce((total, stat) => total + stat, 0);

            expect(pokemon.name).toMatch(/^[A-Z][a-z]+$/);
            expect(pokemon.types.length).toBeGreaterThanOrEqual(1);
            expect(pokemon.types.length).toBeLessThanOrEqual(2);
            expect(new Set(pokemon.types).size).toBe(pokemon.types.length);
            expect(pokemon.ability).not.toBe(pokemon.hiddenAbility);
            expect(statTotal).toBe(pokemon.bst);
            expect(pokemon.bst).toBeLessThanOrEqual(780);
            expect(Math.min(...statValues)).toBeGreaterThanOrEqual(35);
            expect(Math.max(...statValues)).toBeLessThanOrEqual(185);
        }
    });
});

describe('renderRandomPokemonHTML', () => {
    it('renders a compact htmlbox body with the generated fields', () => {
        const html = renderRandomPokemonHTML({
            name: 'Testmon',
            types: ['Fire', 'Ghost'],
            ability: 'Flash Fire',
            hiddenAbility: 'Levitate',
            archetype: 'Special Attacker',
            bst: 500,
            stats: {
                HP: 80,
                Attack: 70,
                Defense: 75,
                'Sp. Atk': 120,
                'Sp. Def': 80,
                Speed: 75,
            },
        });

        expect(html).toContain('Testmon');
        expect(html).toContain('sprites/types/Fire.png');
        expect(html).toContain('sprites/types/Ghost.png');
        expect(html).toContain('Flash Fire');
        expect(html).toContain('Levitate');
        expect(html).toContain('background:hsl(120,85%,45%)');
        expect(html).toContain('border-bottom:3px solid hsl(120,85%,35%)');
        expect(html).toContain('BST');
        expect(html).not.toContain('\n');
    });
});
