export const units = (input: string) => {
  while (true) {
    let i;
    const ilen = input.length;

    for (i = 0; i < ilen; i++) {
      const monomer1 = input.charAt(i);
      const monomer2 = input.charAt(i + 1);
      if ((monomer1 !== monomer2) && (monomer1.toLowerCase() === monomer2.toLowerCase())) {
        input = input.slice(0, i) + input.slice(i + 2);
        break;
      }
    }

    if (ilen === input.length) {
      break;
    }
  }
  return input.length;
};

export const shortestsUnits = (input: string) => {
  const monomerMap: {
    [char: string]: RegExp;
  } = {};

  let polymer = input;
  while (polymer.length) {
    const char = polymer.charAt(0);
    const reg = new RegExp(char, 'ig');
    monomerMap[char] = reg;
    polymer = polymer.replace(reg, '');
  }

  let shortestUnit = Infinity;

  Object.values(monomerMap)
    .map((reg) => units(input.replace(reg, '')))
    .forEach((monomers) => {
      if (monomers < shortestUnit) {
        shortestUnit = monomers;
      }
    });

  return shortestUnit;
};
