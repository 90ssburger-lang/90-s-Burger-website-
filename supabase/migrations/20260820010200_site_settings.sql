create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "Public can view site settings" on public.site_settings for select using (true);
create policy "Staff can manage site settings" on public.site_settings for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
