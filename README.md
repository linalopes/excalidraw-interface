# Excalidraw Interface

An experimental Excalidraw wrapper built with Vite + React + TypeScript.  
It keeps the native Excalidraw experience and adds a custom media overlay layer on top of rectangle placeholders. Depending on URL and metadata, embeds render as `img`, `video`, `object` (PDF), or `iframe`, and stay aligned during pan and zoom.

## Features

- Native Excalidraw UI and canvas behavior
- Scene loading from `public/sample.excalidraw` on startup
- Media-aware overlay rendering driven by element `customData`
- `https://` URL validation for embeds
- Per-embed interaction behavior by content type
- Contextual controls for selected embed placeholders:
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

The embed layer is intentionally implemented outside Excalidraw internals.

1. **Rectangle placeholder in scene**
   - A normal Excalidraw rectangle is used as the visual anchor.
2. **Embed metadata in `customData`**
   - The rectangle carries metadata (`embedType`, `embedKind`, `src`, `title`).
   - `embedKind` can be explicit, or inferred from URL extension.
3. **HTML overlay layer above canvas**
   - React renders absolute-positioned media elements in a DOM layer over Excalidraw.
   - Screen coordinates are derived from element position/size + Excalidraw scroll/zoom.
4. **Kind-specific rendering**
   - Images -> `<img>`
   - Direct video URLs -> `<video controls>`
   - PDFs -> `<object type="application/pdf">`
   - Everything else -> `<iframe>`
5. **Interaction model**
   - Images are non-interactive.
   - Videos are interactive by default (play/pause/scrub immediately).
   - Web-page iframes use explicit `Interact / Lock`.
   - Only one iframe/PDF embed can be in interactive mode at a time; `Esc` locks all.

## Supported content

- Direct image URLs (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`)
- Direct video URLs (`.mp4`, `.webm`, `.ogg`)
- PDF files (`.pdf`)
- Embeddable web pages (fallback `iframe` mode)
- Some sites cannot be embedded due to browser/security policies (for example CSP or `X-Frame-Options`)

## Usage

1. Start the app and wait for the sample scene to load.
2. Add an embed using the `Add iframe` action and provide a valid `https://` URL.
3. Move/resize the rectangle placeholder directly in Excalidraw.
4. Select the embed placeholder to open contextual actions:
   - Toggle `Interact / Lock`
   - Change URL
   - Open in new tab
5. Content behavior depends on URL type:
   - Images fit the placeholder and remain non-interactive.
   - Videos are immediately usable with native controls.
   - PDFs and web pages use embed mode; web pages require `Interact` first.
6. Pan and zoom the canvas; the overlay remains aligned with its placeholder.

## Current limitations

- Only `https://` embed URLs are accepted.
- Some sites cannot be embedded due to browser security headers (e.g. `X-Frame-Options`, CSP).
- Only one iframe/PDF embed can be interactive at a time.
- HTML overlays render above the Excalidraw canvas; canvas text/shapes do not currently render on top of live overlays.
- Excalidraw export outputs the drawing; live iframe DOM content is not preserved as interactive content.

## Project Structure

```text
src/
├── components/
│   └── ExcalidrawViewer.tsx    # Excalidraw wrapper + media overlay and controls
├── App.tsx                     # App shell and sample scene loading
├── main.tsx                    # React entry point
└── styles.css                  # Global and overlay styles

public/
└── sample.excalidraw           # Sample scene loaded on startup
```

## Component Contract

### `ExcalidrawViewer` Props

- `initialData: ExcalidrawInitialData` - Scene data used for initial load.
- `onApiReady: (api: ExcalidrawImperativeAPI) => void` - Callback with minimal imperative API.

### Embed `customData` contract

Attach embed metadata to a rectangle-like Excalidraw element:

```ts
{
  embedType?: "iframe";
  embedKind?: "image" | "video" | "pdf" | "iframe";
  src?: string;   // must be https://
  title?: string;
}
```

## Roadmap (optional future work)

- Persist embed metadata and interaction preferences more explicitly in scene data.
- Better contextual panel placement near viewport edges.
- Optional domain allowlist/blocklist for embed URLs.
- Optional fit-mode controls (`contain` vs `cover`) per embed.
- Improved UX for creating embeds without prompts.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
