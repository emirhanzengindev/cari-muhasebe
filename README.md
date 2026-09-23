This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Inter](https://fonts.google.com/specimen/Inter).

## Routes

The application is split into a public marketing area and a private application area.

Public (indexable, no session required):

- `/` – landing page
- `/cari-hesap-programi`, `/stok-takip-programi`, `/fatura-programi`, `/tahsilat-takip-programi`
- `/blog` and `/blog/<slug>` articles
- `/auth/signin`, `/auth/signup` (marked `noindex`)

Private (session required, marked `noindex`, excluded from `robots.txt` and the sitemap):

- `/dashboard` (panel summary)
- `/current-accounts`, `/inventory`, `/invoices`, `/quick-sales`, `/finance`, `/reports`

Access rules live in `middleware.ts`; sitemap and robots are generated from `src/app/sitemap.ts` and `src/app/robots.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
