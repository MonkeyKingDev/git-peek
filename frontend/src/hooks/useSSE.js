import { useState, useEffect, useRef, useCallback } from 'react';

export const useSSE = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const dataRef = useRef({});
  const optionsRef = useRef(options);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Update options ref when options change
  optionsRef.current = options;

  const connect = useCallback(() => {
    // Force close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        if (optionsRef.current.onOpen) optionsRef.current.onOpen();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          
          if (optionsRef.current.onMessage) {
            optionsRef.current.onMessage(parsedData);
          }

          // Handle different message types
          switch (parsedData.type) {
            case 'progress':
              if (optionsRef.current.onProgress) {
                optionsRef.current.onProgress(parsedData);
              }
              break;
              
            case 'repository':
              dataRef.current.repository = parsedData.data;
              setData({ ...dataRef.current });
              break;
              
            case 'contributors':
              dataRef.current.contributors = parsedData.data;
              setData({ ...dataRef.current });
              break;
              
            case 'pull_requests':
              dataRef.current.pull_requests = parsedData.data;
              setData({ ...dataRef.current });
              break;
              
            case 'commits_chunk':
              if (!dataRef.current.commits) {
                dataRef.current.commits = [];
              }
              dataRef.current.commits = dataRef.current.commits.concat(parsedData.data);
              dataRef.current.total_commits = parsedData.total_so_far;
              setData({ ...dataRef.current });
              break;
              
            case 'detailed_commits_chunk':
              if (!dataRef.current.detailed_commits) {
                dataRef.current.detailed_commits = [];
              }
              dataRef.current.detailed_commits = dataRef.current.detailed_commits.concat(parsedData.data);
              dataRef.current.total_detailed_commits = parsedData.total_so_far;
              setData({ ...dataRef.current });
              break;
              
            case 'analysis_complete':
              dataRef.current.analysis = parsedData.data;
              setData({ ...dataRef.current });
              if (optionsRef.current.onComplete) {
                optionsRef.current.onComplete(parsedData.data);
              }
              break;
              
            case 'stream_complete':
              // Stream finished successfully, close connection
              setIsConnected(false);
              retryCountRef.current = 0; // Reset retry count on successful completion
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;
              
            case 'error':
              setError(parsedData.message);
              if (optionsRef.current.onError) {
                optionsRef.current.onError(parsedData.message);
              }
              break;
              
            default:
              break;
          }
        } catch (parseError) {
          console.error('Failed to parse SSE data:', parseError);
          setError('Failed to parse server response');
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        
        // Check if this might be a 401 error (connection fails immediately)
        if (retryCountRef.current === 0 && eventSource.readyState === EventSource.CLOSED) {
          // First failure that immediately closes - likely auth error
          console.warn('SSE connection failed immediately - possible 401 error');
          setError('Authentication failed. Please log in again.');
          if (optionsRef.current.onError) {
            optionsRef.current.onError('Authentication failed. Please log in again.');
          }
          return;
        }
        
        // Implement retry logic for other errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          console.log(`Connection failed, retrying (${retryCountRef.current}/${maxRetries})...`);
          
          // Retry with exponential backoff
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            connect();
          }, 1000 * retryCountRef.current); // 1s, 2s, 3s delays
          
          setError(`Connection failed, retrying (${retryCountRef.current}/${maxRetries})...`);
        } else {
          setError('Connection error occurred after multiple retries');
          if (optionsRef.current.onError) {
            optionsRef.current.onError('Connection error occurred after multiple retries');
          }
        }
      };

    } catch (connectionError) {
      setError('Failed to establish connection');
      setIsConnected(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    dataRef.current = {};
    retryCountRef.current = 0; // Reset retry count
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    error,
    isConnected,
    connect,
    disconnect,
    reset
  };
};