import { Hono } from "@hono/hono";

const app = new Hono();
const kv = await Deno.openKv();

app.get("/api/text", async (c) => {
  // get args
  const key = c.req.query("key");

  // validate args
  if (!key) {
    return c.json({ ok: false, err: "'key' is required." }, 400);
  }
  if (key.length > 128) {
    return c.json({ ok: false, err: "'key' is too long." }, 400);
  }

  // get the text by key
  const data = (await kv.get<string>(["key", key])).value || "";

  // response
  return c.json({ ok: true, data });
});

app.post("/api/text", async (c) => {
  // get args
  const key = c.req.query("key");
  const { data } = await c.req.json();

  // validate args
  if (!key) {
    return c.json({ ok: false, err: "'key' is required." }, 400);
  }
  if (key.length > 128) {
    return c.json({ ok: false, err: `"key" is too long.` }, 400);
  }
  if (typeof data !== "string") {
    return c.json({ ok: false, err: "'data' is not a string." }, 400);
  }
  if (data.length > 10_000) {
    return c.json({ ok: false, err: "'data' is too long." }, 400);
  }

  // set the text by key
  await kv.set(["key", key], data, {
    expireIn: 1000 * 60 * 60 * 24, // will expire in 24 hours
  });

  // response
  return c.json({ ok: true });
});

app.get("/:key?", async (c) => {
  return c.html(
    await Deno.readTextFile(new URL("./index.html", import.meta.url))
  );
});

Deno.serve(app.fetch);
