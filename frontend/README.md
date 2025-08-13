# GitPeek Frontend 🔍

A modern React application for visualizing GitHub repository insights, code ownership, and contributor analytics.

## ✨ Features

- **GitHub OAuth Integration** - Secure authentication with GitHub
- **Repository Analytics** - Comprehensive insights into your repositories
- **Code Ownership Analysis** - See who primarily edits which files and folders
- **Knowledge Areas** - Identify top contributors per module or directory
- **Activity Heatmaps** - Visualize commits and PR reviews over time
- **Dependency Risk Maps** - Understand impact if key contributors leave
- **Animated Git Branch Visualization** - Beautiful animated background showing git workflow
- **Responsive Design** - Works seamlessly across desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- GitPeek backend server running on `http://localhost:8000`

### Installation

1. **Clone and navigate to frontend directory**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and functional components
- **React Router DOM** - Client-side routing
- **Chart.js** - Data visualization and charts
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with CSS variables and flexbox/grid

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.js     # Main dashboard with repository list
│   ├── Home.js          # Landing page with authentication
│   └── RepositoryAnalysis.js # Repository insights and charts
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state management
├── hooks/               # Custom React hooks
│   └── useSSE.js       # Server-sent events hook
├── utils/               # Utility functions
│   └── api.js          # API calling utilities
├── App.js              # Main app component
├── index.js            # React app entry point
└── index.css           # Global styles
```

## 🔐 Authentication Flow

1. User clicks "Connect with GitHub" on home page
2. Redirects to GitHub OAuth authorization
3. GitHub redirects back with authorization code
4. Backend exchanges code for access token
5. Session created and user redirected to dashboard
6. Frontend stores session ID and makes authenticated API calls

## 📊 Available Charts & Analytics

- **Code Ownership** - File and directory ownership analysis
- **Top Contributors** - Most active contributors by commits and lines changed
- **Activity Heatmaps** - Temporal activity patterns
- **Collaboration Networks** - Contributor collaboration patterns
- **Risk Assessment** - Bus factor and knowledge distribution

## 🎨 Styling

The application uses a clean, GitHub-inspired design with:
- Light theme with subtle shadows and borders
- GitHub color palette (`#0969da` primary, etc.)
- Responsive grid layouts
- Smooth animations and transitions
- Professional SVG icons

## 🔧 Configuration

The frontend expects the backend API to be running on `http://localhost:8000`. This is configured in `package.json`:

```json
{
  "proxy": "http://localhost:8000"
}
```

## 🚦 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App (not recommended)

## 📦 Dependencies

### Core Dependencies
- `react` - React library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing
- `axios` - HTTP client
- `chart.js` & `react-chartjs-2` - Data visualization

### Development Dependencies
- `react-scripts` - Create React App tooling
- `@testing-library/*` - Testing utilities

## 🤝 API Integration

The frontend communicates with the GitPeek backend through RESTful APIs:

- `GET /auth/login` - Initiate GitHub OAuth
- `GET /auth/user` - Get current user info
- `GET /api/repositories` - Fetch user repositories
- `GET /api/analyze/{owner}/{repo}` - Get repository analysis
- `POST /auth/logout` - End user session

## 🎯 Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in routing (`App.js`)
3. Add any new contexts to the provider tree
4. Update this README if adding major features

### Styling Guidelines

- Use semantic class names (`.card`, `.button`, etc.)
- Leverage CSS variables for consistency
- Ensure responsive design with CSS Grid/Flexbox
- Follow GitHub's design patterns

## 🐛 Troubleshooting

**Authentication Issues:**
- Ensure backend is running on port 8000
- Check GitHub OAuth app configuration
- Clear localStorage and cookies

**API Errors:**
- Verify backend connectivity
- Check browser network tab for error details
- Ensure session hasn't expired (1 hour timeout)

**Build Issues:**
- Clear `node_modules` and reinstall dependencies
- Update Node.js version if using very old version

## 📄 License

This project is part of GitPeek - a repository analysis tool.

---

Built with ❤️ using React and modern web technologies.