alter table public.orders add column if not exists sent_to_kitchen_at timestamptz;
create index if not exists orders_sent_to_kitchen_idx on public.orders(sent_to_kitchen_at desc) where sent_to_kitchen_at is not null;

drop policy if exists "Kitchen can view orders" on public.orders;
create policy "Kitchen can view sent orders" on public.orders
  for select to authenticated using (public.is_kitchen(auth.uid()) and sent_to_kitchen_at is not null);

drop policy if exists "Kitchen can view order items" on public.order_items;
create policy "Kitchen can view sent order items" on public.order_items
  for select to authenticated using (
    public.is_kitchen(auth.uid()) and exists (
      select 1 from public.orders where orders.id=order_items.order_id and orders.sent_to_kitchen_at is not null
    )
  );

create or replace function public.kitchen_update_order_status(_order_id uuid, _status public.order_status)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not (public.is_kitchen(auth.uid()) or public.is_staff(auth.uid())) then raise exception 'Not authorized'; end if;
  if _status not in ('pending','processing','shipped','delivered') then raise exception 'Invalid kitchen status'; end if;
  update public.orders set status=_status, updated_at=now()
    where id=_order_id and sent_to_kitchen_at is not null;
end;
$$;
