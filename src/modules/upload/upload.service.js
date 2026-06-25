import { v2 as cloudinary } from "cloudinary";
import env from "../../config/env.js";
import logger from "../../shared/logger/logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer, fileName) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "demo",
        resource_type: "auto",
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      },
    );

    stream.end(fileBuffer);
  });

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.warn("Error deleting from Cloudinary", { error: error.message });
  }
};
