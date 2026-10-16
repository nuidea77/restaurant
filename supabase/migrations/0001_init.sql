-- Шинэ жилийн хүлээн авалтын платформ — суурь схем
create extension if not exists pgcrypto;

-- 1. Рестораны мэдээлэл
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references auth.users(id) on delete cascade,
  name varchar(255) not null,
  district varchar(100) not null,
  address text not null,
  phone varchar(50) not null,
  capacity int not null check (capacity > 0),
  description text,
  has_host boolean default false,
  has_stage boolean default false,
  has_screen boolean default false,
  has_parking boolean default false,
  latitude double precision,
  longitude double precision,
  images text[] default '{}',
  created_at timestamp with time zone default now()
);

-- 2. Багцууд (Шүүлтүүрийн үндсэн хүснэгт)
create table public.menu_packages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  package_name varchar(255) not null,
  file_url text not null,
  total_price numeric not null check (total_price >= 0),
  person_count int not null default 1 check (person_count >= 1),
  price_per_person numeric not null,
  items jsonb default '[]'::jsonb,
  is_verified boolean default false,
  created_at timestamp with time zone default now()
);

-- Хурдан шүүлт хийх индексүүд
create index idx_menu_price on public.menu_packages(price_per_person);
create index idx_menu_restaurant on public.menu_packages(restaurant_id, is_verified);
create index idx_restaurant_district on public.restaurants(district);
create index idx_restaurant_capacity on public.restaurants(capacity);

-- 1 хүний үнийг үргэлж серверт тооцно (AI болон гар засварын алдаанаас хамгаална)
create or replace function public.compute_price_per_person()
returns trigger language plpgsql as $$
begin
  if new.person_count is null or new.person_count < 1 then
    new.person_count := 1;
  end if;
  new.price_per_person := round(new.total_price / new.person_count);
  return new;
end;
$$;

create trigger trg_menu_packages_price
before insert or update of total_price, person_count, price_per_person on public.menu_packages
for each row execute function public.compute_price_per_person();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.menu_packages enable row level security;

create policy "restaurants are public" on public.restaurants
  for select using (true);
create policy "owners insert own restaurant" on public.restaurants
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update own restaurant" on public.restaurants
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete own restaurant" on public.restaurants
  for delete to authenticated using (owner_id = auth.uid());

-- Нийтэд зөвхөн баталгаажсан багц харагдана, эзэмшигч өөрийн бүх багцыг харна
create policy "verified packages are public" on public.menu_packages
  for select using (
    is_verified
    or exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );
create policy "owners insert packages" on public.menu_packages
  for insert to authenticated with check (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );
create policy "owners update packages" on public.menu_packages
  for update to authenticated
  using (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()));
create policy "owners delete packages" on public.menu_packages
  for delete to authenticated using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Хайлт: 1 хүний үнэ, багтаамж, дүүрэг, нөхцөлөөр шүүх
-- ---------------------------------------------------------------------------
create or replace function public.search_restaurants(
  p_district text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_capacity int default null,
  p_max_capacity int default null,
  p_has_host boolean default null,
  p_has_stage boolean default null,
  p_has_screen boolean default null,
  p_has_parking boolean default null
)
returns table (
  id uuid,
  name text,
  district text,
  address text,
  phone text,
  capacity int,
  has_host boolean,
  has_stage boolean,
  has_screen boolean,
  has_parking boolean,
  images text[],
  min_price numeric,
  max_price numeric,
  package_count bigint
)
language sql stable as $$
  select r.id, r.name::text, r.district::text, r.address, r.phone::text, r.capacity,
         r.has_host, r.has_stage, r.has_screen, r.has_parking, r.images,
         min(p.price_per_person), max(p.price_per_person), count(p.id)
  from public.restaurants r
  join public.menu_packages p
    on p.restaurant_id = r.id
   and p.is_verified
   and (p_min_price is null or p.price_per_person >= p_min_price)
   and (p_max_price is null or p.price_per_person <= p_max_price)
  where (p_district is null or r.district = p_district)
    and (p_min_capacity is null or r.capacity >= p_min_capacity)
    and (p_max_capacity is null or r.capacity <= p_max_capacity)
    and (p_has_host is not true or r.has_host)
    and (p_has_stage is not true or r.has_stage)
    and (p_has_screen is not true or r.has_screen)
    and (p_has_parking is not true or r.has_parking)
  group by r.id
  order by min(p.price_per_person) asc;
$$;

grant execute on function public.search_restaurants to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: цэс (PDF/зураг) болон заалны зураг. Клиент шууд байршуулна.
-- Файлын зам: <user_id>/<file>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('menus', 'menus', true, 10485760, array['application/pdf', 'image/png', 'image/jpeg']),
  ('restaurant-images', 'restaurant-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "owners upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('menus', 'restaurant-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners update own files" on storage.objects
  for update to authenticated using (
    bucket_id in ('menus', 'restaurant-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners delete own files" on storage.objects
  for delete to authenticated using (
    bucket_id in ('menus', 'restaurant-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners read own files" on storage.objects
  for select to authenticated using (
    bucket_id in ('menus', 'restaurant-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
