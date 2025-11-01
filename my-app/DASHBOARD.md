# ZeroOne ERP Dashboard

A modern, responsive, and professional dark-themed dashboard for the ZeroOne Coding Club management system.

## 🎨 Features

### Design Style
- Sleek dark blue and black color palette with custom ZOCC blue theme
- Minimalistic, futuristic UI with glowing highlights and soft shadows
- Modern typography using Inter and Plus Jakarta Sans fonts
- Smooth hover animations and transitions
- Fully responsive design (mobile, tablet, desktop)
- Sidebar with collapsible navigation
- Topbar with notifications and user profile

### Core Dashboard Sections

#### 1. Overview Page
- Personalized greeting message
- Summary cards:
  - Sessions attended
  - Submissions made
  - Projects joined
  - Leaderboard rank
- Upcoming sessions list with details
- Latest announcements with priority badges

#### 2. Attendance Page
- Summary statistics with visual indicators
- Interactive attendance trend chart (Recharts Line Chart)
- Recent sessions table with status
- Period filters (week/month/year)

#### 3. Submissions Page
- Grid view of all submissions with thumbnails
- Status badges (pending, reviewed, accepted)
- Upload modal for new submissions:
  - Image upload (JPG/PNG, max 2MB)
  - Session selection
  - Notes/feedback field
- Real-time upload progress (ready for MinIO integration)

#### 4. Projects Page
- Project cards with:
  - Title and mentor information
  - Status badges (active, planning, completed)
  - Tech stack tags
  - Team size and progress bars
  - Join/View Details buttons
- Propose Project modal for students

#### 5. Announcements Page
- Timeline/card view of announcements
- Priority indicators (high, medium, low)
- Author and timestamp information
- Admin functionality to post new announcements
- Category filters

#### 6. Leaderboard Page
- Top 3 highlighted with medals
- Performance overview bar chart
- Full leaderboard table with:
  - Rank, name, points
  - Attendance and submissions count
  - Trend indicators (up/down/stable)

#### 7. Profile Page
- Profile header with avatar and edit functionality
- Personal stats cards
- Detailed profile information
- Achievements section
- Profile picture upload (MinIO ready)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## 📦 Tech Stack

- **React** 19.1.1 - UI framework
- **Vite** 7.1.7 - Build tool and dev server
- **TailwindCSS** 3.4.1 - Utility-first CSS framework
- **Recharts** 3.3.0 - Charting library
- **React Router** 7.9.5 - Client-side routing
- **Lucide React** 0.552.0 - Icon library

## 🎯 Customization

### Colors

The dashboard uses a custom color palette defined in `tailwind.config.js`:

- ZOCC Blue shades: 50-900
- Accent colors: blue, green, red, yellow, purple for status indicators

### Typography

- Primary font: Inter (sans-serif)
- Heading font: Plus Jakarta Sans

### Components

Reusable CSS classes:
- `.dashboard-card` - Standard card styling with hover effects
- `.glow-effect` - Glowing shadow effects

## 📁 Project Structure

```
my-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Login.jsx     # Login page
│   │   ├── LiquidEther.jsx  # Background animation
│   │   └── ...
│   ├── layouts/          # Layout components
│   │   └── DashboardLayout.jsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Overview.jsx
│   │   ├── Attendance.jsx
│   │   ├── Submissions.jsx
│   │   ├── Projects.jsx
│   │   ├── Announcements.jsx
│   │   ├── Leaderboard.jsx
│   │   └── Profile.jsx
│   ├── assets/           # Static assets
│   ├── App.jsx           # Main app with routing
│   ├── App.css           # Global styles
│   └── index.css         # Tailwind directives & base styles
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── package.json
```

## 🔐 Authentication

The dashboard currently uses localStorage for authentication check:
```javascript
const isAuthenticated = localStorage.getItem('authToken') ? true : false;
```

**TODO:** Integrate with your backend authentication system and replace with proper JWT handling.

## 📊 Data Integration

Currently, all pages use mock data. To integrate with your backend:

1. Update each page component to fetch from your API
2. Add loading states
3. Handle errors appropriately
4. Implement real-time updates where needed

### Example Integration Points

- **Attendance**: Replace mock data with API calls to attendance endpoints
- **Submissions**: Integrate MinIO upload using presigned URLs from backend
- **Projects**: Connect to projects API
- **Leaderboard**: Fetch real-time leaderboard data
- **Profile**: Integrate profile picture upload with MinIO

## 🎨 Responsive Design

The dashboard is fully responsive with breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Mobile-specific adjustments:
- Collapsible sidebar (hamburger menu)
- Stacked layouts
- Touch-friendly button sizes
- Optimized font sizes and spacing

## 🚀 Deployment

### Docker

The dashboard is containerized and ready for deployment:

```bash
# Build Docker image
docker build -t zocc-erp-frontend .

# Run with docker-compose
docker-compose up frontend
```

See [DOCKER.md](../DOCKER.md) for full deployment instructions.

### Coolify

See [COOLIFY.md](../COOLIFY.md) for Coolify deployment guide.

## 🛠️ Development

### Code Style

- Use functional components with hooks
- Follow React best practices
- Keep components modular and reusable
- Use meaningful variable and function names

### Adding New Pages

1. Create page component in `src/pages/`
2. Import and add route in `src/pages/Dashboard.jsx`
3. Add navigation item in `src/layouts/DashboardLayout.jsx`

## 📝 Notes

- All API calls are placeholder and need backend integration
- MinIO uploads need proper presigned URL generation
- Authentication flow needs to be connected to your login system
- Real-time features (notifications, updates) are not yet implemented

## 🎉 Features Coming Soon

- [ ] Real-time notifications
- [ ] Dark/Light theme toggle
- [ ] Advanced search and filters
- [ ] Export functionality
- [ ] Advanced analytics
- [ ] Mobile app support

## 📄 License

See LICENSE file in project root.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

