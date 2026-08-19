create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  delivery_fee numeric(10,2) not null check (delivery_fee >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;

create policy "Anyone can view active delivery zones"
  on public.delivery_zones for select
  using (is_active = true or public.is_staff(auth.uid()));

create policy "Staff can manage delivery zones"
  on public.delivery_zones for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create or replace function public.set_delivery_zone_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists delivery_zones_updated_at on public.delivery_zones;
create trigger delivery_zones_updated_at
before update on public.delivery_zones
for each row execute function public.set_delivery_zone_updated_at();
