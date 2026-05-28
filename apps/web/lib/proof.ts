import { keccak256, stringToHex } from "viem";

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashCanonical(value: unknown) {
  return keccak256(stringToHex(stableJson(value)));
}

export function idHash(value: string) {
  return keccak256(stringToHex(value));
}

export function gradeCode(grade: string) {
  return ({ AAA: 1, AA: 2, A: 3, BBB: 4, BB: 5, B: 6, C: 7 } as Record<string, number>)[grade] ?? 7;
}

export function verdictCode(verdict: string) {
  return ({ ELIGIBLE: 1, RESTRICTED: 2, DENIED: 3, NOT_CHECKED: 4 } as Record<string, number>)[verdict] ?? 4;
}
