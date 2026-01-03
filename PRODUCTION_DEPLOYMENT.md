# Production Deployment Guide

## Environment Variables

Before deploying to production, ensure all environment variables are properly configured in your hosting platform.

### Required Environment Variables

Copy the values from `.env.production.example` and set them in your production environment:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Base URL (CRITICAL - Must be your production domain)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Common Production Issues

### 412 Precondition Failed Errors

These errors typically occur due to:

1. **Missing or incorrect Cache-Control headers** - Fixed by the headers configuration in `next.config.ts`
2. **Browser extensions interfering** - Not an application issue
3. **CDN caching issues** - Clear your CDN cache after deployment

### Solutions Implemented

1. **Middleware** (`src/middleware.ts`):
   - Adds proper CORS headers for API routes
   - Sets Vary header to prevent caching issues
   - Handles preflight requests

2. **Next.js Headers** (`next.config.ts`):
   - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
   - Proper cache control for static assets (1 year)
   - No caching for API routes
   - Image optimization caching (1 day with stale-while-revalidate)

3. **Firebase Resource Loading**:
   - DNS prefetch configured in `src/app/layout.tsx`
   - Remote patterns whitelisted in `next.config.ts`

## Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Verify `NEXT_PUBLIC_BASE_URL` matches your production domain
- [ ] Test Firebase connection in production
- [ ] Test Mercado Pago integration in production
- [ ] Configure webhook URL in Mercado Pago dashboard
- [ ] Clear CDN cache after deployment
- [ ] Monitor console for errors after deployment

## Hosting Platform Configuration

### Railway / Nixpacks

The `nixpacks.toml` file is already configured. Ensure environment variables are set in the Railway dashboard.

### Vercel

1. Import your repository
2. Set environment variables in Project Settings → Environment Variables
3. Deploy

### Netlify

1. Import your repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Set environment variables in Site Settings → Environment Variables
5. Deploy

## Troubleshooting

### Images not loading

- Check Firebase Storage CORS configuration
- Verify remote patterns in `next.config.ts`
- Check browser console for specific errors

### API routes failing

- Verify environment variables are set
- Check API route logs in your hosting platform
- Ensure `NEXT_PUBLIC_BASE_URL` is correct

### Mercado Pago webhook not working

- Update webhook URL in Mercado Pago dashboard to: `https://yourdomain.com/api/mercadopago/webhook`
- Verify `MERCADOPAGO_WEBHOOK_SECRET` is set
- Check webhook logs in Mercado Pago dashboard
