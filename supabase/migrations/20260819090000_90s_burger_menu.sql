-- Convert the existing catalog to the 90's Burger menu while preserving tables,
-- order history, coupons, analytics, and admin architecture.
insert into public.categories (id, name, slug, description, image_url)
values
  ('90000000-0000-4000-8000-000000000001','Beef Burgers','beef-burgers','Fresh smashed beef burgers','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85'),
  ('90000000-0000-4000-8000-000000000002','Chicken Burgers','chicken-burgers','Crispy and grilled chicken burgers','https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=1000&q=85'),
  ('90000000-0000-4000-8000-000000000003','Sides','sides','Crispy sides and snacks','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1000&q=85'),
  ('90000000-0000-4000-8000-000000000004','Drinks','drinks','Ice-cold drinks','https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1000&q=85')
on conflict (slug) do update set name=excluded.name, description=excluded.description, image_url=excluded.image_url;

-- Keep historic products for order integrity, but remove them from the storefront.
update public.products set is_active=false
where category_id not in (select id from public.categories where slug in ('beef-burgers','chicken-burgers','sides','drinks'));

insert into public.products (name,slug,description,price,compare_at_price,image_url,images,category_id,stock,is_featured,is_active,shipping_price)
values
 ('The Classic Smash','classic-smash','Double smashed beef, American cheese, pickles, onions and 90’s sauce.',185,null,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000001',100,true,true,0),
 ('Bacon Backtrack','bacon-backtrack','Double beef, smoky bacon, cheddar, caramelized onions and barbecue sauce.',225,null,'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000001',100,true,true,0),
 ('Hot Chick','hot-chick','Crispy chicken, spicy glaze, slaw, pickles and creamy ranch.',175,null,'https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000002',100,true,true,0),
 ('Golden Chicken','golden-chicken','Crispy chicken, cheddar, lettuce, pickles and honey mustard.',165,null,'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000002',100,false,true,0),
 ('Loaded Fries','loaded-fries','Crispy fries loaded with cheese sauce, jalapeños and 90’s sauce.',105,null,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000003',100,true,true,0),
 ('Classic Fries','classic-fries','Golden, crispy, salted fries.',65,null,'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000003',100,false,true,0),
 ('Cola','cola','Ice-cold cola.',35,null,'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000004',100,false,true,0),
 ('Strawberry Shake','strawberry-shake','Thick strawberry shake topped with whipped cream.',85,null,'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1000&q=85','{}','90000000-0000-4000-8000-000000000004',100,true,true,0)
on conflict (slug) do update set description=excluded.description, price=excluded.price, image_url=excluded.image_url, category_id=excluded.category_id, is_active=true;
