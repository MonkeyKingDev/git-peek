import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, formatDate } from '../utils/api';
import { Navigate, useNavigate } from 'react-router-dom';

function Dashboard() {
  const { isAuthenticated, user, logout, sessionId } = useAuth();
  const [repositories, setRepositories] = useState([]);
  
  // Debug user data
  const [starredRepos, setStarredRepos] = useState([]);
  const [activeTab, setActiveTab] = useState('repositories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both repositories and starred repos in parallel
      const [repos, starred] = await Promise.all([
        apiCall(`/repositories?session_id=${sessionId}`),
        apiCall(`/starred?session_id=${sessionId}`)
      ]);
      
      // Ensure repos is an array
      if (Array.isArray(repos)) {
        setRepositories(repos);
      } else {
        setRepositories([]);
        setError('Failed to load repositories. Please try again.');
      }
      
      // Ensure starred is an array
      if (Array.isArray(starred)) {
        setStarredRepos(starred);
      } else {
        setStarredRepos([]);
      }
    } catch (error) {
      setError('Failed to load data. Please try again.');
      setRepositories([]); // Ensure repositories is always an array
      setStarredRepos([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isAuthenticated && sessionId) {
      fetchData();
    }
  }, [isAuthenticated, sessionId, fetchData]);

  const handleRepositoryClick = (repo) => {
    const [owner, repoName] = repo.full_name.split('/');
    navigate(`/repository/${owner}/${repoName}?session_id=${sessionId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
              Welcome back, {(user?.name && user.name !== 'None') ? user.name : user?.login || 'GitHub User'}!
            </h1>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Select a repository to analyze
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="button button-secondary"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          Loading your repositories...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
          <button 
            onClick={fetchData}
            style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div>
          {/* Tab Navigation */}
          <div className="tab-navigation" style={{ marginBottom: '24px' }}>
            <button 
              className={`tab-button ${activeTab === 'repositories' ? 'active' : ''}`}
              onClick={() => setActiveTab('repositories')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === 'repositories' ? '2px solid #0066cc' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                marginRight: '16px',
                color: activeTab === 'repositories' ? '#0066cc' : '#6b7280'
              }}
            >
              My Repositories ({repositories.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'starred' ? 'active' : ''}`}
              onClick={() => setActiveTab('starred')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === 'starred' ? '2px solid #0066cc' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'starred' ? '#0066cc' : '#6b7280'
              }}
            >
              Starred ({starredRepos.length})
            </button>
          </div>

          {/* Repositories Tab */}
          {activeTab === 'repositories' && (
            <div>
              {repositories.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
                  <p>No repositories found. Make sure you have repositories accessible with your GitHub account.</p>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#6b7280' }}>
                      Found {repositories.length} repository{repositories.length !== 1 ? 's' : ''}. 
                      Click on any repository to view detailed analysis.
                    </p>
                  </div>
                  
                  <div className="repo-list">
                    {repositories.map((repo) => (
                      <div 
                        key={repo.id} 
                        className="repo-item"
                        onClick={() => handleRepositoryClick(repo)}
                      >
                        <div className="repo-name">
                          {repo.full_name}
                          {repo.private && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '12px', 
                              backgroundColor: '#fbbf24', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '4px' 
                            }}>
                              Private
                            </span>
                          )}
                        </div>
                        
                        {repo.description && (
                          <div className="repo-description">
                            {repo.description}
                          </div>
                        )}
                        
                        <div className="repo-meta">
                          {repo.language && (
                            <span>
                              <strong>Language:</strong> {repo.language}
                            </span>
                          )}
                          <span>
                            <strong>Updated:</strong> {formatDate(repo.updated_at)}
                          </span>
                          <span>
                            <strong>Created:</strong> {formatDate(repo.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Starred Tab */}
          {activeTab === 'starred' && (
            <div>
              {starredRepos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
                  <p>No starred repositories found. Star some repositories on GitHub to see them here!</p>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#6b7280' }}>
                      You have starred {starredRepos.length} repository{starredRepos.length !== 1 ? 's' : ''}. 
                      Click on any repository to view detailed analysis.
                    </p>
                  </div>
                  
                  <div className="repo-list">
                    {starredRepos.map((repo) => (
                      <div 
                        key={repo.id} 
                        className="repo-item"
                        onClick={() => handleRepositoryClick(repo)}
                      >
                        <div className="repo-name">
                          ⭐ {repo.full_name}
                          {repo.private && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '12px', 
                              backgroundColor: '#fbbf24', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '4px' 
                            }}>
                              Private
                            </span>
                          )}
                        </div>
                        
                        {repo.description && (
                          <div className="repo-description">
                            {repo.description}
                          </div>
                        )}
                        
                        <div className="repo-meta">
                          {repo.language && (
                            <span>
                              <strong>Language:</strong> {repo.language}
                            </span>
                          )}
                          <span>
                            <strong>Updated:</strong> {formatDate(repo.updated_at)}
                          </span>
                          <span>
                            <strong>Created:</strong> {formatDate(repo.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;