import { describe, expect, it, vi } from 'vitest';
import { User, type Message } from 'ps-client';
import { nameColour } from './namecolour.js';
import { getCustomColourDetails } from '../namecolour.js';

describe('nameColour', () => {
    function createPmMessage(content: string): Message<'chat' | 'pm'> {
        const user = new User({ id: 'tester', name: 'Tester' }, {} as any);
        return {
            content,
            type: 'pm',
            target: user,
            reply: vi.fn(),
        } as unknown as Message<'chat' | 'pm'>;
    }

    it('includes the colour match percentage in PM replies', () => {
        const message = createPmMessage('#namecolour testuser');

        nameColour(message, 'Roomba');

        expect(message.reply).toHaveBeenCalledOnce();
        expect(vi.mocked(message.reply).mock.calls[0][0]).toMatch(/\(\d+\.\d{2}% match\)/);
    });

    it('shows the old and new colours when the user has a custom colour', () => {
        const message = createPmMessage('#namecolour theimmortal');
        const customColour = getCustomColourDetails('theimmortal');

        nameColour(message, 'Roomba');

        expect(customColour).not.toBeNull();
        expect(message.reply).toHaveBeenCalledOnce();
        expect(vi.mocked(message.reply).mock.calls[0][0]).toContain('theimmortal has a custom colour');
        expect(vi.mocked(message.reply).mock.calls[0][0]).toContain(`${customColour!.oldColour} -> ${customColour!.newColour}`);
        expect(vi.mocked(message.reply).mock.calls[0][0]).toContain('(from taco)');
    });

    it('does not show custom colour details for regular users', () => {
        const message = createPmMessage('#namecolour testuser');

        nameColour(message, 'Roomba');

        expect(message.reply).toHaveBeenCalledOnce();
        expect(vi.mocked(message.reply).mock.calls[0][0]).not.toContain('custom colour');
    });
});
