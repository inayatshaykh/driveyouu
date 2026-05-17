# UR's Chauffeur Platform 🚗

A comprehensive driver booking platform built with modern web technologies. Book verified chauffeurs to drive your own car across North India.

## 🌟 Features

### Customer Portal
- **OTP-based Authentication** - Secure login without passwords
- **Vehicle Management** - Add and manage multiple vehicles
- **Smart Booking Flow** - On-demand, scheduled, hourly, and outstation bookings
- **Live Tracking** - Real-time driver location tracking with Google Maps
- **Trip History** - View past bookings and receipts
- **SOS Alert** - Emergency assistance during trips
- **Trip Sharing** - Share live trip details with family/friends

### Driver Portal
- **KYC Upload System** - Upload Aadhaar, PAN, License, RC, and photo
- **Ride Management** - Accept/reject bookings, start/end trips
- **Earnings Dashboard** - Track earnings with 80/20 split (Driver/Platform)
- **Real-time Location** - Auto-update location for customer tracking
- **Trip History** - View completed trips and earnings

### Admin Dashboard
- **Analytics Dashboard** - Revenue, bookings, and performance metrics
- **Driver Management** - Verify KYC, approve/reject drivers, manage status
- **Booking Management** - Monitor all bookings, manual driver assignment
- **Customer Management** - View customer profiles, booking history, vehicles
- **Pricing Configuration** - Set pricing rules by city and booking type
- **Commission Tracking** - Monitor 80/20 revenue split

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 SSR)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: TailwindCSS 4.x + [Radix UI](https://www.radix-ui.com/)
- **Maps**: Google Maps JavaScript API
- **SMS**: MSG91 for OTP
- **Payment**: Razorpay (to be integrated)
- **File Storage**: Cloudinary (to be integrated)
- **Real-time**: WebSocket for live tracking

## 📋 Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL 14+
- Google Maps API Key
- MSG91 Account (for OTP)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/inayatshaykh/driveyouu.git
cd driveyouu
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/driveyouu

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# MSG91 (for OTP)
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_TEMPLATE_ID=your-template-id

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay (for payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### 4. Database Setup

Run database migrations:
```bash
bun run db:push
```

Or with npm:
```bash
npm run db:push
```

### 5. Seed Demo Data (Optional)

To populate the database with demo data for testing:
```bash
bun run db:seed
```

This will create:
- 3 demo users (customer, driver, admin)
- Sample vehicles
- Sample bookings
- Pricing configurations

### 6. Start Development Server

```bash
bun run dev
```

Or with npm:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 👥 Demo Accounts

After seeding, you can login with these demo accounts:

### Customer
- Mobile: `9876543210`
- OTP: `123456` (in development mode)

### Driver
- Mobile: `9876543211`
- OTP: `123456`

### Admin
- Mobile: `9876543212`
- OTP: `123456`

## 📁 Project Structure

```
driveyouu-main/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── auth/           # Authentication components
│   │   ├── customer/       # Customer portal components
│   │   ├── driver/         # Driver portal components
│   │   └── ui/             # Reusable UI components (Radix)
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── db/                 # Database schema and connection
│   ├── routes/             # TanStack Router routes
│   │   ├── api/           # API endpoints
│   │   ├── admin/         # Admin routes
│   │   ├── customer/      # Customer routes
│   │   └── driver/        # Driver routes
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
├── drizzle.config.ts      # Drizzle ORM configuration
├── package.json           # Dependencies and scripts
└── vite.config.ts         # Vite configuration
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/register` - Register new user

### Customer APIs
- `POST /api/customer/vehicles` - Add vehicle
- `GET /api/customer/vehicles` - Get all vehicles
- `POST /api/customer/bookings` - Create booking
- `GET /api/customer/bookings` - Get booking history
- `POST /api/customer/bookings/:id/cancel` - Cancel booking

### Driver APIs
- `POST /api/driver/kyc` - Upload KYC documents
- `GET /api/driver/kyc` - Get KYC status
- `GET /api/driver/rides` - Get assigned rides
- `POST /api/driver/rides/:id/accept` - Accept ride
- `POST /api/driver/rides/:id/start` - Start trip
- `POST /api/driver/rides/:id/complete` - Complete trip
- `GET /api/driver/earnings` - Get earnings summary

### Admin APIs
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/drivers` - Get all drivers
- `PUT /api/admin/drivers/:id/verify` - Verify driver
- `GET /api/admin/bookings` - Get all bookings
- `POST /api/admin/bookings/:id/assign` - Assign driver
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/pricing` - Get pricing config
- `POST /api/admin/pricing` - Create pricing rule

## 💰 Commission Model

The platform operates on an **80/20 revenue split**:
- **80%** goes to the driver
- **20%** is platform commission

This split is automatically calculated for each completed booking.

## 🗺️ Booking Types

1. **On-Demand** - Immediate pickup
2. **Scheduled** - Book for a future date/time
3. **Hourly** - Book driver for specific hours
4. **Outstation** - Long-distance trips

## 📱 Mobile Responsive

The entire platform is fully responsive and optimized for mobile devices with:
- Touch-friendly interfaces
- Bottom navigation for mobile
- Optimized map interactions
- Progressive Web App (PWA) ready

## 🔒 Security Features

- JWT-based authentication
- OTP verification (no passwords)
- Role-based access control (Customer, Driver, Admin)
- Secure API endpoints
- Input validation and sanitization
- SQL injection prevention with Drizzle ORM

## 🚧 Upcoming Features

- [ ] WebSocket integration for real-time updates
- [ ] Push notifications
- [ ] In-app chat between customer and driver
- [ ] Payment gateway integration (Razorpay)
- [ ] Automated driver matching algorithm
- [ ] Rating and review system
- [ ] Referral program
- [ ] Multi-language support
- [ ] Driver heat maps
- [ ] Advanced analytics and reporting

## 📝 Scripts

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run start            # Start production server

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed demo data

# Code Quality
bun run lint             # Run ESLint
bun run format           # Format with Prettier
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Mohd Inayat**
- GitHub: [@inayatshaykh](https://github.com/inayatshaykh)

## 🙏 Acknowledgments

- [TanStack](https://tanstack.com/) for the amazing React framework
- [Drizzle ORM](https://orm.drizzle.team/) for the type-safe database toolkit
- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

**Built with ❤️ for the future of on-demand driver services**
