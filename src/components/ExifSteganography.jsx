import { createSignal } from 'solid-js';
import { Upload, Download } from 'lucide-solid';

function ExifSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  const [originalImage, setOriginalImage] = createSignal(null);
  let fileInputRef;

  const handleImageUpload = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      setOriginalImage(result);
      setImagePreview(result);

      if (mode() === 'decode') {
        decodeFromImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const decodeFromImage = (dataUrl) => {
    const marker = '###EXIF_DATA:';
    const endMarker = ':END_EXIF###';

    const startIdx = dataUrl.indexOf(marker);
    if (startIdx === -1) {
      setDecodedMessage('No hidden message found in this image.');
      return;
    }

    const endIdx = dataUrl.indexOf(endMarker, startIdx);
    if (endIdx === -1) {
      setDecodedMessage('Corrupted hidden message.');
      return;
    }

    const encodedMessage = dataUrl.substring(startIdx + marker.length, endIdx);
    try {
      const decoded = atob(encodedMessage);
      setDecodedMessage(decoded);
    } catch (e) {
      setDecodedMessage('Error decoding message.');
    }
  };

  const encodeMessage = () => {
    if (!originalImage() || !secretMessage()) return;

    const encodedMessage = btoa(secretMessage());
    const marker = '###EXIF_DATA:' + encodedMessage + ':END_EXIF###';

    const [header, base64Data] = originalImage().split(',');
    const newDataUrl = header + ',' + marker + base64Data;

    setImagePreview(newDataUrl);
  };

  const downloadImage = () => {
    if (!imagePreview()) return;

    const link = document.createElement('a');
    link.download = 'stego-exif-image.png';
    link.href = imagePreview();
    link.click();
  };

  return (
    <div class="space-y-6">
      <div class="flex gap-4 mb-6">
        <button
          onClick={() => {
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
            onClick={() => fileInputRef?.click()}
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
              onInput={(e) => setSecretMessage(e.currentTarget.value)}
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
