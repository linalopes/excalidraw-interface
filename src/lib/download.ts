/**
 * Download utilities for exporting Excalidraw scenes
 */

/**
 * Downloads a JSON object as a file
 * @param filename - The name of the file to download
 * @param data - The data object to serialize and download
 */
export function downloadJson(filename: string, data: object): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(filename, blob);
}

/**
 * Downloads a Blob as a file
 * @param filename - The name of the file to download
 * @param blob - The blob to download
 */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Converts an SVG element to a Blob for download
 * @param svg - The SVG element to convert
 * @returns A Blob containing the SVG data
 */
export function svgElementToBlob(svg: SVGSVGElement): Blob {
  const svgString = new XMLSerializer().serializeToString(svg);
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Downloads an SVG element as a file
 * @param filename - The name of the file to download
 * @param svg - The SVG element to download
 */
export function downloadSvg(filename: string, svg: SVGSVGElement): void {
  const blob = svgElementToBlob(svg);
  downloadBlob(filename, blob);
}
