'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface ImagesGridProps {
  images: ImageItem[];
}

function ImageLightbox({ 
  image, 
  isOpen, 
  onClose 
}: { 
  image: ImageItem | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!image || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <Image
              src={image.url}
              alt={image.alt || 'Source image'}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {image.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ImagesGrid({ images }: ImagesGridProps) {
  const [lightboxImage, setLightboxImage] = useState<ImageItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (image: ImageItem) => {
    setLightboxImage(image);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImage(null);
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#a7b4c6] text-center">No images found from this source.</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="grid gap-4 auto-rows-max"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="group cursor-pointer rounded-lg overflow-hidden bg-[#26262e] hover:ring-2 hover:ring-[#45caff]/30 transition-all"
            onClick={() => openLightbox(image)}
          >
            <div className="aspect-video relative overflow-hidden">
              <Image
                src={image.url}
                alt={image.alt || 'Source image'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            {image.caption && (
              <div className="p-3">
                <p className="text-xs text-[#a7b4c6] line-clamp-2">
                  {image.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <ImageLightbox
        image={lightboxImage}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
      />
    </>
  );
}