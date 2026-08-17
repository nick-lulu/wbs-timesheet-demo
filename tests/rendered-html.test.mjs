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
  assert.doesNotMatch(html, /Jacky — CCB demo account|Opens the CCB Project Dashboard/);
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
  assert.match(page, /CCB: \{ name: "Jacky Zhong"/);
  assert.doesNotMatch(page, /Jacky Chen/);
});

test("source implements the agreed Initiative, PgM and Manday changes", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Initiative Dashboard/);
  assert.match(page, /one Initiative can contain multiple CSCOP projects/);
  assert.match(page, /Create CSCOP Project Master/);
  assert.match(page, /CCB owns the Project master and Vendor List/);
  assert.match(page, /Assigned PM · PgM editable/);
  assert.match(page, /4 · Start Date/);
  assert.match(page, /5 · Due Date/);
  assert.match(page, /step="0\.01"/);
  assert.match(page, /const md = \(value: number\)/);
  assert.match(page, /Section 1 · PgM Project Information/);
  assert.match(page, /This information is synchronized from the PgM workspace/);
  assert.match(page, /item\.code === project\.code \? updated : item/);
  assert.match(page, /brdSignoffDate: gw1, techReleaseDate: gw4/);
  assert.match(page, /No workflow status restriction/);
  assert.doesNotMatch(page, /planningEnabled|PgM readiness controls editing|Allocation locked/);
  assert.doesNotMatch(page, /PgM Mandatory Metadata/);
  assert.doesNotMatch(page, />Quarter</);
  assert.doesNotMatch(page, /Original Initiative/);
});
