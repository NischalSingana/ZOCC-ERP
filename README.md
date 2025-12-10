# 🚀 ZOCC-ERP

**ZeroOne Coding Club - Enterprise Resource Planning Portal**

A comprehensive, modern web application for managing coding club operations, student activities, sessions, submissions, and administrative tasks. Built with a focus on user experience, security, and scalability.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎓 Student Portal
- **Dashboard Overview**
  - Personalized statistics (sessions attended, submissions, tasks completed)
  - Year-specific dashboards (Y24, Y25, etc.)
  - Upcoming sessions and announcements
  - Real-time attendance tracking
  
- **Session Management**
  - View all sessions with detailed information
  - Download session materials and reference files
  - Track attendance history
  
- **Submission System**
  - Submit assignments with file uploads (PDF, images, documents)
  - Track submission status (Pending, Accepted, Rejected)
  - View admin feedback
  - Download submitted files
  
- **Task Management**
  - View assigned tasks with deadlines
  - Download task attachments
  - Submit task solutions
  
- **Project Proposals**
  - Submit project proposals with detailed descriptions
  - Track proposal status
  - View reference materials
  
- **Announcements**
  - Real-time announcements from admins
  - Categorized notifications
  
- **Profile Management**
  - Update personal information
  - View account details
  - Manage contact information

### 👨‍💼 Admin Portal
- **Admin Dashboard**
  - Comprehensive statistics (total students, sessions, submissions, tasks)
  - Pending account approvals
  - Active projects overview
  - Quick action shortcuts
  
- **Student Management**
  - View all registered students
  - Sort by ID number (newest first)
  - Search and filter students
  - Delete student accounts with cascade deletion
  - View detailed student profiles
  
- **Session Management**
  - Create, edit, and delete sessions
  - Upload session materials to cloud storage
  - Manage session attendance
  - Track session participation
  
- **Submission Approval**
  - Review all student submissions
  - Approve or reject submissions
  - Provide feedback to students
  - Download submission files
  - View student details
  
- **Task Administration**
  - Create and manage tasks
  - Set deadlines and priorities
  - Upload task attachments
  - Track task completion
  
- **Account Approvals**
  - Review pending student registrations
  - Approve or reject new accounts
  - Email notifications for approvals
  
- **Announcements Management**
  - Create and publish announcements
  - Edit or delete announcements
  - Categorize announcements
  
- **Query Management**
  - View and respond to student queries
  - Track query status
  - Provide solutions and support

### 🔐 Authentication & Security
- **Secure Authentication**
  - JWT-based authentication
  - Bcrypt password hashing
  - Role-based access control (Admin/Student)
  
- **Email Verification**
  - OTP-based email verification
  - Secure password reset
  - Email notifications
  
- **Session Management**
  - Automatic token refresh
  - Secure logout
  - Protected routes

### 🎨 UI/UX Features
- **Modern Design**
  - Dark theme with glassmorphism effects
  - Smooth animations with GSAP
  - 3D liquid ether background (Three.js)
  - Responsive design (mobile, tablet, desktop)
  
- **Interactive Elements**
  - Toast notifications (react-hot-toast)
  - Modal dialogs
  - Loading states
  - Error handling
  
- **Data Visualization**
  - Charts and graphs (Recharts)
  - Statistics cards
  - Progress indicators

### ☁️ Cloud Integration
- **Cloudflare R2 Storage**
  - Secure file uploads
  - Signed URLs for downloads
  - Support for multiple file types
  - Automatic file organization

### 📊 Data Management
- **Export Functionality**
  - Export student data to Excel (XLSX)
  - Export attendance records
  - Export submission reports

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client |
| **TailwindCSS** | Utility-first CSS framework |
| **Lucide React** | Icon library |
| **Three.js** | 3D graphics and animations |
| **GSAP** | Animation library |
| **Recharts** | Data visualization |
| **React Hot Toast** | Toast notifications |
| **XLSX** | Excel file generation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **Bcrypt.js** | Password hashing |
| **Nodemailer** | Email service |
| **Multer** | File upload handling |
| **AWS SDK (S3)** | Cloudflare R2 integration |
| **CORS** | Cross-origin resource sharing |

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

---

## 📁 Project Structure

```
ZOCC-ERP/
├── my-app/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API configuration (axios)
│   │   ├── assets/        # Images, logos, static files
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context (Auth)
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin-specific pages
│   │   │   └── ...        # Student pages
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Public assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
│
├── server/                # Backend Node.js application
│   ├── models/            # Mongoose models (implied)
│   ├── middleware/        # Express middleware (implied)
│   ├── routes/            # API routes (implied)
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
│
├── docker-compose.yml     # Docker compose configuration
├── Dockerfile             # Docker configuration
├── .gitignore            # Git ignore rules
├── LICENSE               # License file
└── README.md             # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NischalSingana/ZOCC-ERP.git
   cd ZOCC-ERP
   ```

2. **Install dependencies**

   **Frontend:**
   ```bash
   cd my-app
   npm install
   ```

   **Backend:**
   ```bash
   cd ../server
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the `server` directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

4. **Start MongoDB**

   Make sure MongoDB is running on your system:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

5. **Run the application**

   **Backend (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd my-app
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

### Docker Deployment (Recommended)

1. **Copy environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: `http://localhost:4173`
   - Backend: `http://localhost:4000`

4. **Stop the application**
   ```bash
   docker-compose down
   ```

---

## 🔧 Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/zocc-erp
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zocc-erp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Microsoft SMTP)
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=your-email@outlook.com

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
# For production, add your frontend URL:
# CORS_ORIGIN=https://yourdomain.com

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-password-change-this
```

### Frontend Environment Variables (Optional)

Create a `.env` file in the `my-app` directory:

```env
VITE_API_URL=http://localhost:4000
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/verify-otp` | Verify email OTP | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user | Yes |
| GET | `/api/users/all` | Get all students | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Session Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sessions` | Get all sessions | Yes |
| POST | `/api/sessions` | Create session | Admin |
| PUT | `/api/sessions/:id` | Update session | Admin |
| DELETE | `/api/sessions/:id` | Delete session | Admin |

### Submission Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/submissions` | Get submissions | Yes |
| POST | `/api/submissions` | Create submission | Yes |
| PUT | `/api/submissions/:id` | Update submission | Admin |
| DELETE | `/api/submissions/:id` | Delete submission | Admin |

### File Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/files/:filePath` | Download file | Yes |
| POST | `/api/upload` | Upload file | Yes |

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
   - Click the "Fork" button at the top right of this page

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ZOCC-ERP.git
   cd ZOCC-ERP
   ```

3. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
   Branch naming conventions:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Adding tests

4. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments where necessary
   - Test your changes thoroughly

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```
   
   Commit message conventions:
   - `Add:` - New features
   - `Fix:` - Bug fixes
   - `Update:` - Updates to existing features
   - `Remove:` - Removing code/files
   - `Refactor:` - Code refactoring
   - `Docs:` - Documentation changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes in detail
   - Submit the pull request

### Development Guidelines

#### Code Style
- Use **ESLint** for JavaScript linting
- Follow **React best practices**
- Use **functional components** and **hooks**
- Keep components **small and focused**
- Use **meaningful variable names**

#### Component Structure
```jsx
// Import statements
import { useState } from 'react';

// Component definition
const MyComponent = ({ prop1, prop2 }) => {
  // State declarations
  const [state, setState] = useState(null);

  // Effect hooks
  useEffect(() => {
    // Side effects
  }, []);

  // Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

#### API Development
- Use **RESTful conventions**
- Add **proper error handling**
- Include **input validation**
- Add **authentication/authorization** where needed
- Write **clear error messages**

#### Testing
- Test all new features
- Ensure existing tests pass
- Add tests for bug fixes
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test responsive design on different screen sizes

### Reporting Issues

Found a bug? Have a feature request? Please create an issue:

1. Go to the [Issues](https://github.com/NischalSingana/ZOCC-ERP/issues) page
2. Click "New Issue"
3. Choose the appropriate template:
   - **Bug Report** - For reporting bugs
   - **Feature Request** - For suggesting new features
4. Fill in the template with as much detail as possible
5. Submit the issue

### Code Review Process

1. All pull requests will be reviewed by maintainers
2. Feedback will be provided within 2-3 business days
3. Address any requested changes
4. Once approved, your PR will be merged

### Areas for Contribution

We especially welcome contributions in these areas:

- 🐛 **Bug Fixes** - Fix reported issues
- ✨ **New Features** - Add new functionality
- 📝 **Documentation** - Improve docs and comments
- 🎨 **UI/UX** - Enhance user interface and experience
- ⚡ **Performance** - Optimize code and queries
- 🧪 **Testing** - Add unit and integration tests
- ♿ **Accessibility** - Improve accessibility features
- 🌐 **Internationalization** - Add multi-language support

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Nischal Singana**  - [GitHub](https://github.com/NischalSingana)
- **Kushaal Badavath** - [GitHub](https://github.com/KushaalNayak) 

---

## 🙏 Acknowledgments

- **ZeroOne Coding Club** - For the opportunity to build this system
- **KL University** - For supporting student development
- **Open Source Community** - For the amazing tools and libraries

---

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](#-api-documentation)
2. Search [existing issues](https://github.com/NischalSingana/ZOCC-ERP/issues)
3. Create a [new issue](https://github.com/NischalSingana/ZOCC-ERP/issues/new)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ by the ZeroOne Coding Club**
