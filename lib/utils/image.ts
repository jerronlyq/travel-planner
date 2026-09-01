// Browser-only canvas helpers for producing a thumbnail and a tiny
// blur-up placeholder from an already-compressed image blob.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

function scaled(w: number, h: number, maxDim: number) {
  if (w <= maxDim && h <= maxDim) return { w, h };
  const r = w > h ? maxDim / w : maxDim / h;
  return { w: Math.max(1, Math.round(w * r)), h: Math.max(1, Math.round(h * r)) };
}

async function drawScaled(
  blob: Blob,
  maxDim: number
): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const { w, h } = scaled(img.naturalWidth, img.naturalHeight, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Downscale to `maxDim` on the long edge, re-encoded as JPEG. */
export async function downscaleJpeg(
  blob: Blob,
  maxDim: number,
  quality = 0.75
): Promise<Blob> {
  const canvas = await drawScaled(blob, maxDim);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

/** ~24px JPEG data URI, rendered blurred behind the real image. */
export async function tinyBlurDataUrl(blob: Blob, maxDim = 24): Promise<string> {
  const canvas = await drawScaled(blob, maxDim);
  return canvas.toDataURL("image/jpeg", 0.4);
}
