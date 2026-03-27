# Excalidraw Interface

A Vite + React + TypeScript app that preserves the native Excalidraw experience while adding a custom HTML iframe overlay layer.  
Embeds are represented by regular Excalidraw rectangle placeholders and rendered as DOM iframes above the canvas, staying aligned during pan and zoom.

## Features

- Native Excalidraw UI and canvas behavior
- Scene loading from `public/sample.excalidraw` on startup
- Iframe overlay MVP driven by element `customData`
- `https://` URL validation for embeds
- Per-embed `Interact / Lock` controls
- Contextual controls for selected iframe placeholders:
  - Interact / Lock
  - Change URL
  - Open in new tab
- Native Excalidraw file actions (`Open`, `Save to...`, `Export image...`)

## Tech Stack

- Vite
- React 18
- TypeScript
- `@excalidraw/excalidraw`

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

3. Open `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How it works

The iframe feature is intentionally implemented outside Excalidraw internals.

1. **Rectangle placeholder in scene**
   - A normal Excalidraw rectangle is used as the visual anchor.
2. **Embed metadata in `customData`**
   - The rectangle carries iframe metadata (`embedType`, `src`, `title`).
3. **HTML overlay layer above canvas**
   - React renders absolute-positioned iframes in a DOM layer over Excalidraw.
   - Screen coordinates are derived from element position/size + Excalidraw scroll/zoom.
4. **Interact / Lock mode**
   - Locked: iframe uses `pointer-events: none` so canvas navigation works normally.
   - Interactive: iframe uses `pointer-events: auto`.
   - Only one iframe can be interactive at a time; `Esc` locks all.

## Usage

1. Start the app and wait for the sample scene to load.
2. Add an embed using the `Add iframe` action and provide a valid `https://` URL.
3. Move/resize the rectangle placeholder directly in Excalidraw.
4. Select the iframe placeholder to open contextual actions:
   - Toggle `Interact / Lock`
   - Change URL
   - Open in new tab
5. Pan and zoom the canvas; the iframe overlay remains aligned with its placeholder.

## Current limitations

- Only `https://` embed URLs are accepted.
- Some sites cannot be embedded due to browser security headers (e.g. `X-Frame-Options`, CSP).
- Only one iframe is interactive at a time.
- Excalidraw export outputs the drawing; live iframe DOM content is not preserved as interactive content.

## Project Structure

```text
src/
├── components/
│   └── ExcalidrawViewer.tsx    # Excalidraw wrapper + iframe overlay and controls
├── App.tsx                     # App shell and sample scene loading
├── main.tsx                    # React entry point
└── styles.css                  # Global and overlay styles

public/
└── sample.excalidraw           # Sample scene loaded on startup
```

## API Reference

### `ExcalidrawViewer` Props

- `initialData: ExcalidrawInitialData` - Scene data used for initial load.
- `onApiReady: (api: ExcalidrawImperativeAPI) => void` - Callback with minimal imperative API.

### Iframe `customData` contract

Attach iframe metadata to a rectangle-like Excalidraw element:

```ts
{
  embedType?: "iframe";
  src?: string;   // must be https://
  title?: string;
}
```

## Roadmap (optional future work)

- Persist embed metadata and interaction preferences more explicitly in scene data.
- Better contextual panel placement near viewport edges.
- Optional domain allowlist/blocklist for embed URLs.
- Improved UX for creating embeds without prompts.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
