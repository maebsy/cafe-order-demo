-- 주문·단골 테이블 (데모)
create table public.orders (
  id bigint generated always as identity primary key,
  customer text not null,
  item text not null,
  total integer not null,
  created_at timestamptz default now()
);

create table public.customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null unique
);
