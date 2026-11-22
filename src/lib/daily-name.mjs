// One shared daily selection, changing at midnight in India (UTC+05:30).
const DAY_MS = 86_400_000;
const INDIA_OFFSET_MS = 19_800_000;
const orders = new Map();
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

export function indiaDay(date = Date.now()) {
  const time = Number(date);
  if (!Number.isFinite(time)) throw new RangeError('A valid date is required');
  return Math.floor((time + INDIA_OFFSET_MS) / DAY_MS);
}

export function millisecondsUntilIndiaMidnight(date = Date.now()) {
  return DAY_MS - mod(Number(date) + INDIA_OFFSET_MS, DAY_MS);
}

export function dailyNameIndex(count, date = Date.now()) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('At least one name is required');
  if (!orders.has(count)) {
    const order = Array.from({ length: count }, (_, i) => i);
    // A fixed seed makes the shuffled order identical on every device and build.
    let seed = 0x4c414c49;
    for (let i = count - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
      const j = seed % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    orders.set(count, order);
  }
  // Every name appears once in a full cycle, including across New Year's Day.
  return orders.get(count)[mod(indiaDay(date), count)];
}
