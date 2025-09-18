/**
 * Type definitions for Excalidraw data structures
 * These are defined locally since they're not exported from the main package
 */

export interface ExcalidrawInitialData {
  elements: any[];
  appState: any;
  files: Record<string, any>;
}

export interface ExcalidrawImperativeAPI {
  getSceneElements: () => any[];
  getAppState: () => any;
  getFiles: () => Record<string, any>;
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
  groupIds: string[];
  frameId: string | null;
  roundness: any;
  seed: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: any[];
  updated: number;
  link: string | null;
  locked: boolean;
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
  currentItemStartArrowhead: any;
  currentItemEndArrowhead: string;
  scrollX: number;
  scrollY: number;
  zoom: {
    value: number;
  };
  theme: 'light' | 'dark';
  showWelcomeScreen: boolean;
}
