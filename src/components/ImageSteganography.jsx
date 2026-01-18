import { createSignal, createMemo, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Upload, Download } from 'lucide-solid';

const MESSAGE_DELIMITER = '###END###';
const SAMPLE_MESSAGE = 'The vault opens at 0700.';

function ImageSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  const [imageInfo, setImageInfo] = createSignal({ width: 0, height: 0 });
  const [inlineError, setInlineError] = createSignal('');
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
      logger.info('[ImageSteganography] handleImageUpload file', { name: file.name, size: file.size, type: file.type });

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
    } catch (err) {
      logger.error('[ImageSteganography] handleImageUpload error', err);
      logger.userError('Image upload error.', { err });
    }
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
        logger.userError('Message is too long for this image.', { bits: binary.length, capacity: data.length / 4 });
        return;
      }

      for (let i = 0; i < binary.length; i++) {
        data[i * 4] = (data[i * 4] & 0xFE) | parseInt(binary[i]);
      }

      ctx.putImageData(imageData, 0, 0);
      setImagePreview(canvas.toDataURL('image/png'));
      setInlineError('');
      logger.info('[ImageSteganography] encode complete', { secretLen: secretMessage().length });
    } catch (err) {
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
      logger.info('[ImageSteganography] decode complete', { decodedLen: message.length });
    } catch (err) {
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
      <div class="inline-flex gap-1 rounded-lg border border-blue-500/30 bg-blue-950/30 p-1 backdrop-blur-sm">
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: encode');
            setMode('encode');
          }}
          class={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
            mode() === 'encode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-blue-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: decode');
            setMode('decode');
          }}
          class={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
            mode() === 'decode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-blue-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          Decode
        </button>
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-900">
          Upload Image
        </label>
        <div class="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            class="hidden"
          />
          <button
            onClick={() => {
              logger.info('[ImageSteganography] open file picker');
              fileInputRef?.click();
            }}
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-blue-50"
          >
            <Upload class="h-4 w-4" />
            Choose Image
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          Tip: Larger images allow longer messages (1 bit per pixel). PNG works best for preserving hidden data.
        </p>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[ImageSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
                setInlineError('');
              }}
              placeholder="Enter your secret message..."
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {capacityChars() ? (
                <span>Capacity: ~{capacityChars()} chars</span>
              ) : (
                <span>Upload an image to calculate capacity.</span>
              )}
              <span>Message length: {secretMessage().length} chars</span>
            </div>
          </div>

          {inlineError() && (
            <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {inlineError()}
            </div>
          )}

          <div class="flex gap-3">
            <button
              onClick={encodeMessage}
              disabled={!imagePreview() || !secretMessage()}
              class="flex-1 rounded-lg border border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Hide Message in Image
            </button>
            <button
              onClick={() => {
                setSecretMessage(SAMPLE_MESSAGE);
                setInlineError('');
              }}
              class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-blue-50"
            >
              Use Sample
            </button>
          </div>

          {imagePreview() && (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-gray-900">
                  Image Preview
                </label>
                <button
                  onClick={downloadImage}
                  class="flex items-center gap-2 rounded-lg border border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60"
                >
                  <Download class="h-4 w-4" />
                  Download
                </button>
              </div>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <img src={imagePreview()} alt="Preview" class="h-auto max-w-full rounded-lg" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          <button
            onClick={decodeMessage}
            disabled={!imagePreview()}
            class="w-full rounded-lg border border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Reveal Hidden Message
          </button>

          {decodedMessage() && (
            <div class="rounded-lg border border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg">
              <label class="mb-3 block text-sm font-medium text-gray-900">
                Decoded Message
              </label>
              <div class="whitespace-pre-wrap rounded-lg border border-green-300 bg-white px-4 py-4">
                {decodedMessage()}
              </div>
            </div>
          )}

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Image Preview
            </label>
            <div class="flex min-h-40 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
              {imagePreview() ? (
                <img src={imagePreview()} alt="Preview" class="h-auto max-w-full rounded-lg" />
              ) : (
                <span class="text-sm font-medium text-gray-500">Upload an image to preview it here.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} class="hidden" />

      <div class="rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-200">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-medium text-gray-900">How it works</p>
            <p class="text-sm leading-relaxed text-gray-600">
              This method uses LSB (Least Significant Bit) encoding to hide your message in the image pixels. The changes are invisible to the human eye but can be decoded later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSteganography;
