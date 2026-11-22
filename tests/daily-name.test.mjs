import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyNameIndex, indiaDay, millisecondsUntilIndiaMidnight } from '../src/lib/daily-name.mjs';

test('the shared day changes exactly at midnight in India', () => {
  const before = new Date('2026-11-22T18:29:59.999Z');
  const midnight = new Date('2026-11-22T18:30:00.000Z');
  assert.equal(indiaDay(midnight), indiaDay(before) + 1);
  assert.notEqual(dailyNameIndex(1000, before), dailyNameIndex(1000, midnight));
  assert.equal(millisecondsUntilIndiaMidnight(before), 1);
  assert.equal(millisecondsUntilIndiaMidnight(midnight), 86_400_000);
});

test('visitors in different time zones get the same name for the same India day', () => {
  const early = new Date('2026-11-22T00:00:00+05:30');
  const late = new Date('2026-11-22T10:29:59-08:00');
  assert.equal(dailyNameIndex(1000, early), dailyNameIndex(1000, late));
});

test('all 1000 names appear before the shuffled cycle repeats', () => {
  const start = Date.parse('2026-01-01T00:00:00+05:30');
  const indices = Array.from({ length: 1000 }, (_, i) => dailyNameIndex(1000, start + i * 86_400_000));
  assert.equal(new Set(indices).size, 1000);
  assert.ok(indices.every((i) => i >= 0 && i < 1000));
  assert.equal(dailyNameIndex(1000, start + 1000 * 86_400_000), indices[0]);
});

test('the sequence continues over New Year and leap day', () => {
  for (const [before, after] of [
    ['2026-12-31T23:59:59+05:30', '2027-01-01T00:00:00+05:30'],
    ['2028-02-28T23:59:59+05:30', '2028-02-29T00:00:00+05:30'],
  ]) {
    assert.equal(indiaDay(new Date(after)), indiaDay(new Date(before)) + 1);
    assert.notEqual(dailyNameIndex(1000, new Date(before)), dailyNameIndex(1000, new Date(after)));
  }
});
