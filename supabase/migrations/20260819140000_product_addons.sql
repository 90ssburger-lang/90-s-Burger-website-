create table if not exists public.product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_addons enable row level security;
create policy "Anyone can view enabled product addons" on public.product_addons for select using (is_enabled = true or public.is_staff(auth.uid()));
create policy "Staff can manage product addons" on public.product_addons for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger update_product_addons_updated_at before update on public.product_addons for each row execute function public.handle_updated_at();

alter table public.order_items add column if not exists selections jsonb not null default '{}'::jsonb;
