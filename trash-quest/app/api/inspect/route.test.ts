import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { POST } from "./route.ts";
import { MAX_IMAGE_BYTES } from "../../../lib/detections.ts";

const detection = { name: "紙", level: "lv1", box_2d: [10, 20, 300, 400] };
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function upload(bytes = png, type = "image/png") {
  const form = new FormData();
  form.append("image", new File([bytes], "room", { type }));
  return new Request("http://localhost/api/inspect", { method: "POST", body: form });
}

function gemini(text = JSON.stringify([detection]), finishReason = "STOP") {
  return { candidates: [{ finishReason, content: { parts: [{ text }] } }] };
}

beforeEach(() => {
  // Dummy test values only. Never load .env files or call the real provider.
  process.env.GEMINI_API_KEY = "test-only-key";
  delete process.env.GEMINI_MODEL;
});
afterEach(() => mock.restoreAll());

test("uploads actual bytes using a server header and the default model", async () => {
  const fetch = mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-only-key");
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.contents[0].parts[0].inlineData, { mimeType: "image/png", data: png.toString("base64") });
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    assert.deepEqual(body.generationConfig.responseSchema.items.required, ["name", "box_2d", "level"]);
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json(gemini());
  });
  const response = await POST(upload());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { detections: [detection] });
  assert.equal(fetch.mock.callCount(), 1);
});

test("GEMINI_MODEL overrides the default and accepts a real empty result", async () => {
  process.env.GEMINI_MODEL = "gemini-test-model";
  mock.method(globalThis, "fetch", async (url: RequestInfo | URL) => {
    assert.ok(String(url).includes("/gemini-test-model:generateContent"));
    return Response.json(gemini("[]"));
  });
  assert.deepEqual(await (await POST(upload())).json(), { detections: [] });
});

test("joins response text parts and skips thought content", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ candidates: [{ finishReason: "STOP", content: {
    parts: [{ thought: true, text: "private reasoning" }, { text: "[" }, { text: JSON.stringify(detection) + "]" }],
  } }] }));
  assert.deepEqual(await (await POST(upload())).json(), { detections: [detection] });
});

for (const status of [400, 401, 403, 404, 429, 500, 503]) {
  test(`provider ${status} yields a safe error without automatic retries`, async () => {
    const fetch = mock.method(globalThis, "fetch", async () => new Response("test-only-key provider details", { status }));
    const response = await POST(upload());
    assert.equal(response.status, status === 429 ? 429 : 502);
    const body = await response.text();
    assert.ok(!body.includes("test-only-key"));
    assert.ok(!body.includes("provider details"));
    assert.equal(fetch.mock.callCount(), 1);
  });
}

test("timeout and network failures do not expose thrown error details", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => { throw new DOMException("test-only-key", "TimeoutError"); });
  const timeout = await POST(upload());
  assert.equal(timeout.status, 504);
  assert.ok(!(await timeout.text()).includes("test-only-key"));
  fetch.mock.mockImplementation(async () => { throw new Error("test-only-key"); });
  assert.equal((await POST(upload())).status, 502);
});

for (const [label, value] of Object.entries({
  invalidJSON: gemini("not JSON"), invalidShape: gemini("{}"),
  invalidCoordinates: gemini(JSON.stringify([{ ...detection, box_2d: [0, 0, -1, 1] }])),
  invalidLevel: gemini(JSON.stringify([{ ...detection, level: "lv99" }])),
  truncated: gemini("[]", "MAX_TOKENS"), blocked: { promptFeedback: { blockReason: "SAFETY" } },
  missing: {}, noText: { candidates: [{ finishReason: "STOP", content: { parts: [] } }] },
})) {
  test(`rejects ${label} from Gemini`, async () => {
    mock.method(globalThis, "fetch", async () => Response.json(value));
    const response = await POST(upload());
    assert.equal(response.status, 502);
    assert.ok(!("detections" in await response.json()));
  });
}

test("rejects missing key and invalid model without calling Gemini", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected call"); });
  delete process.env.GEMINI_API_KEY;
  assert.equal((await POST(upload())).status, 503);
  process.env.GEMINI_API_KEY = "test-only-key";
  process.env.GEMINI_MODEL = "../../invalid";
  assert.equal((await POST(upload())).status, 503);
  assert.equal(fetch.mock.callCount(), 0);
});

test("rejects malformed, missing, unsupported, disguised, and oversized images before calling Gemini", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected call"); });
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "{}" }))).status, 400);
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "bad multipart", headers: {
    "content-type": "multipart/form-data; boundary=missing",
  } }))).status, 400);
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: new FormData() }))).status, 400);
  assert.equal((await POST(upload(Buffer.alloc(0)))).status, 400);
  assert.equal((await POST(upload(png, "text/plain"))).status, 415);
  assert.equal((await POST(upload(Buffer.from("not a png")))).status, 415);
  assert.equal((await POST(upload(Buffer.alloc(MAX_IMAGE_BYTES + 1)))).status, 413);
  // No Content-Length: the streaming byte limit must still apply.
  assert.equal((await POST(upload(Buffer.alloc(MAX_IMAGE_BYTES + 128 * 1024)))).status, 413);
  const claimedLarge = upload();
  claimedLarge.headers.set("content-length", "5000000");
  assert.equal((await POST(claimedLarge)).status, 413);
  assert.equal(fetch.mock.callCount(), 0);
});
