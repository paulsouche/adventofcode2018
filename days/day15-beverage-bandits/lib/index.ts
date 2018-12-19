interface Point {
  x: number;
  y: number;
}

interface Cell extends Point {
  distance: number;
  origin?: number;
}

// adjacent squares in reading order
const dx = [0, -1, 1, 0];
const dy = [-1, 0, 0, 1];

export class Soldier implements Point {
  public static readingSort(sa: Point, sb: Point) {
    return ((sa.y > sb.y) || ((sa.y === sb.y) && (sa.x > sb.x))) ? 1 : -1;
  }

  public static adjacentFilter(soldierX: number, soldierY: number) {
    return ({ x, y }: Point) =>
      ((soldierX === x) && ((soldierY === y - 1) || (soldierY === y + 1))) ||
      ((soldierY === y) && ((soldierX === x - 1) || (soldierX === x + 1)));
  }

  public hp = 200;

  constructor(public team: string, public x: number, public y: number) { }

  get isDead() {
    return this.hp <= 0;
  }

  public isEnemy(soldier: Soldier) {
    return this.team !== soldier.team;
  }

  public move(maze: string[][], soldiers: Soldier[]) {
    const enemies = this._getEnemies(soldiers);

    if (!enemies.length) {
      return false;
    }

    if (this._getAdjacentSoldiers(enemies).length) {
      return true;
    }

    const { x, y } = this._findNextCell(maze, soldiers);

    if (x === this.x && y === this.y) {
      return false;
    }
    this.x = x;
    this.y = y;
    return true;
  }

  public attack(soldiers: Soldier[]) {
    const targets = this._getAdjacentSoldiers(this._getEnemies(soldiers))
      .sort(Soldier.readingSort)
      .sort((sa, sb) => sa.hp >= sb.hp ? 1 : -1);

    const [target] = targets;
    if (target) {
      target.hp -= 3;
    }
  }

  private _getAdjacentSoldiers(soldiers: Soldier[]) {
    return soldiers
      .filter(Soldier.adjacentFilter(this.x, this.y));
  }

  private _getEnemies(soldiers: Soldier[]) {
    return soldiers
      .filter((s) => this.isEnemy(s))
      .filter((e) => !e.isDead);
  }

  private _findNextCell(maze: string[][], soldiers: Soldier[]) {
    const sx = this.x;
    const sy = this.y;
    const team = this.team;
    const mazeHeight = maze.length;
    const mazeWidth = Math.max(...maze.map((r) => r.length));
    const distanceMap = new Array(mazeHeight)
      .fill(null)
      .map(() => new Array(mazeWidth).fill(-1));
    distanceMap[sy][sx] = 0;
    const queue: Cell[] = [];
    let from = 0;
    let to = 1;
    let bestEnemy: Soldier | undefined;
    let bestOrigin: number | undefined;
    let nearest = mazeHeight * mazeWidth;
    queue[from] = { x: sx, y: sy, distance: 0 };
    while (from < to) {
      const { x, y, distance, origin } = queue[from++];
      if (distance > nearest) {
        break;
      }
      dx.forEach((_, i) => {
        const [x1, y1] = [x + dx[i], y + dy[i]];
        const soldier = soldiers.find((s) => s.x === x1 && s.y === y1);
        if (maze[y1][x1] === '.' && !soldier && distanceMap[y1][x1] === -1) {
          distanceMap[y1][x1] = distance + 1;
          queue[to++] = {
            distance: distance + 1,
            origin: distance === 0 ? i : origin,
            x: x1,
            y: y1,
          };
        } else if (soldier && soldier.team !== team) {
          if (!bestEnemy || soldier.y < bestEnemy.y || (soldier.y === bestEnemy.y && soldier.x < bestEnemy.x)) {
            bestEnemy = soldier;
            bestOrigin = origin;
            nearest = distance;
          }
        }
      });
    }

    if (bestEnemy && typeof bestOrigin === 'number') {
      return {
        x: sx + dx[bestOrigin],
        y: sy + dy[bestOrigin],
      };
    }
    return {
      x: sx,
      y: sy,
    };
  }
}

function inputToBattle(input: string[]) {
  const maze: string[][] = [];
  const soldiers: Soldier[] = [];

  input
    .forEach((line, y) => {
      const mazeLine: string[] = [];
      const xlen = line.length;
      let x: number;
      for (x = 0; x < xlen; x++) {
        const cell = line[x];
        switch (cell) {
          case 'E':
          case 'G':
            soldiers.push(new Soldier(cell, x, y));
            mazeLine.push('.');
            break;
          default:
            mazeLine.push(cell);
        }
      }
      maze.push(mazeLine);
    });

  return {
    maze,
    soldiers,
  };
}

// function printMaze(maze: string[][], soldiers: Soldier[]) {
//   console.log(maze
//     .map((l, y) => l.map((c, x) => {
//       const soldier = soldiers.find((s) => s.x === x && s.y === y);
//       if (soldier) {
//         return soldier.team;
//       }
//       return c;
//     }).join('')).join('\n'));
// }

export default (input: string[]) => {
  const { maze, soldiers } = inputToBattle(input);

  let round = 0;
  let combatEnded = false;
  while (!combatEnded) {
    soldiers
      .sort(Soldier.readingSort)
      .forEach((s) => {
        if (s.isDead) {
          return;
        }

        combatEnded = combatEnded || !soldiers.find((enemy) => enemy.team !== s.team && !enemy.isDead);

        if (combatEnded) {
          return;
        }

        const hasToAttack = s.move(maze, soldiers);
        if (hasToAttack) {
          s.attack(soldiers);
        }
      });

    if (!combatEnded) {
      round++;
    }

    let deadIndex = soldiers.findIndex((s) => s.isDead);
    while (deadIndex >= 0) {
      soldiers.splice(deadIndex, 1);
      deadIndex = soldiers.findIndex((s) => s.isDead);
    }

  }

  return round * soldiers.reduce((p, n) => p + n.hp, 0);
};
