'use client';
import { CldImage } from 'next-cloudinary';

interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductImage({
  src,
  alt,
  width = 800,
  height = 1000,
  className,
}: ProductImageProps) {
  // Base64 encoded grey SVG placeholder for the blur load effect
  const blurPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

  return (
    <CldImage
      src={src}
      width={width}
      height={height}
      crop="fill"
      gravity="auto"
      alt={alt}
      placeholder="blur"
      blurDataURL={blurPlaceholder}
      className={className}
    />
  );
}
