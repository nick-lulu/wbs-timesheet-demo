import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders Corporate Solution sign-in as the homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Corporate Solution Timesheet/);
  assert.match(html, />Corporate Solution Timesheet<\/h1>/);
  assert.doesNotMatch(html, /Sign in Corporate Solution Timesheet/);
  assert.match(html, /Username or email address/);
  assert.match(html, /Password/);
  assert.match(html, /jackyzhong@lululemon\.com/);
  assert.match(html, /Jacky — CCB demo account/);
  assert.doesNotMatch(html, /class="app-shell"/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("source defines role-specific access and personal time entry", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /"Vendor PM": \["dashboard", "allocation", "timesheet"\]/);
  assert.match(page, /PgM: \["dashboard", "timesheet", "audit"\]/);
  assert.match(page, /state\.projects\.filter\(canVendorSee\)/);
  assert.match(page, /Start Date/);
  assert.match(page, /Submit My Timesheet/);
  assert.match(page, /Section 2 · Vendor Submitted Mandays/);
  assert.match(page, /useState<View>\("dashboard"\)/);
});
