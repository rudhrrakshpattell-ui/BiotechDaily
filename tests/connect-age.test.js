import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, birthDateFrom } from '../src/connect/shared.js';

test('month + year birth dates use the last day of the month (youngest possible)', () => {
  assert.equal(birthDateFrom(2013, 2), '2013-02-28');
  assert.equal(birthDateFrom(2012, 2), '2012-02-29');
  assert.equal(birthDateFrom(2010, 12), '2010-12-31');
});

test('age is only reached on the birthday itself', () => {
  const today = new Date('2026-09-27T12:00:00Z');
  assert.equal(ageOn('2013-09-27', today), 13);
  assert.equal(ageOn('2013-09-28', today), 12);
  assert.equal(ageOn(birthDateFrom(2013, 9), today), 12, 'born "September 2013" is treated as 12 until October');
  assert.equal(ageOn(birthDateFrom(2013, 8), today), 13);
});
