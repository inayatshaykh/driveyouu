# Admin Panel Access Guide

## 🔐 Admin Credentials

### Demo Admin Account

After running the database seed script, you can access the admin panel with:

**Mobile Number**: `9876543212`  
**OTP (Development Mode)**: `123456`  
**Role**: Admin

## 📋 How to Access Admin Panel

### Step 1: Seed the Database

First, make sure you've seeded the database with demo data:

```bash
# Using Bun
bun run db:seed

# Or using npm
npm run db:seed
```

This will create:
- ✅ Demo admin user (mobile: 9876543212)
- ✅ Demo customer user (mobile: 9876543210)
- ✅ Demo driver user (mobile: 9876543211)
- ✅ Sample vehicles, bookings, and pricing configurations

### Step 2: Start the Application

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

The app will be available at: `http://localhost:3000`

### Step 3: Login as Admin

1. **Go to the login page**: `http://localhost:3000/login`

2. **Enter admin mobile number**: `9876543212`

3. **Click "Send OTP"**

4. **Enter OTP**: `123456` (in development mode, this OTP works for all accounts)

5. **Click "Verify OTP"**

6. **You'll be redirected to**: `http://localhost:3000/admin`

## 🎯 Admin Panel Features

Once logged in, you'll have access to:

### 1. Dashboard (`/admin`)
- Platform analytics and metrics
- Total revenue, bookings, drivers, customers
- Completion and cancellation rates
- 80/20 revenue split breakdown

### 2. Drivers Management (`/admin/drivers`)
- View all registered drivers
- Verify KYC documents
- Approve/reject driver applications
- Activate/deactivate driver accounts
- View driver details and trip history

### 3. Bookings Management (`/admin/bookings`)
- View all bookings (pending, active, completed, cancelled)
- Manually assign drivers to bookings
- Update booking status
- View booking details and route information

### 4. Customers Management (`/admin/customers`)
- View all registered customers
- View customer profiles and vehicle information
- View customer booking history
- Handle customer complaints

### 5. SOS Alerts (`/admin/sos`)
- Monitor active SOS alerts
- View SOS alert details (location, driver, customer)
- Resolve SOS alerts
- View SOS history

### 6. Pricing Configuration (`/admin/pricing`)
- Configure pricing by city and booking type
- Set base fare, per-km rate, per-minute rate
- Configure surge multipliers
- Activate/deactivate pricing rules

## 🔒 Authentication & Authorization

### How It Works

The admin panel uses **role-based access control**:

1. **Authentication**: OTP-based login via mobile number
2. **Authorization**: User role stored in JWT token
3. **Route Protection**: Admin routes check for `role === 'admin'`

### Code Implementation

```typescript
// In src/routes/admin/index.tsx
export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (!token || !user) {
      throw redirect({ to: '/login' }); // Not logged in
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 'admin') {
      throw redirect({ to: '/' }); // Not an admin
    }
  },
});
```

### Security Features

- ✅ JWT token stored in localStorage
- ✅ Role-based route protection
- ✅ Automatic redirect if not authenticated
- ✅ Automatic redirect if not admin role
- ✅ Token expiration (30 days)

## 👥 All Demo Accounts

### Customer Account
- **Mobile**: `9876543210`
- **OTP**: `123456`
- **Role**: Customer
- **Access**: Customer portal (`/customer`)

### Driver Account
- **Mobile**: `9876543211`
- **OTP**: `123456`
- **Role**: Driver
- **Access**: Driver portal (`/driver`)

### Admin Account
- **Mobile**: `9876543212`
- **OTP**: `123456`
- **Role**: Admin
- **Access**: Admin panel (`/admin`)

## 🚀 Production Setup

### Creating Real Admin Accounts

In production, you'll need to:

1. **Manually insert admin user** into the database:

```sql
-- Insert admin user
INSERT INTO users (mobile, role, name, email)
VALUES ('+919876543212', 'admin', 'Admin Name', 'admin@urschauffeur.com');
```

2. **Or use a migration script**:

```typescript
// scripts/create-admin.ts
import { db, users } from '../src/db';

async function createAdmin() {
  const mobile = process.argv[2]; // Get mobile from command line
  const name = process.argv[3] || 'Admin';
  
  if (!mobile) {
    console.error('Usage: npm run create-admin <mobile> [name]');
    process.exit(1);
  }

  await db.insert(users).values({
    mobile,
    role: 'admin',
    name,
    email: `${mobile}@admin.com`,
  });

  console.log(`✅ Admin created: ${mobile}`);
}

createAdmin();
```

Then run:
```bash
npm run create-admin 9876543212 "John Doe"
```

### Production OTP

In production, **real OTPs** will be sent via MSG91:

1. User enters mobile number
2. System generates 6-digit OTP
3. OTP sent via MSG91 SMS
4. OTP valid for 10 minutes
5. Max 3 attempts allowed

## 🔧 Troubleshooting

### Issue: "Cannot access admin panel"

**Solution**: Check if you're logged in with an admin account:

```javascript
// Open browser console and check:
console.log(localStorage.getItem('auth_user'));

// Should show: {"id":"...","mobile":"9876543212","role":"admin","name":"Demo Admin"}
```

### Issue: "Redirected to login page"

**Solution**: Your session expired or you're not logged in. Login again with admin credentials.

### Issue: "Redirected to home page"

**Solution**: You're logged in but not as an admin. Logout and login with admin mobile number `9876543212`.

### Issue: "OTP not working"

**Solution**: 
- In development mode, use OTP: `123456`
- Make sure you've seeded the database
- Check if the user exists in the database

## 📱 Mobile Access

The admin panel is **fully responsive** and works on mobile devices:

- ✅ Mobile-friendly sidebar (hamburger menu)
- ✅ Touch-optimized controls
- ✅ Responsive tables and charts
- ✅ Works on tablets and phones

## 🎨 Admin Panel UI

The admin panel features:

- **Modern Design**: Clean, professional interface
- **Dark Mode Support**: Automatically adapts to system theme
- **Sidebar Navigation**: Easy access to all sections
- **Real-time Updates**: WebSocket integration for live data
- **Data Visualization**: Charts and graphs for analytics
- **Responsive Layout**: Works on all screen sizes

## 📊 Admin Capabilities

### What Admins Can Do

✅ View platform analytics and metrics  
✅ Manage driver verification and approval  
✅ Manually assign drivers to bookings  
✅ Monitor and resolve SOS alerts  
✅ Configure pricing by city and type  
✅ View all customers and their bookings  
✅ Track platform revenue and commission  
✅ Activate/deactivate drivers  
✅ Update booking statuses  
✅ View real-time driver locations  

### What Admins Cannot Do

❌ Cannot access customer/driver passwords (OTP-based auth)  
❌ Cannot modify completed bookings  
❌ Cannot delete users (only deactivate)  
❌ Cannot access payment gateway directly  

## 🔐 Security Best Practices

### For Production

1. **Use Strong Admin Mobile Numbers**: Don't use predictable numbers
2. **Enable 2FA**: Add additional authentication layer
3. **Limit Admin Accounts**: Only create necessary admin users
4. **Audit Logs**: Track all admin actions
5. **IP Whitelisting**: Restrict admin access to specific IPs
6. **Session Timeout**: Set shorter session timeouts for admins
7. **Regular Password Rotation**: Change admin credentials regularly

### Environment Variables

```env
# Admin-specific settings
ADMIN_SESSION_TIMEOUT=3600000  # 1 hour (in milliseconds)
ADMIN_IP_WHITELIST=192.168.1.1,10.0.0.1
ADMIN_2FA_ENABLED=true
```

## 📞 Support

If you have issues accessing the admin panel:

1. Check the browser console for errors
2. Verify database connection
3. Ensure seed script ran successfully
4. Check localStorage for auth tokens
5. Review server logs for authentication errors

---

**Quick Access**: `http://localhost:3000/admin`  
**Demo Admin**: `9876543212` / OTP: `123456`  
**Status**: ✅ Ready to use after database seeding

---

**Last Updated**: May 17, 2026  
**Version**: 1.0.0
