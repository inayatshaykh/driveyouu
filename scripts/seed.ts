import { db, users, customers, drivers, vehicleProfiles, bookings, pricingConfig } from '../src/db';
import { hashPassword } from '../src/services/auth.service';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo users
    console.log('Creating demo users...');
    
    // Customer
    const [customerUser] = await db
      .insert(users)
      .values({
        mobile: '9876543210',
        role: 'customer',
        name: 'Demo Customer',
        email: 'customer@demo.com',
      })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        userId: customerUser.id,
        emergencyContacts: [
          { name: 'Emergency Contact', mobile: '9876543299' },
        ],
      })
      .returning();

    // Driver
    const [driverUser] = await db
      .insert(users)
      .values({
        mobile: '9876543211',
        role: 'driver',
        name: 'Demo Driver',
        email: 'driver@demo.com',
      })
      .returning();

    await db.insert(drivers).values({
      userId: driverUser.id,
      verificationStatus: 'verified',
      driverStatus: 'available',
      rating: '4.8',
      totalTrips: 150,
      currentLatitude: '28.6139',
      currentLongitude: '77.2090',
      lastLocationUpdate: new Date(),
    });

    // Admin
    await db.insert(users).values({
      mobile: '9876543212',
      role: 'admin',
      name: 'Demo Admin',
      email: 'admin@demo.com',
    });

    console.log('✅ Demo users created');

    // Create demo vehicles
    console.log('Creating demo vehicles...');
    
    const [vehicle1] = await db
      .insert(vehicleProfiles)
      .values({
        customerId: customer.id,
        make: 'Honda',
        model: 'City',
        year: 2022,
        registrationNumber: 'DL01AB1234',
        color: 'White',
        transmissionType: 'automatic',
        fuelType: 'petrol',
        isDefault: true,
      })
      .returning();

    await db.insert(vehicleProfiles).values({
      customerId: customer.id,
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2021,
      registrationNumber: 'DL02CD5678',
      color: 'Red',
      transmissionType: 'manual',
      fuelType: 'petrol',
      isDefault: false,
    });

    console.log('✅ Demo vehicles created');

    // Create pricing configurations
    console.log('Creating pricing configurations...');
    
    const cities = ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad'];
    const bookingTypes = [
      { type: 'on-demand', baseFare: 100, perKm: 15, perMin: 2, minFare: 150 },
      { type: 'scheduled', baseFare: 120, perKm: 15, perMin: 2, minFare: 180 },
      { type: 'hourly', baseFare: 200, perKm: 12, perMin: 3, minFare: 400 },
      { type: 'outstation', baseFare: 500, perKm: 18, perMin: 1.5, minFare: 1000 },
    ];

    for (const city of cities) {
      for (const booking of bookingTypes) {
        await db.insert(pricingConfig).values({
          city,
          bookingType: booking.type,
          baseFare: booking.baseFare.toString(),
          perKmRate: booking.perKm.toString(),
          perMinuteRate: booking.perMin.toString(),
          minimumFare: booking.minFare.toString(),
          surgeMultiplier: '1.00',
          isActive: true,
        });
      }
    }

    console.log('✅ Pricing configurations created');

    // Create demo bookings
    console.log('Creating demo bookings...');
    
    const demoBookings = [
      {
        status: 'completed',
        pickupAddress: 'Connaught Place, New Delhi',
        pickupLat: '28.6315',
        pickupLng: '77.2167',
        dropAddress: 'India Gate, New Delhi',
        dropLat: '28.6129',
        dropLng: '77.2295',
        totalFare: 250,
        distance: 5.2,
      },
      {
        status: 'completed',
        pickupAddress: 'Cyber City, Gurgaon',
        pickupLat: '28.4950',
        pickupLng: '77.0890',
        dropAddress: 'DLF Phase 3, Gurgaon',
        dropLat: '28.5021',
        dropLng: '77.0910',
        totalFare: 180,
        distance: 3.5,
      },
      {
        status: 'in-progress',
        pickupAddress: 'Sector 18, Noida',
        pickupLat: '28.5706',
        pickupLng: '77.3272',
        dropAddress: 'Greater Noida',
        dropLat: '28.4744',
        dropLng: '77.5040',
        totalFare: 450,
        distance: 18.5,
      },
      {
        status: 'pending',
        pickupAddress: 'Rajiv Chowk, Delhi',
        pickupLat: '28.6328',
        pickupLng: '77.2197',
        dropAddress: null,
        dropLat: null,
        dropLng: null,
        totalFare: 0,
        distance: 0,
      },
    ];

    for (const booking of demoBookings) {
      const totalFare = booking.totalFare;
      const platformCommission = totalFare * 0.2; // 20%
      const driverEarnings = totalFare * 0.8; // 80%

      await db.insert(bookings).values({
        customerId: customer.id,
        vehicleProfileId: vehicle1.id,
        bookingType: 'on-demand',
        status: booking.status,
        pickupLatitude: booking.pickupLat,
        pickupLongitude: booking.pickupLng,
        pickupAddress: booking.pickupAddress,
        dropLatitude: booking.dropLat || undefined,
        dropLongitude: booking.dropLng || undefined,
        dropAddress: booking.dropAddress || undefined,
        baseFare: '100',
        distanceCharge: (booking.distance * 15).toString(),
        timeCharge: '30',
        surgeMultiplier: '1.00',
        tollCharges: '0',
        gst: (totalFare * 0.05).toString(),
        totalFare: totalFare.toString(),
        driverEarnings: driverEarnings.toString(),
        platformCommission: platformCommission.toString(),
        distance: booking.distance.toString(),
        estimatedDuration: Math.round(booking.distance * 3),
        startTime: booking.status !== 'pending' ? new Date(Date.now() - 3600000) : undefined,
        endTime: booking.status === 'completed' ? new Date() : undefined,
      });
    }

    console.log('✅ Demo bookings created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📱 Demo Accounts:');
    console.log('Customer: 9876543210 (OTP: 123456)');
    console.log('Driver: 9876543211 (OTP: 123456)');
    console.log('Admin: 9876543212 (OTP: 123456)');
    console.log('\n💡 In development mode, use OTP: 123456 for all accounts');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✨ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
