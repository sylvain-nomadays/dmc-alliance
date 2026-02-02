'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  folder: string;
}

const folders = [
  { key: 'all', label: 'Tous' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'circuits', label: 'Circuits' },
  { key: 'partners', label: 'Partenaires' },
  { key: 'articles', label: 'Articles' },
  { key: 'uploads', label: 'Autres' },
];

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchFiles();
  }, [selectedFolder]);

  async function fetchFiles() {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from('media')
      .list(selectedFolder === 'all' ? '' : selectedFolder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } else {
      // Transform and filter out folders
      const mediaFiles: MediaFile[] = (data || [])
        .filter((item) => item.id && !item.id.endsWith('/'))
        .map((item) => {
          const folder = selectedFolder === 'all' ? '' : selectedFolder;
          const path = folder ? `${folder}/${item.name}` : item.name;
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

          return {
            id: item.id || item.name,
            name: item.name,
            url: publicUrl,
            size: item.metadata?.size || 0,
            type: item.metadata?.mimetype || 'image/jpeg',
            created_at: item.created_at || new Date().toISOString(),
            folder: selectedFolder,
          };
        });

      setFiles(mediaFiles);
    }
    setIsLoading(false);
  }

  const handleUpload = useCallback(async (uploadFiles: FileList) => {
    setIsUploading(true);
    const supabase = createClient();
    const folder = selectedFolder === 'all' ? 'uploads' : selectedFolder;

    for (const file of Array.from(uploadFiles)) {
      if (!file.type.startsWith('image/')) continue;

      const ext = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filename = `${folder}/${timestamp}-${randomString}.${ext}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(filename, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
      }
    }

    await fetchFiles();
    setIsUploading(false);
  }, [selectedFolder]);

  async function deleteFiles(fileIds: string[]) {
    if (!confirm(`Supprimer ${fileIds.length} fichier(s) ?`)) return;

    const supabase = createClient();
    const folder = selectedFolder === 'all' ? '' : selectedFolder;

    const filesToDelete = files
      .filter((f) => fileIds.includes(f.id))
      .map((f) => folder ? `${folder}/${f.name}` : f.name);

    const { error } = await supabase.storage
      .from('media')
      .remove(filesToDelete);

    if (!error) {
      setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
      setSelectedFiles([]);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function toggleSelect(id: string) {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    alert('URL copiée !');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Médiathèque</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos images et fichiers médias
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedFiles.length > 0 && (
            <button
              onClick={() => deleteFiles(selectedFiles)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Supprimer ({selectedFiles.length})
            </button>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {isUploading ? 'Upload...' : 'Uploader'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Folder tabs */}
          <div className="flex flex-wrap gap-2">
            {folders.map((folder) => (
              <button
                key={folder.key}
                onClick={() => setSelectedFolder(folder.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedFolder === folder.key
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {folder.label}
              </button>
            ))}
          </div>

          {/* View mode */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun fichier</h3>
          <p className="text-gray-500 mb-4">Uploadez vos premières images</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Uploader des images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'relative group bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer',
                selectedFiles.includes(file.id) && 'ring-2 ring-terracotta-500'
              )}
              onClick={() => toggleSelect(file.id)}
            >
              <div className="aspect-square relative">
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />

                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                      selectedFiles.includes(file.id)
                        ? 'bg-terracotta-500 border-terracotta-500'
                        : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                    )}
                  >
                    {selectedFiles.includes(file.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(file.url);
                    }}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Copier l'URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFiles([file.id]);
                    }}
                    className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedFiles(e.target.checked ? files.map((f) => f.id) : [])
                    }
                    checked={selectedFiles.length === files.length && files.length > 0}
                    className="rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fichier
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={file.url}
                          alt={file.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-gray-900 truncate max-w-xs">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyUrl(file.url)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copier l'URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteFiles([file.id])}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
