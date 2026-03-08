import { useState } from "react";

type Props = {
  src: string;
  alt?: string;
};

const ImageLightbox = ({ src, alt = "Image" }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <button
        onClick={() => setOpen(true)}
        className="block mt-1 cursor-pointer hover:brightness-90 transition-all"
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[160px] max-h-[120px] object-cover border-2 border-pc-border"
          loading="lazy"
        />
      </button>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-xl font-pixel text-white hover:brightness-75 z-50"
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain border-2 border-pc-border"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImageLightbox;
