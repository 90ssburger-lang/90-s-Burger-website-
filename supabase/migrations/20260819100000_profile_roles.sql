alter table public.profiles add column if not exists role public.app_role not null default 'customer';

update public.profiles p set role = coalesce((select case when bool_or(ur.role='admin') then 'admin'::public.app_role when bool_or(ur.role='manager') then 'manager'::public.app_role else 'customer'::public.app_role end from public.user_roles ur where ur.user_id=p.id),'customer'::public.app_role);

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=_user_id and role=_role) $$;
create or replace function public.is_staff(_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=_user_id and role in ('admin','manager')) $$;

-- Customers can edit their details, but cannot promote themselves.
revoke update on public.profiles from authenticated;
grant update (email, full_name, avatar_url, updated_at) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Admins can update profile roles" on public.profiles;
create policy "Admins can update profile roles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email,full_name,role) values(new.id,new.email,new.raw_user_meta_data->>'full_name','customer') on conflict(id) do nothing; return new; end; $$;
