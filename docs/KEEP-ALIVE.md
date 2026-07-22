# Keep-Alive Setup Guide

## Problem
Render free/hobby tier spins down after 15 minutes of inactivity. Cold start takes 30-60 seconds.

## Solution: Multi-Layer Keep-Alive

### Layer 1: GitHub Actions (Internal) ✅ Already configured
- **Primary**: Every 8 min with retries
- **Backup**: Offset cron (3/23/43 min)
- **Frequent**: Every 15 min quick ping

### Layer 2: External Monitoring (Recommended)

#### Option A: UptimeRobot (Free, recommended)
1. Go to https://uptimerobot.com → Sign up free
2. Add New Monitor → HTTP(s)
3. Settings:
   - Name: `Sport Lounge API`
   - URL: `https://sport-loungev3.onrender.com/api/health`
   - Monitoring Interval: `5 minutes`
   - Alert contacts: your email/Telegram
4. Save → Done!

**Free tier**: 50 monitors, 5-min intervals

#### Option B: cron-job.org (Free)
1. Go to https://cron-job.org → Sign up
2. Create new cron job:
   - URL: `https://sport-loungev3.onrender.com/api/health`
   - Schedule: Every 10 minutes
   - Request method: GET
3. Save → Enable

#### Option C: Healthchecks.io (Free)
1. Go to https://healthchecks.io → Sign up
2. Create check:
   - Name: `Sport Lounge`
   - Period: Every 10 minutes
   - Grace period: 15 minutes
3. Copy the ping URL
4. Add to GitHub Actions or cron job to ping the Healthchecks URL

### Layer 3: Render Paid Plan (Optional)
- **Starter plan ($7/mo)**: Always-on, no spin-down
- **Pro plan ($20/mo)**: Auto-scaling, no spin-down

## Current Status
- ✅ GitHub Actions: 3 workflows running
- ⬜ External monitoring: Needs setup (5 min)

## Quick Test
```bash
node scripts/keep-alive.js
```

## Monitoring Dashboard
Check GitHub Actions tab for keep-alive status:
https://github.com/cloudopus42-droid/sport-loungev3/actions
