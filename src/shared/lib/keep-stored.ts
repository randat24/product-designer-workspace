import type { z } from "zod";

/**
 * Autosave sends the whole record, and a `validation` failure is never retried. So when a field's rule gets stricter
 * (links had to become http(s)), a value stored under the old rule would block every later save of the record. This
 * parses the record and, when `field` is the only problem and its value is still the stored one (spaces aside),
 * parses the rest without it: the other fields are saved and the old value is left alone. A newly typed bad value is
 * still rejected. `readStored` is called only in that case.
 */
export async function parseKeepingStored<S extends z.ZodObject>(
  schema: S,
  input: unknown,
  field: string,
  readStored: () => Promise<unknown>,
): Promise<z.ZodSafeParseResult<Partial<z.output<S>>>> {
  const parsed = schema.safeParse(input);
  if (parsed.success || !parsed.error.issues.every((i) => i.path[0] === field)) return parsed;
  const typed = (input as Record<string, unknown> | null)?.[field];
  const stored = await readStored();
  if (typeof typed !== "string" || typeof stored !== "string" || !stored.trim() || typed.trim() !== stored.trim()) return parsed;
  // The same object without that field: its output is the record's output minus one key, a Partial of it.
  const rest = schema.omit({ [field]: true } as never) as unknown as S;
  return rest.safeParse(input);
}
