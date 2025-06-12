'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Image {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface ImagesSectionProps {
  images: Image[];
}

export function ImagesSection({ images }: ImagesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<Image | null>(null);

  const openLightbox = (image: Image) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 w-full group"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
          )}
          <h3 className="font-nunito font-light text-[#d4d4e1] text-lg">
            Images ({images.length})
          </h3>
        </button>

        {/* Section Content */}
        {isExpanded && (
          <div className="space-y-4 pl-8">
            {images.length === 0 ? (
              <div className="flex items-center gap-3 text-[#a7b4c6] text-sm italic">
                <ImageIcon className="w-4 h-4" />
                <span>No images found from this source.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group cursor-pointer"
                    onClick={() => openLightbox(image)}
                  >
                    <div className="aspect-video bg-[#26262e] rounded-lg overflow-hidden border border-[#26262e] group-hover:border-[#45caff]/30 transition-colors">
                      <img
                        src={image.url}
                        alt={image.alt || 'Source image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    {image.caption && (
                      <p className="text-xs text-[#a7b4c6] mt-2 line-clamp-2">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt || 'Source image'}
              className="max-w-full max-h-full object-contain"
            />
            {lightboxImage.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white text-sm">{lightboxImage.caption}</p>
              </div>
            )}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}