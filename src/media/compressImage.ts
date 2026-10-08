export const PHOTO_LONG_SIDE = 2000
export const THUMB_LONG_SIDE = 400
const JPEG_QUALITY = 0.82

export interface CompressedPhoto {
  blob: Blob
  thumbBlob: Blob
  mimeType: 'image/jpeg'
  width: number
  height: number
}

function fit(width: number, height: number, longSide: number) {
  const scale = Math.min(1, longSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function drawToJpeg(image: ImageBitmap, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片')
  ctx.drawImage(image, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))), 'image/jpeg', JPEG_QUALITY)
  })
}

/** 压成长边约 2000 像素的大图 + 长边约 400 像素的缩略图；按照片自带的方向信息摆正 */
export async function compressImage(file: Blob): Promise<CompressedPhoto> {
  const image = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const big = fit(image.width, image.height, PHOTO_LONG_SIDE)
    const thumb = fit(image.width, image.height, THUMB_LONG_SIDE)
    const [blob, thumbBlob] = await Promise.all([
      drawToJpeg(image, big.width, big.height),
      drawToJpeg(image, thumb.width, thumb.height),
    ])
    return { blob, thumbBlob, mimeType: 'image/jpeg', width: big.width, height: big.height }
  } finally {
    image.close()
  }
}
