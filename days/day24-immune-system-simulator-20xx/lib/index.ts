export interface Input {
  [team: string]: string[];
}

// tslint:disable-next-line:max-line-length
const unitReg = /^(\d+)[a-z\s]+(\d+)[a-z\s\s]+(?:\s)?(\((immune|weak)\sto\s([a-z\s,\s]+)?(?:;\s)?((immune|weak)\sto\s([a-z\s,\s]+))?\))?[a-z\s\s]+(\d+)\s(\w+)[a-z\s\s]+(\d+)$/;

class Group {
  public static effectivePowerSort(groupA: Group, groupB: Group) {
    return groupA.effectivePower >= groupB.effectivePower
      ? groupA.effectivePower === groupB.effectivePower
        ? groupA.initiative > groupB.initiative
          ? -1
          : 1
        : -1
      : 1;
  }

  public static initiativeSort(groupA: Group, groupB: Group) {
    return groupA.initiative > groupB.initiative
      ? -1
      : 1;
  }

  public selectedTarget: Group | undefined;

  constructor(
    public team: string,
    public index: number,
    public units: number,
    public hitPoints: number,
    public attackDamage: number,
    public attackType: string,
    public initiative: number,
    public weaknesses: string[],
    public immunities: string[],
  ) { }

  get effectivePower() {
    return this.units * this.attackDamage;
  }

  get life() {
    return this.units * this.hitPoints;
  }

  get isDead() {
    return this.units <= 0;
  }

  public selectTarget(groups: Group[]) {
    // console.log(`${this.team}.${this.index},UNITS: ${this.units}`);
    this.selectedTarget = groups
      .filter((g) => g.team !== this.team && !g.isDead && !groups
        .some(({ selectedTarget: prevTarget }) => prevTarget === g))
      .sort((enemyA, enemyB) => {
        const damageToA = this._getDamageToTarget(enemyA);
        const damageToB = this._getDamageToTarget(enemyB);

        if (damageToA > damageToB) {
          return 1;
        }

        if (damageToA < damageToB) {
          return -1;
        }

        const effectivePowerA = enemyA.effectivePower;
        const effectivePowerB = enemyB.effectivePower;
        if (effectivePowerA > effectivePowerB) {
          return 1;
        }

        if (effectivePowerA < effectivePowerB) {
          return -1;
        }

        return enemyA.initiative > enemyB.initiative
          ? 1
          : -1;
      })
      .pop();
  }

  public attack() {
    const selectedTarget = this.selectedTarget;
    if (this.isDead || !selectedTarget) {
      return;
    }

    const damage = this._getDamageToTarget(selectedTarget);

//     console.log(
//       `${this.team}.${this.index}
// ATTACKS TARGET ${selectedTarget.team}.${selectedTarget.index}
// LIFE           ${selectedTarget.life}
// DAMAGE         ${damage}
// UNITS BEFORE   ${selectedTarget.units}
// UNITS AFTER    ${Math.max(0, Math.ceil((selectedTarget.life - damage) / selectedTarget.hitPoints))}
// UNITS LOST     ${selectedTarget.units - Math.max(0, Math
//         .ceil((selectedTarget.life - damage) / selectedTarget.hitPoints))}`,
//     );

    selectedTarget.units = Math.max(0, Math.ceil((selectedTarget.life - damage) / selectedTarget.hitPoints));
    delete this.selectedTarget;
  }

  private _getDamageToTarget({ immunities, weaknesses }: Group) {
    const attackType = this.attackType;
    if (immunities.includes(attackType)) {
      return 0;
    }

    const damage = this.effectivePower;
    if (weaknesses.includes(attackType)) {
      return damage * 2;
    }
    return damage;
  }
}

const strToGroup = (team: string) => (str: string, index: number) => {
  const match = unitReg.exec(str);
  if (!match) {
    throw new Error(`Invalid input ${str}`);
  }

  const weaknesses: string[] = [];
  const immunities: string[] = [];
  [4, 7].forEach((i) => {
    if (match[i] === 'weak') {
      weaknesses.push(...match[i + 1].split(', '));
    }

    if (match[i] === 'immune') {
      immunities.push(...match[i + 1].split(', '));
    }
  });

  return new Group(team, index + 1, +match[1], +match[2], +match[9], match[10], +match[11], weaknesses, immunities);
};

export default (input: Input) => {
  const groups = Object
    .keys(input)
    .reduce((units: Group[], team) => units
      .concat(input[team]
        .map(strToGroup(team))), []);

  let round = 0;
  while (true && round < Infinity) {
    round++;
    // console.log('');
    // console.log('ROUND', round);
    // console.log('');
    groups
      .sort(Group.effectivePowerSort)
      .forEach((g) => g.selectTarget(groups));

    groups
      .sort(Group.initiativeSort)
      .forEach((g) => g.attack());

    const teamsLeft = groups
      .reduce((t: string[], { isDead, team }) => {
        if (!isDead && !t.includes(team)) {
          t.push(team);
        }
        return t;
      }, []);

    if (teamsLeft.length <= 1) {
      break;
    }
  }

  return groups
    .filter((g) => !g.isDead)
    .reduce((units, g) => units + g.units, 0);
};
