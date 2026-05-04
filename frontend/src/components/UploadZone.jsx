import React, { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, RotateCcw, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/**
 * UploadZone — Komponen upload foto dengan dukungan kamera dan galeri.
 * 
 * @param {Object} props
 * @param {string} props.label - Label yang ditampilkan (e.g., "Foto Tanaman", "Foto Label")
 * @param {string} props.hint - Hint teks untuk panduan foto
 * @param {File|null} props.value - File yang sudah dipilih (controlled)
 * @param {(file: File|null) => void} props.onChange - Callback saat file berubah
 * @param {boolean} [props.disabled=false] - Disable interaksi
 * @param {string} [props.accept="image/jpeg,image/png"] - MIME types yang diterima
 */

const MAX_FILE_SIZE_MB = 10;
const COMPRESS_TARGET_MB = 1;

const COMPRESSION_OPTIONS = {
  maxSizeMB: COMPRESS_TARGET_MB,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

export default function UploadZone({
  label,
  hint,
  value,
  onChange,
  disabled = false,
  accept = 'image/jpeg,image/png',
}) {
  const [preview, setPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  /**
   * Validasi file: cek MIME type dan ukuran
   */
  const validateFile = useCallback((file) => {
    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      return 'Format foto harus JPEG atau PNG.';
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Ukuran foto terlalu besar (maks. ${MAX_FILE_SIZE_MB}MB).`;
    }

    return null;
  }, []);

  /**
   * Proses file: validasi → compress → set preview & value
   */
  const processFile = useCallback(async (file) => {
    setError(null);

    // Validasi
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsCompressing(true);

      // Compress jika > target
      let processedFile = file;
      if (file.size > COMPRESS_TARGET_MB * 1024 * 1024) {
        processedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      }

      // Generate preview URL
      const previewUrl = URL.createObjectURL(processedFile);
      
      // Cleanup previous preview URL
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview(previewUrl);
      onChange(processedFile);
    } catch (err) {
      console.error('Gagal memproses foto:', err);
      // Fallback: gunakan file asli jika kompresi gagal dan file < 5MB
      if (file.size < 5 * 1024 * 1024) {
        const previewUrl = URL.createObjectURL(file);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(previewUrl);
        onChange(file);
      } else {
        setError('Gagal memproses foto. Coba foto dengan ukuran lebih kecil.');
      }
    } finally {
      setIsCompressing(false);
    }
  }, [validateFile, onChange, preview]);

  /**
   * Handle file input change (camera atau gallery)
   */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input supaya bisa pilih file yang sama lagi
    e.target.value = '';
  }, [processFile]);

  /**
   * Handle drag & drop
   */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  /**
   * Hapus foto yang sudah dipilih
   */
  const handleRemove = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onChange(null);
  }, [preview, onChange]);

  /**
   * Buka kamera
   */
  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  /**
   * Buka galeri
   */
  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  // Format file size untuk display
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* State: Preview foto */}
      {preview && value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 bg-primary-light animate-slide-up">
          {/* Preview image */}
          <div className="relative aspect-[4/3] bg-gray-100">
            <img
              src={preview}
              alt="Preview foto yang diunggah"
              className="w-full h-full object-cover"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* File info */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                {formatSize(value.size)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 p-3 bg-white">
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 
                         py-2.5 rounded-xl text-sm font-medium
                         text-red-600 bg-red-50 hover:bg-red-100
                         transition-colors duration-200
                         min-h-[44px]
                         disabled:opacity-50"
            >
              <X size={16} />
              Hapus
            </button>
            <button
              type="button"
              onClick={openCamera}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 
                         py-2.5 rounded-xl text-sm font-medium
                         text-primary bg-primary-light hover:bg-green-100
                         transition-colors duration-200
                         min-h-[44px]
                         disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Ganti Foto
            </button>
          </div>
        </div>
      ) : (
        /* State: Upload zone (belum ada foto) */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative rounded-2xl border-2 border-dashed 
            transition-all duration-200 ease-out
            ${dragActive
              ? 'border-primary bg-primary-light scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary-light/50'
            }
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
            ${isCompressing ? 'pointer-events-none' : ''}
          `}
        >
          {/* Compressing overlay */}
          {isCompressing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-primary">
                Mengompres foto...
              </p>
            </div>
          )}

          {/* Upload content */}
          <div className="flex flex-col items-center py-8 px-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
              <ImagePlus size={28} className="text-primary" />
            </div>

            {/* Hint text */}
            <p className="text-sm text-gray-500 text-center mb-1">
              {hint || 'Ambil foto atau pilih dari galeri'}
            </p>
            <p className="text-xs text-gray-400 text-center mb-5">
              JPEG atau PNG, maks. {MAX_FILE_SIZE_MB}MB
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 w-full max-w-[280px]">
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled || isCompressing}
                className="flex-1 btn-primary text-sm py-2.5"
              >
                <Camera size={18} />
                Kamera
              </button>
              <button
                type="button"
                onClick={openGallery}
                disabled={disabled || isCompressing}
                className="flex-1 btn-secondary text-sm py-2.5"
              >
                <ImagePlus size={18} />
                Galeri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
