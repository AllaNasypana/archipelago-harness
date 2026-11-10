import { splitMinutes } from './split-minutes';

describe('splitMinutes', () => {
  it.each([
    [0, { hours: 0, minutes: 0 }],
    [45, { hours: 0, minutes: 45 }],
    [90, { hours: 1, minutes: 30 }],
    [1440, { hours: 24, minutes: 0 }],
  ])('splits %i minutes', (total, expected) => {
    expect(splitMinutes(total)).toEqual(expected);
  });

  it.each([-1, 1.5, Number.NaN])('rejects %s', (total) => {
    expect(() => splitMinutes(total)).toThrow(RangeError);
  });
});
