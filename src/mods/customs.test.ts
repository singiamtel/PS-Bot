import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Room, type Message } from 'ps-client';
import fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
    default: {
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
    },
}));

// Mock logger
vi.mock('../logger.js', () => ({
    logger: {
        verbose: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}));

describe('answerToCustoms', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Mock the customs data
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            'hello': 'Hi there!',
            'test': 'This is a test response',
        }));
        // Reset modules to reload with new mocked data
        vi.resetModules();
    });

    const createMessage = (content: string, roomid: string): Message<'chat' | 'pm'> => {
        const room = new Room(roomid);
        return {
            content,
            target: room,
            reply: vi.fn(),
        } as unknown as Message<'chat' | 'pm'>;
    };

    it('should reply with custom response when trigger matches in allowed room', async () => {
        const message = createMessage('hello', 'botdevelopment');

        // Re-import to get fresh module with mocked fs
        const { answerToCustoms: freshAnswerToCustoms } = await import('./customs.js');
        freshAnswerToCustoms(message);

        expect(message.reply).toHaveBeenCalledWith('Hi there!');
    });

    it('should not reply when message is in non-allowed room', async () => {
        const message = createMessage('hello', 'randomroom');
        const { answerToCustoms: freshAnswerToCustoms } = await import('./customs.js');
        freshAnswerToCustoms(message);

        expect(message.reply).not.toHaveBeenCalled();
    });

    it('should reply in dreamyard room', async () => {
        const message = createMessage('test', 'dreamyard');

        const { answerToCustoms: freshAnswerToCustoms } = await import('./customs.js');
        freshAnswerToCustoms(message);

        expect(message.reply).toHaveBeenCalledWith('This is a test response');
    });

    it('should handle case insensitive triggers', async () => {
        const message = createMessage('HELLO', 'botdevelopment');

        const { answerToCustoms: freshAnswerToCustoms } = await import('./customs.js');
        freshAnswerToCustoms(message);

        expect(message.reply).toHaveBeenCalledWith('Hi there!');
    });
});

describe('addCustom', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}));
        vi.resetModules();
    });

    const createMessage = (content: string): Message<'chat' | 'pm'> => ({
        content,
        reply: vi.fn(),
    } as unknown as Message<'chat' | 'pm'>);

    it('should add a new custom successfully', async () => {
        const message = createMessage('#addcustom hello,Hi there!');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('Custom added.');
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should reject if custom already exists', async () => {
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ 'hello': 'exists' }));

        const message = createMessage('#addcustom hello,New response');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('That custom already exists.');
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should reject invalid format', async () => {
        const message = createMessage('#addcustom invalidformat');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('Invalid format. Use #addcustom key,value');
    });

    it('should reject disallowed commands', async () => {
        const message = createMessage('#addcustom test,/ban user');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('No commands allowed.');
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should allow /show command', async () => {
        const message = createMessage('#addcustom test,/show pokemon');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('Custom added.');
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should normalize key to lowercase', async () => {
        const message = createMessage('#addcustom HELLO,Response');

        const { addCustom: freshAddCustom } = await import('./customs.js');
        freshAddCustom(message);

        expect(message.reply).toHaveBeenCalledWith('Custom added.');
        const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
        const writtenData = JSON.parse(writeCall[1] as string);
        expect(writtenData).toHaveProperty('hello');
    });
});

describe('deleteCustom', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            'hello': 'Hi there!',
            'test': 'Test response',
        }));
        vi.resetModules();
    });

    const createMessage = (content: string): Message<'chat' | 'pm'> => ({
        content,
        reply: vi.fn(),
    } as unknown as Message<'chat' | 'pm'>);

    it('should delete existing custom', async () => {
        const message = createMessage('#deletecustom hello');

        const { deleteCustom: freshDeleteCustom } = await import('./customs.js');
        freshDeleteCustom(message);

        expect(message.reply).toHaveBeenCalledWith('Custom deleted.');
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should reject deletion of non-existent custom', async () => {
        const message = createMessage('#deletecustom nonexistent');

        const { deleteCustom: freshDeleteCustom } = await import('./customs.js');
        freshDeleteCustom(message);

        expect(message.reply).toHaveBeenCalledWith('That custom doesn\'t exist.');
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

describe('showCustoms', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            'hello': 'Hi there!',
            'test': 'Test response',
            'goodbye': 'See you later!',
        }));
        vi.resetModules();
    });

    const createMessage = (): Message<'chat' | 'pm'> => ({
        content: '#showcustom',
        reply: vi.fn(),
    } as unknown as Message<'chat' | 'pm'>);

    it('should show list of all custom keys', async () => {
        const message = createMessage();

        const { showCustoms: freshShowCustoms } = await import('./customs.js');
        freshShowCustoms(message);

        expect(message.reply).toHaveBeenCalled();
        const replyContent = vi.mocked(message.reply).mock.calls[0][0];
        expect(replyContent).toContain('!code');
        expect(replyContent).toContain('hello');
        expect(replyContent).toContain('test');
        expect(replyContent).toContain('goodbye');
    });
});
