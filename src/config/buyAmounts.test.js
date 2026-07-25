import { describe, expect, it } from 'vitest';
import { normalizeBuyAmount } from './buyAmounts.js';

describe('normalizeBuyAmount', () => {
  it.each([
    [1, 1],
    [10, 10],
    [25, 25],
    ['max', 'max'],
    ['MAX', 'max'],
    [100, 25],
    ['nope', 1],
    [null, 1],
    [undefined, 1],
  ])('normalizeBuyAmount(%j) → %j', (input, expected) => {
    expect(normalizeBuyAmount(input)).toBe(expected);
  });
});
