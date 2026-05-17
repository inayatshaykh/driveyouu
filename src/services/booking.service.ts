import { db, bookings, customers, drivers, vehicleProfiles, pricingConfig } from '../db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Booking, BookingType, FareBreakdown, Location, CreateBookingRequest } from '../types';

export class BookingService {
  /**
   * Calculate fare for a booking
   */
  async calculateFare(
    bookingType: BookingType,
    distance: number,
    duration: number,
    city: string = 'Delhi'
  ): Promise<FareBreakdown> {
    // Get pricing configuration for the city and booking type
    const [pricing] = await db
      .select()
      .from(pricingConfig)
      .where(
        and(
          eq(pricingConfig.city, city),
          eq(pricingConfig.bookingType, bookingType),
          eq(pricingConfig.isActive, true)
        )
      )
      .limit(1);

    if (!pricing) {
      throw new Error('Pricing configuration not found for this city');
    }

    // Calculate fare components
    const baseFare = Number(pricing.baseFare);
    const distanceCharge = distance * Number(pricing.perKmRate);
    const timeCharge = duration * Number(pricing.perMinuteRate);
    const surgeMultiplier = Number(pricing.surgeMultiplier);

    // Calculate subtotal before surge
    const subtotal = baseFare + distanceCharge + timeCharge;
    const surgedAmount = subtotal * surgeMultiplier;

    // Calculate GST (18%)
    const gst = surgedAmount * 0.18;

    // Calculate total fare
    const totalFare = surgedAmount + gst;

    // Calculate commission split (80% driver, 20% platform)
    const driverEarnings = totalFare * 0.8;
    const platformCommission = totalFare * 0.2;

    return {
      baseFare,
      distanceCharge,
      timeCharge,
      surgeMultiplier,
      tollCharges: 0,
      gst,
      totalFare,
      driverEarnings,
      platformCommission,
    };
  }

  /**
   * Calculate distance and duration using Google Maps API
   */
  async calculateRoute(
    origin: Location,
    destination: Location
  ): Promise<{ distance: number; duration: number }> {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback: simple distance calculation
      const distance = this.calculateHaversineDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
      const duration = Math.ceil((distance / 40) * 60); // Assume 40 km/h average speed
      return { distance, duration };
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.append('origin', `${origin.latitude},${origin.longitude}`);
      url.searchParams.append('destination', `${destination.latitude},${destination.longitude}`);
      url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error('Failed to calculate route');
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value / 1000, // Convert meters to kilometers
        duration: Math.ceil(leg.duration.value / 60), // Convert seconds to minutes
      };
    } catch (error) {
      console.error('Google Maps API error:', error);
      // Fallback to simple calculation
      const distance = this.calculateHaversineDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
      const duration = Math.ceil((distance / 40) * 60);
      return { distance, duration };
    }
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create a new booking
   */
  async createBooking(
    customerId: string,
    request: CreateBookingRequest
  ): Promise<{ booking: Booking; estimatedFare: FareBreakdown }> {
    // Verify customer exists
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, customerId))
      .limit(1);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle profile belongs to customer
    const [vehicle] = await db
      .select()
      .from(vehicleProfiles)
      .where(
        and(
          eq(vehicleProfiles.id, request.vehicleProfileId),
          eq(vehicleProfiles.customerId, customer.id)
        )
      )
      .limit(1);

    if (!vehicle) {
      throw new Error('Vehicle profile not found');
    }

    // Calculate route and fare
    let distance = 0;
    let duration = request.duration || 0;

    if (request.dropLocation) {
      const route = await this.calculateRoute(
        request.pickupLocation,
        request.dropLocation
      );
      distance = route.distance;
      duration = route.duration;
    } else if (request.bookingType === 'hourly') {
      // For hourly bookings, use the specified duration
      duration = request.duration || 120; // Default 2 hours
    }

    const fare = await this.calculateFare(
      request.bookingType,
      distance,
      duration
    );

    // Create booking
    const [booking] = await db
      .insert(bookings)
      .values({
        customerId: customer.id,
        vehicleProfileId: request.vehicleProfileId,
        bookingType: request.bookingType,
        status: 'pending',
        pickupLatitude: request.pickupLocation.latitude.toString(),
        pickupLongitude: request.pickupLocation.longitude.toString(),
        pickupAddress: request.pickupLocation.address,
        dropLatitude: request.dropLocation?.latitude.toString(),
        dropLongitude: request.dropLocation?.longitude.toString(),
        dropAddress: request.dropLocation?.address,
        scheduledTime: request.scheduledTime ? new Date(request.scheduledTime) : null,
        duration: request.duration,
        distance: distance.toString(),
        estimatedDuration: duration,
        baseFare: fare.baseFare.toString(),
        distanceCharge: fare.distanceCharge.toString(),
        timeCharge: fare.timeCharge.toString(),
        surgeMultiplier: fare.surgeMultiplier.toString(),
        gst: fare.gst.toString(),
        totalFare: fare.totalFare.toString(),
        driverEarnings: fare.driverEarnings.toString(),
        platformCommission: fare.platformCommission.toString(),
      })
      .returning();

    return {
      booking: this.mapBookingFromDB(booking),
      estimatedFare: fare,
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return null;
    }

    return this.mapBookingFromDB(booking);
  }

  /**
   * Get customer bookings
   */
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, customerId))
      .limit(1);

    if (!customer) {
      return [];
    }

    const bookingsList = await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customer.id))
      .orderBy(sql`${bookings.createdAt} DESC`)
      .limit(50);

    return bookingsList.map(this.mapBookingFromDB);
  }

  /**
   * Map database booking to Booking type
   */
  private mapBookingFromDB(booking: any): Booking {
    return {
      id: booking.id,
      customerId: booking.customerId,
      driverId: booking.driverId || undefined,
      vehicleProfileId: booking.vehicleProfileId,
      bookingType: booking.bookingType as BookingType,
      status: booking.status,
      pickupLocation: {
        latitude: Number(booking.pickupLatitude),
        longitude: Number(booking.pickupLongitude),
        address: booking.pickupAddress,
      },
      dropLocation: booking.dropLatitude
        ? {
            latitude: Number(booking.dropLatitude),
            longitude: Number(booking.dropLongitude),
            address: booking.dropAddress,
          }
        : undefined,
      scheduledTime: booking.scheduledTime || undefined,
      duration: booking.duration || undefined,
      startTime: booking.startTime || undefined,
      endTime: booking.endTime || undefined,
      fare: {
        baseFare: Number(booking.baseFare),
        distanceCharge: Number(booking.distanceCharge),
        timeCharge: Number(booking.timeCharge),
        surgeMultiplier: Number(booking.surgeMultiplier),
        tollCharges: Number(booking.tollCharges),
        gst: Number(booking.gst),
        totalFare: Number(booking.totalFare),
        driverEarnings: Number(booking.driverEarnings),
        platformCommission: Number(booking.platformCommission),
      },
      distance: booking.distance ? Number(booking.distance) : undefined,
      estimatedDuration: booking.estimatedDuration || undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

export const bookingService = new BookingService();
