import colors from 'colors';
import input from './input.json';
import implem from './lib';

console.info(colors
  .yellow('Day 24 Immune system simulator 20XX part 1 result :'), colors
    .green(implem(input).toString()));
