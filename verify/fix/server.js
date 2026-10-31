// cafe-order-demo 주문 서버 — 기준 수정본 (verify/fix). 취약한 부분만 고치고 동작은 그대로 둡니다
"use strict";

const { execFile } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");

// 서명 키는 환경 변수에서. 없으면 실행할 때마다 임의 키 (코드에 고정하지 않음)
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString("hex");
// 허용할 출처만 (쿠키를 쓰므로 * 를 쓰지 않음)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3000").split(",");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function makeDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, item TEXT, total INTEGER)`);
  sqlite.exec(`CREATE TABLE menu (id INTEGER PRIMARY KEY, category TEXT, name TEXT, price INTEGER)`);
  const orders = [
    [1, "김민지", "아메리카노", 4500],
    [2, "이수호", "카페라떼", 5000],
    [3, "박지우", "콜드브루", 5500],
  ];
  for (const o of orders) sqlite.prepare("INSERT INTO orders VALUES (?, ?, ?, ?)").run(...o);
  sqlite.prepare("INSERT INTO menu VALUES (?, ?, ?, ?)").run(1, "coffee", "아메리카노", 4500);
  sqlite.prepare("INSERT INTO menu VALUES (?, ?, ?, ?)").run(2, "tea", "얼그레이", 5000);
  return {
    query(sql, ...params) {
      return sqlite.prepare(sql).all(...params);
    },
  };
}

function createApp() {
  const app = express();
  const db = makeDb();
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

  app.get("/", (_req, res) => {
    res.type("text/plain").send("cafe-order-demo: /api/orders?orderId=1, /search?q=커피, /token?user=minji");
  });

  // 주문 조회
  app.get("/api/orders", (req, res) => {
    const orderId = req.query.orderId;
    try {
      const rows = db.query("SELECT * FROM orders WHERE id = ?", orderId);
      res.json(rows);
    } catch (e) {
      res.status(400).json({ error: "잘못된 주문 번호" });
    }
  });

  // 같은 기능을 안전하게 만든 경로 (걸리면 안 됨)
  app.get("/api/orders/safe", (req, res) => {
    res.json(db.query("SELECT * FROM orders WHERE id = ?", Number(req.query.orderId)));
  });

  // 메뉴 조회: 경고를 주석으로 숨김 (실제로는 그대로 취약)
  app.get("/api/menu", (req, res) => {
    const category = req.query.category || "coffee";
    res.json(db.query("SELECT * FROM menu WHERE category = ?", category));
  });

  // 메뉴 검색
  app.get("/search", (req, res) => {
    const q = escapeHtml(req.query.q || "");
    res.type("html").send(`<!doctype html><h1>"${q}" 검색 결과</h1><p>찾는 메뉴가 없습니다.</p>`);
  });

  // 매장 프린터 연결 확인 (관리자용)
  app.get("/api/printer/ping", (req, res) => {
    const host = String(req.query.host || "");
    if (!/^[A-Za-z0-9.-]{1,253}$/.test(host)) return res.status(400).type("text/plain").send("잘못된 주소");
    execFile("ping", ["-c", "1", host], (err, stdout) => {
      res.type("text/plain").send(err ? "연결 실패" : stdout);
    });
  });

  // 단골 토큰 발급
  app.get("/token", (req, res) => {
    const token = jwt.sign({ user: req.query.user || "guest" }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3100;
  createApp().listen(port, "127.0.0.1", () => {
    console.log(`cafe-order-demo on http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
