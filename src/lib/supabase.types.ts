export type UserRole = 'customer' | 'driver' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type BookingType = 'on-demand' | 'scheduled' | 'hourly' | 'outstation';
export type KycStatus = 'pending' | 'verified' | 'rejected';
export type DriverStatus = 'active' | 'offline' | 'suspended';

export interface Profile {
  id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  kyc_status: KycStatus;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_rides: number;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  driver_id: string | null;
  booking_type: BookingType;
  status: BookingStatus;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_address: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  fare: number | null;
  distance_km: number | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'id' | 'created_at' | 'rating' | 'total_rides'>;
        Update: Partial<Omit<Driver, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
    };
  };
};
