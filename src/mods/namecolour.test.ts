import { describe, expect, it, vi } from 'vitest';
import { User, type Message } from 'ps-client';
import { nameColour } from './namecolour.js';

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
});
