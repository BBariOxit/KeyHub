const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

export function optimizeCloudinaryImage(url, options = {}) {
  if (!url || typeof url !== "string") {
    return url;
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "limit",
  } = options;

  const uploadIndex = url.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) {
    return url;
  }

  const transforms = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (crop) transforms.push(`c_${crop}`);
  if (Number.isFinite(width) && width > 0) transforms.push(`w_${Math.round(width)}`);
  if (Number.isFinite(height) && height > 0) transforms.push(`h_${Math.round(height)}`);

  if (transforms.length === 0) {
    return url;
  }

  const transformStr = transforms.join(",");
  return url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transformStr}/`);
}
