import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Message } from 'ps-client';
import { compactDex, findPokemon, renderCompactDexHTML, renderCompactDexText } from './dex.js';

vi.mock('../config.js', () => ({
    config: {
        prefix: '#',
    },
}));

vi.mock('../utils.js', () => ({
    canUHTML: vi.fn(),
}));

describe('findPokemon', () => {
    it('finds Pokemon by name and common aliases', () => {
        expect(findPokemon('Mew')?.name).toBe('Mew');
        expect(findPokemon('zard')?.name).toBe('Charizard');
    });

    it('returns null for unknown Pokemon', () => {
        expect(findPokemon('not a pokemon')).toBeNull();
    });
});

describe('renderCompactDexHTML', () => {
    it('renders a compact single-line dex result', () => {
        const pokemon = findPokemon('Pikachu');

        expect(pokemon).not.toBeNull();
        const html = renderCompactDexHTML(pokemon!);

        expect(html).toContain('Pikachu');
        expect(html).toContain('sprites/dex/pikachu.png');
        expect(html).toContain('sprites/types/Electric.png');
        expect(html).toContain('Static');
        expect(html).toContain('<em>Lightning Rod</em>');
        expect(html).toContain('Dex#: <strong style="color:#111827">25</strong>');
        expect(html).toContain('BST');
        expect(html).not.toContain('\n');
    });
});

describe('renderCompactDexText', () => {
    it('renders a plain text fallback', () => {
        const pokemon = findPokemon('Mew');

        expect(pokemon).not.toBeNull();
        expect(renderCompactDexText(pokemon!)).toBe('UU Mew [Psychic] HP 100 Atk 100 Def 100 SpA 100 SpD 100 Spe 100 BST 600 | Abilities: Synchronize | Dex#: 151 | Gen: 1 | Height: 0.4 m | Weight: 4 kg | Evolution: None');
    });
});

describe('compactDex', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends compact HTML when UHTML is available', async () => {
        const { canUHTML } = await import('../utils.js');
        vi.mocked(canUHTML).mockReturnValue(true);
        const sendHTML = vi.fn();
        const message = {
            content: '#dt Mew',
            reply: vi.fn(),
            sendHTML,
        } as unknown as Message<'chat' | 'pm'>;

        compactDex(message);

        expect(sendHTML).toHaveBeenCalledWith(expect.stringContaining('Mew'), { name: 'COMPACTDEX-mew' });
    });

    it('falls back to code text without UHTML', async () => {
        const { canUHTML } = await import('../utils.js');
        vi.mocked(canUHTML).mockReturnValue(false);
        const reply = vi.fn();
        const message = {
            content: '/botmsg #dex zard',
            reply,
            sendHTML: vi.fn(),
        } as unknown as Message<'chat' | 'pm'>;

        compactDex(message);

        expect(reply).toHaveBeenCalledWith(expect.stringContaining('Charizard'));
    });
});
