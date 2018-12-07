const coordinateReg = /^(\d+),\s(\d+)$/;

interface Point {
  x: number;
  y: number;
}

function parseInput(input: string[]) {
  let maxX = 0;
  let maxY = 0;
  const map: {
    [coordinates: string]: Point;
  } = input
    .map((i: string) => {
      const match = coordinateReg.exec(i);

      if (!match) {
        throw new Error(`invalid coordinates ${i}`);
      }

      const x = +match[1];
      const y = +match[2];

      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      return {
        x,
        y,
      };
    })
    .reduce((p, { x, y }) => ({
      ...p,
      [`${x},${y}`]: {
        x,
        y,
      },
    }), {});

  return {
    map,
    maxX: maxX + 1,
    maxY: maxY + 1,
  };
}

function computeManhattanDistance(point1: Point, point2: Point) {
  return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
}

function findMinManhattanCoordinates(point: Point, map: {
  [coordinates: string]: Point;
}) {
  const key = `${point.x},${point.y}`;
  if (map[key]) {
    return key;
  }

  let minManhattanDistance = Infinity;
  let minManhattanCoordinates: string | undefined;
  Object.keys(map)
    .forEach((k) => {
      const val = map[k];
      const manhattanDistance = computeManhattanDistance(map[k], point);
      if (manhattanDistance === minManhattanDistance) {
        minManhattanCoordinates = `.`;
      }

      if (manhattanDistance < minManhattanDistance) {
        minManhattanDistance = manhattanDistance;
        minManhattanCoordinates = `${val.x},${val.y}`;
      }
    });

  if (!minManhattanCoordinates) {
    throw new Error(`Cannot compute min manhattan distance for ${key}`);
  }

  return minManhattanCoordinates;
}

export default (input: string[], maxDistance = 0) => {
  const {
    map,
    maxX,
    maxY,
  } = parseInput(input);

  let i: number;
  const coordinates = Object.keys(map);
  const ilen = (maxX + 1) * (maxY + 1);
  const grid: string[] = [];
  const infiniteAreas = ['.'];
  let safestArea = 0;
  for (i = 0; i < ilen; i++) {
    const point = {
      x: i % (maxX + 1),
      y: Math.floor(i / (maxX + 1)),
    };
    const manhattanCoordinates = findMinManhattanCoordinates(point, map);

    grid.push(manhattanCoordinates);

    if (point.x === 0 || point.y === 0 || point.y === maxY || point.x === maxX) {
      if (!infiniteAreas.includes(manhattanCoordinates)) {
        infiniteAreas.push(manhattanCoordinates);
      }
    }

    const coordinatesDistanceSum = coordinates
      .reduce((p, n) => p += computeManhattanDistance(point, map[n]), 0);

    if (coordinatesDistanceSum < maxDistance) {
      safestArea++;
    }
  }

  let largestArea = 0;

  coordinates
    .filter((c) => !infiniteAreas.includes(c))
    .forEach((c) => {
      const area = grid.reduce((p, n) => {
        if (n === c) {
          p++;
        }
        return p;
      }, 0);
      if (area > largestArea) {
        largestArea = area;
      }
    });

  return {
    largestArea,
    safestArea,
  };
};
