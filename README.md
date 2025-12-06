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
- **Email**: Microsoft SMTP
- **Deployment**: Docker

## Environment Variables

See [env.example](./env.example) for all required environment variables.

## License

See [LICENSE](./LICENSE) file for details.
