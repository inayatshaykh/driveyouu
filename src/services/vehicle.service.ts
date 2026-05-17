import { db, vehicleProfiles, customers } from '../db';
import { eq, and } from 'drizzle-orm';
import type { VehicleProfile } from '../types';

export class VehicleService {
  /**
   * Create a new vehicle profile
   */
  async createVehicleProfile(
    userId: string,
    data: {
      make: string;
      model: string;
      year?: number;
      registrationNumber: string;
      color?: string;
      transmissionType?: 'manual' | 'automatic';
      fuelType?: 'petrol' | 'diesel' | 'cng' | 'electric';
      isDefault?: boolean;
    }
  ): Promise<VehicleProfile> {
    // Get customer ID from user ID
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate registration number format (Indian format)
    const regNumberRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    if (!regNumberRegex.test(data.registrationNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid registration number format');
    }

    // Check if registration number already exists for this customer
    const [existing] = await db
      .select()
      .from(vehicleProfiles)
      .where(
        and(
          eq(vehicleProfiles.customerId, customer.id),
          eq(vehicleProfiles.registrationNumber, data.registrationNumber)
        )
      )
      .limit(1);

    if (existing) {
      throw new Error('Vehicle with this registration number already exists');
    }

    // Count existing vehicles
    const existingVehicles = await db
      .select()
      .from(vehicleProfiles)
      .where(eq(vehicleProfiles.customerId, customer.id));

    if (existingVehicles.length >= 5) {
      throw new Error('Maximum 5 vehicle profiles allowed per customer');
    }

    // If this is the first vehicle or isDefault is true, unset other defaults
    if (data.isDefault || existingVehicles.length === 0) {
      await db
        .update(vehicleProfiles)
        .set({ isDefault: false })
        .where(eq(vehicleProfiles.customerId, customer.id));
    }

    // Create vehicle profile
    const [vehicle] = await db
      .insert(vehicleProfiles)
      .values({
        customerId: customer.id,
        make: data.make,
        model: data.model,
        year: data.year,
        registrationNumber: data.registrationNumber,
        color: data.color,
        transmissionType: data.transmissionType,
        fuelType: data.fuelType,
        isDefault: data.isDefault || existingVehicles.length === 0,
      })
      .returning();

    return this.mapVehicleFromDB(vehicle);
  }

  /**
   * Get all vehicle profiles for a customer
   */
  async getCustomerVehicles(userId: string): Promise<VehicleProfile[]> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      return [];
    }

    const vehicles = await db
      .select()
      .from(vehicleProfiles)
      .where(eq(vehicleProfiles.customerId, customer.id))
      .orderBy(vehicleProfiles.isDefault);

    return vehicles.map(this.mapVehicleFromDB);
  }

  /**
   * Get vehicle profile by ID
   */
  async getVehicleById(vehicleId: string, userId: string): Promise<VehicleProfile | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      return null;
    }

    const [vehicle] = await db
      .select()
      .from(vehicleProfiles)
      .where(
        and(
          eq(vehicleProfiles.id, vehicleId),
          eq(vehicleProfiles.customerId, customer.id)
        )
      )
      .limit(1);

    if (!vehicle) {
      return null;
    }

    return this.mapVehicleFromDB(vehicle);
  }

  /**
   * Update vehicle profile
   */
  async updateVehicleProfile(
    vehicleId: string,
    userId: string,
    data: Partial<{
      make: string;
      model: string;
      year: number;
      color: string;
      transmissionType: 'manual' | 'automatic';
      fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
      isDefault: boolean;
    }>
  ): Promise<VehicleProfile> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle belongs to customer
    const [existing] = await db
      .select()
      .from(vehicleProfiles)
      .where(
        and(
          eq(vehicleProfiles.id, vehicleId),
          eq(vehicleProfiles.customerId, customer.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error('Vehicle not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(vehicleProfiles)
        .set({ isDefault: false })
        .where(eq(vehicleProfiles.customerId, customer.id));
    }

    // Update vehicle
    const [updated] = await db
      .update(vehicleProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(vehicleProfiles.id, vehicleId))
      .returning();

    return this.mapVehicleFromDB(updated);
  }

  /**
   * Delete vehicle profile
   */
  async deleteVehicleProfile(vehicleId: string, userId: string): Promise<void> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle belongs to customer
    const [existing] = await db
      .select()
      .from(vehicleProfiles)
      .where(
        and(
          eq(vehicleProfiles.id, vehicleId),
          eq(vehicleProfiles.customerId, customer.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error('Vehicle not found');
    }

    // Delete vehicle
    await db.delete(vehicleProfiles).where(eq(vehicleProfiles.id, vehicleId));

    // If deleted vehicle was default, set another as default
    if (existing.isDefault) {
      const [firstVehicle] = await db
        .select()
        .from(vehicleProfiles)
        .where(eq(vehicleProfiles.customerId, customer.id))
        .limit(1);

      if (firstVehicle) {
        await db
          .update(vehicleProfiles)
          .set({ isDefault: true })
          .where(eq(vehicleProfiles.id, firstVehicle.id));
      }
    }
  }

  /**
   * Map database vehicle to VehicleProfile type
   */
  private mapVehicleFromDB(vehicle: any): VehicleProfile {
    return {
      id: vehicle.id,
      customerId: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year || undefined,
      registrationNumber: vehicle.registrationNumber,
      color: vehicle.color || undefined,
      transmissionType: vehicle.transmissionType || undefined,
      fuelType: vehicle.fuelType || undefined,
      isDefault: vehicle.isDefault,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}

export const vehicleService = new VehicleService();
