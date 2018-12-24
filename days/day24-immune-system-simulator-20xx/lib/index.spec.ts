import implem from '.';
import input from '../input.test.json';

describe('Immune system simulator 20XX', () => {
  it('Should output the remaining units of winning team', () => {
    expect(implem(input)).toBe(5216);
  });
});
