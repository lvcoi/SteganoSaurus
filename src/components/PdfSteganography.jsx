import { createSignal, onMount } from 'solid-js';
import { Download, FileText, Upload } from 'lucide-solid';
import { logger } from '../utils/logger.js';

const MARKER_START = '###STEGANO_START###';
const MARKER_END = '###STEGANO_END###';
const SAMPLE_MESSAGE = 'Drop site changed. New time: 21:45.';

const encodeBase64Utf8 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

const decodeBase64Utf8 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

const findSubarray = (haystack, needle, start = 0) => {
  if (!needle.length || needle.length > haystack.length) return -1;
  for (let i = start; i <= haystack.length - needle.length; i += 1) {
    let match = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
};

function PdfSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [decodedMessage, setDecodedMessage] = createSignal('');
  const [encodePdfBytes, setEncodePdfBytes] = createSignal(null);
  const [encodePdfName, setEncodePdfName] = createSignal('');
  const [decodePdfBytes, setDecodePdfBytes] = createSignal(null);
  const [decodePdfName, setDecodePdfName] = createSignal('');
  let fileInputRef;

  onMount(() => {
    logger.info('[PdfSteganography] mounted');
  });

  const handlePdfUpload = (e) => {
    try {
      const file = e.currentTarget.files?.[0];
      if (!file) {
        logger.warn('[PdfSteganography] handlePdfUpload: no file selected');
        return;
      }
      logger.info('[PdfSteganography] handlePdfUpload file', { name: file.name, size: file.size, type: file.type });
      if (mode() === 'encode') {
        setEncodePdfName(file.name);
      } else {
        setDecodePdfName(file.name);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result;
        if (!buffer) {
          logger.warn('[PdfSteganography] handlePdfUpload: empty buffer');
          return;
        }
        const bytes = new Uint8Array(buffer);
        if (mode() === 'encode') {
          setEncodePdfBytes(bytes);
        } else {
          setDecodePdfBytes(bytes);
          setDecodedMessage('');
        }
      };
      reader.onerror = (err) => {
        logger.error('[PdfSteganography] FileReader error', err);
        logger.userError('Failed to read PDF file.', { err });
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      logger.error('[PdfSteganography] handlePdfUpload error', err);
      logger.userError('PDF upload error.', { err });
    }
  };

  const downloadEncodedPdf = () => {
    logger.info('[PdfSteganography] downloadEncodedPdf clicked');
    try {
      const original = encodePdfBytes();
      if (!original || !secretMessage()) {
        logger.warn('[PdfSteganography] downloadEncodedPdf aborted: missing pdf or message');
        return;
      }

      const encodedMessage = encodeBase64Utf8(secretMessage());
      const markerBytes = new TextEncoder().encode(MARKER_START + encodedMessage + MARKER_END);
      const combined = new Uint8Array(original.length + markerBytes.length);
      combined.set(original, 0);
      combined.set(markerBytes, original.length);

      const blob = new Blob([combined], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = encodePdfName() ? encodePdfName().replace(/\.pdf$/i, '') + '-stego.pdf' : 'stego-document.pdf';
      link.click();
      URL.revokeObjectURL(url);
      logger.info('[PdfSteganography] encoded PDF download generated');
    } catch (err) {
      logger.error('[PdfSteganography] downloadEncodedPdf error', err);
      logger.userError('Failed to generate encoded PDF.', { err });
    }
  };

  const decodeMessage = () => {
    logger.info('[PdfSteganography] decodeMessage invoked');
    try {
      const data = decodePdfBytes();
      if (!data) {
        logger.warn('[PdfSteganography] decodeMessage aborted: no PDF loaded');
        return;
      }

      const encoder = new TextEncoder();
      const startBytes = encoder.encode(MARKER_START);
      const endBytes = encoder.encode(MARKER_END);

      const startIndex = findSubarray(data, startBytes, 0);
      if (startIndex === -1) {
        logger.warn('[PdfSteganography] no marker found');
        setDecodedMessage('No hidden message found in this PDF.');
        return;
      }

      const messageStart = startIndex + startBytes.length;
      const endIndex = findSubarray(data, endBytes, messageStart);
      if (endIndex === -1) {
        logger.warn('[PdfSteganography] end marker missing');
        setDecodedMessage('Corrupted hidden message.');
        return;
      }

      const messageBytes = data.slice(messageStart, endIndex);
      const messageBase64 = new TextDecoder().decode(messageBytes);
      const decoded = decodeBase64Utf8(messageBase64);
      setDecodedMessage(decoded);
      logger.info('[PdfSteganography] decode complete', { decodedLen: decoded.length });
    } catch (err) {
      logger.error('[PdfSteganography] decodeMessage error', err);
      logger.userError('Failed to decode message from PDF.', { err });
    }
  };

  return (
    <div class="space-y-7">
      <div class="flex gap-3 p-1.5 bg-gray-100 rounded-xl">
        <button
          onClick={() => {
            logger.info('[PdfSteganography] set mode: encode');
            setMode('encode');
            setDecodedMessage('');
            if (fileInputRef) fileInputRef.value = '';
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
            logger.info('[PdfSteganography] set mode: decode');
            setMode('decode');
            setSecretMessage('');
            if (fileInputRef) fileInputRef.value = '';
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
          Upload PDF
        </label>
        <div class="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            class="hidden"
          />
          <button
            onClick={() => {
              logger.info('[PdfSteganography] open file picker');
              fileInputRef?.click();
            }}
            class="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-200 font-semibold shadow-sm"
          >
            <Upload class="w-5 h-5" />
            Choose PDF
          </button>
          {mode() === 'encode' && encodePdfName() && (
            <span class="text-sm text-gray-600 truncate font-medium">{encodePdfName()}</span>
          )}
          {mode() === 'decode' && decodePdfName() && (
            <span class="text-sm text-gray-600 truncate font-medium">{decodePdfName()}</span>
          )}
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
                logger.info('[PdfSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white hover:border-gray-300"
              rows={4}
            />
          </div>

          <button
            onClick={() => setSecretMessage(SAMPLE_MESSAGE)}
            class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Use sample message
          </button>

          <button
            onClick={downloadEncodedPdf}
            disabled={!secretMessage() || !encodePdfBytes()}
            class="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Download class="w-5 h-5" />
            Download PDF with Hidden Message
          </button>
        </div>
      ) : (
        <div class="space-y-6">
          <button
            onClick={decodeMessage}
            disabled={!decodePdfBytes()}
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
        </div>
      )}

      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 p-5">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16" />
        <div class="relative flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mt-0.5">
            <span class="text-white text-lg">💡</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-blue-900 mb-1">How it works</p>
            <p class="text-sm text-blue-800 leading-relaxed">
              This method appends an encoded message to the end of the PDF file. PDF readers ignore trailing data, but the message can be recovered by scanning for the hidden marker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfSteganography;
