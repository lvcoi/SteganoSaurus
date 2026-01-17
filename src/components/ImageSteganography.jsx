import { createSignal, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Upload, Download } from 'lucide-solid';

function ImageSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  let canvasRef;
  let fileInputRef;

  onMount(() => {
    logger.info('[ImageSteganography] mounted');
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

      const messageWithDelimiter = secretMessage() + '###END###';
      const binary = messageWithDelimiter
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');

      if (binary.length > data.length / 4) {
        logger.warn('[ImageSteganography] message too long for image', { bits: binary.length, capacity: data.length / 4 });
        alert('Message is too long for this image!');
        logger.userError('Message is too long for this image.', { bits: binary.length, capacity: data.length / 4 });
        return;
      }

      for (let i = 0; i < binary.length; i++) {
        data[i * 4] = (data[i * 4] & 0xFE) | parseInt(binary[i]);
      }

      ctx.putImageData(imageData, 0, 0);
      setImagePreview(canvas.toDataURL('image/png'));
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
    <div class="space-y-7">
      <div class="flex gap-3 p-1.5 bg-gray-100 rounded-xl">
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: encode');
            setMode('encode');
          }}
          class={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
            mode() === 'encode'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-700 hover:bg-white/50'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => {
            logger.info('[ImageSteganography] set mode: decode');
            setMode('decode');
          }}
          class={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
            mode() === 'decode'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-700 hover:bg-white/50'
          }`}
        >
          Decode
        </button>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-800 mb-3">
          Upload Image
        </label>
        <div class="flex items-center gap-4">
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
            class="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-200 font-semibold shadow-sm"
          >
            <Upload class="w-5 h-5" />
            Choose Image
          </button>
        </div>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-800 mb-3">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                console.log('[ImageSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white hover:border-gray-300"
              rows={4}
            />
          </div>

          <button
            onClick={encodeMessage}
            disabled={!imagePreview() || !secretMessage()}
            class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Hide Message in Image
          </button>

          {imagePreview() && (
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-semibold text-gray-800">
                  Image Preview
                </label>
                <button
                  onClick={downloadImage}
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg shadow-green-500/30"
                >
                  <Download class="w-4 h-4" />
                  Download
                </button>
              </div>
              <div class="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <img src={imagePreview()} alt="Preview" class="max-w-full h-auto rounded-lg" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          <button
            onClick={decodeMessage}
            disabled={!imagePreview()}
            class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Reveal Hidden Message
          </button>

          {decodedMessage() && (
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
              <label class="block text-sm font-semibold text-gray-800 mb-3">
                Decoded Message
              </label>
              <div class="px-4 py-4 bg-white border-2 border-green-300 rounded-xl shadow-sm whitespace-pre-wrap">
                {decodedMessage()}
              </div>
            </div>
          )}

          <div>
            <label class="block text-sm font-semibold text-gray-800 mb-3">
              Image Preview
            </label>
            <div class="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm flex items-center justify-center min-h-40">
              {imagePreview() ? (
                <img src={imagePreview()} alt="Preview" class="max-w-full h-auto rounded-lg" />
              ) : (
                <span class="text-sm text-gray-500 font-medium">Upload an image to preview it here.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} class="hidden" />

      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 p-5">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16" />
        <div class="relative flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mt-0.5">
            <span class="text-white text-lg">💡</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-blue-900 mb-1">How it works</p>
            <p class="text-sm text-blue-800 leading-relaxed">
              This method uses LSB (Least Significant Bit) encoding to hide your message in the image pixels. The changes are invisible to the human eye but can be decoded later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSteganography;
