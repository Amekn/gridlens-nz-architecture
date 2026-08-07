import assert from "node:assert/strict";
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

test("server-renders the GridLens NZ demo shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>GridLens NZ/);
  assert.match(html, /Candidate site atlas/);
  assert.match(html, /Set the infrastructure scenario/);
  assert.match(html, /<h1[^>]*tabindex=["']-1["'][^>]*>Set the infrastructure scenario<\/h1>/i);
  assert.match(html, /Accessible region list/);
  assert.match(html, /Meets scenario/);
  assert.match(html, /More evidence needed/);
  assert.match(html, /Does not meet scenario/);
  assert.match(html, /Selected region/);
  assert.match(html, /Evaluate[\s\S]{0,40}Southland/);
  assert.match(html, /Sources <span>6<\/span>/);
  assert.doesNotMatch(html, /Prepared demo evidence/);
  assert.doesNotMatch(html, /Selected candidate/);
  assert.doesNotMatch(html, /demonstration zone/i);
  assert.doesNotMatch(html, /role=["']tablist["']/i);
  assert.doesNotMatch(html, />\s*0[0-9]\s*[Â·\u00b7]/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("does not render checkbox or select geography controls", async () => {
  const html = await (await render()).text();
  assert.doesNotMatch(html, /type=["']checkbox["']/i);
  assert.doesNotMatch(html, /<select\b[^>]*(?:region|geograph)/i);
  assert.match(html, /<select\b[^>]*aria-label=["']Cooling method["']/i);
  assert.match(html, /Selectable map of New Zealand regions and candidate sites/);
});
