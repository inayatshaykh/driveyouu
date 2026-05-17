// User types
export type UserRole = 'customer' | 'driver' | 'admin';

export interface User {
  id: string;
  mobile: string;
  role: UserRole;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer extends User {
  role: 'customer';
  emergencyContacts?: EmergencyContact[];
  vehicleProfiles?: VehicleProfile[];
}

export interface Driver extends User {
  role: 'driver';
  verificationStatus: VerificationStatus;
  driverStatus: DriverStatus;
  rating: number;
  totalTrips: number;
  currentLocation?: Coordinates;
  lastLocationUpdate?: Date;
}

export interface EmergencyContact {
  name: string;
  mobile: string;
}

// Vehicle types
export interface VehicleProfile {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year?: number;
  registrationNumber: string;
  color?: string;
  transmissionType?: 'manual' | 'automatic';
  fuelType?: 'petrol' | 'diesel' | 'cng' | 'electric';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking types
export type BookingType = 'on-demand' | 'scheduled' | 'hourly' | 'outstation';

export type BookingStatus =
  | 'pending'
  | 'assigned'
  | 'driver_en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  vehicleProfileId: string;
  bookingType: BookingType;
  status: BookingStatus;
  pickupLocation: Location;
  dropLocation?: Location;
  scheduledTime?: Date;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  fare?: FareBreakdown;
  routeData?: RouteData;
  distance?: number;
  estimatedDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  tollCharges: number;
  gst: number;
  totalFare: number;
  driverEarnings: number;
  platformCommission: number;
}

export interface RouteData {
  polyline: string;
  waypoints: Coordinates[];
  distance: number;
  duration: number;
}

// Payment types
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cash';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  gatewayResponse?: any;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Driver verification types
export type VerificationStatus =
  | 'pending'
  | 'documents_submitted'
  | 'in_office_verified'
  | 'police_verification_pending'
  | 'police_verified'
  | 'rejected';

export type DriverStatus = 'offline' | 'available' | 'en_route' | 'on_trip' | 'busy';

export type DocumentType = 'aadhaar' | 'pan' | 'license' | 'rc' | 'photo';

export interface KYCDocument {
  id: string;
  driverId: string;
  documentType: DocumentType;
  documentUrl: string;
  documentNumber?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDetails {
  id: string;
  driverId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing types
export interface PricingConfig {
  id: string;
  city: string;
  bookingType: BookingType;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  surgeMultiplier: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// SOS types
export interface SOSAlert {
  id: string;
  bookingId: string;
  customerId: string;
  location: Coordinates;
  status: 'active' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

// Trip sharing types
export interface TripShare {
  id: string;
  bookingId: string;
  shareToken: string;
  expiresAt: Date;
  createdAt: Date;
}

// API Request/Response types
export interface LoginRequest {
  mobile: string;
}

export interface LoginResponse {
  otpId: string;
  message: string;
}

export interface VerifyOTPRequest {
  otpId: string;
  otp: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: User;
}

export interface CreateBookingRequest {
  vehicleProfileId: string;
  bookingType: BookingType;
  pickupLocation: Location;
  dropLocation?: Location;
  scheduledTime?: string;
  duration?: number;
}

export interface CreateBookingResponse {
  booking: Booking;
  estimatedFare: FareBreakdown;
}

// WebSocket event types
export interface WSMessage {
  type: string;
  payload: any;
}

export interface LocationUpdateEvent {
  type: 'driver:location:update';
  payload: {
    driverId: string;
    location: Coordinates;
    timestamp: string;
  };
}

export interface BookingStatusEvent {
  type: 'booking:status:changed';
  payload: {
    bookingId: string;
    status: BookingStatus;
    timestamp: string;
  };
}

export interface DriverArrivedEvent {
  type: 'driver:arrived';
  payload: {
    bookingId: string;
    driverId: string;
    timestamp: string;
  };
}
