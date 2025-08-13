# Setup Instructions

## Prerequisites

1. **Python 3.8+** for backend
2. **Node.js 16+** for frontend  
3. **GitHub OAuth App** - Create one at https://github.com/settings/developers

## GitHub OAuth App Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: GitPeek
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8000/auth/callback`
4. Save the **Client ID** and **Client Secret**

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   SECRET_KEY=your_random_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## Testing the Application

1. **Access the application:**
   - Open http://localhost:3000 in your browser

2. **Test the OAuth flow:**
   - Click "Connect with GitHub"
   - Authorize the application
   - You should be redirected to the dashboard

3. **Test repository analysis:**
   - Select a repository from the dashboard
   - View the analysis charts and metrics

## Security Features

- ✅ **OAuth tokens stored securely server-side**
- ✅ **Input validation and sanitization**
- ✅ **XSS protection with HTML encoding**
- ✅ **CSRF protection headers**
- ✅ **Security headers (CSP, HSTS, etc.)**
- ✅ **Session management with expiration**

## Troubleshooting

**Backend Issues:**
- Check that port 8000 is available
- Verify GitHub OAuth credentials
- Check logs for detailed error messages

**Frontend Issues:**
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify CORS configuration

**OAuth Issues:**
- Double-check callback URL matches GitHub app settings
- Ensure CLIENT_ID and CLIENT_SECRET are correct
- Check that OAuth app is not suspended

## API Endpoints

- `GET /` - Health check
- `GET /auth/login` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout user
- `GET /api/repositories` - Get user repositories
- `GET /api/repository/{owner}/{repo}/analysis` - Get repository analysis