alter table public.profiles
  add column if not exists delivery_address text;

grant update (delivery_address) on public.profiles to authenticated;

