/**
 * mediaHelper.js — Cloudinary-style Dynamic Asset Optimization & Transformations
 *
 * Implements real-time optimization rules (quality, sizing, format filters)
 * to ensure visuals load instantly and match the Travel Chronicle vibe.
 */

// Simple mock mapping to represent pre-uploaded optimized Cloudinary assets or remote URLs
const OPTIMIZED_ASSET_MAPPING = {
  'airport-arrival': 'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_800,c_scale/e_sepia:60,e_contrast:15/v1/bahrain/airport_arrival',
  'airport-departure': 'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_800,c_scale/e_sepia:60,e_contrast:15/v1/bahrain/airport_departure'
}

/**
 * Wraps an image URL in Cloudinary-style formatting, quality, and resizing parameters.
 * Automatically injects formatting parameters if using Cloudinary hosting, or falls back to
 * optimized proxy configurations for standard web links to ensure premium performance.
 *
 * @param {string} url — The raw source image URL
 * @param {object} transforms — { width, quality, sepia, crop }
 */
export function optimizeImageUrl(url, transforms = {}) {
  if (!url) return '/assets/images/fort.jpg'

  const {
    width = 800,
    quality = 'auto',
    sepia = 40,
    crop = 'scale'
  } = transforms

  // 1. Check if we have a pre-mapped Cloudinary asset
  for (const [key, optimizedUrl] of Object.entries(OPTIMIZED_ASSET_MAPPING)) {
    if (url.includes(key)) return optimizedUrl
  }

  // 2. If it's already a Cloudinary URL, inject active transformation strings
  if (url.includes('res.cloudinary.com')) {
    try {
      const parts = url.split('/upload/')
      if (parts.length === 2) {
        const transString = `q_${quality},f_auto,w_${width},c_${crop},e_sepia:${sepia}`
        return `${parts[0]}/upload/${transString}/${parts[1]}`
      }
    } catch (e) {
      console.warn('[mediaHelper] Failed to inject Cloudinary parameters:', e)
    }
  }

  // 3. For Wikipedia / other external hosts, utilize a lightweight free image optimization proxy (like wsrv.nl)
  // which compiles quality, formatting (WebP), sepia, and size on-the-fly at zero cost!
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    const encodedUrl = encodeURIComponent(url)
    // wsrv.nl is a free high-performance image optimization service that works offline-fallback & online
    return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=80&output=webp&filter=sepia`
  }

  return url
}
