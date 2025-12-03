# NPS Widget & Backend

A production-ready Next.js 14 app for capturing and analyzing Net Promoter Score (NPS) feedback via email.

## Features

- **Email-Embedded Widget:** Fast, lightweight HTML buttons for scores 1-5.
- **Secure Tracking:** HMAC-signed tokens prevent tampering and allow idempotency.
- **Instant Feedback:** Fast server-side logging and redirect to a branded "Thank You" page.
- **Admin Metrics:** API endpoint for aggregated stats and CSV export.
- **Privacy:** IP hashing for GDPR compliance.

## Quick Start (Local)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create `.env` based on `.env.example`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/nps_db"
   EMAIL_SIGNING_KEY="super-secret-key-change-me"
   APP_HOST="http://localhost:3000"
   ADMIN_API_KEY="admin-secret-key"
   ```

3. **Database:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run Dev Server:**
   ```bash
   npm run dev
   ```

## Bulk Link Generation

Generate tracking links for your email campaign using the CLI script.

1. Prepare `teachers.csv`:
   ```csv
   email,campaign,custom_field
   teacher@school.com,fall-2025,GroupA
   bob@school.com,fall-2025,GroupB
   ```

2. Run script:
   ```bash
   npx ts-node scripts/generate_bulk_links.ts teachers.csv
   ```

3. Output will be `teachers_with_links.csv` containing columns `link_1` to `link_5`.

## Embedding in Email

1. Open `emails/nps-widget.html`.
2. Use your email marketing tool (Mailchimp, SendGrid, etc.) to merge the links.
   - Replace `{{LINK_1}}` with the merge tag for the column `link_1`.
   - Example (Mailchimp): `*|LINK_1|*`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway instructions.

## Security

See [SECURITY.md](SECURITY.md) for details on token rotation and privacy.

