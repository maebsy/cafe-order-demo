'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 관리자 화면: 오늘 들어온 주문을 보고 취소할 수 있게 함
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // 공개용 anon 키. 권한은 RLS 정책으로 제한
);

type Order = { id: number; customer: string; item: string; total: number };

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => setOrders(data ?? []));
  }, []);

  async function cancel(id: number) {
    await supabase.from("orders").delete().eq("id", id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <main>
      <h1>오늘의 주문</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.customer} · {o.item} · {o.total.toLocaleString()}원
            <button onClick={() => cancel(o.id)}>취소</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
