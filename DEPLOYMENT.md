# Mangaken Deployment Guide

## Overview
This project is deployed using:
- **Server**: Render.com
- **Client**: Netlify.com

## Server Deployment (Render)

1. **Connect Repository**: Link your GitHub repository to Render
2. **Service Configuration**: 
   - Service Type: Web Service
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node.js

3. **Environment Variables** (Set in Render Dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   MANGADX_API_BASE_URL=https://api.mangadx.org
   CLIENT_URL=https://mangaken-app.netlify.app
   ```

## Client Deployment (Netlify)

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Configuration**:
   - Base Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `dist`

3. **Environment Variables** (if needed):
   - No specific environment variables required for client

## Important URLs

- **Production Server**: https://mangaken-server.onrender.com
- **Production Client**: https://mangaken-app.netlify.app

## Local Development

1. **Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Notes

- The client automatically proxies `/api/*` requests to the Render server
- CORS is configured to allow requests from the Netlify domain
- All Vercel configurations have been removed
