'use client';

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");

  async function login() {
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ phone }) });
    const { token } = await res.json();
    localStorage.setItem("authToken", token);
    location.href = "/";
  }

  return (
    <main>
      <h1>단골 로그인</h1>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호" />
      <button onClick={login}>로그인</button>
    </main>
  );
}
