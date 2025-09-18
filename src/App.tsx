import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExcalidrawViewer } from './components/ExcalidrawViewer';
import { type ExcalidrawImperativeAPI, type ExcalidrawInitialData } from '@excalidraw/excalidraw';
import './styles.css';

/**
 * Main App component that manages the Excalidraw viewer with toolbar controls
 */
const App: React.FC = () => {
  // State for the current scene data
  const [initialData, setInitialData] = useState<ExcalidrawInitialData>({
    elements: [],
    appState: {},
    files: {},
  });

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load the default sample scene on component mount
   */
  useEffect(() => {
    const loadSampleScene = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/sample.excalidraw');
        if (!response.ok) {
          throw new Error(`Failed to load sample scene: ${response.statusText}`);
        }

        const sceneData = await response.json();

        // Validate that the loaded data has the expected structure
        if (!sceneData || typeof sceneData !== 'object') {
          throw new Error('Invalid scene data format');
        }

        console.log('Loaded scene data:', sceneData);

        // Ensure files property exists (required for embedded images)
        const validatedData: ExcalidrawInitialData = {
          elements: sceneData.elements || [],
          appState: sceneData.appState || {},
          files: sceneData.files || {},
        };

        console.log('Validated data:', validatedData);
        setInitialData(validatedData);
      } catch (err) {
        console.error('Error loading sample scene:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sample scene');
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleScene();
  }, []);




  return (
    <div className="app">
      {/* Main viewer area - Excalidraw handles its own UI */}
      <div className="viewer-container">
        {isLoading && <div className="loading">Loading scene...</div>}
        {error && <div className="error-message">{error}</div>}
        {!isLoading && !error && (
          <ExcalidrawViewer
            initialData={initialData}
            onApiReady={() => {}} // No longer needed
          />
        )}
      </div>
    </div>
  );
};

export default App;
