import { looselyOrdered, strictlyOrdered, type PhotoGroupingConfig, } from "./layout";
import { test, expect } from "vitest";

const groupingConfigs: PhotoGroupingConfig[] = [
  { '-': 1, '|': 1 },
  { '-': 1, '|': 2 },
  { '-': 2, '|': 1 },
  { '-': 2, '|': 3 },
  { '-': 3, '|': 4 },
  { '-': 4, '|': 5 },
  { '-': 5, '|': 7 },
]

const inputs = [
  '-',
  '|',
  '-|',
  '|--',
  '||-',
  '||||-',
  '-||',
  '--||',
  '---||',
  '---|||',
  '|||',
  '---',
  '---||',
  '-|-|-|',
  '|-|-|-',
  '|-|-|-',
]

const functionsToTest = {
  looselyOrdered,
  strictlyOrdered,
}

declare global {
  interface Array<T> {
    toSorted(): T[];
  }
}

Object.entries(functionsToTest).forEach(([name, fn]) => {
  groupingConfigs.forEach(config => {
    inputs.forEach(input => {
      const inputParsed = input.split('') as ('|' | '-')[];

      const output = fn(config, inputParsed, (x) => x);

      test(`${name} with ${JSON.stringify(config)}, when given: ${input}`, () => {
        // Output should not be empty
        expect(output.length).toBeGreaterThan(0);

        // Each group must not exceed the limit
        expect(output.every(g => g.items.length <= config[g.type])).toBe(true);

        // Total elements should be the same
        expect(output.flatMap(g => g.items).toSorted().join('')).toMatch(input.split('').toSorted().join(''));

        // Does not contain empty groups
        expect(output.every(g => g.items.length > 0)).toBe(true);
      });
    });

    // If given an empty list, it should return an empty list
    test(`${name} with ${JSON.stringify(config)}, when given empty list`, () => {
      const output = fn(config, [], (x) => x);
      expect(output.length).toBe(0);
    });
  });
})
