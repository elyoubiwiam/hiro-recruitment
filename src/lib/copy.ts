/** Keep generated and saved workspace copy free of em dashes. */
export function normalizeCopy<T>(value: T): T {
  if (typeof value === "string") return value.replace(/\s*—\s*/g, ": ") as T;
  if (Array.isArray(value)) return value.map(normalizeCopy) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeCopy(item)])) as T;
  }
  return value;
}