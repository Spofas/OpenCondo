# OpenCondo — Deployment Guide

**How to put OpenCondo on the internet so people can use it.**

This guide is written for someone with no technical background. Follow each step in order. If something goes wrong, re-read the step — most issues come from skipping a detail.

---

## What you'll need before starting

- A computer with a web browser
- An email address
- A GitHub account (free) — this is where the code lives
- About 30 minutes

## What you'll set up

| Service | What it does | Cost |
|---------|-------------|------|
| **GitHub** | Stores the code | Free |
| **Neon** | The database (where all the data lives) | Free tier: 0.5 GB |
| **Vercel** | Hosts the app (makes it available on the internet) | Free tier: hobby use |

**When you're ready for production (real users):**
- Vercel Pro: ~$20/month
- Neon Pro: ~$19/month

---

## Step 1: Get the code on GitHub

If the code is already on GitHub, skip to Step 2.

1. Go to [github.com](https://github.com) and sign in (or create an account)
2. Click the **+** button in the top-right corner → **New repository**
3. Name it `OpenCondo`
4. Leave it as **Private** (you can make it public later)
5. Click **Create repository**
6. Follow the instructions GitHub shows to push your existing code

---

## Step 2: Create your database on Neon

The database is where all the data lives — units, residents, payments, everything. Think of it as the filing cabinet behind the app.

1. Go to [neon.tech](https://neon.tech) and click **Sign Up**
2. Sign up with your GitHub account (easiest option)
3. Once logged in, click **Create Project**
4. Fill in:
   - **Project name:** `opencondo`
   - **Region:** Choose **Europe (Frankfurt)** — this keeps data close to Portugal for speed and GDPR compliance
   - **Database name:** `opencondo`
5. Click **Create Project**
6. **IMPORTANT:** Neon will show you a connection string that looks like this:
   ```
   postgresql://username:password@ep-something-123456.eu-central-1.aws.neon.tech/opencondo?sslmode=require
   ```
   **Copy this and save it somewhere safe** (a text file, a note, etc.). This is your `DATABASE_URL`. You'll need it in Step 3.

> **Note:** You do not need to create any tables manually. Vercel will set up the database structure automatically the first time it builds the app.

---

## Step 3: Deploy to Vercel

Vercel is the service that takes the code from GitHub and makes it available as a website.

1. Go to [vercel.com](https://vercel.com) and click **Sign Up**
2. Sign up with your **GitHub account** (this lets Vercel access your code)
3. Click **Add New Project**
4. Find your `OpenCondo` repository in the list and click **Import**
5. Vercel will auto-detect that it's a Next.js project. You'll see a configuration screen.

> **Note:** The build command is already configured in the project's `vercel.json` file — you do not need to change any build settings manually. Vercel reads this file automatically.

### Add environment variables

This is the most important step. Environment variables are secret settings that the app needs to run — like a key to open the filing cabinet.

Click **Environment Variables** and add these one at a time:

| Name | Value | Where to get it |
|------|-------|-----------------|
| `DATABASE_URL` | Your Neon connection string from Step 2 | The string you saved earlier |
| `NEXTAUTH_URL` | `https://your-project-name.vercel.app` | Vercel will show you the URL after the first deploy — you can update this after |
| `NEXTAUTH_SECRET` | A random secret string | See below how to generate one |
| `CRON_SECRET` | A random secret string | See below how to generate one |

**How to generate NEXTAUTH_SECRET and CRON_SECRET:**

Go to [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) in your browser. It will show a random string. Copy it and paste it as the value. Generate a **separate value** for each secret — do not reuse the same string for both.

`CRON_SECRET` protects the nightly background job (`/api/cron/process`) that marks overdue quotas and generates recurring expenses. Vercel sends this secret automatically when it triggers the cron — you just need to set the same value in both Vercel's environment variables and this field.

### Deploy

1. Click **Deploy**
2. Wait 2-3 minutes. Vercel will:
   - Download the code from GitHub
   - Set up the database tables automatically (using Prisma migrations)
   - Build the app
   - Make it live at `your-project-name.vercel.app`
3. If the build succeeds, you'll see a "Congratulations!" screen with a link to your live app

### After first deploy: Update NEXTAUTH_URL

1. Note the URL Vercel gave you (e.g., `opencondo-abc123.vercel.app`)
2. Go to your project's **Settings** → **Environment Variables**
3. Edit `NEXTAUTH_URL` to match your actual URL: `https://opencondo-abc123.vercel.app`
4. Go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

---

## Step 4: Test it

1. Open your Vercel URL in a browser
2. You should see the OpenCondo login page
3. Click "Registar" to create a new account
4. After registering, you'll be guided through the condominium setup
5. Once set up, you'll see the dashboard

**If something isn't working:**
- Check Vercel's **Deployments** tab for error messages
- Make sure all 3 environment variables are set correctly
- The most common issue is a wrong `DATABASE_URL` — double-check it matches what Neon gave you exactly

---

## Step 5: Custom domain (optional)

If you want `app.opencondo.pt` instead of `opencondo.vercel.app`:

1. Buy a domain from a registrar (e.g., Namecheap, GoDaddy, Google Domains)
2. In Vercel: **Settings** → **Domains** → **Add**
3. Type your domain (e.g., `app.opencondo.pt`)
4. Vercel will show you DNS records to add at your domain registrar
5. Add those records (usually a CNAME pointing to `cname.vercel-dns.com`)
6. Wait 5-30 minutes for the change to take effect across the internet
7. Update `NEXTAUTH_URL` to your custom domain and redeploy

---

## Ongoing: What happens when you update the code

Once connected, **Vercel automatically deploys every time you merge code into the `main` branch on GitHub.** This means:

- Merge a pull request into `main` → your live site updates automatically within a few minutes
- Push to other branches → Vercel creates a preview URL (great for testing before going live)
- No manual deployment needed after initial setup

If the database structure changes (new features that need new tables), the update is applied automatically as part of the same deploy — your existing data is never deleted.

---

## Upgrading for production

When you're ready for real users, here's what to upgrade:

### Vercel Pro ($20/month)
- More bandwidth and build minutes
- Password protection for preview deployments
- Team collaboration features
- Go to **Settings** → **Billing** → upgrade

### Neon Pro (~$19/month)
- More storage (10 GB+)
- More compute hours
- Point-in-time recovery (lets you undo database mistakes from up to 7 days ago)
- Go to your Neon dashboard → **Billing** → upgrade

### Additional services you'll eventually want

| Service | What for | When to add | Cost |
|---------|----------|-------------|------|
| **Resend** (resend.com) | Sending emails (notifications, invites, password resets) | When you enable email features | Free up to 3,000 emails/month |
| **Cloudflare R2** or **AWS S3** | File storage (documents, invoices, contract PDFs) | When you enable document uploads | R2: free up to 10 GB |
| **Sentry** (sentry.io) | Error tracking (get alerts when something breaks) | Before launch | Free tier available |

---

## Quick reference

| What | Where |
|------|-------|
| Your app | `https://your-project.vercel.app` |
| Vercel dashboard | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Neon dashboard | [console.neon.tech](https://console.neon.tech) |
| Deployment logs | Vercel → your project → Deployments |
| Database explorer | Neon → your project → Tables |
| Environment variables | Vercel → your project → Settings → Environment Variables |

---

## Troubleshooting

### "Build failed" on Vercel
- Click on the failed deployment to see the full error log
- Most common cause: a missing or incorrect environment variable. Make sure all 4 are set.

### "Cannot connect to database"
- Check that `DATABASE_URL` in Vercel matches your Neon connection string exactly
- Make sure it includes `?sslmode=require` at the end
- In Neon, check that your project isn't suspended (free tier suspends after 5 minutes of inactivity — it wakes automatically, but the first request after a long pause may be slow)

### "Login doesn't work"
- Check that `NEXTAUTH_URL` matches the exact URL in your browser (including `https://`)
- Check that `NEXTAUTH_SECRET` is set and not empty
- Always redeploy after changing any environment variable — changes only take effect after the next build

### "Page shows an error"
- Go to Vercel → Deployments → click the latest → **Functions** tab → look for error messages
- Check Vercel's build log to see if the database setup step ran successfully

### App is slow on first load
- Neon's free tier suspends the database after 5 minutes of no activity. The first request after suspension takes 1-3 seconds while it wakes up. This is normal on the free plan and does not happen on paid plans.

---

*Last updated: 2026-03-25*
