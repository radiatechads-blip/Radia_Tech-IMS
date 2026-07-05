This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create or update `.env` with the values used by the database, admin login, uploads, and email delivery:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="use-a-long-random-secret"
ADMIN_EMAIL="admin@radiatech.in"
ADMIN_PASSWORD="use-a-strong-password"
SEED_SECRET="use-a-long-random-seed-secret"

RESEND_API_KEY="re_..."
EMAIL_FROM="Radiatech Electra <noreply@radiatech.in>"
ADMIN_NOTIFICATION_EMAIL="sales@radiatech.in"

NEXT_PUBLIC_SITE_URL="https://radiatech.in"
NEXT_PUBLIC_SITE_NAME="Radiatech Electra"
NEXT_PUBLIC_WHATSAPP_NUMBER="918178850959"
NEXT_PUBLIC_PHONE_NUMBER="+91 81788 50959"

R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="radiatech-images"
R2_PUBLIC_URL="https://pub-6f6e10a32fff4209bd4d2f49885eafe7.r2.dev"
```

`ADMIN_NOTIFICATION_EMAIL` can contain one email address or a comma-separated list. Customer confirmation emails are sent to the email entered in the inquiry form when one is provided.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# IMS" 
