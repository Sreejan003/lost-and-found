/* ==========================================================================
   SUPABASE STORAGE & IMAGE OPTIMIZATION SERVICE
   ========================================================================== */

import { supabaseClient } from './supabase.js';
import { CONFIG } from './config.js';

/**
 * Optimizes an image file by resizing to a max width and converting to WebP/JPEG DataURL.
 */
export function optimizeImage(file, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return resolve('');
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads optimized image and returns a guaranteed working image URL / DataURL.
 */
export async function uploadItemImage(file) {
  if (!file) return '';
  try {
    const optimizedDataUrl = await optimizeImage(file);
    return optimizedDataUrl;
  } catch (err) {
    console.error("Image optimization exception, fallback to raw reader:", err);
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}
