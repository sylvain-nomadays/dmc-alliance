'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface PartnerVideo {
  id: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'upload';
  title_fr: string;
  title_en: string;
  description_fr?: string;
  description_en?: string;
  thumbnail_url?: string;
  is_featured: boolean;
  order: number;
}

interface VideoManagerProps {
  videos: PartnerVideo[];
  onChange: (videos: PartnerVideo[]) => void;
}

export function VideoManager({ videos, onChange }: VideoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PartnerVideo | null>(null);
  const [newVideo, setNewVideo] = useState<Partial<PartnerVideo>>({
    url: '',
    type: 'youtube',
    title_fr: '',
    title_en: '',
    description_fr: '',
    description_en: '',
    is_featured: false,
  });

  // Extraire l'ID YouTube ou Vimeo d'une URL
  const extractVideoId = (url: string): { type: 'youtube' | 'vimeo' | 'upload'; embedUrl: string; thumbnail: string } | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
      };
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbnail: '', // Vimeo nécessite une API call pour la miniature
      };
    }

    // URL directe (upload)
    if (url.includes('.mp4') || url.includes('.webm')) {
      return {
        type: 'upload',
        embedUrl: url,
        thumbnail: '',
      };
    }

    return null;
  };

  const handleUrlChange = (url: string) => {
    const extracted = extractVideoId(url);
    if (extracted) {
      setNewVideo({
        ...newVideo,
        url: extracted.embedUrl,
        type: extracted.type,
        thumbnail_url: extracted.thumbnail || newVideo.thumbnail_url,
      });
    } else {
      setNewVideo({ ...newVideo, url });
    }
  };

  const handleAddVideo = () => {
    if (!newVideo.url || !newVideo.title_fr) return;

    const video: PartnerVideo = {
      id: crypto.randomUUID(),
      url: newVideo.url,
      type: newVideo.type || 'youtube',
      title_fr: newVideo.title_fr,
      title_en: newVideo.title_en || newVideo.title_fr,
      description_fr: newVideo.description_fr,
      description_en: newVideo.description_en,
      thumbnail_url: newVideo.thumbnail_url,
      is_featured: videos.length === 0 ? true : newVideo.is_featured || false,
      order: videos.length + 1,
    };

    onChange([...videos, video]);
    setNewVideo({
      url: '',
      type: 'youtube',
      title_fr: '',
      title_en: '',
      description_fr: '',
      description_en: '',
      is_featured: false,
    });
    setShowAddForm(false);
  };

  const handleUpdateVideo = () => {
    if (!editingVideo) return;

    const updatedVideos = videos.map((v) =>
      v.id === editingVideo.id ? editingVideo : v
    );
    onChange(updatedVideos);
    setEditingVideo(null);
  };

  const handleDeleteVideo = (id: string) => {
    if (!confirm('Supprimer cette vidéo ?')) return;
    const filtered = videos.filter((v) => v.id !== id);
    // Reorder
    const reordered = filtered.map((v, i) => ({ ...v, order: i + 1 }));
    onChange(reordered);
  };

  const handleSetFeatured = (id: string) => {
    const updated = videos.map((v) => ({
      ...v,
      is_featured: v.id === id,
    }));
    onChange(updated);
  };

  const moveVideo = (id: string, direction: 'up' | 'down') => {
    const index = videos.findIndex((v) => v.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === videos.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newVideos = [...videos];
    [newVideos[index], newVideos[newIndex]] = [newVideos[newIndex], newVideos[index]];

    // Update order
    const reordered = newVideos.map((v, i) => ({ ...v, order: i + 1 }));
    onChange(reordered);
  };

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return (
          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'vimeo':
        return (
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Liste des vidéos */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos
            .sort((a, b) => a.order - b.order)
            .map((video, index) => (
              <div
                key={video.id}
                className={`border rounded-lg p-4 ${
                  video.is_featured ? 'border-terracotta-300 bg-terracotta-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail / Preview */}
                  <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title_fr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {getVideoTypeIcon(video.type)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getVideoTypeIcon(video.type)}
                      <h4 className="font-medium text-gray-900 truncate">{video.title_fr}</h4>
                      {video.is_featured && (
                        <span className="px-2 py-0.5 text-xs bg-terracotta-500 text-white rounded-full">
                          Mise en avant
                        </span>
                      )}
                    </div>
                    {video.title_en && video.title_en !== video.title_fr && (
                      <p className="text-sm text-gray-500">{video.title_en}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate mt-1">{video.url}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Move up/down */}
                    <button
                      type="button"
                      onClick={() => moveVideo(video.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Monter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVideo(video.id, 'down')}
                      disabled={index === videos.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Descendre"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Set featured */}
                    {!video.is_featured && (
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(video.id)}
                        className="p-1 text-gray-400 hover:text-terracotta-500"
                        title="Mettre en avant"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => setEditingVideo(video)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && !showAddForm && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-3">Aucune vidéo de présentation</p>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            Ajouter une vidéo
          </Button>
        </div>
      )}

      {/* Add button (when videos exist) */}
      {videos.length > 0 && !showAddForm && (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une vidéo
        </Button>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Ajouter une vidéo</h4>

          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de la vidéo *
              </label>
              <input
                type="url"
                value={newVideo.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Collez une URL YouTube, Vimeo ou un lien direct vers un fichier vidéo
              </p>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre (FR) *
                </label>
                <input
                  type="text"
                  value={newVideo.title_fr || ''}
                  onChange={(e) => setNewVideo({ ...newVideo, title_fr: e.target.value })}
                  placeholder="Découvrez notre agence"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (EN)
                </label>
                <input
                  type="text"
                  value={newVideo.title_en || ''}
                  onChange={(e) => setNewVideo({ ...newVideo, title_en: e.target.value })}
                  placeholder="Discover our agency"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (FR)
                </label>
                <textarea
                  value={newVideo.description_fr || ''}
                  onChange={(e) => setNewVideo({ ...newVideo, description_fr: e.target.value })}
                  rows={2}
                  placeholder="Courte description de la vidéo..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (EN)
                </label>
                <textarea
                  value={newVideo.description_en || ''}
                  onChange={(e) => setNewVideo({ ...newVideo, description_en: e.target.value })}
                  rows={2}
                  placeholder="Short video description..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddVideo}
                disabled={!newVideo.url || !newVideo.title_fr}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-heading text-gray-900 mb-4">Modifier la vidéo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={editingVideo.url}
                  onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (FR)</label>
                  <input
                    type="text"
                    value={editingVideo.title_fr}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title_fr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={editingVideo.title_en}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                  <textarea
                    value={editingVideo.description_fr || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description_fr: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                  <textarea
                    value={editingVideo.description_en || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description_en: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingVideo(null)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleUpdateVideo}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
