import { pgTable, text, timestamp, uuid, varchar, decimal, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

// Users table - base for all user types
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  mobile: varchar('mobile', { length: 15 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull(), // 'customer', 'driver', 'admin'
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  mobileIdx: index('users_mobile_idx').on(table.mobile),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Customer-specific data
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  emergencyContacts: jsonb('emergency_contacts').$type<Array<{name: string, mobile: string}>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Driver-specific data
export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('pending'),
  driverStatus: varchar('driver_status', { length: 20 }).notNull().default('offline'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalTrips: integer('total_trips').default(0),
  currentLatitude: decimal('current_latitude', { precision: 10, scale: 8 }),
  currentLongitude: decimal('current_longitude', { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp('last_location_update'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('drivers_status_idx').on(table.driverStatus),
  verificationIdx: index('drivers_verification_idx').on(table.verificationStatus),
}));

// Vehicle profiles
export const vehicleProfiles = pgTable('vehicle_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year'),
  registrationNumber: varchar('registration_number', { length: 20 }).notNull(),
  color: varchar('color', { length: 50 }),
  transmissionType: varchar('transmission_type', { length: 20 }), // 'manual', 'automatic'
  fuelType: varchar('fuel_type', { length: 20 }), // 'petrol', 'diesel', 'cng', 'electric'
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('vehicle_profiles_customer_idx').on(table.customerId),
}));

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleProfileId: uuid('vehicle_profile_id').references(() => vehicleProfiles.id).notNull(),
  bookingType: varchar('booking_type', { length: 20 }).notNull(), // 'on-demand', 'scheduled', 'hourly', 'outstation'
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  
  // Location data
  pickupLatitude: decimal('pickup_latitude', { precision: 10, scale: 8 }).notNull(),
  pickupLongitude: decimal('pickup_longitude', { precision: 11, scale: 8 }).notNull(),
  pickupAddress: text('pickup_address').notNull(),
  dropLatitude: decimal('drop_latitude', { precision: 10, scale: 8 }),
  dropLongitude: decimal('drop_longitude', { precision: 11, scale: 8 }),
  dropAddress: text('drop_address'),
  
  // Timing
  scheduledTime: timestamp('scheduled_time'),
  duration: integer('duration'), // in minutes for hourly bookings
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  
  // Fare details
  baseFare: decimal('base_fare', { precision: 10, scale: 2 }),
  distanceCharge: decimal('distance_charge', { precision: 10, scale: 2 }),
  timeCharge: decimal('time_charge', { precision: 10, scale: 2 }),
  surgeMultiplier: decimal('surge_multiplier', { precision: 4, scale: 2 }).default('1.00'),
  tollCharges: decimal('toll_charges', { precision: 10, scale: 2 }).default('0.00'),
  gst: decimal('gst', { precision: 10, scale: 2 }),
  totalFare: decimal('total_fare', { precision: 10, scale: 2 }),
  driverEarnings: decimal('driver_earnings', { precision: 10, scale: 2 }),
  platformCommission: decimal('platform_commission', { precision: 10, scale: 2 }),
  
  // Route data
  routeData: jsonb('route_data'),
  distance: decimal('distance', { precision: 10, scale: 2 }), // in kilometers
  estimatedDuration: integer('estimated_duration'), // in minutes
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('bookings_customer_idx').on(table.customerId),
  driverIdx: index('bookings_driver_idx').on(table.driverId),
  statusIdx: index('bookings_status_idx').on(table.status),
  createdAtIdx: index('bookings_created_at_idx').on(table.createdAt),
  statusCreatedIdx: index('bookings_status_created_idx').on(table.status, table.createdAt),
}));

// Payment transactions
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  method: varchar('method', { length: 20 }).notNull(), // 'card', 'upi', 'netbanking', 'cash'
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  gatewayResponse: jsonb('gateway_response'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index('payments_booking_idx').on(table.bookingId),
  statusIdx: index('payments_status_idx').on(table.status),
}));

// KYC documents
export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'aadhaar', 'pan', 'license', 'rc', 'photo'
  documentUrl: text('document_url').notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  driverIdx: index('kyc_documents_driver_idx').on(table.driverId),
}));

// Bank details for drivers
export const bankDetails = pgTable('bank_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull().unique(),
  accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  ifscCode: varchar('ifsc_code', { length: 20 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  branchName: varchar('branch_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OTP storage
export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  mobile: varchar('mobile', { length: 15 }).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').default(false),
  attempts: integer('attempts').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  mobileIdx: index('otps_mobile_idx').on(table.mobile),
}));

// Pricing configuration
export const pricingConfig = pgTable('pricing_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  city: varchar('city', { length: 100 }).notNull(),
  bookingType: varchar('booking_type', { length: 20 }).notNull(),
  baseFare: decimal('base_fare', { precision: 10, scale: 2 }).notNull(),
  perKmRate: decimal('per_km_rate', { precision: 10, scale: 2 }).notNull(),
  perMinuteRate: decimal('per_minute_rate', { precision: 10, scale: 2 }).notNull(),
  minimumFare: decimal('minimum_fare', { precision: 10, scale: 2 }).notNull(),
  surgeMultiplier: decimal('surge_multiplier', { precision: 4, scale: 2 }).default('1.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cityTypeIdx: index('pricing_config_city_type_idx').on(table.city, table.bookingType),
}));

// SOS alerts
export const sosAlerts = pgTable('sos_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index('sos_alerts_booking_idx').on(table.bookingId),
  statusIdx: index('sos_alerts_status_idx').on(table.status),
}));

// Trip sharing links
export const tripShares = pgTable('trip_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  shareToken: varchar('share_token', { length: 100 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('trip_shares_token_idx').on(table.shareToken),
}));
