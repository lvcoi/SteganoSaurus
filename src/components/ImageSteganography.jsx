import { createSignal } from 'solid-js';
import { Upload, Download } from 'lucide-solid';

function ImageSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [imagePreview, setImagePreview] = createSignal(null);
  let canvasRef;
  let fileInputRef;

  const handleImageUpload = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

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
          }
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const encodeMessage = () => {
    const canvas = canvasRef;
    if (!canvas || !secretMessage()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const messageWithDelimiter = secretMessage() + '###END###';
    const binary = messageWithDelimiter
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    if (binary.length > data.length / 4) {
      alert('Message is too long for this image!');
      return;
    }

    for (let i = 0; i < binary.length; i++) {
      data[i * 4] = (data[i * 4] & 0xFE) | parseInt(binary[i]);
    }

    ctx.putImageData(imageData, 0, 0);
    setImagePreview(canvas.toDataURL('image/png'));
  };

  const decodeMessage = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
  };

  const downloadImage = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'stego-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div class="space-y-6">
      <div class="flex gap-4 mb-6">
        <button
          onClick={() => setMode('encode')}
          class={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            mode() === 'encode'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => setMode('decode')}
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
            disabled={!imagePreview() || !secretMessage()}
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Hide Message in Image
          </button>

          {imagePreview() && (
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <label class="block text-sm font-medium text-gray-700">
                  Image Preview
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
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          <button
            onClick={decodeMessage}
            disabled={!imagePreview()}
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Reveal Hidden Message
          </button>

          {decodedMessage() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Decoded Message
              </label>
              <div class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-green-50 border-green-200 whitespace-pre-wrap">
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

      <canvas ref={canvasRef} class="hidden" />

      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>How it works:</strong> This method uses LSB (Least Significant Bit) encoding to hide your message in the image pixels. The changes are invisible to the human eye but can be decoded later.
        </p>
      </div>
    </div>
  );
}

export default ImageSteganography;
