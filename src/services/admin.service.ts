import { db, drivers, users, customers, bookings, kycDocuments, pricingConfig, vehicleProfiles } from '../db';
import { eq, and, sql, desc, gte, lte, count } from 'drizzle-orm';
import type { Driver, Booking, PricingConfig } from '../types';

export class AdminService {
  /**
   * Get all drivers with filters
   */
  async getAllDrivers(filters?: {
    verificationStatus?: string;
    driverStatus?: string;
    search?: string;
  }): Promise<Driver[]> {
    let query = db
      .select({
        driver: drivers,
        user: users,
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id));

    // Apply filters
    if (filters?.verificationStatus) {
      query = query.where(eq(drivers.verificationStatus, filters.verificationStatus));
    }

    if (filters?.driverStatus) {
      query = query.where(eq(drivers.driverStatus, filters.driverStatus));
    }

    const results = await query;

    return results.map(({ driver, user }) => ({
      id: user.id,
      mobile: user.mobile,
      role: 'driver' as const,
      name: user.name,
      email: user.email || undefined,
      verificationStatus: driver.verificationStatus as any,
      driverStatus: driver.driverStatus as any,
      rating: Number(driver.rating),
      totalTrips: driver.totalTrips,
      currentLocation:
        driver.currentLatitude && driver.currentLongitude
          ? {
              latitude: Number(driver.currentLatitude),
              longitude: Number(driver.currentLongitude),
            }
          : undefined,
      lastLocationUpdate: driver.lastLocationUpdate || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Update driver verification status
   */
  async updateDriverVerification(
    driverId: string,
    status: string,
    adminId: string,
    rejectionReason?: string
  ): Promise<void> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, driverId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    await db
      .update(drivers)
      .set({
        verificationStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driver.id));

    // If rejecting, update KYC documents
    if (status === 'rejected' && rejectionReason) {
      await db
        .update(kycDocuments)
        .set({
          verificationStatus: 'rejected',
          rejectionReason,
          verifiedBy: adminId,
          verifiedAt: new Date(),
        })
        .where(eq(kycDocuments.driverId, driver.id));
    }
  }

  /**
   * Activate/Deactivate driver
   */
  async updateDriverStatus(driverId: string, status: string): Promise<void> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, driverId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    await db
      .update(drivers)
      .set({ driverStatus: status })
      .where(eq(drivers.id, driver.id));
  }

  /**
   * Get all customers with booking stats
   */
  async getAllCustomers(search?: string): Promise<any[]> {
    const results = await db
      .select({
        customer: customers,
        user: users,
      })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id));

    // Get booking stats for each customer
    const customersWithStats = await Promise.all(
      results.map(async ({ customer, user }) => {
        const customerBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.customerId, customer.id));

        const totalBookings = customerBookings.length;
        const completedBookings = customerBookings.filter((b) => b.status === 'completed').length;
        const cancelledBookings = customerBookings.filter((b) => b.status === 'cancelled').length;
        const totalSpent = customerBookings
          .filter((b) => b.status === 'completed')
          .reduce((sum, b) => sum + Number(b.totalFare || 0), 0);

        return {
          id: customer.id,
          userId: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email || null,
          createdAt: user.createdAt,
          totalBookings,
          completedBookings,
          cancelledBookings,
          totalSpent,
        };
      })
    );

    return customersWithStats;
  }

  /**
   * Get customer details with bookings and vehicles
   */
  async getCustomerDetails(customerId: string): Promise<any> {
    const [result] = await db
      .select({
        customer: customers,
        user: users,
      })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!result) {
      throw new Error('Customer not found');
    }

    const { customer, user } = result;

    // Get booking stats
    const customerBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customer.id))
      .orderBy(desc(bookings.createdAt));

    const totalBookings = customerBookings.length;
    const completedBookings = customerBookings.filter((b) => b.status === 'completed').length;
    const cancelledBookings = customerBookings.filter((b) => b.status === 'cancelled').length;
    const totalSpent = customerBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.totalFare || 0), 0);

    // Get recent bookings (last 10)
    const recentBookings = customerBookings.slice(0, 10).map((booking) => ({
      id: booking.id,
      bookingType: booking.bookingType,
      status: booking.status,
      pickupAddress: booking.pickupAddress,
      dropAddress: booking.dropAddress || null,
      totalFare: Number(booking.totalFare || 0),
      createdAt: booking.createdAt,
    }));

    // Get vehicles
    const customerVehicles = await db
      .select()
      .from(vehicleProfiles)
      .where(eq(vehicleProfiles.customerId, customer.id));

    const vehicles = customerVehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      isDefault: vehicle.isDefault || false,
    }));

    return {
      id: customer.id,
      userId: user.id,
      mobile: user.mobile,
      name: user.name,
      email: user.email || null,
      createdAt: user.createdAt,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
      recentBookings,
      vehicles,
    };
  }

  /**
   * Get all bookings with filters
   */
  async getAllBookings(filters?: {
    status?: string;
    bookingType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]> {
    let query = db.select().from(bookings);

    if (filters?.status) {
      query = query.where(eq(bookings.status, filters.status));
    }

    if (filters?.bookingType) {
      query = query.where(eq(bookings.bookingType, filters.bookingType));
    }

    if (filters?.startDate) {
      query = query.where(gte(bookings.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where(lte(bookings.createdAt, filters.endDate));
    }

    const results = await query.orderBy(desc(bookings.createdAt)).limit(100);

    return results.map(this.mapBookingFromDB);
  }

  /**
   * Manually assign driver to booking
   */
  async assignDriverToBooking(bookingId: string, driverId: string): Promise<Booking> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error('Booking is not available for assignment');
    }

    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, driverId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    const [updated] = await db
      .update(bookings)
      .set({
        driverId: driver.id,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    return this.mapBookingFromDB(updated);
  }

  /**
   * Get pricing configuration
   */
  async getPricingConfig(city?: string): Promise<PricingConfig[]> {
    let query = db.select().from(pricingConfig);

    if (city) {
      query = query.where(eq(pricingConfig.city, city));
    }

    const results = await query;

    return results.map((config) => ({
      id: config.id,
      city: config.city,
      bookingType: config.bookingType as any,
      baseFare: Number(config.baseFare),
      perKmRate: Number(config.perKmRate),
      perMinuteRate: Number(config.perMinuteRate),
      minimumFare: Number(config.minimumFare),
      surgeMultiplier: Number(config.surgeMultiplier),
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  /**
   * Update pricing configuration
   */
  async updatePricingConfig(
    configId: string,
    data: {
      baseFare?: number;
      perKmRate?: number;
      perMinuteRate?: number;
      minimumFare?: number;
      surgeMultiplier?: number;
      isActive?: boolean;
    }
  ): Promise<PricingConfig> {
    const [updated] = await db
      .update(pricingConfig)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(pricingConfig.id, configId))
      .returning();

    return {
      id: updated.id,
      city: updated.city,
      bookingType: updated.bookingType as any,
      baseFare: Number(updated.baseFare),
      perKmRate: Number(updated.perKmRate),
      perMinuteRate: Number(updated.perMinuteRate),
      minimumFare: Number(updated.minimumFare),
      surgeMultiplier: Number(updated.surgeMultiplier),
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Create pricing configuration
   */
  async createPricingConfig(data: {
    city: string;
    bookingType: string;
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    minimumFare: number;
    surgeMultiplier?: number;
  }): Promise<PricingConfig> {
    const [created] = await db
      .insert(pricingConfig)
      .values({
        ...data,
        surgeMultiplier: data.surgeMultiplier?.toString() || '1.00',
        isActive: true,
      })
      .returning();

    return {
      id: created.id,
      city: created.city,
      bookingType: created.bookingType as any,
      baseFare: Number(created.baseFare),
      perKmRate: Number(created.perKmRate),
      perMinuteRate: Number(created.perMinuteRate),
      minimumFare: Number(created.minimumFare),
      surgeMultiplier: Number(created.surgeMultiplier),
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Get platform analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    platformCommission: number;
    driverEarnings: number;
    activeDrivers: number;
    totalCustomers: number;
    averageFare: number;
  }> {
    let bookingsQuery = db.select().from(bookings);

    if (startDate) {
      bookingsQuery = bookingsQuery.where(gte(bookings.createdAt, startDate));
    }

    if (endDate) {
      bookingsQuery = bookingsQuery.where(lte(bookings.createdAt, endDate));
    }

    const allBookings = await bookingsQuery;

    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;

    const totalRevenue = allBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.totalFare || 0), 0);

    const platformCommission = allBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.platformCommission || 0), 0);

    const driverEarnings = allBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.driverEarnings || 0), 0);

    const activeDriversCount = await db
      .select()
      .from(drivers)
      .where(eq(drivers.driverStatus, 'available'));

    const totalCustomersCount = await db.select().from(customers);

    const averageFare = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      platformCommission,
      driverEarnings,
      activeDrivers: activeDriversCount.length,
      totalCustomers: totalCustomersCount.length,
      averageFare,
    };
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
      bookingType: booking.bookingType,
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

export const adminService = new AdminService();
