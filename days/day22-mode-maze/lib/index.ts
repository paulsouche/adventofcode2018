export interface Input {
  depth: number;
  target: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Target extends Point {
  tool: tools;
}

export interface WalkAlternative {
  cell: Point;
  minutesToCell: number;
  tool: tools;
  from?: WalkAlternative | undefined;
}

const directions = [
  {
    x: 0,
    y: -1,
  },
  {
    x: -1,
    y: 0,
  },
  {
    x: 1,
    y: 0,
  },
  {
    x: 0,
    y: 1,
  },
];

enum squareTypes {
  rocky,
  wet,
  narrow,
}

enum tools {
  torch,
  climbingGear,
  neither,
}

const toolsBySquareTypes = {
  [`${squareTypes.rocky},${tools.torch}`]: true,
  [`${squareTypes.rocky},${tools.climbingGear}`]: true,
  [`${squareTypes.rocky},${tools.neither}`]: false,
  [`${squareTypes.wet},${tools.torch}`]: false,
  [`${squareTypes.wet},${tools.climbingGear}`]: true,
  [`${squareTypes.wet},${tools.neither}`]: true,
  [`${squareTypes.narrow},${tools.torch}`]: true,
  [`${squareTypes.narrow},${tools.climbingGear}`]: false,
  [`${squareTypes.narrow},${tools.neither}`]: true,
};

export default ({ depth, target }: Input) => {
  const [targetX, targetY] = target.split(',').map((c) => +c);
  const caveErosionLevelsMap: {
    [coordinates: string]: number;
  } = {};
  const caveMap: {
    [coordinates: string]: squareTypes;
  } = {};

  const geologicIndex = (squareX: number, squareY: number) => {
    if (squareX === 0 && squareY === 0) {
      return 0;
    }

    if (squareX === targetX && squareY === targetY) {
      return 0;
    }

    if (squareY === 0) {
      return squareX * 16807;
    }

    if (squareX === 0) {
      return squareY * 48271;
    }

    let squareErosionLevelLeft = caveErosionLevelsMap[`${squareX - 1},${squareY}`];
    if (typeof squareErosionLevelLeft === 'undefined') {
      squareErosionLevelLeft = erosionLevel(squareX - 1, squareY);
    }

    let squareErosionLevelTop = caveErosionLevelsMap[`${squareX},${squareY - 1}`];
    if (typeof squareErosionLevelTop === 'undefined') {
      squareErosionLevelTop = erosionLevel(squareX, squareY - 1);
    }

    return squareErosionLevelLeft * squareErosionLevelTop;
  };

  const erosionLevel = (squareX: number, squareY: number) => {
    const squareGeologicIndex = geologicIndex(squareX, squareY);
    return (squareGeologicIndex + depth) % 20183;
  };

  const squareType = (squareX: number, squareY: number) => {
    const coordinates = `${squareX},${squareY}`;
    const squareErosionLevel = caveErosionLevelsMap[coordinates] = erosionLevel(squareX, squareY);
    switch (squareErosionLevel % 3) {
      case 0:
        caveMap[coordinates] = squareTypes.rocky;
        break;
      case 1:
        caveMap[coordinates] = squareTypes.wet;
        break;
      case 2:
        caveMap[coordinates] = squareTypes.narrow;
        break;
      default:
        throw new Error('WAT ?');
    }
  };

  let x: number;
  let y: number;
  for (x = 0; x <= targetX; x++) {
    for (y = 0; y <= targetY; y++) {
      squareType(x, y);
    }
  }

  const totalRisk = Object.values(caveMap).reduce((p, n) => p + n, 0);

  const allreadyBeenThere: {
    [coordinates: string]: number;
  } = {};
  const targetCell = (cell: Point, direction: Point) => ({
    x: cell.x + direction.x,
    y: cell.y + direction.y,
  });

  const manhattanDistanceToTarget = ({ cell }: WalkAlternative) => {
    return Math.abs(cell.x - targetX) + Math.abs(cell.y - targetY);
  };

  const cellSquareType = (cell: Point) => {
    const type = caveMap[`${cell.x},${cell.y}`];
    if (typeof type === 'undefined') {
      return squareType(cell.x, cell.y);
    }
    return type;
  };

  const shouldIGoThere = (cell: Point, minutesToCell: number, from?: WalkAlternative) => {
    return (direction: Point) => {
      const move = targetCell(cell, direction);
      if (move.x < 0 || move.y < 0) {
        // Out of the map
        return false;
      }

      if (from && from.cell.x === move.x && from.cell.y === move.y) {
        // Move forward only
        return false;
      }

      const alreadyBeenThereInTime = allreadyBeenThere[`${move.x},${move.y}`];
      if (typeof alreadyBeenThereInTime === 'number' && minutesToCell >= alreadyBeenThereInTime) {
        // Already been there faster
        return false;
      }

      allreadyBeenThere[`${move.x},${move.y}`] = Math.min(minutesToCell, alreadyBeenThereInTime);
      return true;
    };
  };

  const findAlternatives = (alternative: WalkAlternative) => {
    const { cell, tool, minutesToCell } = alternative;
    const startSquareType = cellSquareType(cell);
    return (alternatives: WalkAlternative[], direction: Point) => {
      const move = targetCell(cell, direction);
      const moveSquareType = cellSquareType(move);
      if (startSquareType === moveSquareType) {
        // Change tool not needed
        alternatives.push({
          cell: move,
          from: alternative,
          minutesToCell: minutesToCell + 1,
          tool,
        });
        return alternatives;
      }

      [tools.torch, tools.climbingGear, tools.neither]
        .filter((t) => toolsBySquareTypes[`${startSquareType},${t}`] &&
          toolsBySquareTypes[`${moveSquareType},${t}`])
        .forEach((t) => alternatives.push({
          cell: move,
          from: alternative,
          minutesToCell: minutesToCell + 1 + ((t === tool) ? 0 : 7),
          tool: t,
        }));

      return alternatives;
    };
  };

  const sortAlternatives = (a: WalkAlternative, b: WalkAlternative) => {
    const aDist = manhattanDistanceToTarget(a);
    const bDist = manhattanDistanceToTarget(b);
    if (aDist > bDist) {
      return 1;
    }

    if (aDist === bDist) {
      return a.minutesToCell > b.minutesToCell ? 1 : -1;
    }

    return -1;
  };

  let minMinutes = Infinity;
  const walk = ({ cell, from, minutesToCell, tool }: WalkAlternative) => {
    // First check if on target
    if (cell.x === targetX && cell.y === targetY) {
      minMinutes = Math.min(minMinutes, minutesToCell);
      // End of path
      return [];
    }

    if (minutesToCell > minMinutes) {
      // Shortest path exist
      return [];
    }

    allreadyBeenThere[`${cell.x},${cell.y}`] = Math.min(minutesToCell, allreadyBeenThere[`${cell.x},${cell.y}`]);

    return directions
      .filter(shouldIGoThere(cell, minutesToCell, from))
      .reduce(findAlternatives({ cell, minutesToCell, tool }), []);
  };

  let walkAlternatives = walk({
    cell: { x: 0, y: 0 },
    minutesToCell: 0,
    tool: tools.torch,
  });

  console.log('ALTERNATIVES', walkAlternatives);

  while (walkAlternatives.length) {
    const alternative = walkAlternatives
      .sort(sortAlternatives).shift();
    if (!alternative) {
      throw new Error('Inception !!!');
    }

    console.log('CHOSEN ALTERNATIVE', alternative);
    const newAlternatives = walk(alternative);

    console.log('NEW ALTERNATIVES', newAlternatives);
    walkAlternatives.push(...newAlternatives);
    walkAlternatives = walkAlternatives
      .filter((a) => a.minutesToCell < minMinutes);

    console.log('REMAINING ALTERNATIVES', walkAlternatives);
  }

  return {
    minMinutes,
    totalRisk,
  };
};
