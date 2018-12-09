const partyReg = /^(\d+)\splayers;\slast\smarble\sis\sworth\s(\d+)\spoints$/;

interface Marble {
  next: Marble;
  prev: Marble;
  value: number;
}

function strToParty(input: string, coeff: number) {
  const match = partyReg.exec(input);

  if (!match) {
    throw new Error(`Invalid party ${input}`);
  }

  return {
    marbles: +match[2] * coeff,
    players: +match[1],
  };
}

const addAfter = (value: number, marble: Marble) => {
  const toAdd = {
    next: marble.next,
    prev: marble,
    value,
  };
  marble.next.prev = toAdd;
  marble.next = toAdd;
  return toAdd;
};

export default (input: string, coeff = 1) => {
  const { marbles, players } = strToParty(input, coeff);
  const scores = new Array(players).fill(0);

  let current: Marble = {
    value: 0,
  } as any;

  current.next = current;
  current.prev = current;

  let marble: number;
  let player = 0;
  for (marble = 1; marble <= marbles; marble++) {
    if (marble % 23 === 0) {
      scores[player] += marble;
      current = current.prev.prev.prev.prev.prev.prev;
      scores[player] += current.prev.value;
      current.prev.prev.next = current;
      current.prev = current.prev.prev;
    } else {
      current = addAfter(marble, current.next);
    }

    player = ++player % players;
  }

  return Math.max(...scores);
};
