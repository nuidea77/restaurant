export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  capacity: number;
  description: string | null;
  has_host: boolean;
  has_stage: boolean;
  has_screen: boolean;
  has_parking: boolean;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  created_at: string;
};

export type MenuPackage = {
  id: string;
  restaurant_id: string;
  package_name: string;
  file_url: string;
  total_price: number;
  person_count: number;
  price_per_person: number;
  items: string[];
  is_verified: boolean;
  created_at: string;
};

export type RestaurantSearchRow = Pick<
  Restaurant,
  | "id"
  | "name"
  | "district"
  | "address"
  | "phone"
  | "capacity"
  | "has_host"
  | "has_stage"
  | "has_screen"
  | "has_parking"
  | "images"
> & { min_price: number; max_price: number; package_count: number };
