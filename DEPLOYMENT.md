# Deployment Guide 🚀

This guide covers deploying UR's Chauffeur Platform to production.

## Prerequisites

- Node.js 18+ or Bun runtime
- PostgreSQL database (Supabase recommended)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt or cloud provider)

## Recommended Hosting Options

### Option 1: Vercel (Recommended for Quick Deploy)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel
   ```

2. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables, add:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   VITE_GOOGLE_MAPS_API_KEY=your-key
   MSG91_AUTH_KEY=your-key
   MSG91_TEMPLATE_ID=your-template-id
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   RAZORPAY_KEY_ID=your-key
   RAZORPAY_KEY_SECRET=your-secret
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Create New Project**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` from the database settings

3. **Configure Environment Variables**
   - Go to your service → Variables
   - Add all environment variables from `.env.example`

4. **Deploy**
   - Railway will automatically deploy on every push to main branch

### Option 3: DigitalOcean App Platform

1. **Create App**
   ```bash
   # Install doctl CLI
   # Follow: https://docs.digitalocean.com/reference/doctl/how-to/install/
   
   doctl apps create --spec .do/app.yaml
   ```

2. **Configure Database**
   - Create a managed PostgreSQL database
   - Add connection string to environment variables

3. **Set Environment Variables**
   - In App Platform dashboard → Settings → App-Level Environment Variables

### Option 4: Self-Hosted (VPS)

#### Using PM2 (Process Manager)

1. **Setup Server**
   ```bash
   # SSH into your server
   ssh user@your-server-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone and Setup**
   ```bash
   # Clone repository
   git clone https://github.com/inayatshaykh/driveyouu.git
   cd driveyouu
   
   # Install dependencies
   npm install
   
   # Create .env file
   nano .env
   # Add all environment variables
   
   # Build application
   npm run build
   ```

3. **Start with PM2**
   ```bash
   # Start application
   pm2 start npm --name "driveyouu" -- start
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on boot
   pm2 startup
   ```

4. **Setup Nginx Reverse Proxy**
   ```bash
   # Install Nginx
   sudo apt-get install nginx
   
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/driveyouu
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/driveyouu /etc/nginx/sites-enabled/
   
   # Test configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

5. **Setup SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt-get install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   
   # Auto-renewal is setup automatically
   ```

## Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create new project
   - Copy the connection string

2. **Run Migrations**
   ```bash
   # Set DATABASE_URL in .env
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   
   # Push schema
   npm run db:push
   
   # Seed demo data (optional)
   npm run db:seed
   ```

3. **Enable Row Level Security (RLS)**
   - In Supabase Dashboard → Authentication → Policies
   - Create policies for each table based on user roles

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# MSG91 (SMS/OTP)
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_TEMPLATE_ID=your-msg91-template-id

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay (Payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Optional Variables

```env
# Node Environment
NODE_ENV=production

# Port (default: 3000)
PORT=3000

# WebSocket Port
WS_PORT=3001

# CORS Origins (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## API Keys Setup

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Distance Matrix API
4. Create API key
5. Restrict API key to your domain

### MSG91 (SMS/OTP)

1. Sign up at [MSG91](https://msg91.com)
2. Verify your account
3. Create OTP template
4. Get Auth Key from dashboard
5. Copy Template ID

### Cloudinary (File Storage)

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Configure upload presets for KYC documents

### Razorpay (Payments)

1. Sign up at [Razorpay](https://razorpay.com)
2. Complete KYC verification
3. Go to Settings → API Keys
4. Generate Key ID and Secret
5. Configure webhooks for payment events

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Google Maps API working
- [ ] SMS/OTP sending working
- [ ] File uploads working
- [ ] Payment gateway tested
- [ ] Admin account created
- [ ] Monitoring setup (optional)
- [ ] Backup strategy configured
- [ ] Error tracking setup (Sentry recommended)

## Monitoring & Logging

### Option 1: PM2 Monitoring

```bash
# View logs
pm2 logs driveyouu

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Option 2: Sentry (Error Tracking)

1. Sign up at [Sentry.io](https://sentry.io)
2. Create new project
3. Install Sentry SDK:
   ```bash
   npm install @sentry/react @sentry/node
   ```
4. Configure in your app

### Option 3: LogRocket (Session Replay)

1. Sign up at [LogRocket](https://logrocket.com)
2. Install SDK:
   ```bash
   npm install logrocket
   ```
3. Initialize in your app

## Backup Strategy

### Database Backups

**Automated (Supabase)**
- Supabase provides automatic daily backups
- Point-in-time recovery available

**Manual Backups**
```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_20240101.sql
```

### File Backups

- Cloudinary automatically stores all uploaded files
- No additional backup needed for files

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Use Nginx or cloud load balancer
   - Distribute traffic across multiple instances

2. **Database Connection Pooling**
   - Use PgBouncer for PostgreSQL
   - Configure max connections

3. **Caching**
   - Implement Redis for session storage
   - Cache frequently accessed data

### Vertical Scaling

- Upgrade server resources (CPU, RAM)
- Optimize database queries
- Enable database indexing

## WebSocket Server (Real-time Tracking)

For production WebSocket server:

```bash
# Create separate WebSocket server
# File: server/websocket.ts

import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    // Handle location updates
    // Broadcast to relevant clients
  });
});
```

Deploy WebSocket server separately or use managed service like Pusher/Ably.

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git
   - Use different keys for dev/staging/production
   - Rotate secrets regularly

2. **Database**
   - Enable SSL connections
   - Use connection pooling
   - Regular security updates

3. **API Security**
   - Rate limiting (use express-rate-limit)
   - CORS configuration
   - Input validation
   - SQL injection prevention (Drizzle ORM handles this)

4. **Authentication**
   - JWT token expiration
   - Refresh token rotation
   - OTP expiration (5 minutes)
   - Max OTP attempts (3)

5. **File Uploads**
   - Validate file types
   - Limit file sizes
   - Scan for malware
   - Use signed URLs

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Build Errors**
```bash
# Clear cache
rm -rf node_modules .next
npm install
npm run build
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Support

For deployment issues:
- GitHub Issues: [github.com/inayatshaykh/driveyouu/issues](https://github.com/inayatshaykh/driveyouu/issues)
- Email: support@yoursdomain.com

---

**Happy Deploying! 🚀**
