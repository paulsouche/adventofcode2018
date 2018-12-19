from collections import deque

OPS = -1+0j, 0-1j, 0+1j, +1+0j

def cct(complex):
    return tuple(map(int,[complex.real, complex.imag]))

def setup(input, elf_attack_power):
    players = []
    open_spaces = set()
    attack_power = {'E': elf_attack_power, 'G': 3}
    for i, line in enumerate(input):
        for j,c in enumerate(line):
            if c == '.':
                open_spaces.add(complex(i,j))
            elif c in 'EG':
                unit = Unit(complex(i,j), c, attack_power[c])
                players.append(unit)
    return players, open_spaces

class Unit:
    def __init__(self, position, band, attack_power):
        self.hp = 200
        self.position = position
        self.band = band
        self.attack_power = attack_power

    def __lt__(self, other):
        return cct(self.position) < cct(other.position)

    def turn(self):
        move = self.find_move()
        if move is not None:
            open_spaces.add(self.position)
            open_spaces.remove(move)
            self.position = move

        enemy = self.check_range()
        if enemy is not None:
            enemy.hp -= self.attack_power
            if not enemy:
                players.remove(enemy)
                open_spaces.add(enemy.position)

    def check_range(self):
        inrange = []
        for op in OPS:
            adjacent = self.position + op
            for player in players:
                if player.band == self.band:
                    continue
                if adjacent == player.position:
                    inrange.append(player)
        if inrange:
            inrange.sort(key=lambda u: u.hp)
            return inrange[0]

    def find_move(self):
        positions = []
        for enemy in (p for p in players if p.band != self.band):
            for op in OPS:
                c = enemy.position + op
                if c in open_spaces:
                    positions.append(c)
                elif c == self.position:
                    return

        if not positions:
            return
        paths = [p for p in (self.find_shortest_path(position) for position in positions) if p is not None]
        if not paths:
            return
        paths.sort(key= lambda p: (len(p), *cct(p[-1])))
        return paths[0][1]

    def find_shortest_path(self,b):
        paths = deque([[self.position]])
        visited = set([self.position])
        while paths:
            path = paths.pop()
            origin = path[-1]
            for op in OPS:
                new_path = path[:]
                new_pos = origin + op
                if new_pos not in open_spaces or new_pos in visited:
                    continue
                new_path.append(new_pos)
                if new_pos == b:
                    return new_path
                visited.add(new_pos)
                paths.appendleft(new_path)

    def __bool__(self):
        return self.hp>0


if __name__ == "__main__":
    file = 'input.txt'
    inp = open(file).read().splitlines()


    attack_power = 4
    players, open_spaces = setup(inp, attack_power)
    nelves = len([p for p in players if p.band == 'E'])

    while True:

        rounds = 0
        while True:
            for player in players[:]:
                if not player:
                    continue
                player.turn()
            if all(p.band == players[0].band for p in players):
                break
            rounds+=1
            players.sort()

        remain_elves = len([p for p in players if p.band == 'E'])
        print(f'Attack power: {attack_power}')
        print(remain_elves)

        if remain_elves == nelves:
            print(rounds * sum(p.hp for p in players))
            break
        attack_power += 1
        players, open_spaces = setup(inp, attack_power)