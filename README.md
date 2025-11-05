# ZOCC-ERP

ZeroOne Coding Club ERP Portal - A modern authentication system with email verification.

## Quick Start

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd ZOCC-ERP

# Copy environment variables
cp env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:4173
# Backend: http://localhost:4000
```

### Deploy to Coolify

See [COOLIFY_QUICKSTART.md](./COOLIFY_QUICKSTART.md) for deployment instructions.

## Documentation

- [DASHBOARD.md](./my-app/DASHBOARD.md) - Dashboard features and development guide
- [COOLIFY_QUICKSTART.md](./COOLIFY_QUICKSTART.md) - Quick deployment guide for Coolify
- [COOLIFY.md](./COOLIFY.md) - Comprehensive Coolify deployment guide
- [DOCKER.md](./DOCKER.md) - Docker setup and configuration
- [server/GMAIL_SETUP.md](./server/GMAIL_SETUP.md) - Gmail SMTP setup
- [server/MONGODB_SETUP.md](./server/MONGODB_SETUP.md) - MongoDB setup

## Features

- 🔐 Secure authentication with JWT
- 📧 Email verification via OTP
- 🎨 Modern React UI with 3D effects
- 📊 **Professional Dark Dashboard** with:
  - Overview with stats and upcoming sessions
  - Attendance tracking with charts
  - Submission management with file uploads
  - Project management and proposals
  - Announcements system
  - Leaderboard with rankings
  - User profile management
- 🎯 Fully responsive design (mobile, tablet, desktop)
- 🐳 Docker-ready
- ☁️ Cloud-ready deployment
- 🔒 Secure password hashing
- ⚡ Fast API responses

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS + Recharts + React Router
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Email**: Gmail SMTP
- **Deployment**: Docker + Coolify

## Environment Variables

See [env.example](./env.example) for all required environment variables.

## License

See [LICENSE](./LICENSE) file for details.