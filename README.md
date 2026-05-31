# 🌿 SPORT LOUNGE — Premium Hookah Lounge Platform

Modern full-stack web application for a premium hookah lounge — Instagram-style feed, admin panel, real-time notifications, and more.

## Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js 4.x
- **Database:** MongoDB 7+ with Mongoose ODM
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Real-time:** Socket.IO 4.x
- **File Upload:** Multer (JPEG, PNG, WebP, HEIC — up to 10MB)
- **Validation:** Zod
- **Security:** Helmet, CORS

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3.x + custom "Liquid Glass" design system
- **Animations:** Framer Motion
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT interceptor
- **Real-time:** Socket.IO Client

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)

### Backend
```bash
cd server
cp .env.example .env    # Edit with your MongoDB URI and JWT secret
npm install
npm run seed            # Populate database with demo data
npm run dev             # Start dev server on port 5000
```

### Frontend
```bash
cd client
npm install
npm run dev             # Start Vite dev server on port 5173
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
