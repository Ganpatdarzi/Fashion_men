const test = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");

let server;
let base;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("GET / returns API message", async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.message, "Men's Fashion E-Commerce API");
});

test("GET /api/categories returns an array", async () => {
  const res = await fetch(`${base}/api/categories`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
});

test("GET /api/products returns paginated products", async () => {
  const res = await fetch(`${base}/api/products`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.products));
  assert.ok(typeof body.total === "number");
});

test("GET /api/products/999999 returns 404", async () => {
  const res = await fetch(`${base}/api/products/999999`);
  assert.strictEqual(res.status, 404);
});

test("unauthenticated /api/cart returns 401", async () => {
  const res = await fetch(`${base}/api/cart`);
  assert.strictEqual(res.status, 401);
});

test("login rejects wrong password", async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@fashion.com", password: "wrong-password" }),
  });
  assert.strictEqual(res.status, 401);
});

test("login accepts seeded admin credentials", async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@fashion.com", password: "admin123" }),
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.strictEqual(body.user.role, "admin");
});

test("admin-only route blocks customer tokens", async () => {
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@fashion.com", password: "customer123" }),
  });
  const { token } = await login.json();
  const res = await fetch(`${base}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(res.status, 403);
});

test("/api/auth/register requires email and password", async () => {
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "No Password" }),
  });
  assert.strictEqual(res.status, 400);
});