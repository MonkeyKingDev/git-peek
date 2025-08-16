import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSSE } from '../hooks/useSSE';
import { apiCall, getApiBaseUrl } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// SVG Icon Components
const IconCalendar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconChart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconTrending = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);

const IconSearch = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21L16.65 16.65"/>
  </svg>
);

const IconRefresh = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,3.36L23,14"/>
  </svg>
);

const IconFire = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5,12.5a2.5,2.5,0,0,0,5,0c0-1.38-2.5-5-2.5-5S8.5,11.12,8.5,12.5Z"/>
    <path d="M12,2a3,3,0,0,1,3,3c0,2-1,4-1,4s4-1,4,2.5a4.5,4.5,0,0,1-9,0c0-2.5,3-2.5,3-2.5s-1-2-1-4A3,3,0,0,1,12,2Z"/>
  </svg>
);

const IconStar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
  </svg>
);

const IconDatabase = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const IconStatusConnected = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#10b981"/>
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconStatusDisconnected = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#ef4444"/>
    <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function RepositoryAnalysis() {
  const { owner, repo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const sessionId = searchParams.get('session_id');
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ step: '', message: '', progress: 0 });
  const [quarterFilter, setQuarterFilter] = useState('current'); // 'current', 'last_financial', 'past_year' - defaults to current quarter
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const [useStreaming] = useState(false); // Default to regular mode for Vercel (streaming disabled on serverless)

  // Prepare collaboration network data for simple SVG visualization  
  const collaborationNetworkData = useMemo(() => {
    if (!analysis?.dependency_risk?.pull_request_analysis?.workflow_analysis?.collaboration_pairs) {
      return { nodes: [], edges: [], maxInteractions: 0 };
    }

    const pairs = (analysis?.dependency_risk?.pull_request_analysis?.workflow_analysis?.collaboration_pairs || []).slice(0, 8);
    const nodeMap = new Map();
    const edges = [];
    let maxInteractions = 0;

    // Extract unique nodes and create edges
    pairs.forEach((collab) => {
      const [person1, person2] = collab.pair.split(' ↔ ');
      maxInteractions = Math.max(maxInteractions, collab.interactions);
      
      if (!nodeMap.has(person1)) {
        nodeMap.set(person1, { id: person1, label: person1, connections: 0 });
      }
      if (!nodeMap.has(person2)) {
        nodeMap.set(person2, { id: person2, label: person2, connections: 0 });
      }

      // Count connections for each node
      nodeMap.get(person1).connections += collab.interactions;
      nodeMap.get(person2).connections += collab.interactions;

      edges.push({
        source: person1,
        target: person2,
        weight: collab.interactions
      });
    });

    // Position nodes in a circle layout
    const nodes = Array.from(nodeMap.values());
    const centerX = 140;
    const centerY = 120;
    const radius = 80;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.radius = Math.max(8, Math.min(20, 8 + (node.connections / maxInteractions) * 12));
    });

    return { nodes, edges, maxInteractions };
  }, [analysis]);

  // Helper functions for quarter filtering
  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `${now.getFullYear()} Q${quarter}`;
  };

  const getFinancialYearQuarters = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const isAfterApril = currentMonth >= 3; // April is month 3 (0-indexed)
    
    const fyYear = isAfterApril ? now.getFullYear() : now.getFullYear() - 1;
    return [
      `${fyYear} Q1`, // Jan-Mar
      `${fyYear} Q2`, // Apr-Jun  
      `${fyYear} Q3`, // Jul-Sep
      `${fyYear} Q4`  // Oct-Dec
    ];
  };

  // Convert quarter filter to epoch timestamp range - memoized to prevent re-calculations
  const quarterToEpochRange = useCallback((quarterFilter) => {
    const now = new Date();
    
    if (quarterFilter === 'current') {
      // Current quarter using UTC
      const currentMonth = now.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const startDate = new Date(Date.UTC(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999));
      
      return {
        start_epoch: Math.floor(startDate.getTime() / 1000),
        end_epoch: Math.floor(endDate.getTime() / 1000)
      };
    } else if (quarterFilter === 'last_financial') {
      // Financial year (April to March) - match backend logic exactly using UTC
      const currentMonth = now.getMonth() + 1; // Convert to 1-indexed like backend
      let fyStartYear, fyEndYear;
      
      if (currentMonth >= 4) { // After April
        fyStartYear = now.getFullYear();
        fyEndYear = now.getFullYear() + 1;
      } else { // Before April
        fyStartYear = now.getFullYear() - 1;
        fyEndYear = now.getFullYear();
      }
      
      const startDate = new Date(Date.UTC(fyStartYear, 3, 1, 0, 0, 0)); // April 1st UTC
      const endDate = new Date(Date.UTC(fyEndYear, 2, 31, 23, 59, 59, 999)); // March 31st UTC
      
      return {
        start_epoch: Math.floor(startDate.getTime() / 1000),
        end_epoch: Math.floor(endDate.getTime() / 1000)
      };
    } else if (quarterFilter === 'past_year') {
      // Past year: current time - 1 year
      const endDate = new Date();
      const startDate = new Date();
      startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
      
      return {
        start_epoch: Math.floor(startDate.getTime() / 1000),
        end_epoch: Math.floor(endDate.getTime() / 1000)
      };
    } else {
      // Default: current time - 3 months (to show more meaningful data) using UTC
      const endDate = new Date();
      const startDate = new Date();
      startDate.setUTCMonth(startDate.getUTCMonth() - 3);
      
      return {
        start_epoch: Math.floor(startDate.getTime() / 1000),
        end_epoch: Math.floor(endDate.getTime() / 1000)
      };
    }
  }, []); // No dependencies since it only uses current date

  const filterQuarterlyData = (quarterlyInsights) => {
    if (!quarterlyInsights || !quarterlyInsights.quarters) return quarterlyInsights;
    
    const currentQuarter = getCurrentQuarter();
    const financialQuarters = getFinancialYearQuarters();
    
    let filteredQuarters = {};
    
    switch (quarterFilter) {
      case 'current':
        if (quarterlyInsights.quarters[currentQuarter]) {
          filteredQuarters[currentQuarter] = quarterlyInsights.quarters[currentQuarter];
        }
        break;
      case 'last_financial':
        financialQuarters.forEach(quarter => {
          if (quarterlyInsights.quarters[quarter]) {
            filteredQuarters[quarter] = quarterlyInsights.quarters[quarter];
          }
        });
        break;
      default:
        // Default to current quarter if invalid filter
        if (quarterlyInsights.quarters[currentQuarter]) {
          filteredQuarters[currentQuarter] = quarterlyInsights.quarters[currentQuarter];
        }
        break;
    }
    
    return {
      ...quarterlyInsights,
      quarters: filteredQuarters
    };
  };

  // Calculate epoch range once when quarterFilter changes
  const epochRange = useMemo(() => {
    return quarterToEpochRange(quarterFilter);
  }, [quarterFilter, quarterToEpochRange]);

  // SSE connection for streaming analysis with epoch timestamps - memoized to prevent infinite re-renders
  const sseUrl = useMemo(() => {
    if (!sessionId) return null;
    
    const baseUrl = `${getApiBaseUrl()}/api/repository/${owner}/${repo}/analysis/stream`;
    
    const params = new URLSearchParams({
      session_id: sessionId,
      start_epoch: epochRange.start_epoch.toString(),
      end_epoch: epochRange.end_epoch.toString()
    });
    
    return `${baseUrl}?${params.toString()}`;
  }, [owner, repo, sessionId, epochRange]);

  // Create stable callback functions using useCallback
  const onProgress = useCallback((progressData) => {
    setProgress(progressData);
  }, []);

  const onComplete = useCallback((analysisData) => {
    setAnalysis(analysisData);
    setLoading(false);
    setProgress({ step: 'complete', message: 'Analysis complete!', progress: 100 });
  }, []);

  const onError = useCallback((errorMessage) => {
    setError(errorMessage);
    setLoading(false);
    
    // Check if it's an authentication error
    if (errorMessage && errorMessage.includes('Authentication failed')) {
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [navigate]);

  // Regular analysis fetch function
  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      setProgress({ step: 'starting', message: 'Loading repository analysis...', progress: 0 });
      
      const params = new URLSearchParams({
        session_id: sessionId,
        start_epoch: epochRange.start_epoch.toString(),
        end_epoch: epochRange.end_epoch.toString()
      });
      
      const endpoint = `/repository/${owner}/${repo}/analysis?${params.toString()}`;
      const data = await apiCall(endpoint);
      
      setAnalysis(data);
      setProgress({ step: 'complete', message: 'Analysis complete!', progress: 100 });
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      setError('Failed to load repository analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [owner, repo, sessionId, epochRange]);

  const { data: streamData, error: streamError, isConnected, connect, disconnect, reset } = useSSE(useStreaming ? sseUrl : null, {
    onProgress,
    onComplete,  
    onError
  });

  useEffect(() => {
    if (isAuthenticated && sessionId) {
      if (useStreaming && sseUrl) {
        setLoading(true);
        setError(null);
        setAnalysis(null);
        reset();
        connect();
      } else {
        fetchAnalysis();
      }
    }
    
    // Cleanup function to disconnect when component unmounts or dependencies change
    return () => {
      if (useStreaming) {
        disconnect();
      }
    };
  }, [owner, repo, sessionId, isAuthenticated, quarterFilter, useStreaming, sseUrl, connect, disconnect, reset, fetchAnalysis]);

  // Auto-disconnect when analysis is complete
  useEffect(() => {
    if (analysis && !loading) {
      disconnect();
    }
  }, [analysis, loading, disconnect]);


  if (!isAuthenticated || !sessionId) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
              Analyzing repository {owner}/{repo}
            </h2>
            
            {/* Progress bar */}
            {progress.progress > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px', 
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${progress.progress}%`, 
                    backgroundColor: '#3b82f6', 
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  marginTop: '8px', 
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{progress.message}</span>
                  <span>{progress.progress}%</span>
                </div>
              </div>
            )}
            
            {/* Connection status - only show in streaming mode */}
            {useStreaming && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '12px', 
                color: '#6b7280', 
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <span>Connection status:</span>
                {isConnected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconStatusConnected size={14} />
                    <span style={{ color: '#059669', fontWeight: '500' }}>Connected</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconStatusDisconnected size={14} />
                    <span style={{ color: '#dc2626', fontWeight: '500' }}>Disconnected</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Real-time stats */}
            {streamData && (
              <div style={{ 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  <IconDatabase size={16} color="#3b82f6" />
                  Data collected so far:
                </div>
                
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: '#4b5563' }}>
                  {streamData.repository && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                      <span>• Repository info:</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#10b981"/>
                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ color: '#059669', fontWeight: '500' }}>Complete</span>
                    </div>
                  )}
                  {streamData.contributors && (
                    <div style={{ padding: '6px 0' }}>
                      • Contributors: <strong>{streamData.contributors.length}</strong>
                    </div>
                  )}
                  {streamData.pull_requests && (
                    <div style={{ padding: '6px 0' }}>
                      • Pull requests: <strong>{streamData.pull_requests.length}</strong>
                    </div>
                  )}
                  {streamData.total_commits && (
                    <div style={{ padding: '6px 0' }}>
                      • Commits processed: <strong>{streamData.total_commits}</strong>
                    </div>
                  )}
                  {streamData.total_detailed_commits && (
                    <div style={{ padding: '6px 0' }}>
                      • File changes analyzed: <strong>{streamData.total_detailed_commits}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ fontSize: '14px', marginTop: '8px', color: '#9ca3af' }}>
            Real-time analysis in progress...
          </div>
        </div>
      </div>
    );
  }

  if (error || streamError) {
    return (
      <div className="container">
        <div className="error">
          {error || streamError}
          <div style={{ marginTop: '12px' }}>
            <button 
              onClick={() => {
                setError(null);
                reset();
                connect();
              }}
              style={{ marginRight: '12px', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/dashboard?session_id=${sessionId}`)}
          className="button button-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          No analysis data available for this repository.
        </div>
      </div>
    );
  }

  // Prepare chart data
  const contributorsData = {
    labels: analysis.code_ownership.top_contributors.slice(0, 10).map(([name]) => name),
    datasets: [
      {
        label: 'Commits',
        data: analysis.code_ownership.top_contributors.slice(0, 10).map(([, commits]) => commits),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const activityData = {
    labels: Object.keys(analysis.activity_heatmap.daily).slice(-30),
    datasets: [
      {
        label: 'Daily Commits',
        data: Object.values(analysis.activity_heatmap.daily).slice(-30),
        fill: false,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const riskData = {
    labels: analysis.dependency_risk.key_contributors.slice(0, 5).map(contributor => contributor.name),
    datasets: [
      {
        data: analysis.dependency_risk.key_contributors.slice(0, 5).map(contributor => contributor.percentage),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };


  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
              {analysis.repository.full_name}
            </h1>
            {analysis.repository.description && (
              <p style={{ margin: 0, color: '#6b7280' }}>
                {analysis.repository.description}
              </p>
            )}
          </div>
          <button 
            onClick={() => navigate(`/dashboard?session_id=${sessionId}`)}
            className="button button-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Quarter Filter Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCalendar size={18} color="#1f2937" />
            Analysis Period
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setQuarterFilter('current')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: quarterFilter === 'current' ? '#3b82f6' : 'white',
                color: quarterFilter === 'current' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: quarterFilter === 'current' ? '600' : '400'
              }}
            >
              Current Quarter
            </button>
            <button
              onClick={() => setQuarterFilter('last_financial')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: quarterFilter === 'last_financial' ? '#3b82f6' : 'white',
                color: quarterFilter === 'last_financial' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: quarterFilter === 'last_financial' ? '600' : '400'
              }}
            >
              Financial Year
            </button>
            <button
              onClick={() => setQuarterFilter('past_year')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: quarterFilter === 'past_year' ? '#3b82f6' : 'white',
                color: quarterFilter === 'past_year' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: quarterFilter === 'past_year' ? '600' : '400'
              }}
            >
              Past Year
            </button>
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {quarterFilter === 'current' && `Showing data for ${getCurrentQuarter()}`}
          {quarterFilter === 'last_financial' && `Showing financial year data (${getFinancialYearQuarters().join(', ')})`}
          {quarterFilter === 'past_year' && `Showing data for the past year (${new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()})`}
        </div>
      </div>

      {/* Professional Quarterly Analysis */}
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconChart size={20} color="#1f2937" />
          Quarterly Business Intelligence (Last 12 Months)
        </h2>
        
        {/* Year-over-Year KPIs */}
        {analysis.activity_heatmap.quarterly_insights && (() => {
          const filteredInsights = filterQuarterlyData(analysis.activity_heatmap.quarterly_insights);
          return (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0066cc' }}>
                  {filteredInsights.year_over_year.total_commits}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Commits (YTD)</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                  {filteredInsights.year_over_year.total_contributors}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Active Contributors</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef7ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9333ea' }}>
                  {filteredInsights.year_over_year?.total_prs || 0}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Pull Requests</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {filteredInsights.year_over_year?.overall_merge_rate || 0}%
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Merge Rate</div>
              </div>
            </div>

            {/* Quarterly Breakdown */}
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconTrending size={16} color="#059669" />
                Quarterly Performance Breakdown
              </div>
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {Object.entries(filteredInsights.quarters || {}).map(([quarter, data]) => (
                <div key={quarter} style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {quarter}
                    </h4>
                    <div style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      backgroundColor: data.velocity_score > 10 ? '#10b981' : data.velocity_score > 5 ? '#f59e0b' : '#6b7280',
                      color: 'white', 
                      borderRadius: '12px' 
                    }}>
                      Velocity: {data.velocity_score}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>{data.commits}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Commits</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{data.active_contributors}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Contributors</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9333ea' }}>{data.total_prs}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>PRs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{data.merge_rate}%</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Merge Rate</div>
                    </div>
                  </div>
                  
                  {/* Top Contributors for Quarter */}
                  {data.top_contributors.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Top Contributors: {data.top_contributors.map(([name, commits]) => `${name} (${commits})`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key Insights */}
            {filteredInsights.trends && filteredInsights.trends.most_productive_quarter && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#0369a1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconSearch size={14} color="#7c3aed" />
                    Key Insights
                  </div>
                </h4>
                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                  {filteredInsights.trends.most_productive_quarter && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconTrending size={12} color="#059669" />
                        Most Productive Quarter: <strong>{filteredInsights.trends.most_productive_quarter[0]}</strong>
                      </div>
                      ({filteredInsights.trends.most_productive_quarter[1].commits} commits)
                    </div>
                  )}
                  {filteredInsights.trends.highest_merge_rate_quarter && (
                    <div>
                      ✅ Highest Quality Quarter: <strong>{filteredInsights.trends.highest_merge_rate_quarter[0]}</strong> 
                      ({filteredInsights.trends.highest_merge_rate_quarter[1].merge_rate}% merge rate)
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconChart size={12} color="#0369a1" />
                      Average Quarterly Velocity: <strong>{filteredInsights.year_over_year.avg_quarterly_velocity}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Repository Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>
              {analysis.code_ownership.total_commits}
            </div>
            <div style={{ color: '#6b7280' }}>Total Commits</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {analysis.code_ownership.unique_contributors}
            </div>
            <div style={{ color: '#6b7280' }}>Contributors</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {analysis.dependency_risk.bus_factor}
            </div>
            <div style={{ color: '#6b7280' }}>Bus Factor</div>
          </div>
          {analysis.repository.language && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {analysis.repository.language}
              </div>
              <div style={{ color: '#6b7280' }}>Primary Language</div>
            </div>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">Top Contributors</h3>
          <Bar data={contributorsData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Activity Over Time (Last 30 Days)</h3>
          <Line data={activityData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Dependency Risk Distribution</h3>
          <Doughnut data={riskData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Key Contributors Risk Analysis</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {analysis.dependency_risk.key_contributors.map((contributor, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: contributor.risk_level === 'high' ? '#fef2f2' : 
                                 contributor.risk_level === 'medium' ? '#fffbeb' : '#f8fafc'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{contributor.name}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {contributor.commits} commits ({contributor.percentage}%)
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  backgroundColor: contributor.risk_level === 'high' ? '#dc2626' : 
                                 contributor.risk_level === 'medium' ? '#f59e0b' : '#10b981',
                  color: 'white'
                }}>
                  {contributor.risk_level} risk
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Pull Request Collaboration Brain Map</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          PR interaction patterns, review networks, and collaboration workflows {quarterFilter !== 'all' && `(filtered for ${quarterFilter === 'current' ? 'current quarter' : 'financial year'})`}
        </p>
        
        {/* PR Workflow Analysis */}
        {analysis.dependency_risk.pull_request_analysis?.workflow_analysis && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconRefresh size={16} color="#7c3aed" />
                Collaboration Network
              </div>
            </h4>
            
            {/* Most Active Authors and Reviewers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369a1' }}>
                  👑 Most Active PR Authors
                </h5>
                {(analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.most_active_authors || []).map(([author, count], index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < 4 ? '1px solid #e0f2fe' : 'none' }}>
                    <span style={{ fontWeight: '500', color: '#1e40af' }}>{author}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{count} PRs</span>
                  </div>
                ))}
              </div>
              
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#16a34a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconSearch size={14} color="#15803d" />
                    Most Active Reviewers
                  </div>
                </h5>
                {(analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.most_active_reviewers || []).map(([reviewer, count], index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: index < 4 ? '1px solid #dcfce7' : 'none' }}>
                    <span style={{ fontWeight: '500', color: '#15803d' }}>{reviewer}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{count} reviews</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Collaboration Network */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '4px', height: '20px', backgroundColor: '#3b82f6', borderRadius: '2px', marginRight: '12px' }}></div>
                <h5 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                  Collaboration Network
                </h5>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Interactive visualization of team collaboration patterns based on quarterly data
              </p>
              <div style={{ height: '300px', position: 'relative' }}>
                {collaborationNetworkData.nodes.length > 0 ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <style>{`
                      @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.5); }
                        to { opacity: 1; transform: scale(1); }
                      }
                      @keyframes drawLine {
                        from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
                        to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
                      }
                      .network-node {
                        animation: fadeIn 0.6s ease-out forwards;
                        transform-origin: center;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      }
                      .network-node:hover {
                        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
                        transform: scale(1.1);
                      }
                      .network-edge {
                        animation: drawLine 1s ease-out forwards;
                        transition: all 0.3s ease;
                      }
                      .network-edge:hover {
                        stroke-width: 4 !important;
                        filter: drop-shadow(0 0 4px rgba(147, 51, 234, 0.4));
                      }
                      .network-text {
                        opacity: 0;
                        animation: fadeIn 0.6s ease-out 0.4s forwards;
                        transition: all 0.2s ease;
                      }
                      .pulse-animation {
                        animation: pulse 2s infinite;
                      }
                      @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                      }
                    `}</style>
                    <svg 
                      width="100%" 
                      height="100%" 
                      viewBox="0 0 280 260" 
                      style={{ 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        backgroundColor: '#fafafa',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseLeave={() => setTooltip({ show: false, content: '', x: 0, y: 0 })}
                    >
                      {/* Draw edges first (so they appear behind nodes) */}
                      {collaborationNetworkData.edges.map((edge, index) => {
                        const sourceNode = collaborationNetworkData.nodes.find(n => n.id === edge.source);
                        const targetNode = collaborationNetworkData.nodes.find(n => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;
                        
                        const strokeWidth = Math.max(2, Math.min(5, edge.weight / collaborationNetworkData.maxInteractions * 5));
                        const opacity = Math.max(0.4, Math.min(0.9, edge.weight / collaborationNetworkData.maxInteractions));
                        
                        return (
                          <line
                            key={index}
                            className="network-edge"
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke="#6366f1"
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                            strokeLinecap="round"
                            style={{ 
                              cursor: 'pointer',
                              animationDelay: `${index * 0.1}s`
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                content: `${edge.source} ↔ ${edge.target}\n${edge.weight} collaborations`,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10
                              });
                            }}
                          />
                        );
                      })}
                      
                      {/* Draw nodes */}
                      {collaborationNetworkData.nodes.map((node, index) => (
                        <g key={index}>
                          <circle
                            className="network-node"
                            cx={node.x}
                            cy={node.y}
                            r={node.radius}
                            fill="url(#nodeGradient)"
                            stroke="#4f46e5"
                            strokeWidth="2"
                            style={{ 
                              cursor: 'pointer',
                              animationDelay: `${index * 0.1 + 0.3}s`
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                content: `${node.label}\n${node.connections} total collaborations`,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10
                              });
                            }}
                          />
                          <text
                            className="network-text"
                            x={node.x}
                            y={node.y + node.radius + 16}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#374151"
                            fontWeight="500"
                            style={{ 
                              pointerEvents: 'none',
                              animationDelay: `${index * 0.1 + 0.5}s`
                            }}
                          >
                            {node.label.length > 14 ? node.label.substring(0, 14) + '...' : node.label}
                          </text>
                        </g>
                      ))}
                      
                      {/* Gradient Definition */}
                      <defs>
                        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'#60a5fa', stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Custom Tooltip */}
                    {tooltip.show && (
                      <div 
                        style={{
                          position: 'fixed',
                          left: tooltip.x,
                          top: tooltip.y,
                          transform: 'translate(-50%, -100%)',
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          whiteSpace: 'pre-line',
                          pointerEvents: 'none',
                          zIndex: 1000,
                          maxWidth: '220px',
                          textAlign: 'center',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #334155',
                          backdropFilter: 'blur(8px)',
                          lineHeight: '1.4'
                        }}
                      >
                        {tooltip.content}
                        <div style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #1e293b'
                        }}></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    color: '#9333ea',
                    fontSize: '14px'
                  }}>
                    No collaboration data available
                  </div>
                )}
              </div>
              <div style={{ 
                marginTop: '16px', 
                fontSize: '12px', 
                color: '#64748b',
                textAlign: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}></div>
                    <span>Node size = collaboration frequency</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '2px', backgroundColor: '#6366f1', borderRadius: '1px' }}></div>
                    <span>Edge thickness = interaction strength</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quarterly PR Trends */}
            {analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7', marginTop: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#16a34a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconChart size={14} color="#059669" />
                    Quarterly PR Insights
                  </div>
                </h5>
                <div style={{ display: 'grid', gap: '8px', fontSize: '12px' }}>
                  {analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.most_active_quarter && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconFire size={12} color="#dc2626" />
                        Most Active Quarter: <strong>{analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.most_active_quarter?.[0]}</strong>
                      </div>
                      ({analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.most_active_quarter?.[1]?.prs} PRs)
                    </div>
                  )}
                  {analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.highest_quality_quarter && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconStar size={12} color="#f59e0b" />
                        Highest Quality Quarter: <strong>{analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.highest_quality_quarter?.[0]}</strong>
                      </div>
                      ({analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.highest_quality_quarter?.[1]?.merge_rate}% merge rate)
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconTrending size={12} color="#059669" />
                      Total Quarterly PRs: <strong>{analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.total_quarterly_prs}</strong>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconChart size={12} color="#3b82f6" />
                      Avg Quarterly Merge Rate: <strong>{analysis.dependency_risk?.pull_request_analysis?.workflow_analysis?.quarterly_trends?.avg_quarterly_merge_rate}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Knowledge Areas & Module Ownership</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Key contributors and their areas of expertise in the codebase
        </p>
        
        {/* Core Contributors */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
            Core Contributors ({analysis.knowledge_areas.core_contributors?.length || 0})
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {analysis.knowledge_areas.core_contributors?.slice(0, 10).map((contributor, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '6px',
                borderLeft: '4px solid #0066cc'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
                  {contributor.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {contributor.contributions} contributions • {contributor.commit_count || 0} commits
                  {contributor.active_days && (
                    <span> • Active {contributor.active_days} days</span>
                  )}
                </div>
                {contributor.avg_commits_per_day && (
                  <div style={{ fontSize: '12px', color: '#059669' }}>
                    Average: {contributor.avg_commits_per_day} commits/day
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Module Impact Analysis */}
        {analysis.code_ownership.module_impact && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
              Module Impact & Ownership
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {Object.entries(analysis.code_ownership.module_impact).slice(0, 8).map(([contributor, impact]) => (
                <div key={contributor} style={{ 
                  padding: '12px', 
                  backgroundColor: '#fefbf3', 
                  borderRadius: '6px',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
                    {contributor}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    Impact Score: {impact.impact_score} • 
                    Primary Files: {impact.primary_files_count} • 
                    Primary Folders: {impact.primary_folders_count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669' }}>
                    +{impact.total_additions} lines added, -{impact.total_deletions} lines removed
                  </div>
                  {impact.folders_owned?.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      Key folders: {impact.folders_owned.slice(0, 3).join(', ')}
                      {impact.folders_owned.length > 3 && ` +${impact.folders_owned.length - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folder Ownership */}
        {analysis.code_ownership.folder_ownership && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
              Top Module/Folder Ownership
            </h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {Object.entries(analysis.code_ownership.folder_ownership).slice(0, 12).map(([folder, owners]) => {
                const topOwner = Object.entries(owners).sort(([,a], [,b]) => b - a)[0];
                return (
                  <div key={folder} style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>{folder || 'root'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {topOwner[0]} ({topOwner[1]} commits)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RepositoryAnalysis;