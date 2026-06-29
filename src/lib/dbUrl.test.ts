import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDatabaseUrl } from "./dbUrl";

test("normalizes database URLs with special characters in the password", () => {
  const input = "postgresql://postgres:rohit123!@#R@db.tieghsviwujefpdihzgt.supabase.co:5432/postgres";
  const output = normalizeDatabaseUrl(input);
  const parsed = new URL(output);

  assert.equal(parsed.username, "postgres");
  assert.equal(decodeURIComponent(parsed.password), "rohit123!@#R");
  assert.match(output, /%40/);
  assert.match(output, /%23/);
});

test("preserves already encoded credentials", () => {
  const input = "postgresql://user:pa%40ss%23word@host:5432/db";
  assert.equal(normalizeDatabaseUrl(input), input);
});
