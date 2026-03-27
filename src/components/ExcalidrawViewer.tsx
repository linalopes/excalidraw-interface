import React, { useCallback, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type {
  ExcalidrawAppState,
  ExcalidrawElement,
  ExcalidrawInitialData,
  ExcalidrawImperativeAPI,
} from '../types/excalidraw';

interface ExcalidrawViewerProps {
  /** Initial data to load into the Excalidraw scene */
  initialData: ExcalidrawInitialData;
  /** Callback when the Excalidraw API is ready */
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
}

interface EmbedOverlayItem {
  id: string;
  src: string;
  title: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

const isValidHttpsUrl = (value: string | undefined): value is string => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// TEMP MVP: inject a single sample rectangle embed if scene has none yet.
// Remove this helper once embeds are authored directly in scene data.
const withFallbackSampleEmbed = (elements: ExcalidrawElement[]): ExcalidrawElement[] => {
  const hasIframeEmbed = elements.some(
    (element) =>
      !element.isDeleted &&
      element.customData?.embedType === 'iframe' &&
      isValidHttpsUrl(element.customData.src),
  );

  if (hasIframeEmbed) {
    return elements;
  }

  const now = Date.now();
  const fallbackElement: ExcalidrawElement = {
    id: 'mvp-sample-iframe-embed',
    type: 'rectangle',
    x: 120,
    y: 120,
    width: 480,
    height: 320,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: [],
    updated: now,
    link: null,
    locked: true,
    customData: {
      embedType: 'iframe',
      src: 'https://example.com',
      title: 'Example',
    },
  };

  return [...elements, fallbackElement];
};

const getVisibleIframeEmbedElements = (elements: ExcalidrawElement[]): ExcalidrawElement[] => {
  return elements.filter((element) => {
    if (element.isDeleted || element.width <= 0 || element.height <= 0) {
      return false;
    }

    return (
      element.customData?.embedType === 'iframe' &&
      isValidHttpsUrl(element.customData.src)
    );
  });
};

const getEmbedOverlayItems = (
  elements: ExcalidrawElement[],
  appState: Partial<ExcalidrawAppState>,
): EmbedOverlayItem[] => {
  const scrollX = appState.scrollX ?? 0;
  const scrollY = appState.scrollY ?? 0;
  const zoom = appState.zoom?.value ?? 1;

  return getVisibleIframeEmbedElements(elements).map((element) => ({
    id: element.id,
    src: element.customData?.src ?? '',
    title: element.customData?.title ?? 'Embedded content',
    // Excalidraw world->screen mapping:
    // screenX = (elementX + scrollX) * zoom, same for Y and size.
    left: (element.x + scrollX) * zoom,
    top: (element.y + scrollY) * zoom,
    width: element.width * zoom,
    height: element.height * zoom,
  }));
};

/**
 * ExcalidrawViewer component that renders an Excalidraw scene in read-only mode
 * with pan and zoom capabilities, and clickable links.
 */
export const ExcalidrawViewer: React.FC<ExcalidrawViewerProps> = ({
  initialData,
  onApiReady,
}) => {
  type ExcalidrawOnChange = NonNullable<React.ComponentProps<typeof Excalidraw>['onChange']>;

  const [currentElements, setCurrentElements] = React.useState<ExcalidrawElement[]>(
    withFallbackSampleEmbed(initialData.elements || []),
  );
  const [currentAppState, setCurrentAppState] = React.useState<Partial<ExcalidrawAppState>>(
    initialData.appState || {},
  );
  const [currentFiles, setCurrentFiles] = React.useState<Record<string, unknown>>(
    initialData.files || {},
  );

  // Update state when initialData changes
  React.useEffect(() => {
    setCurrentElements(withFallbackSampleEmbed(initialData.elements || []));
    setCurrentAppState(initialData.appState || {});
    setCurrentFiles(initialData.files || {});
  }, [initialData]);

  console.log('ExcalidrawViewer initialData:', initialData);
  console.log('ExcalidrawViewer currentElements:', currentElements);

  // Handle the Excalidraw API when it's ready
  const handleChange: ExcalidrawOnChange = useCallback(
    (elements, appState, files) => {
      console.log('Excalidraw onChange:', { elements, appState, files });
      setCurrentElements([...elements] as ExcalidrawElement[]);
      setCurrentAppState(appState as Partial<ExcalidrawAppState>);
      setCurrentFiles(files as Record<string, unknown>);
    },
    [],
  );

  // Create a mock API object that provides the methods we need
  const mockApi = React.useMemo(
    () => ({
      getSceneElements: () => {
        console.log('getSceneElements called, returning:', currentElements);
        return Array.isArray(currentElements) ? currentElements : [];
      },
      getAppState: () => {
        console.log('getAppState called, returning:', currentAppState);
        return (currentAppState || {}) as ExcalidrawAppState;
      },
      getFiles: () => {
        console.log('getFiles called, returning:', currentFiles);
        return currentFiles || {};
      },
    }),
    [currentElements, currentAppState, currentFiles],
  );

  // Notify parent when API is ready
  useEffect(() => {
    onApiReady(mockApi as ExcalidrawImperativeAPI);
  }, [mockApi, onApiReady]);

  // Ensure we have valid initial data
  const safeInitialData = {
    elements: withFallbackSampleEmbed(initialData.elements || []),
    appState: initialData.appState || {},
    files: initialData.files || {},
  };

  const embedOverlays = React.useMemo(
    () => getEmbedOverlayItems(currentElements, currentAppState),
    [currentElements, currentAppState],
  );

  return (
    <div className="viewer-container">
      <Excalidraw
        initialData={safeInitialData as unknown as React.ComponentProps<typeof Excalidraw>['initialData']}
        viewModeEnabled={false}
        onChange={handleChange}
        // Preserve the original theme and view state
        theme={safeInitialData.appState?.theme || 'light'}
      />
      <div className="embed-overlay-layer" aria-hidden="true">
        {embedOverlays.map((embed) => (
          <div
            key={embed.id}
            className="embed-overlay-item"
            style={{
              left: embed.left,
              top: embed.top,
              width: embed.width,
              height: embed.height,
            }}
          >
            <iframe
              src={embed.src}
              title={embed.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="embed-overlay-iframe"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
