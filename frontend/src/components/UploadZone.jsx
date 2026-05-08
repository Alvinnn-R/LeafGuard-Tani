import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, ImagePlus, X, RotateCcw, AlertCircle, SwitchCamera } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/**
 * UploadZone — Komponen upload foto dengan dukungan kamera dan galeri.
 * 
 * Kamera: di HP → buka kamera native via capture="environment"
 *         di Desktop → buka webcam modal via getUserMedia
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

/**
 * Deteksi apakah device ini mobile/tablet (yang punya kamera native)
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

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

  // Webcam states (untuk desktop)
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  /**
   * Stop webcam stream — penting untuk melepas kamera saat modal ditutup
   */
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamReady(false);
    setWebcamError(null);
  }, []);

  /**
   * Start webcam stream
   */
  const startWebcam = useCallback(async (facing = 'environment') => {
    setWebcamError(null);
    setWebcamReady(false);

    // Stop previous stream jika ada
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setWebcamReady(true);
        };
      }
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      if (err.name === 'NotAllowedError') {
        setWebcamError('Izin kamera ditolak. Berikan izin kamera di pengaturan browser Anda.');
      } else if (err.name === 'NotFoundError') {
        setWebcamError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setWebcamError('Gagal mengakses kamera. Pastikan kamera tidak digunakan aplikasi lain.');
      }
    }
  }, []);

  /**
   * Buka webcam modal (desktop) atau kamera native (mobile)
   */
  const openCamera = useCallback(() => {
    if (isMobileDevice()) {
      // Mobile: gunakan input capture native
      cameraInputRef.current?.click();
    } else {
      // Desktop: buka webcam modal
      setShowWebcam(true);
      startWebcam(facingMode);
    }
  }, [startWebcam, facingMode]);

  /**
   * Tutup webcam modal
   */
  const closeWebcam = useCallback(() => {
    stopWebcam();
    setShowWebcam(false);
  }, [stopWebcam]);

  /**
   * Switch kamera depan/belakang
   */
  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startWebcam(newFacing);
  }, [facingMode, startWebcam]);

  /**
   * Ambil foto dari webcam
   */
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Mirror gambar jika kamera depan
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `kamera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          closeWebcam();
          processFile(file);
        }
      },
      'image/jpeg',
      0.92
    );
  }, [facingMode, closeWebcam]);

  // Cleanup saat component unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

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
        accept="image/*"
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
      {/* Hidden canvas for webcam capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ============================================ */}
      {/* WEBCAM MODAL (Desktop only) */}
      {/* ============================================ */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Video feed */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Loading kamera */}
            {!webcamReady && !webcamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-white text-sm">Mengakses kamera...</p>
              </div>
            )}

            {/* Error kamera */}
            {webcamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <p className="text-white text-sm text-center mb-6">{webcamError}</p>
                <button
                  type="button"
                  onClick={closeWebcam}
                  className="px-6 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold
                             min-h-[44px] active:scale-95 transition-transform"
                >
                  Kembali
                </button>
              </div>
            )}

            {/* Viewfinder overlay */}
            {webcamReady && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                <div className="absolute top-[15%] left-[10%] w-12 h-12 border-t-2 border-l-2 border-white/60 rounded-tl-xl" />
                <div className="absolute top-[15%] right-[10%] w-12 h-12 border-t-2 border-r-2 border-white/60 rounded-tr-xl" />
                <div className="absolute bottom-[25%] left-[10%] w-12 h-12 border-b-2 border-l-2 border-white/60 rounded-bl-xl" />
                <div className="absolute bottom-[25%] right-[10%] w-12 h-12 border-b-2 border-r-2 border-white/60 rounded-br-xl" />
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="bg-black/95 px-6 py-5 flex items-center justify-between"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
            {/* Tutup */}
            <button
              type="button"
              onClick={closeWebcam}
              className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center
                         active:scale-90 transition-transform min-h-[44px] min-w-[44px]"
              aria-label="Tutup kamera"
            >
              <X size={22} className="text-white" />
            </button>

            {/* Shutter button */}
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!webcamReady}
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center
                         ring-4 ring-white/30 ring-offset-2 ring-offset-black
                         active:scale-90 transition-transform
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Ambil foto"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white border-2 border-gray-200" />
            </button>

            {/* Switch camera */}
            <button
              type="button"
              onClick={switchCamera}
              disabled={!webcamReady}
              className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center
                         active:scale-90 transition-transform min-h-[44px] min-w-[44px]
                         disabled:opacity-40"
              aria-label="Ganti kamera"
            >
              <SwitchCamera size={22} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* State: Preview foto */}
      {/* ============================================ */}
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
