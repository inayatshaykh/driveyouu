import { db, drivers, users, kycDocuments, bankDetails, bookings } from '../db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Driver, KYCDocument, BankDetails, Booking } from '../types';

export class DriverService {
  /**
   * Get or create driver profile
   */
  async getOrCreateDriver(userId: string): Promise<Driver> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Get or create driver
    let [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      [driver] = await db
        .insert(drivers)
        .values({
          userId,
          verificationStatus: 'pending',
          driverStatus: 'offline',
          rating: '0.00',
          totalTrips: 0,
        })
        .returning();
    }

    return this.mapDriverFromDB(driver, user);
  }

  /**
   * Update driver location
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    await db
      .update(drivers)
      .set({
        currentLatitude: latitude.toString(),
        currentLongitude: longitude.toString(),
        lastLocationUpdate: new Date(),
      })
      .where(eq(drivers.id, driver.id));
  }

  /**
   * Update driver status
   */
  async updateStatus(
    userId: string,
    status: 'offline' | 'available' | 'en_route' | 'on_trip' | 'busy'
  ): Promise<void> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
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
   * Upload KYC document
   */
  async uploadKYCDocument(
    userId: string,
    documentType: 'aadhaar' | 'pan' | 'license' | 'rc' | 'photo',
    documentUrl: string,
    documentNumber?: string
  ): Promise<KYCDocument> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if document already exists
    const [existing] = await db
      .select()
      .from(kycDocuments)
      .where(
        and(
          eq(kycDocuments.driverId, driver.id),
          eq(kycDocuments.documentType, documentType)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing document
      const [updated] = await db
        .update(kycDocuments)
        .set({
          documentUrl,
          documentNumber,
          verificationStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(kycDocuments.id, existing.id))
        .returning();

      return this.mapKYCDocumentFromDB(updated);
    }

    // Create new document
    const [document] = await db
      .insert(kycDocuments)
      .values({
        driverId: driver.id,
        documentType,
        documentUrl,
        documentNumber,
        verificationStatus: 'pending',
      })
      .returning();

    // Update driver verification status
    await this.updateDriverVerificationStatus(driver.id);

    return this.mapKYCDocumentFromDB(document);
  }

  /**
   * Get driver KYC documents
   */
  async getKYCDocuments(userId: string): Promise<KYCDocument[]> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      return [];
    }

    const documents = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.driverId, driver.id));

    return documents.map(this.mapKYCDocumentFromDB);
  }

  /**
   * Update driver verification status based on documents
   */
  private async updateDriverVerificationStatus(driverId: string): Promise<void> {
    const documents = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.driverId, driverId));

    const requiredDocs = ['aadhaar', 'pan', 'license', 'photo'];
    const uploadedDocs = documents.map((d) => d.documentType);
    const allUploaded = requiredDocs.every((doc) => uploadedDocs.includes(doc));

    if (allUploaded) {
      await db
        .update(drivers)
        .set({ verificationStatus: 'documents_submitted' })
        .where(eq(drivers.id, driverId));
    }
  }

  /**
   * Save bank details
   */
  async saveBankDetails(
    userId: string,
    details: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
    }
  ): Promise<BankDetails> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if bank details already exist
    const [existing] = await db
      .select()
      .from(bankDetails)
      .where(eq(bankDetails.driverId, driver.id))
      .limit(1);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(bankDetails)
        .set({
          ...details,
          updatedAt: new Date(),
        })
        .where(eq(bankDetails.id, existing.id))
        .returning();

      return this.mapBankDetailsFromDB(updated);
    }

    // Create new
    const [newDetails] = await db
      .insert(bankDetails)
      .values({
        driverId: driver.id,
        ...details,
      })
      .returning();

    return this.mapBankDetailsFromDB(newDetails);
  }

  /**
   * Get bank details
   */
  async getBankDetails(userId: string): Promise<BankDetails | null> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      return null;
    }

    const [details] = await db
      .select()
      .from(bankDetails)
      .where(eq(bankDetails.driverId, driver.id))
      .limit(1);

    if (!details) {
      return null;
    }

    return this.mapBankDetailsFromDB(details);
  }

  /**
   * Get driver bookings
   */
  async getDriverBookings(userId: string): Promise<Booking[]> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      return [];
    }

    const driverBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.driverId, driver.id))
      .orderBy(sql`${bookings.createdAt} DESC`)
      .limit(50);

    return driverBookings.map(this.mapBookingFromDB);
  }

  /**
   * Get driver earnings summary
   */
  async getEarningsSummary(userId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalEarnings: number;
    pendingPayout: number;
  }> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalEarnings: 0,
        pendingPayout: 0,
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get completed bookings
    const completedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driver.id),
          eq(bookings.status, 'completed')
        )
      );

    const today = completedBookings
      .filter((b) => new Date(b.createdAt) >= todayStart)
      .reduce((sum, b) => sum + Number(b.driverEarnings || 0), 0);

    const thisWeek = completedBookings
      .filter((b) => new Date(b.createdAt) >= weekStart)
      .reduce((sum, b) => sum + Number(b.driverEarnings || 0), 0);

    const thisMonth = completedBookings
      .filter((b) => new Date(b.createdAt) >= monthStart)
      .reduce((sum, b) => sum + Number(b.driverEarnings || 0), 0);

    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + Number(b.driverEarnings || 0),
      0
    );

    // Pending payout (completed but not paid)
    const pendingPayout = totalEarnings; // In production, subtract already paid amounts

    return {
      today,
      thisWeek,
      thisMonth,
      totalEarnings,
      pendingPayout,
    };
  }

  /**
   * Accept booking
   */
  async acceptBooking(userId: string, bookingId: string): Promise<Booking> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Verify driver is verified
    if (driver.verificationStatus !== 'police_verified') {
      throw new Error('Driver verification incomplete');
    }

    // Get booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error('Booking is not available');
    }

    // Assign driver to booking
    const [updated] = await db
      .update(bookings)
      .set({
        driverId: driver.id,
        status: 'assigned',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Update driver status
    await db
      .update(drivers)
      .set({ driverStatus: 'en_route' })
      .where(eq(drivers.id, driver.id));

    return this.mapBookingFromDB(updated);
  }

  /**
   * Map database driver to Driver type
   */
  private mapDriverFromDB(driver: any, user: any): Driver {
    return {
      id: user.id,
      mobile: user.mobile,
      role: 'driver',
      name: user.name,
      email: user.email || undefined,
      verificationStatus: driver.verificationStatus,
      driverStatus: driver.driverStatus,
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
    };
  }

  /**
   * Map database KYC document to KYCDocument type
   */
  private mapKYCDocumentFromDB(doc: any): KYCDocument {
    return {
      id: doc.id,
      driverId: doc.driverId,
      documentType: doc.documentType,
      documentUrl: doc.documentUrl,
      documentNumber: doc.documentNumber || undefined,
      verificationStatus: doc.verificationStatus,
      verifiedBy: doc.verifiedBy || undefined,
      verifiedAt: doc.verifiedAt || undefined,
      rejectionReason: doc.rejectionReason || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Map database bank details to BankDetails type
   */
  private mapBankDetailsFromDB(details: any): BankDetails {
    return {
      id: details.id,
      driverId: details.driverId,
      accountHolderName: details.accountHolderName,
      accountNumber: details.accountNumber,
      ifscCode: details.ifscCode,
      bankName: details.bankName,
      branchName: details.branchName || undefined,
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
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

export const driverService = new DriverService();
