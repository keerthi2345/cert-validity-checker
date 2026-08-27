import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Helper to trigger browser file download using standard Blob ObjectURL anchor click
 * with fallback to FileSaver saveAs.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.warn('[Export] Anchor download fallback to saveAs:', err);
    saveAs(blob, filename);
  }
}

/**
 * Utility function to download the complete project source code as a single ZIP file.
 * Handles both backend stream export, static file retrieval, and client-side fallback via JSZip.
 */
export async function downloadProjectZip(filename = 'veridoc-ai-source-code.zip'): Promise<boolean> {
  console.log('[Export] Initiating source code ZIP download...');

  // Strategy 1: Fetch binary stream from /api/export-project-zip
  try {
    const response = await fetch('/api/export-project-zip', {
      method: 'GET',
      headers: {
        'Accept': 'application/zip, application/octet-stream',
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 1000) {
        console.log(`[Export] Successfully retrieved ZIP from server (${blob.size} bytes). Triggering browser download...`);
        triggerBrowserDownload(blob, filename);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Export] Backend export route fetch error, falling back to static asset/client-side build:', err);
  }

  // Strategy 2: Fetch the pre-bundled static zip asset from /veridoc-ai-source-code.zip
  try {
    const staticResp = await fetch(`/${filename}`);
    if (staticResp.ok) {
      const staticBlob = await staticResp.blob();
      if (staticBlob.size > 1000) {
        console.log(`[Export] Successfully retrieved pre-bundled static ZIP (${staticBlob.size} bytes). Triggering browser download...`);
        triggerBrowserDownload(staticBlob, filename);
        return true;
      }
    }
  } catch (staticErr) {
    console.warn('[Export] Static asset fetch error, proceeding to client-side JSZip bundler:', staticErr);
  }

  // Strategy 3: Client-side JSZip in-memory bundling fallback
  try {
    console.log('[Export] Assembling project files using JSZip...');
    const zip = new JSZip();
    
    // Glob import all client source files as raw text
    const metaWithGlob = import.meta as unknown as { glob: (pattern: string[] | string, options?: any) => Record<string, string> };
    const sourceModules = typeof metaWithGlob.glob === 'function' 
      ? metaWithGlob.glob([
          '/src/**/*.{ts,tsx,css,json}',
          '/index.html',
          '/package.json',
          '/tsconfig.json',
          '/vite.config.ts',
          '/metadata.json',
          '/README.md',
          '/server.ts',
          '/.env.example',
        ], { query: '?raw', import: 'default', eager: true }) 
      : {};

    for (const [filePath, content] of Object.entries(sourceModules)) {
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      zip.file(relativePath, content);
    }

    const generatedBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    console.log(`[Export] In-memory ZIP created successfully (${generatedBlob.size} bytes). Saving to local disk...`);
    triggerBrowserDownload(generatedBlob, filename);
    return true;
  } catch (bundleErr) {
    console.error('[Export] All export strategies failed:', bundleErr);
    // Ultimate fallback: direct window navigation
    window.location.assign(`/${filename}`);
    return false;
  }
}
