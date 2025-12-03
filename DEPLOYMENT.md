# Deployment Guide (Railway)

This application is optimized for deployment on Railway.

## Prerequisites

- Railway Account
- GitHub Repository with this code

## Steps

1. **Create New Project on Railway:**
   - Select "Deploy from GitHub repo".
   - Choose this repository.

2. **Add Database:**
   - In the Railway project canvas, right-click and "Add Service" -> "Database" -> "PostgreSQL".
   - This will automatically provide the `DATABASE_URL` variable.

3. **Configure Environment Variables:**
   - Go to the App Service -> "Variables".
   - Add the following:
     - `EMAIL_SIGNING_KEY`: A long random string (e.g., generated via `openssl rand -hex 32`).
     - `APP_HOST`: The public URL of your Railway app (e.g., `https://your-app.up.railway.app`).
     - `ADMIN_API_KEY`: Secret key for accessing admin metrics.
     - `NODE_ENV`: `production` (usually default).

4. **Build & Deploy:**
   - Railway will detect the `railway.json` and `Dockerfile`.
   - It will run the build process defined in the Dockerfile.
   - Migrations (`prisma migrate deploy`) will run automatically on startup.

## Troubleshooting

- **Database Connection:** Ensure `DATABASE_URL` is set. Railway sets this automatically if you add a Postgres service in the same project.
- **Build Errors:** Check the "Build Logs". Ensure `npx prisma generate` runs during the build phase.

