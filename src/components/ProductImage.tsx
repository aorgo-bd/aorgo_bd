'use client';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  width = 800,
  height = 1000,
  className,
  priority = false,
}: ProductImageProps) {
  // Base64 encoded grey SVG placeholder for the blur load effect
  const blurPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

  const isLocalOrFullUrl = !src || src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://');

  if (isLocalOrFullUrl) {
    return (
      <Image
        src={src || '/images/products/placeholder.webp'}
        width={width}
        height={height}
        alt={alt}
        className={className}
        placeholder="blur"
        blurDataURL={blurPlaceholder}
        priority={priority}
      />
    );
  }

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
      priority={priority}
    />
  );
}
