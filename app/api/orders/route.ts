import { NextResponse } from "next/server";
import { db } from "../../lib/db";

// 주문 조회: /api/orders?customer=김민지
export async function GET(request: Request) {
  const customer = new URL(request.url).searchParams.get("customer") ?? "";
  const rows = await db.query(`SELECT * FROM orders WHERE customer = '${customer}'`);
  return NextResponse.json(rows);
}

// 주문 접수
export async function POST(request: Request) {
  const body = await request.json();
  const order = await db.orders.create({ data: { customer: body.customer, item: body.item, total: body.total } });
  return NextResponse.json(order, { status: 201 });
}
