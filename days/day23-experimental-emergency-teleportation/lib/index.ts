export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface NanoBot extends Point {
  r: number;
}

const nanoBotReg = /^pos=<(-?\d+),(-?\d+),(-?\d+)>,\sr=(-?\d+)$/;

export function strToNanoBot(str: string) {
  const match = nanoBotReg.exec(str);

  if (!match) {
    throw new Error(`Invalid nanobot input ${str}`);
  }

  return {
    r: +match[4],
    x: +match[1],
    y: +match[2],
    z: +match[3],
  };
}

export function computeManhattanDistance(point1: Point, point2: Point) {
  return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y) + Math.abs(point1.z - point2.z);
}

export default (input: string[]) => {
  const nanoBots = input.map(strToNanoBot);
  const start = { x: 0, y: 0, z: 0 };

  let [strongestNanobot] = nanoBots;
  nanoBots
    .forEach((n) => {
      if (strongestNanobot.r < n.r) {
        strongestNanobot = n;
      }
    });

  const nanoBotsInStrongestRange = nanoBots
    .filter((n) => computeManhattanDistance(strongestNanobot, n) <= strongestNanobot.r);
  const numberOfNanoBotsInStrongestRange = nanoBotsInStrongestRange.length;

  const bestPos = nanoBotsInStrongestRange
    .reduce((p, n) => {
      if (n === strongestNanobot) {
        return p;
      }
      p.x += n.x / (numberOfNanoBotsInStrongestRange - 1);
      p.y += n.y / (numberOfNanoBotsInStrongestRange - 1);
      p.z += n.z / (numberOfNanoBotsInStrongestRange - 1);
      return p;
    }, { ...start });

  if (!bestPos) {
    throw new Error(`Could not find best position`);
  }

  return {
    bestPos: computeManhattanDistance({
      x: Math.round(bestPos.x),
      y: Math.round(bestPos.y),
      z: Math.round(bestPos.z),
    }, start),
    nanoBotsInStrongestRange: nanoBotsInStrongestRange.length,
  };
};
