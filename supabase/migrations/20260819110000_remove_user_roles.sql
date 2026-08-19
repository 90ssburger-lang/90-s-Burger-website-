-- Final role architecture:
-- auth.users -> profiles (1:1), with the role stored only in profiles.role.

-- Ensure every existing Auth user has a profile before removing the old table.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  u.raw_user_meta_data->>'full_name',
  'customer'::public.app_role
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- The trigger creates exactly one profile for every future Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    'customer'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Remove the last policy that depended directly on user_roles.
drop policy if exists "Staff can manage product sizes" on public.product_sizes;
create policy "Staff can manage product sizes"
  on public.product_sizes for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Authorization helpers already read profiles.role. The legacy table is no longer needed.
drop table if exists public.user_roles cascade;
