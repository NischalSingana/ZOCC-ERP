# ZOCC ERP Dashboard

A React-based ERP dashboard for ZeroOne Coding Club with Student and Admin roles.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **Backend**: Express.js (in `/server` directory)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (for backend)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### Backend Setup

The backend server is in the `/server` directory. See the server README for setup instructions.

```bash
cd server
npm install
npm run dev
```

## Project Structure

```
my-app/
├── src/
│   ├── components/     # React components
│   ├── layouts/        # Layout components
│   ├── pages/          # Page components
│   ├── assets/         # Static assets
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Public assets
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- Student dashboard with sessions, attendance, submissions
- Admin panel for managing students and content
- Authentication with JWT
- Responsive design with TailwindCSS

## License

MIT


