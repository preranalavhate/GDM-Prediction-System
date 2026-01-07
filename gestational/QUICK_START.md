# Quick Start - Vercel Deployment

## ⚡ Fast Track Deployment (5 Minutes)

### 1. Prepare Firebase Service Account
```bash
# Download serviceAccountKey.json from Firebase Console
# Convert to single line:
cat serviceAccountKey.json | jq -c .
# Copy the output for next step
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add these environment variables:

**Required Variables:**
```
FIREBASE_SERVICE_ACCOUNT=<paste-single-line-json>
ML_API_URL=https://gestation-backend.onrender.com
VITE_FIREBASE_API_KEY=<from-firebase-console>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

4. Click **Deploy**

### 4. Update API URL
After first deployment:
1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Add environment variable:
   - `VITE_API_URL` = `https://your-app.vercel.app`
3. Redeploy

### 5. Test Your Deployment

Visit these URLs:
- Frontend: `https://your-app.vercel.app`
- API Health: `https://your-app.vercel.app/api/health`

## 📁 What Was Changed

- ✅ Created [vercel.json](vercel.json) - Vercel configuration
- ✅ Created [api/index.js](api/index.js) - Serverless API functions
- ✅ Created [.env.example](.env.example) - Backend env template
- ✅ Created [frontend/.env.example](frontend/.env.example) - Frontend env template
- ✅ Updated [.gitignore](.gitignore) - Added Vercel
- ✅ Updated [package.json](package.json) - Added build script

## 🔍 API Endpoints

All endpoints are now available at `/api/`:
- `POST /api/doctors/register` - Register doctor
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/patients/register` - Register patient
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/assessments` - Create assessment with ML prediction
- `GET /api/assessments/:id` - Get assessment
- `GET /api/health` - Health check

## 🐛 Common Issues

**Build fails?**
- Check Node.js version (requires >= 18.x)
- Verify all dependencies in package.json

**API returns 500?**
- Check Firebase service account is set correctly
- Verify it's a single-line JSON string
- Check Vercel function logs

**Frontend can't connect?**
- Verify `VITE_API_URL` is set to your Vercel URL
- Check browser console for errors

## 📚 Full Documentation

See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🆘 Need Help?

1. Check Vercel logs: Dashboard → Your Project → Functions
2. Check browser console: F12 → Console tab
3. Test API directly: `curl https://your-app.vercel.app/api/health`
