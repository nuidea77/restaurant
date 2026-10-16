-- Шинэ жилийн хүлээн авалтын платформ — локал PGlite (Postgres) схем

-- 0. Рестораны эзэмшигчид (Auth.js credentials)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

-- 1. Рестораны мэдээлэл
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references users(id) on delete cascade,
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
create table if not exists menu_packages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
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
create index if not exists idx_menu_price on menu_packages(price_per_person);
create index if not exists idx_menu_restaurant on menu_packages(restaurant_id, is_verified);
create index if not exists idx_restaurant_district on restaurants(district);
create index if not exists idx_restaurant_capacity on restaurants(capacity);

-- 1 хүний үнийг үргэлж DB-д тооцно (AI болон гар засварын алдаанаас хамгаална)
create or replace function compute_price_per_person()
returns trigger language plpgsql as $$
begin
  if new.person_count is null or new.person_count < 1 then
    new.person_count := 1;
  end if;
  new.price_per_person := round(new.total_price / new.person_count);
  return new;
end;
$$;

drop trigger if exists trg_menu_packages_price on menu_packages;
create trigger trg_menu_packages_price
before insert or update of total_price, person_count, price_per_person on menu_packages
for each row execute function compute_price_per_person();

-- ---------------------------------------------------------------------------
-- Олон ресторан + нийтлэлийн төлбөр (ресторан бүр 50,000₮)
-- ---------------------------------------------------------------------------
-- Нэг эзэмшигч олон ресторантай байж болно.
alter table restaurants drop constraint if exists restaurants_owner_id_key;
create index if not exists idx_restaurant_owner on restaurants(owner_id);

-- Энэ өөрчлөлтөөс өмнө үүссэн ресторанууд (default true-гээр бөглөгдөнө) идэвхтэй хэвээр үлдэнэ;
-- шинээр нэмэгдсэн ресторан төлбөр төлөгдтөл нийтэд харагдахгүй.
alter table restaurants add column if not exists is_paid boolean not null default true;
alter table restaurants alter column is_paid set default false;
alter table restaurants add column if not exists paid_at timestamp with time zone;
create index if not exists idx_restaurant_paid on restaurants(is_paid);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status varchar(20) not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  provider varchar(50) not null default 'demo',
  reference varchar(32) not null unique,
  created_at timestamp with time zone default now(),
  paid_at timestamp with time zone
);
create index if not exists idx_payments_restaurant on payments(restaurant_id, status);
