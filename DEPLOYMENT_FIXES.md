# Deployment Fixes for Vercel

## Issues Fixed

### 1. Missing TanStack Start Config Export
**Error**: `Missing "./config" specifier in "@tanstack/react-start" package`

**Solution**: Changed from `@tanstack/react-start/config` to standard Vite config approach.

**Files Modified**:
- `vite.config.ts` - Now uses `defineConfig` from `vite` instead of `@tanstack/react-start/config`

### 2. Missing Entry Points
**Issue**: No HTML entry point or client/server entry files for Vite

**Solution**: Created proper entry points for Vite build system.

**Files Created**:
- `index.html` - Main HTML entry point
- `src/entry-client.tsx` - Client-side entry point for browser
- `src/entry-server.tsx` - Server-side entry point for SSR

### 3. Vercel Configuration
**Issue**: No Vercel-specific configuration

**Solution**: Created `vercel.json` with proper build settings.

**Files Created**:
- `vercel.json` - Specifies build command, output directory, and install command

## Changes Summary

### vite.config.ts
```typescript
// Before
import { defineConfig } from "@tanstack/react-start/config";

// After
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
```

### Build Configuration
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Framework**: Vite with TanStack Router

### SSR Configuration
- Externalized server-only packages: `pg`, `drizzle-orm`, `ws`, `jsonwebtoken`, `bcryptjs`
- Included TanStack packages in SSR bundle: `@tanstack/react-router`, `@tanstack/react-query`

## Deployment Status

✅ Fixed vite.config import error  
✅ Added HTML entry point  
✅ Added client entry point  
✅ Added server entry point  
✅ Created Vercel configuration  
✅ Configured proper build output  
✅ Pushed to GitHub

## Next Steps

1. Vercel will automatically detect the new commit and trigger a deployment
2. Monitor the Vercel deployment logs for any remaining issues
3. Once deployed, test all features in production environment

## Environment Variables Needed

Before the app can fully function in production, configure these environment variables in Vercel:

### Database
- `DATABASE_URL` - PostgreSQL connection string (Supabase)

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens

### SMS (MSG91)
- `MSG91_AUTH_KEY` - MSG91 authentication key
- `MSG91_SENDER_ID` - Sender ID (e.g., URSCHR)

### Google Maps
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API key

### Payments (Razorpay)
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key

### File Storage (Cloudinary)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### WebSocket
- `VITE_WS_URL` - WebSocket server URL (e.g., wss://api.urschauffeur.com)
- `WS_PORT` - WebSocket server port (default: 3001)

### App
- `NODE_ENV` - Set to `production`
- `PORT` - Server port (default: 3000)

## Notes

- The WebSocket server (`server/index.ts`) needs to be deployed separately as it runs on a different port
- Database migrations need to be run after deployment: `npm run db:migrate`
- Initial pricing configuration should be seeded: `npm run db:seed`

---

**Last Updated**: May 17, 2026  
**Status**: Ready for deployment
