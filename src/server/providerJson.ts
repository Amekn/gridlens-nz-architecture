const encoder = new TextEncoder();

export class StrictJsonError extends Error {}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function parseStrictJson(source: string): unknown {
  let cursor = 0;

  const fail = (): never => {
    throw new StrictJsonError("Invalid JSON");
  };
  const whitespace = () => {
    while (/[\t\n\r ]/.test(source[cursor] ?? "")) cursor += 1;
  };
  const string = (): string => {
    if (source[cursor] !== '"') fail();
    const start = cursor;
    cursor += 1;
    let escaped = false;
    while (cursor < source.length) {
      const character = source[cursor];
      if (!escaped && character === '"') {
        cursor += 1;
        let decoded: unknown;
        try {
          decoded = JSON.parse(source.slice(start, cursor));
        } catch {
          fail();
        }
        if (typeof decoded !== "string") fail();
        const decodedString = decoded as string;
        if (hasUnpairedSurrogate(decodedString)) fail();
        return decodedString;
      }
      if (!escaped && character.charCodeAt(0) < 0x20) fail();
      if (!escaped && character === "\\") escaped = true;
      else escaped = false;
      cursor += 1;
    }
    return fail();
  };
  const value = (): unknown => {
    whitespace();
    const character = source[cursor];
    if (character === '"') return string();
    if (character === "{") {
      cursor += 1;
      whitespace();
      const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
      const keys = new Set<string>();
      if (source[cursor] === "}") {
        cursor += 1;
        return result;
      }
      while (cursor < source.length) {
        whitespace();
        const key = string();
        if (keys.has(key) || key === "__proto__" || key === "prototype" || key === "constructor") fail();
        keys.add(key);
        whitespace();
        if (source[cursor] !== ":") fail();
        cursor += 1;
        result[key] = value();
        whitespace();
        if (source[cursor] === "}") {
          cursor += 1;
          return result;
        }
        if (source[cursor] !== ",") fail();
        cursor += 1;
      }
      return fail();
    }
    if (character === "[") {
      cursor += 1;
      whitespace();
      const result: unknown[] = [];
      if (source[cursor] === "]") {
        cursor += 1;
        return result;
      }
      while (cursor < source.length) {
        result.push(value());
        whitespace();
        if (source[cursor] === "]") {
          cursor += 1;
          return result;
        }
        if (source[cursor] !== ",") fail();
        cursor += 1;
      }
      return fail();
    }
    for (const [token, parsed] of [["true", true], ["false", false], ["null", null]] as const) {
      if (source.startsWith(token, cursor)) {
        cursor += token.length;
        return parsed;
      }
    }
    const match = source.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) return fail();
    cursor += match[0].length;
    const number = Number(match[0]);
    if (!Number.isFinite(number) || Object.is(number, -0)) fail();
    return number;
  };

  const parsed = value();
  whitespace();
  if (cursor !== source.length) fail();
  return parsed;
}

export async function readBoundedJson(request: Request, limit: number): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > limit)) {
    throw new RangeError("Payload too large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new StrictJsonError("Missing request body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new RangeError("Payload too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new StrictJsonError("Invalid UTF-8");
  }
  return parseStrictJson(text);
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function canonicalJson(value: unknown): string {
  return canonicalize(value);
}

export function utf8Length(value: string): number {
  return encoder.encode(value).byteLength;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
