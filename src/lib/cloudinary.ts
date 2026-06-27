export const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export function cloudinaryUrl(publicId: string, opts: { w?: number; h?: number; q?: string } = {}) {
  if (!publicId || publicId.startsWith("http://") || publicId.startsWith("https://") || publicId.startsWith("/")) {
    return publicId;
  }

  const { w = 800, h = 1000, q = "auto" } = opts;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/c_fill,g_auto,w_${w},h_${h},q_${q},f_auto/${publicId}`;
}

export function cloudinaryDocumentUrl(publicId: string) {
  if (!publicId || publicId.startsWith("http://") || publicId.startsWith("https://") || publicId.startsWith("/")) {
    return publicId;
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${publicId}`;
}