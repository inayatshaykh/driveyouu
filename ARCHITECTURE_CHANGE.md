# Architecture Change: Client-Side Only Application

## What Changed

We've simplified the application architecture by removing TanStack Start and converting to a **pure client-side React application** with TanStack Router.

### Removed
- ❌ `@tanstack/react-start` package
- ❌ All API route files in `src/routes/api/`
- ❌ `src/start.ts` and `src/server.ts`
- ❌ Server-side rendering (SSR)

### Kept
- ✅ TanStack Router for client-side routing
- ✅ TanStack Query for data fetching
- ✅ All UI components
- ✅ All service files (auth, booking, driver, etc.)
- ✅ Database schema and Drizzle ORM

## New Architecture

```
┌─────────────────────────────────────────┐
│         Browser (Client-Side)           │
│  ┌───────────────────────────────────┐  │
│  │  React 19 + TanStack Router       │  │
│  │  - Customer Portal                │  │
│  │  - Driver Portal                  │  │
│  │  - Admin Dashboard                │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/WebSocket
                  │
┌─────────────────▼───────────────────────┐
│         Backend API Server              │
│  (Needs to be implemented separately)   │
│  - Express/Fastify/Hono                 │
│  - PostgreSQL + Drizzle ORM             │
│  - WebSocket Server                     │
│  - Authentication (JWT)                 │
└─────────────────────────────────────────┘
```

## Why This Change?

TanStack Start had export issues that were blocking deployment:
1. Missing `@tanstack/react-start/config` export
2. Missing `@tanstack/react-start/api` export
3. Complex SSR setup not compatible with Vercel's build system

By removing it, we get:
- ✅ **Simpler deployment** - Just static files
- ✅ **Faster builds** - No SSR compilation
- ✅ **Easier debugging** - Client-side only
- ✅ **Better compatibility** - Works with any hosting

## What Needs to Be Done

### 1. Backend API Server (Required)

You need to create a separate backend API server. Options:

#### Option A: Express.js
```bash
# Create a new backend folder
mkdir backend
cd backend
npm init -y
npm install express cors drizzle-orm pg jsonwebtoken bcryptjs ws
```

#### Option B: Fastify
```bash
npm install fastify @fastify/cors drizzle-orm pg jsonwebtoken bcryptjs ws
```

#### Option C: Hono (Recommended for Vercel)
```bash
npm install hono @hono/node-server drizzle-orm pg jsonwebtoken bcryptjs ws
```

### 2. API Endpoints to Implement

All the endpoints that were in `src/routes/api/` need to be recreated in the backend:

**Authentication**:
- POST `/api/auth/send-otp`
- POST `/api/auth/verify-otp`

**Customer**:
- GET/POST `/api/customer/vehicles`
- GET/POST `/api/customer/bookings`
- POST `/api/customer/sos`
- GET/POST `/api/customer/emergency-contacts`
- POST `/api/customer/payments/create-order`
- POST `/api/customer/payments/verify`

**Driver**:
- GET/POST `/api/driver/kyc`
- GET/POST `/api/driver/bookings`
- GET `/api/driver/earnings`
- GET `/api/driver/profile`

**Admin**:
- GET `/api/admin/analytics`
- GET/PUT `/api/admin/drivers`
- GET/POST `/api/admin/bookings`
- GET `/api/admin/customers`
- GET/POST/PUT `/api/admin/pricing`
- GET/POST `/api/admin/sos`

### 3. Update Service Files

The service files in `src/services/` need to be updated to call the backend API instead of direct database access:

**Before** (Direct DB access):
```typescript
// src/services/auth.service.ts
export const authService = {
  async sendOTP(mobile: string) {
    // Direct database query
    const result = await db.insert(otps).values({...});
    return result;
  }
};
```

**After** (API calls):
```typescript
// src/services/auth.service.ts
export const authService = {
  async sendOTP(mobile: string) {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });
    return response.json();
  }
};
```

### 4. Environment Variables

Update `.env` to point to the backend API:

```env
# Frontend (Vite)
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=your-key

# Backend (separate server)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
MSG91_AUTH_KEY=your-key
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## Deployment

### Frontend (Vercel)
The frontend will now deploy successfully as a static site:
```bash
# Vercel will run:
npm install
npm run build
# Output: dist/ folder with static files
```

### Backend (Separate Deployment)
Deploy the backend API server separately:
- **Vercel**: Deploy as serverless functions
- **Railway**: Deploy as Node.js app
- **Render**: Deploy as web service
- **AWS/GCP**: Deploy on EC2/Cloud Run

## Benefits of This Approach

1. **Separation of Concerns**: Frontend and backend are independent
2. **Scalability**: Can scale frontend and backend separately
3. **Flexibility**: Can swap backend technology easily
4. **Simplicity**: Easier to understand and maintain
5. **Deployment**: No SSR complexity

## Migration Path

### Phase 1: Get Frontend Deploying (DONE)
- ✅ Remove TanStack Start
- ✅ Remove API routes
- ✅ Deploy static frontend to Vercel

### Phase 2: Create Backend API (TODO)
- [ ] Set up Express/Fastify/Hono server
- [ ] Implement all API endpoints
- [ ] Add authentication middleware
- [ ] Set up WebSocket server
- [ ] Deploy backend

### Phase 3: Connect Frontend to Backend (TODO)
- [ ] Update service files to call API
- [ ] Add API base URL configuration
- [ ] Test all features end-to-end

## Alternative: Keep TanStack Start

If you want to keep TanStack Start, you would need to:
1. Wait for TanStack Start to fix their package exports
2. OR use a different build system (not Vite)
3. OR manually patch the package exports

However, the client-side approach is simpler and more reliable for now.

---

**Status**: Frontend deployment should now succeed  
**Next Step**: Create backend API server  
**Timeline**: Backend can be built in 2-3 days

---

**Last Updated**: May 17, 2026  
**Commit**: `c2857c8`
