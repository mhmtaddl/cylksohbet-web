import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface HeroImageCarouselProps {
  images: string[];
}

const SLIDE_INTERVAL = 5000;

export const HeroImageCarousel: React.FC<HeroImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    goTo((currentIndex + 1) % images.length, 1);
  }, [currentIndex, images.length, goTo]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length <= 1) return;
    goTo((currentIndex - 1 + images.length) % images.length, -1);
  }, [currentIndex, images.length, goTo]);

  // Progress bar
  useEffect(() => {
    if (images.length <= 1 || isPaused || lightboxOpen) return;

    setProgress(0);
    startTimeRef.current = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_INTERVAL) * 100, 100);
      setProgress(pct);

      if (elapsed >= SLIDE_INTERVAL) {
        setDirection(1);
        setCurrentIndex(prev => (prev + 1) % images.length);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
    }, 30);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, images.length, isPaused, lightboxOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handleNext, handlePrev]);

  if (!images || images.length === 0) return null;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.04,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <>
      {/* Main Carousel */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative rounded-[2rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18)] group border border-white/10"
      >
        {/* Image Area */}
        <div
          className="relative w-full aspect-[5/4] overflow-hidden cursor-zoom-in bg-black"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="sync" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0"
            >
              {/* Ken Burns zoom */}
              <motion.img
                src={images[currentIndex]}
                alt={`Preview ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                initial={{ scale: 1 }}
                animate={{ scale: isPaused ? 1 : 1.06 }}
                transition={{ duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

          {/* Maximize icon */}
          <div className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} />
          </div>

          {/* Arrow buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Bottom info bar */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 flex flex-col gap-2">
              {/* Progress bar */}
              <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${isPaused ? progress : progress}%` }}
                />
              </div>
              {/* Counter */}
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs font-medium">
                  {currentIndex + 1} / {images.length}
                </span>
                <div className="flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); goTo(idx, idx > currentIndex ? 1 : -1); }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-black/80 backdrop-blur-md">
            {images.map((src, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx, idx > currentIndex ? 1 : -1)}
                className={`relative flex-1 aspect-video rounded-lg overflow-hidden transition-all duration-200 ${
                  idx === currentIndex
                    ? 'ring-2 ring-white scale-[1.04]'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full h-full flex items-center justify-center p-8 md:p-16"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="sync" custom={direction}>
                <motion.img
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  src={images[currentIndex]}
                  alt="Enlarged view"
                  className="absolute max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Close */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md z-50"
              >
                <X size={22} />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 backdrop-blur-md z-50"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 backdrop-blur-md z-50"
                  >
                    <ChevronRight size={28} />
                  </button>

                  {/* Lightbox counter */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/70 text-sm">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
