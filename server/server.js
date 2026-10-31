// cafe-order-demo 주문 서버 (의도적으로 취약한 데모, 배포 금지)
"use strict";

const { exec } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");

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
  app.use(cors({ origin: "*", credentials: true }));

  app.get("/", (_req, res) => {
    res.type("text/plain").send("cafe-order-demo: /api/orders?orderId=1, /search?q=커피, /token?user=minji");
  });

  // 주문 조회
  app.get("/api/orders", (req, res) => {
    const orderId = req.query.orderId;
    try {
      const rows = db.query("SELECT * FROM orders WHERE id = " + orderId);
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
    res.json(db.query("SELECT * FROM menu WHERE category = '" + category + "'")); // nosemgrep
  });

  // 메뉴 검색
  app.get("/search", (req, res) => {
    const q = req.query.q || "";
    res.type("html").send(`<!doctype html><h1>"${q}" 검색 결과</h1><p>찾는 메뉴가 없습니다.</p>`);
  });

  // 매장 프린터 연결 확인 (관리자용)
  app.get("/api/printer/ping", (req, res) => {
    exec("ping -c 1 " + req.query.host, (err, stdout) => {
      res.type("text/plain").send(err ? "연결 실패" : stdout);
    });
  });

  // 단골 토큰 발급
  app.get("/token", (req, res) => {
    const token = jwt.sign({ user: req.query.user || "guest" }, "cafe-demo-signing-key", { expiresIn: "1h" });
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
