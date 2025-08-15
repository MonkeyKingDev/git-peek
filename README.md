# GitPeek 🔍

A powerful GitHub repository analysis tool that provides comprehensive insights into code ownership, collaboration patterns, activity trends, and risk assessment.

## Features

- **📊 Repository Analytics**: Deep dive into commit patterns, contributor activities, and code evolution
- **🤝 Collaboration Analysis**: Understand team dynamics and collaboration patterns
- **⚠️ Risk Assessment**: Identify key contributors and potential bus factor issues
- **📈 Activity Trends**: Visualize repository activity over time with heatmaps
- **🔧 Date Range Filtering**: Analyze specific time periods (quarters, fiscal years, custom ranges)
- **⚡ Performance Optimized**: Fast analysis with parallel data fetching and smart caching

## Tech Stack

- **Frontend**: React 18, JavaScript ES6+
- **Backend**: Node.js serverless functions on Vercel
- **APIs**: GitHub REST API v3
- **Authentication**: OAuth 2.0 with JWT tokens
- **Deployment**: Vercel with automated GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- GitHub account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd github-code-visualise
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Set up GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App with:
     - Application name: `GitPeek Local`
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/api/auth/callback`

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Start Vercel dev server for API
   vercel dev --listen 3001
   
   # Terminal 2: Start React frontend
   cd frontend && npm start
   ```

6. **Access the application**
   Open http://localhost:3000 in your browser

### Production Deployment

#### 1. Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Connect to Vercel**
   ```bash
   vercel login
   vercel
   ```

3. **Set production environment variables**
   In your Vercel dashboard, add these environment variables:
   ```
   GITHUB_CLIENT_ID=your_production_github_client_id
   GITHUB_CLIENT_SECRET=your_production_github_client_secret
   GITHUB_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
   JWT_SECRET=your_super_secret_production_jwt_key
   FRONTEND_URL=https://your-domain.vercel.app
   ```

4. **Create production GitHub OAuth App**
   - Create another OAuth App for production
   - Set callback URL to: `https://your-domain.vercel.app/api/auth/callback`

#### 2. Automated Deployment with GitHub Actions

1. **Get Vercel tokens**
   ```bash
   vercel --token
   npx vercel project ls
   npx vercel teams ls
   ```

2. **Add GitHub Secrets**
   In your GitHub repository settings > Secrets and variables > Actions, add:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_team_id
   VERCEL_PROJECT_ID=your_project_id
   ```

3. **Push to main branch**
   ```bash
   git push origin main
   ```
   The GitHub Action will automatically deploy to Vercel!

## API Documentation

### Authentication Endpoints

- `GET /api/auth/login` - Initiate GitHub OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/user` - Get current user info

### Repository Endpoints

- `GET /api/repositories` - Get user's repositories
- `GET /api/starred` - Get user's starred repositories
- `GET /api/repository/{owner}/{repo}/analysis` - Get repository analysis

### Analysis Parameters

- `start_epoch` - Start date as Unix timestamp
- `end_epoch` - End date as Unix timestamp
- `session_id` - JWT session token

## Project Structure

```
github-code-visualise/
├── api/                          # Serverless API functions
│   ├── auth/                     # Authentication endpoints
│   ├── repository/               # Repository analysis endpoints
│   ├── repositories/             # User repositories
│   ├── starred/                  # Starred repositories
│   └── utils/                    # Shared utilities
│       ├── auth.js              # Authentication helpers
│       ├── github.js            # GitHub API utilities
│       ├── analysis.js          # Analysis algorithms
│       └── response.js          # Response helpers
├── frontend/                     # React frontend
│   ├── public/
│   └── src/
│       ├── components/          # React components
│       ├── contexts/            # React contexts
│       ├── hooks/               # Custom hooks
│       └── utils/               # Frontend utilities
├── .github/workflows/           # GitHub Actions
└── vercel.json                  # Vercel configuration
```

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `Iv1.a1b2c3d4e5f6g7h8` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | `1234567890abcdef...` |
| `GITHUB_REDIRECT_URI` | OAuth callback URL | `https://yourapp.vercel.app/api/auth/callback` |
| `JWT_SECRET` | JWT signing secret | `super-secret-key-change-in-production` |
| `FRONTEND_URL` | Frontend URL for redirects | `https://yourapp.vercel.app` |

## Performance

- **Parallel API calls** for faster data fetching
- **Smart pagination** with early cutoffs
- **Date range filtering** at GitHub API level
- **Optimized algorithms** for large repositories
- **Response caching** and performance timing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.