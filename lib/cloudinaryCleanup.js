import { v2 as cloudinary } from "cloudinary";

let cloudinaryConfigured = false;

const configureCloudinary = () => {
  if (cloudinaryConfigured) {
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinaryConfigured = true;
};

export const extractCloudinaryPublicId = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl.includes("/upload/")) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const uploadSegment = "/upload/";
    const uploadIndex = url.pathname.indexOf(uploadSegment);
    if (uploadIndex === -1) {
      return null;
    }

    const rawPublicPath = url.pathname.slice(uploadIndex + uploadSegment.length);
    const segments = rawPublicPath.split("/").filter(Boolean);

    if (segments.length === 0) {
      return null;
    }

    let publicPathStartIndex = 0;

    if (segments[0].startsWith("v") && /^v\d+$/.test(segments[0])) {
      publicPathStartIndex = 1;
    } else {
      const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
      publicPathStartIndex = versionIndex >= 0 ? versionIndex + 1 : 0;
    }

    const publicPath = segments.slice(publicPathStartIndex).join("/");
    if (!publicPath) {
      return null;
    }

    return publicPath.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
};

export const cleanupCloudinaryImages = async (imageUrls = [], options = {}) => {
  configureCloudinary();

  const { resourceType = "image", errorPrefix = "Cloudinary cleanup error:" } = options;
  const normalizedUrls = Array.isArray(imageUrls) ? imageUrls : [];

  await Promise.all(
    normalizedUrls.map(async (imageUrl) => {
      const publicId = extractCloudinaryPublicId(imageUrl);
      if (!publicId) {
        return;
      }

      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (error) {
        console.error(errorPrefix, error);
      }
    })
  );
};
