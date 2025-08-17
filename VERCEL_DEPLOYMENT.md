# 🚀 Deploy Flask Backend on Vercel

## Overview
This guide will help you deploy your Flask backend on Vercel as serverless functions, which will be much faster than Render.

## 📁 Project Structure
```
vichaar/
├── api/
│   └── index.py          # Main Flask app for Vercel
├── src/                   # React frontend
├── vercel.json           # Vercel configuration
├── requirements.txt      # Python dependencies
└── backend.py           # Original Flask app (for local development)
```

## 🛠️ Setup Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Backend
```bash
vercel --prod
```

### 4. Configure Environment Variables (if needed)
In Vercel dashboard, go to your project → Settings → Environment Variables

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

### requirements.txt
```
flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
PyJWT==2.8.0
python-dotenv==1.0.0
```

## 🌐 API Endpoints

Your backend will be available at:
- **Production**: `https://your-project.vercel.app/api/`
- **Preview**: `https://your-project-git-branch.vercel.app/api/`

### Available Routes:
- `GET /api/` - Health check
- `POST /api/test-kmit` - Test KMIT API connection
- `POST /api/login-with-token` - Login with captcha
- `GET /api/student-profile` - Get student profile
- `GET /api/attendance` - Get attendance data
- `GET /api/subject-attendance` - Get subject attendance
- `GET /api/timetable` - Get timetable
- `GET /api/internal-results` - Get internal results
- `GET /api/semester-results` - Get semester results

## 🚀 Benefits of Vercel

1. **Speed**: Serverless functions are much faster than traditional servers
2. **Global CDN**: Automatic global distribution
3. **Auto-scaling**: Handles traffic spikes automatically
4. **Free Tier**: Generous free tier for development
5. **Easy Deployment**: Git-based deployments
6. **Built-in Analytics**: Performance monitoring included

## 🔄 Deployment Workflow

1. **Push to Git**: Your changes are automatically deployed
2. **Preview Deployments**: Each PR gets a preview URL
3. **Production**: Merge to main branch deploys to production

## 🐛 Troubleshooting

### Common Issues:

1. **Import Errors**: Make sure all packages are in `requirements.txt`
2. **CORS Issues**: Check the CORS configuration in `api/index.py`
3. **Timeout Errors**: Vercel has a 10-second timeout limit
4. **Environment Variables**: Set them in Vercel dashboard

### Debug Commands:
```bash
# Check Vercel status
vercel ls

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

## 📱 Frontend Integration

Update your frontend API client to use the new Vercel backend:

```typescript
const BACKEND_BASE_URL = 'https://your-project.vercel.app/api'
```

## 🎯 Next Steps

1. Deploy using `vercel --prod`
2. Test all API endpoints
3. Update frontend if needed
4. Monitor performance in Vercel dashboard

## 💡 Tips

- Keep functions lightweight (under 10 seconds)
- Use environment variables for sensitive data
- Monitor function execution times
- Set up proper error handling
- Use Vercel's edge functions for global performance
