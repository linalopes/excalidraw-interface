import React, { useCallback, useEffect } from 'react';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
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
  kind: OverlayEmbedKind;
  left: number;
  top: number;
  width: number;
  height: number;
}

type OverlayEmbedKind = 'image' | 'video' | 'pdf' | 'iframe';

interface OverlayEmbedElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  title: string;
  kind: OverlayEmbedKind;
}

interface OverlayViewportState {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

interface InternalExcalidrawApi {
  getSceneElements: () => readonly ExcalidrawElement[];
  updateScene: (scene: { elements: readonly ExcalidrawElement[] }) => void;
  getAppState?: () => Partial<ExcalidrawAppState>;
  getFiles?: () => Record<string, unknown>;
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

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] as const;
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'] as const;

const inferEmbedKindFromUrl = (src: string): OverlayEmbedKind => {
  try {
    const url = new URL(src);
    const pathname = url.pathname.toLowerCase();

    if (pathname.endsWith('.pdf')) {
      return 'pdf';
    }
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return 'image';
    }
    if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return 'video';
    }
  } catch {
    // URL validity is checked elsewhere; fallback to iframe.
  }

  return 'iframe';
};

const getEmbedKind = (element: ExcalidrawElement): OverlayEmbedKind => {
  const explicitKind = element.customData?.embedKind;
  if (explicitKind) {
    return explicitKind;
  }

  const src = element.customData?.src;
  if (!src) {
    return 'iframe';
  }

  return inferEmbedKindFromUrl(src);
};

// TEMP MVP: inject a single sample rectangle embed if scene has none yet.
// Remove this helper once embeds are authored directly in scene data.
const withFallbackSampleEmbed = (elements: ExcalidrawElement[]): ExcalidrawElement[] => {
  const hasRealIframeEmbed = elements.some(
    (element) =>
      !element.isDeleted &&
      element.id !== 'mvp-sample-iframe-embed' &&
      element.customData?.embedType === 'iframe' &&
      isValidHttpsUrl(element.customData.src),
  );

  if (hasRealIframeEmbed) {
    return elements.filter((element) => element.id !== 'mvp-sample-iframe-embed');
  }

  const hasAnyIframeEmbed = elements.some(
    (element) =>
      !element.isDeleted &&
      element.customData?.embedType === 'iframe' &&
      isValidHttpsUrl(element.customData.src),
  );

  if (hasAnyIframeEmbed) {
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
    locked: false,
    customData: {
      embedType: 'iframe',
      src: 'https://www.linalopes.info',
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
  elements: OverlayEmbedElement[],
  viewport: OverlayViewportState,
): EmbedOverlayItem[] => {
  return elements.map((element) => ({
    id: element.id,
    src: element.src,
    title: element.title,
    kind: element.kind,
    // Excalidraw world->screen mapping:
    // screenX = (elementX + scrollX) * zoom, same for Y and size.
    left: (element.x + viewport.scrollX) * viewport.zoom,
    top: (element.y + viewport.scrollY) * viewport.zoom,
    width: element.width * viewport.zoom,
    height: element.height * viewport.zoom,
  }));
};

const toOverlayEmbedElements = (elements: readonly ExcalidrawElement[]): OverlayEmbedElement[] => {
  return getVisibleIframeEmbedElements([...elements]).map((element) => ({
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    src: element.customData?.src ?? '',
    title: element.customData?.title ?? 'Embedded content',
    kind: getEmbedKind(element),
  }));
};

const areViewportsEqual = (
  left: OverlayViewportState,
  right: OverlayViewportState,
): boolean => {
  return (
    left.scrollX === right.scrollX &&
    left.scrollY === right.scrollY &&
    left.zoom === right.zoom
  );
};

const areOverlayEmbedListsEqual = (
  left: OverlayEmbedElement[],
  right: OverlayEmbedElement[],
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    const l = left[i];
    const r = right[i];
    if (
      l.id !== r.id ||
      l.x !== r.x ||
      l.y !== r.y ||
      l.width !== r.width ||
      l.height !== r.height ||
      l.src !== r.src ||
      l.title !== r.title ||
      l.kind !== r.kind
    ) {
      return false;
    }
  }

  return true;
};

const getSelectedIframeElementId = (
  appState: Partial<ExcalidrawAppState>,
  embeds: OverlayEmbedElement[],
): string | null => {
  const selectedMap = (appState as { selectedElementIds?: Record<string, boolean> })
    .selectedElementIds;
  if (!selectedMap) {
    return null;
  }

  const selectedIds = Object.keys(selectedMap).filter((id) => selectedMap[id]);
  if (selectedIds.length === 0) {
    return null;
  }

  const embedIds = new Set(embeds.map((embed) => embed.id));
  return selectedIds.find((id) => embedIds.has(id)) ?? null;
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

  const [overlayElements, setOverlayElements] = React.useState<OverlayEmbedElement[]>(
    toOverlayEmbedElements(withFallbackSampleEmbed(initialData.elements || [])),
  );
  const [overlayViewport, setOverlayViewport] = React.useState<OverlayViewportState>({
    scrollX: initialData.appState?.scrollX ?? 0,
    scrollY: initialData.appState?.scrollY ?? 0,
    zoom: initialData.appState?.zoom?.value ?? 1,
  });
  const [latestAppState, setLatestAppState] = React.useState<OverlayViewportState>({
    scrollX: initialData.appState?.scrollX ?? 0,
    scrollY: initialData.appState?.scrollY ?? 0,
    zoom: initialData.appState?.zoom?.value ?? 1,
  });
  const [selectedIframeId, setSelectedIframeId] = React.useState<string | null>(null);
  const [interactiveIframeId, setInteractiveIframeId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const excalidrawApiRef = React.useRef<InternalExcalidrawApi | null>(null);

  // Prepare initial scene data once per incoming initialData change.
  // Fallback embed injection lives only in this initialization path.
  const preparedInitialData = React.useMemo(
    () => ({
      elements: withFallbackSampleEmbed(initialData.elements || []),
      appState: initialData.appState || {},
      files: initialData.files || {},
    }),
    [initialData],
  );

  // Mirror-only path: onChange reflects editor state into React state.
  // Do not mutate the scene from here.
  const handleChange: ExcalidrawOnChange = useCallback(
    (elements, appState, files) => {
      void files;
      const nextViewport: OverlayViewportState = {
        scrollX: appState.scrollX ?? 0,
        scrollY: appState.scrollY ?? 0,
        zoom: appState.zoom?.value ?? 1,
      };
      const nextEmbeds = toOverlayEmbedElements(elements as readonly ExcalidrawElement[]);
      const nextSelectedIframeId = getSelectedIframeElementId(
        appState as Partial<ExcalidrawAppState>,
        nextEmbeds,
      );

      setOverlayViewport((prev) => (areViewportsEqual(prev, nextViewport) ? prev : nextViewport));
      setLatestAppState((prev) => (areViewportsEqual(prev, nextViewport) ? prev : nextViewport));
      setOverlayElements((prev) =>
        areOverlayEmbedListsEqual(prev, nextEmbeds) ? prev : nextEmbeds,
      );
      setSelectedIframeId((prev) => (prev === nextSelectedIframeId ? prev : nextSelectedIframeId));
    },
    [],
  );

  // Expose a minimal imperative API to parent; scene data remains owned by Excalidraw.
  const mockApi = React.useMemo(
    () => ({
      getSceneElements: () => {
        return [...(excalidrawApiRef.current?.getSceneElements() || [])];
      },
      getAppState: () => {
        return (excalidrawApiRef.current?.getAppState?.() || {}) as ExcalidrawAppState;
      },
      getFiles: () => {
        return excalidrawApiRef.current?.getFiles?.() || {};
      },
    }),
    [],
  );

  // Notify parent when API is ready
  useEffect(() => {
    onApiReady(mockApi as ExcalidrawImperativeAPI);
  }, [mockApi, onApiReady]);

  const embedOverlays = React.useMemo(
    () => getEmbedOverlayItems(overlayElements, overlayViewport),
    [overlayElements, overlayViewport],
  );
  const selectedOverlay = React.useMemo(
    () => embedOverlays.find((embed) => embed.id === selectedIframeId) ?? null,
    [embedOverlays, selectedIframeId],
  );
  const canInteractSelectedOverlay = selectedOverlay?.kind === 'iframe' || selectedOverlay?.kind === 'pdf';

  useEffect(() => {
    const hasInteractive = interactiveIframeId
      ? overlayElements.some((embed) => embed.id === interactiveIframeId)
      : true;
    if (!hasInteractive) {
      setInteractiveIframeId(null);
    }
  }, [interactiveIframeId, overlayElements]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInteractiveIframeId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const updateIframeElement = useCallback(
    (elementId: string, updater: (element: ExcalidrawElement) => ExcalidrawElement) => {
      const sceneElements = excalidrawApiRef.current?.getSceneElements() || [];
      const updatedElements = sceneElements.map((element) =>
        element.id === elementId ? updater(element) : element,
      );

      excalidrawApiRef.current?.updateScene({
        elements: updatedElements,
      });
    },
    [],
  );

  const handleAddIframe = useCallback(() => {
    const rawUrl = window.prompt('Enter iframe URL (https:// only):');
    if (!rawUrl) {
      return;
    }

    const validatedUrl = rawUrl.trim();
    if (!isValidHttpsUrl(validatedUrl)) {
      window.alert('Invalid URL. Please enter a valid https:// URL.');
      return;
    }

    const rawTitle = window.prompt('Optional title:', '');
    const embedTitle = rawTitle?.trim() || validatedUrl;

    const zoom = latestAppState.zoom;
    const scrollX = latestAppState.scrollX;
    const scrollY = latestAppState.scrollY;
    const defaultWidth = 640;
    const defaultHeight = 360;
    const rect = containerRef.current?.getBoundingClientRect();

    // Convert screen-center to scene coordinates:
    // worldX = screenX / zoom - scrollX (same for Y).
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 280;
    const elementX = centerX / zoom - scrollX - defaultWidth / 2;
    const elementY = centerY / zoom - scrollY - defaultHeight / 2;

    const [newElement] = convertToExcalidrawElements([
      {
        type: 'rectangle',
        x: elementX,
        y: elementY,
        width: defaultWidth,
        height: defaultHeight,
        locked: false,
        customData: {
          embedType: 'iframe',
          embedKind: inferEmbedKindFromUrl(validatedUrl),
          src: validatedUrl,
          title: embedTitle,
        },
      },
    ]);

    const sceneElements = excalidrawApiRef.current?.getSceneElements() || [];
    const nonFallbackSceneElements = sceneElements.filter(
      (element) => element.id !== 'mvp-sample-iframe-embed',
    );
    const mergedElements = [
      ...nonFallbackSceneElements,
      newElement as unknown as ExcalidrawElement,
    ];

    // Mutation path: Add iframe uses updateScene as the single source of truth.
    excalidrawApiRef.current?.updateScene({
      elements: mergedElements,
    });
  }, [latestAppState]);

  const handleToggleInteractive = useCallback(
    (elementId: string) => {
      setInteractiveIframeId((prev) => (prev === elementId ? null : elementId));
    },
    [],
  );

  const handleChangeSelectedIframeUrl = useCallback(() => {
    if (!selectedOverlay) {
      return;
    }

    const rawUrl = window.prompt('Enter new iframe URL (https:// only):', selectedOverlay.src);
    if (!rawUrl) {
      return;
    }

    const validatedUrl = rawUrl.trim();
    if (!isValidHttpsUrl(validatedUrl)) {
      window.alert('Invalid URL. Please enter a valid https:// URL.');
      return;
    }

    updateIframeElement(selectedOverlay.id, (element) => ({
      ...element,
      customData: {
        ...(element.customData || {}),
        embedType: 'iframe',
        embedKind: inferEmbedKindFromUrl(validatedUrl),
        src: validatedUrl,
        title: element.customData?.title || validatedUrl,
      },
    }));
  }, [selectedOverlay, updateIframeElement]);

  const handleOpenSelectedInNewTab = useCallback(() => {
    if (!selectedOverlay) {
      return;
    }

    window.open(selectedOverlay.src, '_blank', 'noopener,noreferrer');
  }, [selectedOverlay]);

  return (
    <div className="viewer-container" ref={containerRef}>
      <Excalidraw
        initialData={preparedInitialData as unknown as React.ComponentProps<typeof Excalidraw>['initialData']}
        viewModeEnabled={false}
        onChange={handleChange}
        excalidrawAPI={(api) => {
          excalidrawApiRef.current = api as unknown as InternalExcalidrawApi;
        }}
        // Preserve the original theme and view state
        theme={preparedInitialData.appState?.theme || 'light'}
      />
      <div className="embed-overlay-layer">
        {embedOverlays.map((embed) => (
          <div
            key={embed.id}
            className={`embed-overlay-item ${
              interactiveIframeId === embed.id ? 'embed-overlay-item--interactive' : ''
            }`}
            style={{
              left: embed.left,
              top: embed.top,
              width: embed.width,
              height: embed.height,
            }}
          >
            <button
              type="button"
              className="embed-overlay-chip"
              onClick={() => handleToggleInteractive(embed.id)}
              style={{ display: embed.kind === 'iframe' || embed.kind === 'pdf' ? 'inline-block' : 'none' }}
            >
              {interactiveIframeId === embed.id ? 'Lock' : 'Interact'}
            </button>
            {embed.kind === 'image' && (
              <img
                src={embed.src}
                alt={embed.title}
                className="embed-overlay-media"
                draggable={false}
              />
            )}
            {embed.kind === 'video' && (
              <video
                src={embed.src}
                controls
                className="embed-overlay-media embed-overlay-media--interactive"
              />
            )}
            {embed.kind === 'pdf' && (
              <object
                data={embed.src}
                type="application/pdf"
                className={`embed-overlay-object ${
                  interactiveIframeId === embed.id ? 'embed-overlay-object--interactive' : ''
                }`}
              >
                <a href={embed.src} target="_blank" rel="noopener noreferrer">
                  Open PDF
                </a>
              </object>
            )}
            {embed.kind === 'iframe' && (
              <iframe
                src={embed.src}
                title={embed.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`embed-overlay-iframe ${
                  interactiveIframeId === embed.id ? 'embed-overlay-iframe--interactive' : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {selectedOverlay && (
        <div
          className="iframe-context-panel"
          style={{
            left: selectedOverlay.left + selectedOverlay.width + 8,
            top: selectedOverlay.top,
          }}
        >
          <button
            type="button"
            className="iframe-context-panel-button"
            onClick={() => handleToggleInteractive(selectedOverlay.id)}
            disabled={!canInteractSelectedOverlay}
          >
            {interactiveIframeId === selectedOverlay.id ? 'Lock' : 'Interact'}
          </button>
          <button
            type="button"
            className="iframe-context-panel-button"
            onClick={handleChangeSelectedIframeUrl}
          >
            Change URL
          </button>
          <button
            type="button"
            className="iframe-context-panel-button"
            onClick={handleOpenSelectedInNewTab}
          >
            Open in new tab
          </button>
        </div>
      )}
      {!selectedOverlay && (
        <button type="button" className="add-iframe-entry" onClick={handleAddIframe}>
          Add iframe
        </button>
      )}
    </div>
  );
};
