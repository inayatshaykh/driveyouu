# Testing Instructions - Input Freeze Fix

## ⚠️ CRITICAL: You MUST restart the dev server first!

The bug was a JavaScript runtime error that requires a fresh server start.

## Step 1: Restart Dev Server

```bash
# In your terminal, press Ctrl+C to stop the current server
# Then run:
npm run dev
```

Wait for the message: `Local: http://localhost:5173/` (or similar)

## Step 2: Clear Browser Cache

1. Open your browser
2. Press `F12` to open DevTools
3. Right-click the refresh button (next to address bar)
4. Select **"Empty Cache and Hard Reload"**

OR

1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"

## Step 3: Test Login Page

1. Navigate to: `http://localhost:5173/login`
2. Enter mobile number: `9876543210`
3. Click **"Send OTP"**
4. **Click on the first OTP input box** ← This should NOT freeze
5. Enter OTP: `1234`
6. Should redirect to `/booking` without freezing

## Step 4: Test Location Input

1. Navigate to: `http://localhost:5173/booking`
2. **Click on "Pickup Location" input** ← This should NOT freeze
3. Type: `del` (at least 3 letters)
4. Suggestions should appear without freezing
5. Click on a suggestion
6. Input should populate without freezing

## Step 5: Test Other Inputs

1. Try clicking on "Date" input
2. Try clicking on "Time" input
3. Try clicking on "Vehicle Category" buttons
4. All should work without freezing

## What Was Fixed?

**The Bug:** In `src/routes/login.tsx`, line 48 had:
```typescript
const userInfo = DEMO_USERS[mobile];
if (!userInfo) {
  userInfo = { ... }; // ❌ ERROR: Can't reassign const!
}
```

**The Fix:** Changed to:
```typescript
let userInfo = DEMO_USERS[mobile];
if (!userInfo) {
  userInfo = { ... }; // ✅ Now works!
}
```

This JavaScript error was causing the entire page to freeze when any input was clicked.

## If It Still Freezes

### Check Browser Console (F12 → Console)
Look for red error messages. Common issues:

1. **"Cannot assign to 'userInfo' because it is a constant"**
   - Server wasn't restarted properly
   - Solution: Kill all node processes and restart

2. **"Failed to fetch"** or network errors
   - Dev server isn't running
   - Solution: Check terminal, restart `npm run dev`

3. **"Module not found"** errors
   - Dependencies issue
   - Solution: Run `npm install` then `npm run dev`

### Kill All Node Processes (Windows)

If restart doesn't work:

```bash
# In PowerShell or CMD:
taskkill /F /IM node.exe
taskkill /F /IM npm.exe

# Then restart:
npm run dev
```

### Check Dev Server Port

If you see "Port already in use":

```bash
# Find what's using port 5173:
netstat -ano | findstr :5173

# Kill that process (replace PID with actual number):
taskkill /F /PID <PID>

# Then restart:
npm run dev
```

## Demo Accounts

| Mobile | Role | Redirects To |
|--------|------|--------------|
| 9876543210 | Customer | /booking |
| 9876543212 | Admin | /admin |
| 9876543211 | Driver | /driver |

**Demo OTP:** `1234` (always works)

## Success Criteria

✅ Login page loads without errors
✅ Can click on mobile number input
✅ Can click on OTP inputs
✅ Can enter OTP digits
✅ Redirects after successful OTP
✅ Location input accepts clicks
✅ Location suggestions appear
✅ Can select from suggestions
✅ All other inputs work normally

## Still Having Issues?

Share these details:

1. **Browser Console Errors** (F12 → Console tab, screenshot the red errors)
2. **Dev Server Output** (Copy the terminal output where `npm run dev` is running)
3. **Network Tab** (F12 → Network tab, check if any requests are failing)
4. **Browser & Version** (Chrome 120, Firefox 121, etc.)
5. **What exactly happens** (Does it freeze immediately? After typing? etc.)

---

**Expected Result:** All inputs should work smoothly without any freezing or browser "Page Unresponsive" dialogs.
