import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Animated Git Branch Network Background
const GitGraphBackground = () => {
  const canvasRef = useRef(null);
  
  // Static GitHub-themed colors
  const colors = {
    gitMain: '#0969da',
    gitFeature: '#8b5cf6', 
    gitBranch: '#f59e0b',
    gitHotfix: '#dc2626',
    warning: '#f97316',
    accent: '#10b981',
    background: '#ffffff'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Git branch structure
    const startX = canvas.width * 0.1;
    const startY = canvas.height * 0.5;
    
    const branches = [];
    const commits = [];
    let time = 0;
    
    // Define branch paths that grow over time
    const branchPaths = [
      { // Main branch
        startX: startX,
        startY: startY,
        endX: canvas.width * 0.9,
        endY: startY,
        color: colors.gitMain,
        width: 3,
        delay: 0
      },
      { // Feature branch 1
        startX: startX + 150,
        startY: startY,
        endX: canvas.width * 0.7,
        endY: startY - 80,
        color: colors.gitFeature,
        width: 2,
        delay: 2000
      },
      { // Feature branch 2
        startX: startX + 250,
        startY: startY,
        endX: canvas.width * 0.8,
        endY: startY + 100,
        color: colors.gitBranch,
        width: 2,
        delay: 4000
      },
      { // Hotfix branch
        startX: startX + 400,
        startY: startY,
        endX: canvas.width * 0.6,
        endY: startY - 50,
        color: colors.gitHotfix,
        width: 2,
        delay: 6000
      }
    ];

    // User avatars (simple colored circles)
    const userColors = [colors.gitMain, colors.gitFeature, colors.gitBranch, colors.gitHotfix, colors.warning, colors.accent];
    
    // Commit nodes along branches
    const commitNodes = [
      { x: startX, y: startY, user: 0, delay: 500, branch: 'main' },
      { x: startX + 80, y: startY, user: 1, delay: 1500, branch: 'main' },
      { x: startX + 160, y: startY, user: 0, delay: 2500, branch: 'main' },
      { x: startX + 200, y: startY - 20, user: 2, delay: 3500, branch: 'feature-1' },
      { x: startX + 280, y: startY - 40, user: 2, delay: 4500, branch: 'feature-1' },
      { x: startX + 300, y: startY + 30, user: 3, delay: 5500, branch: 'feature-2' },
      { x: startX + 420, y: startY - 15, user: 4, delay: 7000, branch: 'hotfix' },
      { x: startX + 360, y: startY, user: 1, delay: 8000, branch: 'main' },
    ];

    let animationId;
    let startTime = Date.now();

    // Animation function
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw branches with growth animation
      branchPaths.forEach((branch, index) => {
        const branchStartTime = branch.delay;
        const branchElapsed = Math.max(0, elapsed - branchStartTime);
        const branchDuration = 3000; // 3 seconds to draw each branch
        
        if (branchElapsed > 0) {
          const progress = Math.min(1, branchElapsed / branchDuration);
          
          // Easing function for smooth growth
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          const currentEndX = branch.startX + (branch.endX - branch.startX) * easeProgress;
          const currentEndY = branch.startY + (branch.endY - branch.startY) * easeProgress;
          
          // Draw branch line
          ctx.beginPath();
          ctx.moveTo(branch.startX, branch.startY);
          ctx.lineTo(currentEndX, currentEndY);
          ctx.strokeStyle = branch.color;
          ctx.lineWidth = branch.width;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
        }
      });

      // Draw commit nodes (user avatars)
      commitNodes.forEach((commit, index) => {
        if (elapsed > commit.delay) {
          const nodeAge = elapsed - commit.delay;
          const fadeInDuration = 500;
          const opacity = Math.min(1, nodeAge / fadeInDuration);
          
          // Slight pulsing animation
          const pulse = Math.sin(elapsed * 0.003 + index) * 0.5 + 1;
          const radius = 8 + pulse;
          
          // Draw user avatar (colored circle)
          ctx.beginPath();
          ctx.arc(commit.x, commit.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = userColors[commit.user % userColors.length];
          ctx.globalAlpha = opacity * 0.8;
          ctx.fill();
          
          // Add subtle border
          ctx.beginPath();
          ctx.arc(commit.x, commit.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = colors.background;
          ctx.lineWidth = 2;
          ctx.globalAlpha = opacity * 0.9;
          ctx.stroke();
          
          // Add user initial
          ctx.font = '8px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = opacity;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String.fromCharCode(65 + commit.user), commit.x, commit.y);
        }
      });

      ctx.globalAlpha = 1;
      
      // Loop animation every 15 seconds
      if (elapsed > 15000) {
        startTime = currentTime;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []); // Run once on mount

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: colors.background
      }}
    />
  );
};

function Home() {
  const { isAuthenticated, login, loading } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      setLoginLoading(false);
    }
  };

  return (
    <>
      <GitGraphBackground />
      <div className="container" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '24px', color: '#1e293b' }}>
            GitPeek
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '48px', color: '#64748b', maxWidth: '600px', margin: '0 auto 48px' }}>
            Analyze your repositories with powerful insights into code ownership, 
            contributor activity, and dependency risks. Connect your GitHub account to get started.
          </p>
        
        <div className="card" style={{ 
          maxWidth: '500px', 
          margin: '0 auto', 
          textAlign: 'left'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>What You'll Get:</h2>
          <ul style={{ lineHeight: '1.8', color: '#64748b' }}>
            <li><strong style={{ color: '#1e293b' }}>Code Ownership Analysis:</strong> See who primarily edits which files and folders</li>
            <li><strong style={{ color: '#1e293b' }}>Knowledge Areas:</strong> Identify top contributors per module or directory</li>
            <li><strong style={{ color: '#1e293b' }}>Activity Heatmaps:</strong> Visualize commits and PR reviews over time</li>
            <li><strong style={{ color: '#1e293b' }}>Dependency Risk Maps:</strong> Understand impact if key contributors leave</li>
          </ul>
        </div>

        <div style={{ margin: '48px 0' }}>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            maxWidth: '600px',
            margin: '0 auto 24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Required Permissions
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              This app will request access to:
            </p>
            <ul style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              <li><strong style={{ color: '#1e293b' }}>repo:</strong> Read-only access to your repositories</li>
              <li><strong style={{ color: '#1e293b' }}>read:org:</strong> Read organization membership information</li>
            </ul>
            <p style={{ margin: '12px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Your OAuth tokens are stored securely server-side and never exposed to the frontend.
            </p>
          </div>

          <button 
            onClick={handleLogin}
            disabled={loginLoading}
            className="button"
            style={{ 
              fontSize: '18px', 
              padding: '16px 32px'
            }}
          >
            {loginLoading ? 'Connecting...' : 'Connect with GitHub'}
          </button>
        </div>

        <div style={{ marginTop: '60px', color: '#94a3b8', fontSize: '14px' }}>
          <p>Secure • Private • Read-only access</p>
        </div>
        </div>
      </div>
    </>
  );
}

export default Home;