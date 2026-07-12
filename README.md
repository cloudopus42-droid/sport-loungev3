# 🌿 SPORT LOUNGE — Premium Hookah Lounge Platform

Modern full-stack web application for a premium hookah loung, admin panel, real-time notifications, and more.

## Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js 4.x
- **Database:** MongoDB 7+ with Mongoose ODM
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Real-time:** Socket.IO 4.x
- **File Upload:** Multer (JPEG, PNG, WebP, HEIC — up to 10MB)
- **Validation:** Zod
- **Security:** Helmet, CORS, API Rate Limiting (`express-rate-limit`)
- **Documentation:** Swagger OpenAPI (accessible at `/api-docs`)
- **Tests:** Integration testing using Jest and Supertest (`npm run test`)

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3.x + custom "Liquid Glass" design system
- **Animations:** Framer Motion
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT interceptor
- **Real-time:** Socket.IO Client
- **Performance:** Component and Route code-splitting via `React.lazy` and `Suspense`

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)

### Local Dev Server Setup

1. **Install all workspace dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup environment variables:**
   * Copy `server/.env.example` to `server/.env` and edit database connection details.

3. **Seed Database and Start Application:**
   ```bash
   npm run seed        # Seed database
   npm run dev         # Run client & server concurrently
   ```

### Running Backend Tests
```bash
npm run test --prefix server
```

### Default Admin Account
- **Email:** admin@sportlounge.com
- **Password:** admin123

## Features

### Public
- 📸 Instagram-style photo feed with infinite scroll
- 📖 Stories slider with auto-advance
- ❤️ Post likes
- 📩 Real-time invitation notifications via WebSocket
- 📋 Active invitations page

### Admin Panel (`/admin`)
- 📊 Dashboard with live statistics
- 📷 Post management (CRUD + bulk delete + drag-and-drop upload)
- 🧪 Tobacco mix catalog (CRUD + flavors + strength)
- 🎁 Promotions management (CRUD + discount + date range + color badge)
- 📱 Stories management (CRUD + drag-and-drop reorder)
- 📨 Invitations (CRUD + publish with WebSocket broadcast)

## Project Structure

```
sport-lounge/
├── server/              # Express + TypeScript backend
│   ├── src/
│   │   ├── config/      # DB connection, env validation
│   │   ├── models/      # Mongoose models (6)
│   │   ├── middleware/   # Auth, admin guard, upload, errors
│   │   ├── schemas/     # Zod validation schemas (6)
│   │   ├── routes/      # API routes (6)
│   │   ├── socket/      # Socket.IO setup
│   │   ├── server.ts    # Entry point
│   │   └── seed.ts      # Database seeder
│   └── uploads/         # Uploaded files
│
├── client/              # React + Vite frontend
│   └── src/
│       ├── components/  # UI + feature components
│       ├── contexts/    # Auth + Socket contexts
│       ├── hooks/       # Custom hooks
│       ├── layouts/     # Main + Admin layouts
│       ├── pages/       # All pages
│       ├── lib/         # API + socket clients
│       └── types/       # TypeScript interfaces
│
└── deploy/              # Deployment configs
    ├── ecosystem.config.js  # PM2
    ├── nginx.conf           # Nginx reverse proxy
    └── DEPLOY.md            # Step-by-step VPS guide
```

## Deployment

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for a complete step-by-step VPS deployment guide.

## License

MIT
