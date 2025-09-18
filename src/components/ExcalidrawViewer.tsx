import React, { useCallback, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

// Define types for Excalidraw data
interface ExcalidrawInitialData {
  elements: any[];
  appState: any;
  files: Record<string, any>;
}

interface ExcalidrawImperativeAPI {
  getSceneElements: () => any[];
  getAppState: () => any;
  getFiles: () => Record<string, any>;
}

interface ExcalidrawViewerProps {
  /** Initial data to load into the Excalidraw scene */
  initialData: ExcalidrawInitialData;
  /** Callback when the Excalidraw API is ready */
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
}

/**
 * ExcalidrawViewer component that renders an Excalidraw scene in read-only mode
 * with pan and zoom capabilities, and clickable links.
 */
export const ExcalidrawViewer: React.FC<ExcalidrawViewerProps> = ({
  initialData,
  onApiReady,
}) => {
  const [currentElements, setCurrentElements] = React.useState(initialData.elements || []);
  const [currentAppState, setCurrentAppState] = React.useState(initialData.appState || {});
  const [currentFiles, setCurrentFiles] = React.useState(initialData.files || {});

  // Update state when initialData changes
  React.useEffect(() => {
    setCurrentElements(initialData.elements || []);
    setCurrentAppState(initialData.appState || {});
    setCurrentFiles(initialData.files || {});
  }, [initialData]);

  console.log('ExcalidrawViewer initialData:', initialData);
  console.log('ExcalidrawViewer currentElements:', currentElements);

  // Handle the Excalidraw API when it's ready
  const handleChange = useCallback((elements: any, appState: any, files: any) => {
    console.log('Excalidraw onChange:', { elements, appState, files });
    setCurrentElements(elements);
    setCurrentAppState(appState);
    setCurrentFiles(files);
  }, []);

  // Create a mock API object that provides the methods we need
  const mockApi = React.useMemo(() => ({
    getSceneElements: () => {
      console.log('getSceneElements called, returning:', currentElements);
      return Array.isArray(currentElements) ? currentElements : [];
    },
    getAppState: () => {
      console.log('getAppState called, returning:', currentAppState);
      return currentAppState || {};
    },
    getFiles: () => {
      console.log('getFiles called, returning:', currentFiles);
      return currentFiles || {};
    },
  }), [currentElements, currentAppState, currentFiles]);

  // Notify parent when API is ready
  useEffect(() => {
    onApiReady(mockApi as ExcalidrawImperativeAPI);
  }, [mockApi, onApiReady]);

  // Ensure we have valid initial data
  const safeInitialData = {
    elements: initialData.elements || [],
    appState: initialData.appState || {},
    files: initialData.files || {},
  };

  return (
    <div className="viewer-container">
      <Excalidraw
        initialData={safeInitialData}
        viewModeEnabled={false}
        onChange={handleChange}
        // Preserve the original theme and view state
        theme={safeInitialData.appState?.theme || 'light'}
      />
    </div>
  );
};
