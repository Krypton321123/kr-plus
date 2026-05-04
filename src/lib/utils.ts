import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * generateNextCode
 *
 * Looks at the latest code in a given table + field, parses the numeric
 * suffix, increments it, and returns the next padded code.
 *
 * Example:
 *   latest = "CTYA00003"  →  next = "CTYA00004"
 *   no rows yet           →  next = "CTYA00001"
 *
 * @param db        - Prisma client instance (typed as any so it works for both common/mopl)
 * @param table     - The Prisma model key, e.g. "mstCity"
 * @param codeField - The field that holds the code, e.g. "ctycd"
 * @param prefix    - The prefix string, e.g. "CTYA"
 * @param padLength - How many digits to pad the number to (default 5)
 */
export async function generateNextCode(
  db: any,
  table: string,
  codeField: string,
  prefix: string,
  padLength = 5
): Promise<string> {
  // Fetch the row with the highest code that starts with our prefix
  const latest = await db[table].findFirst({
    where: {
      [codeField]: {
        startsWith: prefix,
      },
    },
    orderBy: {
      [codeField]: "desc",
    },
    select: {
      [codeField]: true,
    },
  });
 
  if (!latest) {
    // No rows yet — start at 1
    return `${prefix}${"1".padStart(padLength, "0")}`;
  }
 
  const currentCode: string = latest[codeField];
  const numericPart = currentCode.slice(prefix.length);
  const currentNum = parseInt(numericPart, 10);
 
  if (isNaN(currentNum)) {
    // Malformed existing code — safe fallback
    return `${prefix}${"1".padStart(padLength, "0")}`;
  }
 
  const nextNum = currentNum + 1;
  return `${prefix}${String(nextNum).padStart(padLength, "0")}`;
}