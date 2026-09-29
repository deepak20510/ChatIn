import cloudinary from "./cloudinary.js";
import { ENV } from "./env.js";

/**
 * Checks if Cloudinary is configured with valid credentials
 */
export const isCloudinaryConfigured = () => {
  const name = ENV.CLOUDINARY_CLOUD_NAME?.trim();
  const key = ENV.CLOUDINARY_API_KEY?.trim();
  const secret = ENV.CLOUDINARY_API_SECRET?.trim();

  if (!name || !key || !secret) return false;
  if (
    name === "your_cloudinary_cloud_name" ||
    key === "your_cloudinary_api_key" ||
    secret === "your_cloudinary_api_secret" ||
    name === "undefined" ||
    name === "null"
  ) {
    return false;
  }
  return true;
};

/**
 * Safely handles image storage:
 * 1. If Cloudinary credentials are provided, attempts to upload and return the secure URL.
 * 2. If Cloudinary upload fails or credentials are not configured:
 *    Gracefully falls back to storing the compressed base64 data URI directly.
 *
 * This ensures image sending and profile picture updating ALWAYS succeed,
 * eliminating 500 crashes when Cloudinary is unconfigured or unavailable.
 *
 * @param {string} imageString - base64 data URI or hosted image URL
 * @param {string} folder - target Cloudinary folder name
 * @returns {Promise<string|null>} image URL or data URI
 */
export const uploadImage = async (imageString, folder = "chatin_uploads") => {
  if (!imageString) return null;

  // If already an HTTP/HTTPS URL, return as-is
  if (imageString.startsWith("http://") || imageString.startsWith("https://")) {
    return imageString;
  }

  // Attempt Cloudinary upload if all credentials are present
  if (isCloudinaryConfigured()) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(imageString, {
        folder,
        resource_type: "image",
        timeout: 10000,
      });
      if (uploadResponse?.secure_url) {
        return uploadResponse.secure_url;
      }
    } catch (cloudErr) {
      console.warn(
        `[IMAGE-UPLOAD] Cloudinary upload failed (${cloudErr.message}). Falling back to direct image storage.`
      );
    }
  } else {
    console.log(
      `[IMAGE-UPLOAD] Cloudinary credentials not configured in .env. Storing compressed image directly.`
    );
  }

  // Direct storage fallback: ensure it is a valid data URI
  if (imageString.startsWith("data:image/") || imageString.startsWith("data:")) {
    return imageString;
  }

  // Fallback for raw base64 string without data:image prefix
  if (/^[A-Za-z0-9+/=]+$/.test(imageString.substring(0, 100))) {
    return `data:image/jpeg;base64,${imageString}`;
  }

  throw new Error("Invalid image format provided. Expected base64 data URI or image URL.");
};
