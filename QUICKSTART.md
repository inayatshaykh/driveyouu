# Quick Start Guide 🚀

Get UR's Chauffeur Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL 14+ (or use Supabase)
- Git

## Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/inayatshaykh/driveyouu.git
cd driveyouu

# Install dependencies
npm install
# or
bun install
```

## Step 2: Environment Setup

```bash
# Copy environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Minimum required for local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/driveyouu
JWT_SECRET=your-secret-key-min-32-chars
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
WS_PORT=3001
VITE_WS_URL=ws://localhost:3001
```

## Step 3: Database Setup

```bash
# Push database schema
npm run db:push

# Seed demo data (optional but recommended)
npm run db:seed
```

## Step 4: Start Development

**Option A: Start Everything (Recommended)**
```bash
npm run dev:all
```

This starts:
- Main app on `http://localhost:3000`
- WebSocket server on `ws://localhost:3001`

**Option B: Start Separately**

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run dev:ws
```

## Step 5: Login

Open `http://localhost:3000` and login with demo accounts:

### Customer Account
- Mobile: `9876543210`
- OTP: `123456`

### Driver Account
- Mobile: `9876543211`
- OTP: `123456`

### Admin Account
- Mobile: `9876543212`
- OTP: `123456`

## Testing Real-time Features

### Test Live Tracking

1. **Login as Customer** (9876543210)
2. Create a new booking
3. **Login as Driver** (9876543211) in another browser/incognito
4. Accept the booking
5. Start the trip
6. Watch real-time location updates on customer's screen!

### Test WebSocket Connection

Open browser console and check for:
```
✅ WebSocket connected successfully
📍 User joined booking [booking-id]
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Or use Supabase (recommended)
# Get connection string from: https://supabase.com
```

### WebSocket Not Connecting

1. Check WebSocket server is running: `npm run dev:ws`
2. Verify `VITE_WS_URL` in `.env`
3. Check browser console for errors

## Next Steps

- 📖 Read [README.md](./README.md) for full documentation
- 🔌 Check [WEBSOCKET.md](./WEBSOCKET.md) for WebSocket details
- 🚀 See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- 📊 Review [PROJECT_STATUS.md](./PROJECT_STATUS.md) for progress

## Quick Commands

```bash
# Development
npm run dev:all          # Start app + WebSocket
npm run dev              # Start app only
npm run dev:ws           # Start WebSocket only

# Database
npm run db:push          # Apply schema changes
npm run db:seed          # Add demo data
npm run db:studio        # Open database GUI

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run start:ws         # Start WebSocket server
```

## Features to Try

### As Customer
✅ Add your vehicle  
✅ Create a booking  
✅ Track driver in real-time  
✅ View trip history  
✅ Check fare breakdown  

### As Driver
✅ Upload KYC documents  
✅ Accept bookings  
✅ Start/complete trips  
✅ View earnings (80% split)  
✅ Track location automatically  

### As Admin
✅ View analytics dashboard  
✅ Verify driver KYC  
✅ Monitor all bookings  
✅ Manage customers  
✅ Configure pricing  

## Support

Having issues? Check:
- [GitHub Issues](https://github.com/inayatshaykh/driveyouu/issues)
- [WebSocket Guide](./WEBSOCKET.md)
- [Full Documentation](./README.md)

---

**Happy Coding! 🎉**
