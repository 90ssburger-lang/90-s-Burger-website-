create or replace function public.is_kitchen(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=_user_id and role='kitchen');
$$;

create policy "Kitchen can view orders" on public.orders
  for select to authenticated using (public.is_kitchen(auth.uid()));

create policy "Kitchen can view order items" on public.order_items
  for select to authenticated using (public.is_kitchen(auth.uid()));

create or replace function public.kitchen_update_order_status(_order_id uuid, _status public.order_status)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not (public.is_kitchen(auth.uid()) or public.is_staff(auth.uid())) then
    raise exception 'Not authorized';
  end if;
  if _status not in ('pending','processing','shipped','delivered') then
    raise exception 'Invalid kitchen status';
  end if;
  update public.orders set status=_status, updated_at=now() where id=_order_id;
end;
$$;

grant execute on function public.kitchen_update_order_status(uuid, public.order_status) to authenticated;
