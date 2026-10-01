import { createSignal, createMemo, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Upload, Download, Eye, EyeOff, ImageIcon, Sparkles } from 'lucide-solid';

const MESSAGE_DELIMITER = '###END###';
const SAMPLE_MESSAGE = 'The vault opens at 0700.';

function ImageSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  const [imageInfo, setImageInfo] = createSignal({ width: 0, height: 0 });
  const [inlineError, setInlineError] = createSignal('');
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);
  let canvasRef;
  let fileInputRef;

  onMount(() => {
    logger.info('[ImageSteganography] mounted');
  });

  const capacityBits = createMemo(() => {
    const { width, height } = imageInfo();
    return width && height ? width * height : 0;
  });

  const capacityChars = createMemo(() => {
    const bits = capacityBits();
    if (!bits) return 0;
    const bytes = Math.floor(bits / 8);
    return Math.max(bytes - MESSAGE_DELIMITER.length, 0);
  });

  const handleImageUpload = (e) => {
    try {
      const file = e.currentTarget.files?.[0];
      if (!file) {
        logger.warn('[ImageSteganography] handleImageUpload: no file selected');
        return;
      }
      processImageFile(file);
    } catch (err) {
      logger.error('[ImageSteganography] handleImageUpload error', err);
      logger.userError('Image upload error.', { err });
    }
  };

  const processImageFile = (file) => {
    logger.info('[ImageSteganography] processing file', { name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImagePreview(event.target?.result);
        setImageInfo({ width: img.width, height: img.height });
        setInlineError('');
        const canvas = canvasRef;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            logger.debug('[ImageSteganography] canvas prepared', { width: canvas.width, height: canvas.height });
          }
        }
      };
      img.src = event.target?.result;
    };
    reader.onerror = (err) => {
      logger.error('[ImageSteganography] FileReader error', err);
      logger.userError('Failed to read image file.', { err });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const encodeMessage = () => {
    logger.info('[ImageSteganography] encodeMessage invoked');
    try {
      const canvas = canvasRef;
      if (!canvas || !secretMessage()) {
        logger.warn('[ImageSteganography] encodeMessage aborted: missing canvas or secretMessage');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        logger.warn('[ImageSteganography] encodeMessage aborted: no 2d context');
        return;
      }

      setIsProcessing(true);
      setTimeout(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const messageWithDelimiter = secretMessage() + MESSAGE_DELIMITER;
        const binary = messageWithDelimiter
          .split('')
          .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
          .join('');

        if (binary.length > data.length / 4) {
          logger.warn('[ImageSteganography] message too long for image', { bits: binary.length, capacity: data.length / 4 });
          setInlineError('Message is too long for this image. Try a larger image or shorten the message.');
          setIsProcessing(false);
          logger.userError('Message is too long for this image.', { bits: binary.length, capacity: data.length / 4 });
          return;
        }

        for (let i = 0; i < binary.length; i++) {
          data[i * 4] = (data[i * 4] & 0xFE) | parseInt(binary[i]);
        }

        ctx.putImageData(imageData, 0, 0);
        setImagePreview(canvas.toDataURL('image/png'));
        setInlineError('');
        setIsProcessing(false);
        logger.info('[ImageSteganography] encode complete', { secretLen: secretMessage().length });
      }, 300);
    } catch (err) {
      setIsProcessing(false);
      logger.error('[ImageSteganography] encodeMessage error', err);
      logger.userError('Failed to encode message into image.', { err });
    }
  };

  const decodeMessage = () => {
    logger.info('[ImageSteganography] decodeMessage invoked');
    try {
      const canvas = canvasRef;
      if (!canvas) {
        logger.warn('[ImageSteganography] decodeMessage aborted: no canvas');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        logger.warn('[ImageSteganography] decodeMessage aborted: no 2d context');
        return;
      }

      setIsProcessing(true);
      setTimeout(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let binary = '';
        for (let i = 0; i < data.length / 4; i++) {
          binary += (data[i * 4] & 1).toString();
        }

        let message = '';
        for (let i = 0; i < binary.length; i += 8) {
          const byte = binary.slice(i, i + 8);
          if (byte.length === 8) {
            const char = String.fromCharCode(parseInt(byte, 2));
            message += char;

            if (message.endsWith('###END###')) {
              message = message.slice(0, -9);
              break;
            }
          }
        }

        setDecodedMessage(message);
        setIsProcessing(false);
        logger.info('[ImageSteganography] decode complete', { decodedLen: message.length });
      }, 300);
    } catch (err) {
      setIsProcessing(false);
      logger.error('[ImageSteganography] decodeMessage error', err);
      logger.userError('Failed to decode message from image.', { err });
    }
  };

  const downloadImage = () => {
    logger.info('[ImageSteganography] downloadImage clicked');
    try {
      const canvas = canvasRef;
      if (!canvas) {
        logger.warn('[ImageSteganography] no canvas to download');
        return;
      }

      const link = document.createElement('a');
      link.download = 'stego-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      logger.error('[ImageSteganography] downloadImage error', err);
      logger.userError('Failed to generate download.', { err });
    }
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="inline-flex gap-1 rounded-xl border-2 border-slate-200 bg-slate-100 p-1.5">
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: encode');
            setMode('encode');
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'encode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'encode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Hide a secret message in an image"
        >
          <span class="flex items-center gap-2">
            <EyeOff class="h-4 w-4" />
            Encode
          </span>
        </button>
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: decode');
            setMode('decode');
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'decode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'decode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Reveal a hidden message from an image"
        >
          <span class="flex items-center gap-2">
            <Eye class="h-4 w-4" />
            Decode
          </span>
        </button>
      </div>

      {/* Image Upload with Drag & Drop */}
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Upload Image</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          class={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer ${
            isDragging()
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            class="hidden"
          />
          <div class={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ${
            isDragging() ? 'bg-blue-500 text-white scale-110' : 'bg-slate-100 text-slate-400'
          }`}>
            <Upload class="h-7 w-7" />
          </div>
          <div class="text-center">
            <p class="font-semibold text-slate-700">
              {isDragging() ? 'Drop image here' : 'Click to upload or drag and drop'}
            </p>
            <p class="mt-1 text-sm text-slate-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        <p class="mt-3 text-xs text-slate-500">
          💡 Tip: Larger images allow longer messages (1 bit per pixel). PNG works best for preserving hidden data.
        </p>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Secret Message</label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[ImageSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
                setInlineError('');
              }}
              placeholder="Enter your secret message..."
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 resize-none hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              rows={4}
            />
            <div class="mt-2 flex flex-wrap items-center gap-4 text-xs">
              {capacityChars() ? (
                <span class="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                  Capacity: ~{capacityChars().toLocaleString()} chars
                </span>
              ) : (
                <span class="text-slate-500">Upload an image to calculate capacity</span>
              )}
              <span class={`rounded-full px-3 py-1 font-medium ${
                secretMessage().length > capacityChars() && capacityChars() > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                Message: {secretMessage().length.toLocaleString()} chars
              </span>
            </div>
          </div>

          {inlineError() && (
            <div class="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              ⚠️ {inlineError()}
            </div>
          )}

          <div class="flex gap-3">
            <button
              onClick={encodeMessage}
              disabled={!imagePreview() || !secretMessage() || isProcessing()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
              data-tooltip="Embed your secret message into the image pixels"
            >
              {isProcessing() ? (
                <>
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles class="h-4 w-4" />
                  Hide Message in Image
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSecretMessage(SAMPLE_MESSAGE);
                setInlineError('');
              }}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
              data-tooltip="Load example text to try it out"
            >
              Use Sample
            </button>
          </div>

          {imagePreview() && (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon class="h-5 w-5 text-slate-400" />
                  Image Preview
                </label>
                <button
                  onClick={downloadImage}
                  class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98]"
                  style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
                  data-tooltip="Download the image with hidden message"
                >
                  <Download class="h-4 w-4" />
                  Download
                </button>
              </div>
              <div class="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-inner">
                <img src={imagePreview()} alt="Preview" class="h-auto max-w-full rounded-lg shadow-md" />
              </div>
              <p class="text-xs text-slate-500">
                📐 Dimensions: {imageInfo().width} × {imageInfo().height} pixels
              </p>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-5">
          <button
            onClick={decodeMessage}
            disabled={!imagePreview() || isProcessing()}
            class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 w-full flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
            data-tooltip="Extract the hidden message from the image"
          >
            {isProcessing() ? (
              <>
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <Eye class="h-4 w-4" />
                Reveal Hidden Message
              </>
            )}
          </button>

          {decodedMessage() && (
            <div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-lg transition-all duration-300" style={{ animation: 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Decoded Message</label>
              <div class="whitespace-pre-wrap rounded-xl border-2 border-emerald-200 bg-white px-4 py-4 shadow-inner">
                {decodedMessage()}
              </div>
              <p class="mt-3 text-xs text-emerald-700">
                ✓ Hidden message revealed successfully!
              </p>
            </div>
          )}

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ImageIcon class="h-4 w-4 text-slate-400" />
              Image Preview
            </label>
            <div class="flex min-h-48 items-center justify-center rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-inner">
              {imagePreview() ? (
                <img src={imagePreview()} alt="Preview" class="h-auto max-w-full rounded-lg shadow-md" />
              ) : (
                <div class="text-center">
                  <ImageIcon class="mx-auto h-12 w-12 text-slate-300" />
                  <p class="mt-3 text-sm font-medium text-slate-500">Upload an image to preview it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} class="hidden" />

      {/* Info Box */}
      <div class="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-bold text-slate-900">How it works</p>
            <p class="text-sm leading-relaxed text-slate-600">
              This method uses LSB (Least Significant Bit) encoding to hide your message in the image pixels. 
              The changes are invisible to the human eye but can be decoded later. 
              For best results, use PNG format to avoid compression artifacts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSteganography;
