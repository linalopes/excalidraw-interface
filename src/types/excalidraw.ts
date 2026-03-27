/**
 * Type definitions for Excalidraw data structures
 * These are defined locally since they're not exported from the main package
 */

export interface ExcalidrawInitialData {
  elements: ExcalidrawElement[];
  appState: Partial<ExcalidrawAppState>;
  files: Record<string, unknown>;
}

export interface ExcalidrawImperativeAPI {
  getSceneElements: () => ExcalidrawElement[];
  getAppState: () => ExcalidrawAppState;
  getFiles: () => Record<string, unknown>;
}

export interface ExcalidrawElementCustomData {
  embedType?: 'iframe';
  src?: string;
  title?: string;
}

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: readonly string[];
  frameId: string | null;
  roundness: unknown;
  seed: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: readonly unknown[];
  updated: number;
  link: string | null;
  locked: boolean;
  customData?: ExcalidrawElementCustomData;
}

export interface ExcalidrawAppState {
  gridSize: number | null;
  viewBackgroundColor: string;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemFillStyle: string;
  currentItemStrokeWidth: number;
  currentItemStrokeStyle: string;
  currentItemRoughness: number;
  currentItemOpacity: number;
  currentItemFontFamily: number;
  currentItemFontSize: number;
  currentItemTextAlign: string;
  currentItemStartArrowhead: unknown;
  currentItemEndArrowhead: string;
  scrollX: number;
  scrollY: number;
  zoom: {
    value: number;
  };
  theme: 'light' | 'dark';
  showWelcomeScreen: boolean;
}
