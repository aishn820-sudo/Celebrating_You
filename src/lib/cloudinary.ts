import crypto from "crypto";

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Uploads an image to Cloudinary using signed upload API.
 * Gracefully falls back to a data URI or placeholder if Cloudinary credentials are not configured.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
  options: {
    folder?: string;
    publicIdPrefix?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const folder = options.folder || "celebrating_you/memories";

  // If Cloudinary credentials exist, upload to Cloudinary directly
  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      const formData = new URLSearchParams();
      formData.append("file", base64Data);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn("[Cloudinary] Upload failed, falling back to data URL:", errorText);
      } else {
        const data = await res.json();
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
        };
      }
    } catch (err) {
      console.warn("[Cloudinary] Upload exception, falling back to data URL:", err);
    }
  }

  // Graceful fallback: return data URI so image displays immediately and persists
  const base64 = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    url: dataUrl,
    publicId: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    bytes: fileBuffer.length,
  };
}
