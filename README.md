# Time Keeping Management System (TKMS)

A comprehensive time keeping management system with camera capture capabilities, built with Next.js, TypeScript, and MongoDB.

## Features

- 📸 **Camera Capture** - Real-time photo capture during time in/out
- 👤 **Employee Management** - Track employee attendance and hours
- 📅 **Schedule Management** - Admin can set flexible schedules (days and time)
- 📊 **Dashboard Analytics** - View attendance reports and statistics
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔐 **Secure Authentication** - JWT-based authentication system
- ⏰ **Real-time Updates** - Live time tracking

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS
- **Camera**: react-webcam
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running locally or MongoDB Atlas account

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
   - Copy `.env.local` and update with your MongoDB connection string
   - Update JWT secrets for production

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the development server:
```bash
pnpm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

### Admin Account
- Email: admin@tkms.com
- Password: admin123

### Employee Account
- Email: employee@tkms.com
- Password: employee123

## Project Structure

```
tkms/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── employee/          # Employee pages
│   │   ├── api/               # API routes
│   │   └── auth/              # Authentication pages
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── employee/         # Employee components
│   │   ├── shared/           # Shared components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utility functions
│   │   ├── db/              # Database connection
│   │   ├── models/          # Mongoose models
│   │   └── utils/           # Helper functions
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript types
├── public/                  # Static assets
└── package.json

```

## Features Overview

### For Employees
- Clock in/out with camera capture
- View personal attendance history
- View assigned schedule
- View hours worked

### For Admins
- Manage employee accounts
- Set and modify schedules
- View all employee attendance
- Generate reports
- Approve/reject time entries
- Monitor real-time attendance

## Development

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run type-check` - Type checking
## License

Private - All Rights Reserved
