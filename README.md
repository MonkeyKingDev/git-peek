# GitPeek

A secure web application that connects to GitHub via OAuth to analyze repository metrics including code ownership, knowledge areas, activity heatmaps, and dependency risk mapping.

## Architecture

- **Backend**: FastAPI with GitHub REST API integration
- **Frontend**: React with Chart.js for visualizations
- **Authentication**: GitHub OAuth with secure server-side token handling

## Project Structure

```
├── backend/          # FastAPI server
│   ├── app/
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React application
│   ├── src/
│   ├── package.json
│   └── public/
└── README.md
```

## Features

- **GitHub OAuth Integration**: Secure authentication with repo and read:org scopes
- **Repository Analysis**: Code ownership, contributor insights, activity patterns
- **Interactive Dashboard**: Charts and filtering capabilities
- **Security First**: No token exposure to frontend, CSRF/XSS protection

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure GitHub OAuth credentials
uvicorn app.main:app --reload
```

### Frontend Setup  
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create `.env` in backend directory:
```
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
SECRET_KEY=your_random_secret_key
```