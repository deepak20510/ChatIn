# ChatIn Deployment Checklist - 401 Error Fix

## ✅ Code Changes Applied

All backend and frontend code has been fixed to handle cross-domain authentication properly:

- ✅ Cookie settings optimized for cross-domain (sameSite=none, secure=true)
- ✅ CORS configuration with proper credentials support
- ✅ Trust proxy enabled for Render production environment
- ✅ Socket.io URL properly configured
- ✅ Axios with proper withCredentials

## 🔧 Required Environment Variables

### Render Backend (.env)

```
PORT=3000
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=https://your-frontend-domain.vercel.app
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=ChatIn
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=production
```

### Vercel Frontend

Go to Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-render-backend-app.onrender.com
```

## 📋 Deployment Steps

1. **Update Render Backend:**
   - Go to Render Dashboard → Select your service
   - Go to Settings → Environment
   - Update `CLIENT_URL` to your Vercel URL
   - Save and redeploy

2. **Update Vercel Frontend:**
   - Go to Vercel Dashboard → Select your project
   - Go to Settings → Environment Variables
   - Add `VITE_API_URL=https://your-render-app.onrender.com`
   - Redeploy

3. **Verify Deployment:**
   - Wait for both services to fully deploy
   - Test login flow in production
   - Check browser DevTools for cookie headers

## 🔍 Debugging

### Check if cookies are sent:

1. Open DevTools → Network tab
2. Make a request to `/api/auth/check`
3. Check Request Headers for: `Cookie: jwt=...`
4. Check Response Headers for: `Set-Cookie: jwt=...`

### Check CORS:

1. Response Headers should have: `Access-Control-Allow-Credentials: true`
2. Response Headers should have: `Access-Control-Allow-Origin: https://your-vercel-url.vercel.app`

### Backend Logs:

- Check Render logs for debug output from auth middleware
- Look for: "Auth Guard - Cookies:"

## 🚨 Common Issues

| Issue                      | Solution                                                     |
| -------------------------- | ------------------------------------------------------------ |
| Still getting 401          | Try clearing browser cookies and logging in again            |
| Cookie not sent            | Ensure VITE_API_URL matches your Render URL exactly          |
| CORS error                 | Verify CLIENT_URL is set on Render and matches Vercel domain |
| Socket.io connection fails | Check that SOCKET_URL is correct in auth store               |

## ✨ Success Indicators

- Login works and redirects to chat
- Auth check endpoint returns 200 with user data
- Cookies visible in DevTools
- No 401 errors on subsequent requests
