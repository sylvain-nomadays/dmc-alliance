'use client';

import { useState } from 'react';
import { PlayCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  url: string;
  title_fr: string;
  title_en: string;
  is_featured?: boolean;
}

interface StaticVideo {
  url: string;
  title: {
    fr: string;
    en: string;
  };
}

interface VideoCarouselProps {
  videos: Video[];
  staticVideo?: StaticVideo;
  locale: string;
}

export function VideoCarousel({ videos, staticVideo, locale }: VideoCarouselProps) {
  const isFr = locale === 'fr';
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine Supabase videos with static video as fallback
  const allVideos: { url: string; title: string; id: string }[] = [];

  // Add Supabase videos first (sorted by featured and order)
  if (videos && videos.length > 0) {
    const sortedVideos = [...videos].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    sortedVideos.forEach((video) => {
      allVideos.push({
        id: video.id,
        url: video.url,
        title: isFr ? video.title_fr : video.title_en,
      });
    });
  }

  // Add static video if no Supabase videos
  if (allVideos.length === 0 && staticVideo) {
    allVideos.push({
      id: 'static',
      url: staticVideo.url,
      title: isFr ? staticVideo.title.fr : staticVideo.title.en,
    });
  }

  if (allVideos.length === 0) {
    return null;
  }

  const currentVideo = allVideos[currentIndex];
  const hasMultipleVideos = allVideos.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allVideos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allVideos.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayCircleIcon className="w-8 h-8 text-terracotta-500" />
            <div>
              <h2 className="text-xl font-heading text-white">
                {currentVideo.title}
              </h2>
              {hasMultipleVideos && (
                <p className="text-white/60 text-sm mt-1">
                  {currentIndex + 1} / {allVideos.length} {isFr ? 'vidéos' : 'videos'}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Arrows (for desktop) */}
          {hasMultipleVideos && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isFr ? 'Vidéo précédente' : 'Previous video'}
              >
                <ChevronLeftIcon className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isFr ? 'Vidéo suivante' : 'Next video'}
              >
                <ChevronRightIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="relative">
        <div className="aspect-video">
          <iframe
            key={currentVideo.id} // Force re-render on video change
            src={currentVideo.url}
            title={currentVideo.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Mobile Navigation Arrows */}
        {hasMultipleVideos && (
          <>
            <button
              onClick={goToPrevious}
              className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label={isFr ? 'Vidéo précédente' : 'Previous video'}
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label={isFr ? 'Vidéo suivante' : 'Next video'}
            >
              <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {hasMultipleVideos && (
        <div className="p-4 flex justify-center gap-2">
          {allVideos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'bg-terracotta-500 w-8'
                  : 'bg-white/30 hover:bg-white/50'
              )}
              aria-label={`${isFr ? 'Aller à la vidéo' : 'Go to video'} ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Video Thumbnails/Titles List */}
      {hasMultipleVideos && allVideos.length <= 5 && (
        <div className="px-6 pb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allVideos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => goToIndex(index)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all duration-300',
                  index === currentIndex
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                )}
              >
                {video.title.length > 30 ? `${video.title.substring(0, 30)}...` : video.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default VideoCarousel;
