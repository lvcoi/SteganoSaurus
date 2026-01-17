import { createSignal, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Upload, Download } from 'lucide-solid';

function ExifSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  const [originalImage, setOriginalImage] = createSignal(null);
  let fileInputRef;

  onMount(() => {
    logger.info('[ExifSteganography] mounted');
  });

  const handleImageUpload = (e) => {
    try {
      const file = e.currentTarget.files?.[0];
      if (!file) {
        logger.warn('[ExifSteganography] handleImageUpload: no file selected');
        return;
      }
      logger.info('[ExifSteganography] handleImageUpload file', { name: file.name, size: file.size, type: file.type });

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        setOriginalImage(result);
        setImagePreview(result);
        logger.debug('[ExifSteganography] image loaded and preview set');

        if (mode() === 'decode') {
          logger.info('[ExifSteganography] auto-decoding from uploaded image');
          decodeFromImage(result);
        }
      };
      reader.onerror = (err) => {
        logger.error('[ExifSteganography] FileReader error', err);
        logger.userError('Failed to read image file.', { err });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      logger.error('[ExifSteganography] handleImageUpload error', err);
      logger.userError('Image upload error.', { err });
    }
  };

  const decodeFromImage = (dataUrl) => {
    logger.info('[ExifSteganography] decodeFromImage invoked');
    try {
      const marker = '###EXIF_DATA:';
      const endMarker = ':END_EXIF###';

      const startIdx = dataUrl.indexOf(marker);
      if (startIdx === -1) {
        logger.warn('[ExifSteganography] no marker found');
        setDecodedMessage('No hidden message found in this image.');
        logger.userError('No hidden message found in this image.');
        return;
      }

      const endIdx = dataUrl.indexOf(endMarker, startIdx);
      if (endIdx === -1) {
        logger.warn('[ExifSteganography] end marker missing');
        setDecodedMessage('Corrupted hidden message.');
        logger.userError('Corrupted hidden message.');
        return;
      }

      const encodedMessage = dataUrl.substring(startIdx + marker.length, endIdx);
      try {
        const decoded = atob(encodedMessage);
        setDecodedMessage(decoded);
        logger.info('[ExifSteganography] decode complete', { decodedLen: decoded.length });
      } catch (e) {
        logger.error('[ExifSteganography] atob failed', e);
        setDecodedMessage('Error decoding message.');
        logger.userError('Error decoding message.', { err: e });
      }
    } catch (err) {
      logger.error('[ExifSteganography] decodeFromImage error', err);
      setDecodedMessage('Error decoding message.');
      logger.userError('Error decoding message.', { err });
    }
  };

  const encodeMessage = () => {
    logger.info('[ExifSteganography] encodeMessage invoked');
    try {
      if (!originalImage() || !secretMessage()) {
        logger.warn('[ExifSteganography] encodeMessage aborted: missing image or secret');
        return;
      }

      const encodedMessage = btoa(secretMessage());
      const marker = '###EXIF_DATA:' + encodedMessage + ':END_EXIF###';

      const [header, base64Data] = originalImage().split(',');
      const newDataUrl = header + ',' + marker + base64Data;

      setImagePreview(newDataUrl);
      logger.info('[ExifSteganography] encode complete', { secretLen: secretMessage().length, previewLen: newDataUrl.length });
    } catch (err) {
      logger.error('[ExifSteganography] encodeMessage error', err);
      logger.userError('Failed to encode message into EXIF.', { err });
    }
  };

  const downloadImage = () => {
    logger.info('[ExifSteganography] downloadImage clicked');
    try {
      if (!imagePreview()) {
        logger.warn('[ExifSteganography] no imagePreview to download');
        return;
      }

      const link = document.createElement('a');
      link.download = 'stego-exif-image.png';
      link.href = imagePreview();
      link.click();
    } catch (err) {
      logger.error('[ExifSteganography] downloadImage error', err);
      logger.userError('Failed to generate download.', { err });
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex gap-4 mb-6">
        <button
          onClick={() => {
            logger.info('[ExifSteganography] set mode: encode');
            setMode('encode');
            setDecodedMessage('');
          }}
          class={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            mode() === 'encode'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => {
            logger.info('[ExifSteganography] set mode: decode');
            setMode('decode');
            setSecretMessage('');
          }}
          class={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            mode() === 'decode'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Decode
        </button>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
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
              logger.info('[ExifSteganography] open file picker');
              fileInputRef?.click();
            }}
            class="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload class="w-5 h-5" />
            Choose Image
          </button>
        </div>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[ExifSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <button
            onClick={encodeMessage}
            disabled={!originalImage() || !secretMessage()}
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Hide Message in EXIF Data
          </button>

          {imagePreview() && originalImage() && imagePreview() !== originalImage() && (
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">
                  Encoded Image
                </label>
                <button
                  onClick={downloadImage}
                  class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download class="w-4 h-4" />
                  Download
                </button>
              </div>
              <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img src={imagePreview()} alt="Preview" class="max-w-full h-auto" />
              </div>
              <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-green-800">
                  Message successfully hidden! Download the image to share it.
                </p>
              </div>
            </div>
          )}

          {imagePreview() && !secretMessage() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img src={imagePreview()} alt="Preview" class="max-w-full h-auto" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          {decodedMessage() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {decodedMessage().startsWith('No hidden') || decodedMessage().startsWith('Error') || decodedMessage().startsWith('Corrupted')
                  ? 'Status'
                  : 'Decoded Message'}
              </label>
              <div class={`w-full px-4 py-3 border rounded-lg whitespace-pre-wrap ${
                decodedMessage().startsWith('No hidden') || decodedMessage().startsWith('Error') || decodedMessage().startsWith('Corrupted')
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-green-50 border-green-200 text-gray-900'
              }`}>
                {decodedMessage()}
              </div>
            </div>
          )}

          {imagePreview() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img src={imagePreview()} alt="Preview" class="max-w-full h-auto" />
              </div>
            </div>
          )}
        </div>
      )}

      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>How it works:</strong> This method embeds your secret message in the image's metadata (EXIF-like data structure). The message is encoded in base64 and stored within the image file itself.
        </p>
      </div>
    </div>
  );
}

export default ExifSteganography;
