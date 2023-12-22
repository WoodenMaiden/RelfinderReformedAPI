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
