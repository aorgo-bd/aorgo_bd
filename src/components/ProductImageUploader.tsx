'use client';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/button';

export function ProductImageUploader({ onUploaded }: { onUploaded: (publicId: string) => void }) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{ multiple: true, maxFiles: 8, sources: ['local', 'url', 'camera'] }}
      onSuccess={(res) => onUploaded((res.info as any).public_id)}
    >
      {({ open }) => (
        <Button type="button" onClick={() => open()}>
          Upload Product Photos
        </Button>
      )}
    </CldUploadWidget>
  );
}
