# Excalidraw Viewer

A minimal, production-ready viewer app for Excalidraw files built with Vite + React + TypeScript.

## Features

- **View Excalidraw scenes** in read-only mode with pan & zoom
- **Clickable links** on elements that have URLs
- **Download functionality**:
  - Download as `.excalidraw` (JSON format)
  - Download as SVG
  - Download as PNG
- **Load local files** via file input
- **Clean, minimal UI** with responsive design
- **Handles embedded images** correctly

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **@excalidraw/excalidraw** - Excalidraw component library

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **View the sample scene**: The app loads a sample Excalidraw scene on startup
2. **Open local files**: Use the "Open .excalidraw" button to load your own files
3. **Download scenes**: Use the download buttons to export the current scene in different formats
4. **Navigate**: Pan and zoom using mouse/touch gestures (hand tool is enabled)

## Project Structure

```
src/
├── components/
│   └── ExcalidrawViewer.tsx    # Main Excalidraw component wrapper
├── lib/
│   └── download.ts             # Download utility functions
├── App.tsx                     # Main app component with toolbar
├── main.tsx                    # React entry point
└── styles.css                  # Global styles

public/
└── sample.excalidraw           # Sample scene loaded on startup
```

## API Reference

### ExcalidrawViewer Props

- `initialData: ExcalidrawInitialData` - The scene data to display
- `onApiReady: (api: ExcalidrawImperativeAPI) => void` - Callback when API is ready

### Download Functions

- `downloadJson(filename: string, data: object)` - Download JSON data
- `downloadBlob(filename: string, blob: Blob)` - Download blob data
- `downloadSvg(filename: string, svg: SVGSVGElement)` - Download SVG element

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
