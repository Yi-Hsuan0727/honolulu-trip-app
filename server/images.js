const sharp = require('sharp');

// Photos are stored once at a sane size plus a small thumbnail for the lists,
// so pages don't download multi-megabyte originals over a slow connection.
const FULL_MAX = 1600;
const THUMB_MAX = 640;

async function resizeJpeg(input, max, quality) {
  return sharp(input, { failOn: 'none' })
    .rotate() // apply EXIF orientation
    .resize(max, max, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

// Returns { full: Buffer, mime, thumb: Buffer }. Falls back to the untouched upload
// (no thumbnail) if the file can't be decoded.
async function prepareUpload(buffer, mime) {
  try {
    const [full, thumb] = await Promise.all([resizeJpeg(buffer, FULL_MAX, 82), resizeJpeg(buffer, THUMB_MAX, 72)]);
    return { full, mime: 'image/jpeg', thumb };
  } catch (err) {
    console.error('image resize failed, storing original:', err.message);
    return { full: buffer, mime, thumb: null };
  }
}

async function makeThumb(buffer) {
  return resizeJpeg(buffer, THUMB_MAX, 72);
}

module.exports = { prepareUpload, makeThumb };
