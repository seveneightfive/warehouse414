import React, { useState, useRef } from 'react';
import { Upload, X, Star, Link as LinkIcon, Image as ImageIcon, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProductImage } from '../lib/types';

interface ImageUploadManagerProps {
  productSku: string;
  productId?: string;
  featuredImageUrl?: string | null;
  existingImages?: ProductImage[];
  onImagesChange: (images: ImageData[], featuredUrl: string | null) => void;
}

export interface ImageData {
  id?: string;
  url: string;
  displayOrder: number;
  isNew?: boolean;
}

export function ImageUploadManager({
  productSku,
  productId,
  featuredImageUrl,
  existingImages = [],
  onImagesChange,
}: ImageUploadManagerProps) {
  const [images, setImages] = useState<ImageData[]>(() => {
    const existing = existingImages.map((img) => ({
      id: img.id,
      url: img.image_url,
      displayOrder: img.display_order,
    }));
    return existing;
  });
  const [featured, setFeatured] = useState<string | null>(featuredImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyParent = (updatedImages: ImageData[], updatedFeatured: string | null) => {
    onImagesChange(updatedImages, updatedFeatured);
  };

  const uploadToB2 = async (file: File): Promise<string> => {
    const tempId = `uploading-${Date.now()}-${Math.random()}`;
    setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

    try {
      // Request signed upload URL from edge function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-b2-upload-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku: productSku,
            filename: file.name,
            contentType: file.type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await response.json();

      // Upload file directly to B2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to B2');
      }

      setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));
      setTimeout(() => {
        setUploadProgress((prev) => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      }, 1000);

      return publicUrl;
    } catch (error) {
      setUploadProgress((prev) => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(async (file) => {
      try {
        const url = await uploadToB2(file);
        return url;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter((url): url is string => url !== null);

    if (validUrls.length > 0) {
      const newImages = validUrls.map((url, index) => ({
        url,
        displayOrder: images.length + index,
        isNew: true,
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);

      // Set first image as featured if no featured image exists
      const updatedFeatured = featured || (updatedImages.length > 0 ? updatedImages[0].url : null);
      setFeatured(updatedFeatured);
      notifyParent(updatedImages, updatedFeatured);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const newImage: ImageData = {
      url: urlInput.trim(),
      displayOrder: images.length,
      isNew: true,
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);

    // Set as featured if no featured image exists
    const updatedFeatured = featured || newImage.url;
    setFeatured(updatedFeatured);
    notifyParent(updatedImages, updatedFeatured);

    setUrlInput('');
  };

  const handleDelete = (index: number) => {
    const imageToDelete = images[index];
    const updatedImages = images.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      displayOrder: i,
    }));

    setImages(updatedImages);

    // Update featured if the deleted image was featured
    let updatedFeatured = featured;
    if (featured === imageToDelete.url) {
      updatedFeatured = updatedImages.length > 0 ? updatedImages[0].url : null;
      setFeatured(updatedFeatured);
    }

    notifyParent(updatedImages, updatedFeatured);
  };

  const handleSetFeatured = (url: string) => {
    setFeatured(url);
    notifyParent(images, url);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);

    // Update display order
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));

    setImages(reorderedImages);
    notifyParent(reorderedImages, featured);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'upload'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Upload className="inline-block w-4 h-4 mr-2" />
          Upload Files
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'url'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <LinkIcon className="inline-block w-4 h-4 mr-2" />
          Add by URL
        </button>
      </div>

      {activeTab === 'upload' && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop images here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select Files
            </button>
          </div>

          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'url' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlAdd();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleUrlAdd}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter the URL of an image hosted online
            </p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Product Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id || image.url}
                className="relative group border-2 rounded-lg overflow-hidden hover:border-blue-600 transition-colors"
                style={{
                  borderColor: featured === image.url ? '#2563eb' : '#e5e7eb',
                }}
              >
                <img
                  src={image.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-40 object-cover"
                />

                {featured === image.url && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {featured !== image.url && (
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(image.url)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                        title="Set as featured"
                      >
                        <Star className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="p-2 bg-white rounded-full hover:bg-red-50"
                      title="Delete image"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index - 1)}
                      className="p-1 bg-white rounded hover:bg-gray-100 text-xs"
                      title="Move left"
                    >
                      ←
                    </button>
                  )}
                  <span className="flex-1" />
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index + 1)}
                      className="p-1 bg-white rounded hover:bg-gray-100 text-xs"
                      title="Move right"
                    >
                      →
                    </button>
                  )}
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded p-1">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No images uploaded yet. Add images using the options above.
        </div>
      )}
    </div>
  );
}
