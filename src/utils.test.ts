import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  padTo2Digits,
  formatDate,
  isRoom,
  inAllowedRooms,
  toOrdinal,
  formatTop3,
  toCmd,
  assertNever
} from './utils.js';
import { Room, User, type Message } from 'ps-client';

describe('padTo2Digits', () => {
  it('should pad single digit numbers', () => {
    expect(padTo2Digits(1)).toBe('01');
    expect(padTo2Digits(9)).toBe('09');
  });

  it('should not pad double digit numbers', () => {
    expect(padTo2Digits(10)).toBe('10');
    expect(padTo2Digits(99)).toBe('99');
  });

  it('should handle zero', () => {
    expect(padTo2Digits(0)).toBe('00');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T14:30:45');
    expect(formatDate(date)).toBe('2024-01-15 14:30:45');
  });

  it('should pad single digit months and days', () => {
    const date = new Date('2024-03-05T09:08:07');
    expect(formatDate(date)).toBe('2024-03-05 09:08:07');
  });
});

describe('isRoom', () => {
  it('should return true for Room instances', () => {
    const room = new Room('test');
    expect(isRoom(room)).toBe(true);
  });

  it('should return false for User instances', () => {
    const user = new User({ id: 'testuser' });
    expect(isRoom(user)).toBe(false);
  });
});

describe('inAllowedRooms', () => {
  it('should return true if message is in allowed room', () => {
    const room = new Room('testroom');
    const message = {
      target: room,
    } as Message<'chat' | 'pm'>;

    expect(inAllowedRooms(message, ['testroom'])).toBe(true);
  });

  it('should return true for botdevelopment room even if not in list', () => {
    const room = new Room('botdevelopment');
    const message = {
      target: room,
    } as Message<'chat' | 'pm'>;

    expect(inAllowedRooms(message, [])).toBe(true);
  });

  it('should return false if message is not in a room', () => {
    const user = new User({ id: 'testuser' });
    const message = {
      target: user,
    } as Message<'chat' | 'pm'>;

    expect(inAllowedRooms(message, ['testroom'])).toBe(false);
  });

  it('should return false if room is not in allowed list', () => {
    const room = new Room('otherroom');
    const message = {
      target: room,
    } as Message<'chat' | 'pm'>;

    expect(inAllowedRooms(message, ['testroom'])).toBe(false);
  });
});

describe('toOrdinal', () => {
  it('should return correct ordinal for 1st, 2nd, 3rd', () => {
    expect(toOrdinal(1)).toBe('1st');
    expect(toOrdinal(2)).toBe('2nd');
    expect(toOrdinal(3)).toBe('3rd');
  });

  it('should return "th" suffix for numbers >= 4', () => {
    expect(toOrdinal(4)).toBe('4th');
    expect(toOrdinal(10)).toBe('10th');
    expect(toOrdinal(100)).toBe('100th');
  });
});

describe('formatTop3', () => {
  it('should return empty string for empty array', () => {
    expect(formatTop3([])).toBe('');
  });

  it('should return single username for one user', () => {
    expect(formatTop3(['user1'])).toBe('user1');
  });

  it('should join two users with "and"', () => {
    expect(formatTop3(['user1', 'user2'])).toBe('user1 and user2');
  });

  it('should format three users correctly', () => {
    expect(formatTop3(['user1', 'user2', 'user3'])).toBe('user1, user2, and user3');
  });

  it('should only take first 3 users even if more are provided', () => {
    expect(formatTop3(['user1', 'user2', 'user3', 'user4', 'user5']))
      .toBe('user1, user2, and user3');
  });
});

describe('toCmd', () => {
  const createMessage = (content: string): Message<'chat' | 'pm'> => ({
    content,
  } as Message<'chat' | 'pm'>);

  beforeEach(() => {
    // Mock config prefix as '#'
    vi.stubEnv('prefix', '#');
  });

  it('should extract command from message with prefix', () => {
    expect(toCmd(createMessage('#ttp'))).toBe('ttp');
    expect(toCmd(createMessage('#namecolour'))).toBe('namecolour');
  });

  it('should extract command from message with arguments', () => {
    expect(toCmd(createMessage('#ttp arg1 arg2'))).toBe('ttp');
  });

  it('should handle /botmsg prefix', () => {
    expect(toCmd(createMessage('/botmsg #ttp'))).toBe('ttp');
    expect(toCmd(createMessage('/botmsg #namecolour arg'))).toBe('namecolour');
  });

  it('should return false if message does not start with prefix', () => {
    expect(toCmd(createMessage('hello world'))).toBe(false);
    expect(toCmd(createMessage('ttp'))).toBe(false);
  });

  it('should return false if command is not in command list', () => {
    expect(toCmd(createMessage('#invalidcommand'))).toBe(false);
  });
});

describe('assertNever', () => {
  it('should throw error when called', () => {
    expect(() => assertNever('test' as never)).toThrow('Unexpected object: test');
  });
});
