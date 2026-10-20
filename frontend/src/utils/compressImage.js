import { LIMITES } from './reportConfig'

/**
 * Compression d'image côté client (avant envoi / stockage).
 * Objectif : JPEG redimensionné ≤ PHOTO_MAX_BYTES (500 Ko par défaut).
 */

export class ImageCompressError extends Error {
  constructor(message, code = 'echec') {
    super(message)
    this.name = 'ImageCompressError'
    this.code = code
  }
}

const DEFAULTS = {
  maxWidth: LIMITES.PHOTO_MAX_WIDTH,
  maxBytes: LIMITES.PHOTO_MAX_BYTES,
  startQuality: 0.82,
  minQuality: 0.45,
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      try {
        return await createImageBitmap(file)
      } catch {
        // repli sur HTMLImageElement ci-dessous
      }
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageCompressError('Impossible de lire cette image', 'decodage'))
    }
    img.src = url
  })
}

function drawScaled(image, width, height, scale) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ImageCompressError('Canvas indisponible sur ce navigateur', 'canvas')
  }
  // Fond blanc : JPEG ne gère pas la transparence
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

const toBlob = (canvas, quality) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new ImageCompressError('Lecture du fichier échouée', 'lecture'))
    reader.readAsDataURL(blob)
  })

/**
 * Compresse une image et retourne { dataUrl, bytes, width, height }
 * @param {File|Blob} file
 * @param {{maxWidth?: number, maxBytes?: number}} [options]
 * @returns {Promise<{dataUrl: string, bytes: number, width: number, height: number}>}
 */
export async function compressImage(file, options = {}) {
  const maxWidth = options.maxWidth ?? DEFAULTS.maxWidth
  const maxBytes = options.maxBytes ?? DEFAULTS.maxBytes

  if (!file || typeof file !== 'object' || !('size' in file)) {
    throw new ImageCompressError('Fichier image manquant', 'fichier')
  }
  if (file.type && !file.type.startsWith('image/')) {
    throw new ImageCompressError('Seules les images sont acceptées', 'type')
  }

  const image = await decode(file)
  const sourceWidth = image.width || image.naturalWidth
  const sourceHeight = image.height || image.naturalHeight
  if (!sourceWidth || !sourceHeight) {
    throw new ImageCompressError('Dimensions de l’image introuvables', 'decodage')
  }

  const baseScale = Math.min(1, maxWidth / sourceWidth)
  let scale = baseScale
  let quality = DEFAULTS.startQuality

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = drawScaled(image, sourceWidth, sourceHeight, scale)
    const blob = await toBlob(canvas, quality)
    if (blob) {
      if (blob.size <= maxBytes) {
        const dataUrl = await blobToDataUrl(blob)
        if (typeof image.close === 'function') image.close()
        return {
          dataUrl,
          bytes: blob.size,
          width: canvas.width,
          height: canvas.height,
        }
      }
    }
    if (quality > DEFAULTS.minQuality) {
      quality = Math.max(DEFAULTS.minQuality, quality - 0.12)
    } else {
      scale = scale * 0.75
    }
  }

  if (typeof image.close === 'function') image.close()
  throw new ImageCompressError(
    'Image trop lourde même après compression — essayez-en une autre',
    'trop_lourde',
  )
}
