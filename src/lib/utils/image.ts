// Downscale + compress an image (data URL) in the browser before uploading.
// A phone photo can be 4–12 MB; for OCR / backgrounds ~1600px JPEG is plenty
// and uploads ~20–50× faster on cellular. Also bakes in EXIF orientation so
// the result is upright everywhere. Falls back to the original on any failure.
export async function downscaleImage(
  dataUrl: string,
  maxDim = 1600,
  quality = 0.72
): Promise<string> {
  try {
    if (typeof document === 'undefined') return dataUrl
    const blob = await (await fetch(dataUrl)).blob()

    let bmp: ImageBitmap
    try {
      bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      bmp = await createImageBitmap(blob)
    }

    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close?.()

    const out = canvas.toDataURL('image/jpeg', quality)
    // Guard: if compression somehow made it bigger, keep the original.
    return out.length < dataUrl.length ? out : dataUrl
  } catch {
    return dataUrl
  }
}
