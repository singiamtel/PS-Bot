import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Room, User, type Message } from 'ps-client';

// Mock the logger
vi.mock('./logger.js', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        verbose: vi.fn(),
    },
}));

// Mock the config
vi.mock('./config.js', () => ({
    config: {
        whitelist: ['whitelisteduser'],
        rooms: ['testroom'],
        hostRoom: 'testroom',
        prefix: '#',
        imageCDN: 'https://cdn.crob.at/',
        name: 'testbot',
    },
}));

// Mock ps-client to prevent actual connection
vi.mock('ps-client', async () => {
    const actual = await vi.importActual<typeof import('ps-client')>('ps-client');
    return {
        ...actual,
        Client: vi.fn().mockImplementation(() => ({
            connect: vi.fn(),
            getRoom: vi.fn(),
        })),
    };
});

// Now import bot after mocks are set up
import { atLeast, roomAtLeast, reply, privateHTML, rankOrder, type Rank } from './bot.js';

describe('rankOrder', () => {
    it('should have correct rank hierarchy', () => {
        expect(rankOrder['&']).toBeGreaterThan(rankOrder['#']);
        expect(rankOrder['#']).toBeGreaterThan(rankOrder['@']);
        expect(rankOrder['@']).toBeGreaterThan(rankOrder['%']);
        expect(rankOrder['%']).toBeGreaterThan(rankOrder['*']);
        expect(rankOrder['*']).toBeGreaterThan(rankOrder['+']);
        expect(rankOrder['+']).toBeGreaterThan(rankOrder[' ']);
    });
});

describe('atLeast', () => {
    const createMessage = (msgRank: Rank | undefined, authorName: string): Message<'chat' | 'pm'> => ({
        msgRank,
        author: {
            name: authorName,
            id: authorName.toLowerCase(),
        },
        content: 'test message',
    } as Message<'chat' | 'pm'>);

    it('should return true for whitelisted users regardless of rank', () => {
        expect(atLeast('+', createMessage(undefined, 'whitelisteduser'))).toBe(true);
        expect(atLeast('&', createMessage(' ', 'whitelisteduser'))).toBe(true);
    });

    it('should return true when user has sufficient rank', () => {
        expect(atLeast('+', createMessage('%', 'testuser'))).toBe(true);
        expect(atLeast('%', createMessage('%', 'testuser'))).toBe(true);
        expect(atLeast('+', createMessage('&', 'testuser'))).toBe(true);
    });

    it('should return false when user lacks sufficient rank', () => {
        expect(atLeast('%', createMessage('+', 'testuser'))).toBe(false);
        expect(atLeast('#', createMessage('%', 'testuser'))).toBe(false);
    });

    it('should return false when msgRank is undefined', () => {
        expect(atLeast('+', createMessage(undefined, 'testuser'))).toBe(false);
    });

    it('should respect quiet parameter for logging', async () => {
        const { logger } = await import('./logger.js');

        atLeast('%', createMessage('+', 'testuser'), false);
        expect(logger.warn).toHaveBeenCalled();

        vi.clearAllMocks();

        atLeast('%', createMessage('+', 'testuser'), true);
        expect(logger.warn).not.toHaveBeenCalled();
    });
});

describe('roomAtLeast', () => {
    let mockClient: any;

    beforeEach(() => {
    // Mock the client module
        mockClient = {
            getRoom: vi.fn(),
        };

        vi.doMock('./bot.js', async (importOriginal) => {
            const actual: any = await importOriginal();
            return {
                ...actual,
                default: mockClient,
            };
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMessage = (msgRank: Rank | undefined, authorId: string): Message<'chat' | 'pm'> => ({
        msgRank,
        author: {
            id: authorId,
            name: authorId,
        },
        content: 'test message',
    } as Message<'chat' | 'pm'>);

    it('should return true for whitelisted users', () => {
        expect(roomAtLeast('%', createMessage(' ', 'whitelisteduser'), 'testroom')).toBe(true);
    });

    it('should return true for users with global permissions', () => {
        expect(roomAtLeast('%', createMessage('&', 'globalmod'), 'testroom')).toBe(true);
    });
});

describe('reply', () => {
    it('should send message in PM by default', () => {
        const sendMock = vi.fn();
        const replyMock = vi.fn();

        const message = {
            author: { send: sendMock },
            reply: replyMock,
        } as unknown as Message<'chat' | 'pm'>;

        reply(message, 'test content');

        expect(sendMock).toHaveBeenCalledWith('test content');
        expect(replyMock).not.toHaveBeenCalled();
    });

    it('should reply in public when inPm is false', () => {
        const sendMock = vi.fn();
        const replyMock = vi.fn();

        const message = {
            author: { send: sendMock },
            reply: replyMock,
        } as unknown as Message<'chat' | 'pm'>;

        reply(message, 'test content', { inPm: false });

        expect(replyMock).toHaveBeenCalledWith('test content');
        expect(sendMock).not.toHaveBeenCalled();
    });
});

describe('privateHTML', () => {
    it('should send PM if not in a room', () => {
        const sendMock = vi.fn();
        const replyMock = vi.fn();
        const user = new User({ id: 'testuser' }, {} as any);

        const message = {
            target: user,
            author: { id: 'testuser', send: sendMock },
            reply: replyMock,
        } as unknown as Message<'chat' | 'pm'>;

        privateHTML(message, '<b>test</b>', 'testroom');

        expect(sendMock).toHaveBeenCalledWith('<b>test</b>');
        expect(replyMock).not.toHaveBeenCalled();
    });

    it('should use msgroom command when in a room', () => {
        const sendMock = vi.fn();
        const replyMock = vi.fn();
        const room = new Room('testroom', {} as any);

        const message = {
            target: room,
            author: { id: 'testuser', send: sendMock },
            reply: replyMock,
        } as unknown as Message<'chat' | 'pm'>;

        privateHTML(message, '<b>test</b>', 'testroom');

        expect(replyMock).toHaveBeenCalledWith('/msgroom testroom,/sendprivatehtmlbox  testuser, <b>test</b>');
        expect(sendMock).not.toHaveBeenCalled();
    });
});
