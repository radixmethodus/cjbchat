import { forwardRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  alt?: string;
};

const ImageLightbox = forwardRef<HTMLDivElement, Props>(
  ({ src, alt = "Image" }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      <div ref={ref}>
        {/* Thumbnail — stop propagation so parent reply handler doesn't fire */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="block mt-1 cursor-pointer hover:brightness-90 transition-all"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-[160px] max-h-[120px] object-cover border-2 border-pc-border"
            loading="lazy"
          />
        </div>

        {/* Lightbox overlay — rendered via portal to escape bubble DOM */}
        {open &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
              onClick={() => setOpen(false)}
            >
              <div
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-xl font-pixel text-white hover:brightness-75 z-50 cursor-pointer"
                role="button"
                tabIndex={0}
              >
                ✕
              </div>
              <img
                src={src}
                alt={alt}
                className="max-w-[90vw] max-h-[90vh] object-contain border-2 border-pc-border"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body
          )}
      </div>
    );
  }
);

ImageLightbox.displayName = "ImageLightbox";

export default ImageLightbox;
