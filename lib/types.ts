export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  city: string;
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
  /** Захиалга авах өдрүүд, "YYYY-MM-DD", эрэмбэлсэн. */
  dates: string[];
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
};

export type MenuPackage = {
  id: string;
  restaurant_id: string;
  package_name: string;
  file_url: string | null;
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
  | "city"
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

export type OwnerRestaurant = Restaurant & { package_count: number; pending_count: number };

export type Payment = {
  id: string;
  restaurant_id: string;
  owner_id: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  provider: string;
  reference: string;
  created_at: string;
  paid_at: string | null;
  byl_checkout_id?: number | null;
  byl_checkout_url?: string | null;
};
