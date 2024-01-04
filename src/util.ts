export async function measureQueryTime<T>(
  future: Promise<T>,
): Promise<{ time: number; result: T }> {
  const start = Date.now();
  const result = (await future) as T;
  return {
    time: Date.now() - start,
    result,
  };
}

export function range(n: number): number[] {
  return [...Array(n < 0 ? 0 : n).keys()];
}

export function cartesian(...allEntries: string[][]) {
  return allEntries.reduce<string[][]>(
    (results, entries) =>
      results
        .map((result) => entries.map((entry) => result.concat([entry])))
        .reduce((subResults, result) => subResults.concat(result), []),
    [[]],
  );
}
