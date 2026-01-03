# Benê Brasil - E-commerce Platform

Moda feita de ritmo, cor e liberdade. E-commerce platform for Benê Brasil, celebrating Brazilian style with vibrant colors and unique pieces.

## Tech Stack

- **Framework:** Next.js 15.5.5 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Firebase (Firestore)
- **Authentication:** Firebase Auth
- **Payment:** Mercado Pago
- **Deployment:** Railway/Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Firebase project
- Mercado Pago account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

See `.env.example` for required environment variables. For production deployment, see `.env.production.example`.

**Critical for Production:**
- `NEXT_PUBLIC_BASE_URL` - Must be set to your production domain (e.g., `https://benebrasil.com`)

## Production Deployment

### Important: Fixing 412 Errors in Production

This project includes configurations to prevent 412 Precondition Failed errors in production:

1. **Middleware** (`src/middleware.ts`) - Handles CORS and caching headers
2. **Next.js Headers** (`next.config.ts`) - Proper cache control for static assets
3. **Environment Variables** - Ensure all variables are set in production

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Checklist

- [ ] Set all environment variables in your hosting platform
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your production domain
- [ ] Configure Mercado Pago webhook URL: `https://yourdomain.com/api/mercadopago/webhook`
- [ ] Test Firebase connection
- [ ] Clear CDN cache after deployment

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── contexts/         # React contexts (Auth, Cart)
├── lib/             # Utilities and Firebase config
└── middleware.ts    # Next.js middleware for headers/CORS
```

## Key Features

- Product catalog with collections
- Shopping cart with Mercado Pago integration
- User authentication and profiles
- Admin panel for content management
- Responsive design with Tailwind CSS
- Firebase real-time updates
- SEO optimized

## Documentation

- [Mercado Pago Setup](./MERCADOPAGO_SETUP.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Mercado Pago API](https://www.mercadopago.com.br/developers)
- [Tailwind CSS](https://tailwindcss.com/docs)
