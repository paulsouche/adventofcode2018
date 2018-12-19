import implem from '.';

describe('Beverage bandits', () => {
  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#######',
      '#.G...#',
      '#...EG#',
      '#.#.#G#',
      '#..G#E#',
      '#.....#',
      '#######',
    ])).toBe(27730);
  });

  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#######',
      '#G..#E#',
      '#E#E.E#',
      '#G.##.#',
      '#...#E#',
      '#...E.#',
      '#######',
    ])).toBe(36334);
  });

  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#######',
      '#E..EG#',
      '#.#G.E#',
      '#E.##E#',
      '#G..#.#',
      '#..E#.#',
      '#######',
    ])).toBe(39514);
  });

  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#######',
      '#E.G#.#',
      '#.#G..#',
      '#G.#.G#',
      '#G..#.#',
      '#...E.#',
      '#######',
    ])).toBe(27755);
  });

  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#######',
      '#.E...#',
      '#.#..G#',
      '#.###.#',
      '#E#G#G#',
      '#...#G#',
      '#######',
    ])).toBe(28944);
  });

  it('Should play the battle and output the final score', () => {
    expect(implem([
      '#########',
      '#G......#',
      '#.E.#...#',
      '#..##..G#',
      '#...##..#',
      '#...#...#',
      '#.G...G.#',
      '#.....G.#',
      '#########',
    ])).toBe(18740);
  });
});
