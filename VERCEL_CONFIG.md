# Vercel Configuration for LinkEdu Frontend

## ⚠️ If You See 404 Error

If you're getting a 404 NOT_FOUND error:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: cdg1::XXXXX
```

This means one of the following:

### 1. **VITE_API_URL not set in Vercel** (Most Likely)
The environment variable must be configured in Vercel's dashboard.

### 2. **Build failed silently**
Check Vercel deployment logs for build errors.

### 3. **Wrong project selected**
Make sure you're configuring the correct Vercel project.

---

## Critical: Set Environment Variables in Vercel Dashboard

The frontend deployment on Vercel **requires** the correct environment variables to be set. Follow these steps:

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- Select the **link-edu** project

### 2. Go to Settings > Environment Variables
- Click on **Settings** in the top navigation
- Select **Environment Variables** from the left sidebar

### 3. Add/Update the Following Variables

**For Production:**
- **Name:** `VITE_API_URL`
- **Value:** `https://backendlinkededu-main-oied8k.free.laravel.cloud`
- **Environments:** ✅ Production (check only this)

**For Preview (optional):**
- **Name:** `VITE_API_URL`
- **Value:** `https://backendlinkededu-main-oied8k.free.laravel.cloud`
- **Environments:** ✅ Preview (if you want preview deploys to use production backend)

### 4. Redeploy
After setting the environment variables:
- Go to **Deployments** tab
- Find the most recent deployment
- Click the **...** menu and select **Redeploy**
- Wait for the deployment to complete

---

## Verification

Once deployed, open the browser console (F12) on https://link-edu.vercel.app and check:
```javascript
// In browser console
// You should see:
// Environment VITE_API_URL: https://backendlinkededu-main-oied8k.free.laravel.cloud
// Is production: true  Protocol: https:
```

---

## Troubleshooting

### If you see 404 NOT_FOUND
1. **Check Vercel Logs:**
   - Go to Deployments tab
   - Click on the failed deployment
   - Check the build logs for errors
   
2. **Verify Environment Variables:**
   - Settings > Environment Variables
   - Ensure `VITE_API_URL` is set
   - The value should be: `https://backendlinkededu-main-oied8k.free.laravel.cloud`
   
3. **Redeploy:**
   - After adding/updating environment variables, always redeploy
   - The deployment must happen AFTER variables are set
   - Go to Deployments > Most Recent > ... > Redeploy

### If you see "http://link-edu.vercel.app:8000"
This means `VITE_API_URL` is not properly set in Vercel. The fallback rewrite logic is incorrectly rewriting the URL.
- Check that `VITE_API_URL` is set in Vercel dashboard
- Trigger a new deployment

### If you see Network Error in login
1. Check backend is running: https://backendlinkededu-main-oied8k.free.laravel.cloud/sanctum/csrf-cookie
   - Should return 204 No Content
2. Check CORS in backend config at [backend/config/cors.php](backend/config/cors.php)
   - Should include `https://link-edu.vercel.app` in allowed origins patterns
3. Check browser console for detailed error messages

### Build takes too long or fails
- Check Node.js version: `.nvmrc` file specifies v20
- Clear Vercel cache: Settings > Git > Clear Build Cache
- Check package.json for any pre/post build hooks that might hang

---

## Local Development

For local development (http://localhost:5173), the .env file should have:
```
VITE_API_URL=http://127.0.0.1:8000
```

This is already set correctly in the repository.

---

## Quick Checklist

- [ ] Go to Vercel dashboard
- [ ] Select link-edu project
- [ ] Go to Settings > Environment Variables
- [ ] Add `VITE_API_URL` = `https://backendlinkededu-main-oied8k.free.laravel.cloud`
- [ ] Go to Deployments > Most Recent
- [ ] Click `...` menu > Redeploy
- [ ] Wait for deployment to complete
- [ ] Check https://link-edu.vercel.app for 404
- [ ] Open browser console and verify environment variable logged
