import { expect, it, vi, describe, beforeEach } from 'vitest';
import { getUserConfig } from './config.js';
import { readFileSync } from 'node:fs';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

describe('getUserConfig', () => {
  beforeEach(() => {
    vi.mocked(readFileSync).mockReset();
  });

  it('Parses basic config correctly', () => {
    vi.mocked(readFileSync).mockReturnValue(`{
      "meters": [
        { "prm": "123", "token": "ccc" },
        { "prm": "123", "token": "ppp", "production": true }
      ]
    }`);
    expect(getUserConfig()).toEqual({
      meters: [
        {
          prm: '123',
          production: false,
          token: 'ccc',
        },
        { prm: '123', production: true, token: 'ppp' },
      ],
    });
  });

  it('Throws if a PRM is configured multiple times', () => {
    vi.mocked(readFileSync).mockReturnValue(`{
      "meters": [
        { "prm": "123", "token": "ccc" },
        { "prm": "123", "token": "ppp", "production": true },
        { "prm": "123", "token": "ddd", "production": false }
      ]
    }`);

    expect(() => getUserConfig()).toThrowError('PRM 123 is configured multiple times in consumption mode');
  });
});
