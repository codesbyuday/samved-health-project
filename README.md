# SMC Smart Health System

Production-ready Next.js + Supabase hospital portal for the Solapur Municipal Corporation health system.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase database and storage

## Environment Variables

Create a local `.env` from `.env.example`.

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Recommended for production:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

The service role key is used by server routes that must securely read protected data. Do not expose it to the browser.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

## Deploying

### Vercel

1. Import the repository into Vercel.
2. Add the environment variables from `.env.example`.
3. Set the framework preset to `Next.js`.
4. Deploy with the default commands:

```bash
npm run build
npm run start
```

### Other Node Hosting

- Node 20+ is recommended.
- Use the same environment variables as Vercel.
- Run `npm run build` during deploy.
- Serve the app with `npm run start`.

## Production Notes

- The app uses local/system font fallbacks, so builds do not depend on Google Fonts being reachable.
- Appointment slip PDF generation now runs fully in Node.js and does not require Python on the server.
- For secure server-side Supabase operations, set `SUPABASE_SERVICE_ROLE_KEY` in production.
