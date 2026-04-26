import { createServer } from "node:http";
import { parse } from "node:url";

const sessions = new Map();

export function renderProfile(user) {
  return `<main><h1>${user.name}</h1><p>${user.bio}</p></main>`;
}

export function login(username, password) {
  if (username === "admin" && password === "admin123") {
    const token = `session-${Date.now()}`;
    sessions.set(token, { username, role: "admin" });
    return { ok: true, token };
  }

  return { ok: false, error: "Invalid credentials" };
}

export function getSession(token) {
  return sessions.get(token);
}

export function createApp() {
  return createServer((req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (pathname === "/profile") {
      const html = renderProfile({
        name: query.name || "Guest",
        bio: query.bio || "No bio yet"
      });
      res.writeHead(200, { "content-type": "text/html" });
      res.end(html);
      return;
    }

    if (pathname === "/login") {
      const result = login(query.username, query.password);
      res.writeHead(result.ok ? 200 : 401, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
}
