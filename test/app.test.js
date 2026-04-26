import assert from "node:assert/strict";
import test from "node:test";
import { login, renderProfile } from "../src/app.js";

test("login accepts the demo admin credentials", () => {
  const result = login("admin", "admin123");
  assert.equal(result.ok, true);
  assert.match(result.token, /^session-/);
});

test("profile renderer includes supplied user fields", () => {
  const html = renderProfile({ name: "Ada", bio: "Compiler engineer" });
  assert.equal(html, "<main><h1>Ada</h1><p>Compiler engineer</p></main>");
});
