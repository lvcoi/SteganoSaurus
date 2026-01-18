import { createSignal, onMount } from 'solid-js';
import { Download, FileText, Upload, Eye, EyeOff, Sparkles, File } from 'lucide-solid';
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
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);
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
      processPdfFile(file);
    } catch (err) {
      logger.error('[PdfSteganography] handlePdfUpload error', err);
      logger.userError('PDF upload error.', { err });
    }
  };

  const processPdfFile = (file) => {
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
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      processPdfFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const downloadEncodedPdf = () => {
    logger.info('[PdfSteganography] downloadEncodedPdf clicked');
    try {
      const original = encodePdfBytes();
      if (!original || !secretMessage()) {
        logger.warn('[PdfSteganography] downloadEncodedPdf aborted: missing pdf or message');
        return;
      }

      setIsProcessing(true);
      setTimeout(() => {
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
        setIsProcessing(false);
        logger.info('[PdfSteganography] encoded PDF download generated');
      }, 300);
    } catch (err) {
      setIsProcessing(false);
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

      setIsProcessing(true);
      setTimeout(() => {
        const encoder = new TextEncoder();
        const startBytes = encoder.encode(MARKER_START);
        const endBytes = encoder.encode(MARKER_END);

        const startIndex = findSubarray(data, startBytes, 0);
        if (startIndex === -1) {
          logger.warn('[PdfSteganography] no marker found');
          setDecodedMessage('No hidden message found in this PDF.');
          setIsProcessing(false);
          return;
        }

        const messageStart = startIndex + startBytes.length;
        const endIndex = findSubarray(data, endBytes, messageStart);
        if (endIndex === -1) {
          logger.warn('[PdfSteganography] end marker missing');
          setDecodedMessage('Corrupted hidden message.');
          setIsProcessing(false);
          return;
        }

        const messageBytes = data.slice(messageStart, endIndex);
        const messageBase64 = new TextDecoder().decode(messageBytes);
        const decoded = decodeBase64Utf8(messageBase64);
        setDecodedMessage(decoded);
        setIsProcessing(false);
        logger.info('[PdfSteganography] decode complete', { decodedLen: decoded.length });
      }, 300);
    } catch (err) {
      setIsProcessing(false);
      logger.error('[PdfSteganography] decodeMessage error', err);
      logger.userError('Failed to decode message from PDF.', { err });
    }
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="inline-flex gap-1 rounded-xl border-2 border-slate-200 bg-slate-100 p-1.5">
        <button
          onClick={() => {
            logger.info('[PdfSteganography] set mode: encode');
            setMode('encode');
            setDecodedMessage('');
            if (fileInputRef) fileInputRef.value = '';
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'encode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'encode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Hide a secret message in a PDF file"
        >
          <span class="flex items-center gap-2">
            <EyeOff class="h-4 w-4" />
            Encode
          </span>
        </button>
        <button
          onClick={() => {
            logger.info('[PdfSteganography] set mode: decode');
            setMode('decode');
            setSecretMessage('');
            if (fileInputRef) fileInputRef.value = '';
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'decode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'decode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Reveal a hidden message from a PDF file"
        >
          <span class="flex items-center gap-2">
            <Eye class="h-4 w-4" />
            Decode
          </span>
        </button>
      </div>

      {/* PDF Upload with Drag & Drop */}
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">Upload PDF</label>
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
            accept="application/pdf"
            onChange={handlePdfUpload}
            class="hidden"
          />
          <div class={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ${
            isDragging() ? 'bg-blue-500 text-white scale-110' : 'bg-slate-100 text-slate-400'
          }`}>
            <FileText class="h-7 w-7" />
          </div>
          <div class="text-center">
            <p class="font-semibold text-slate-700">
              {isDragging() ? 'Drop PDF here' : 'Click to upload or drag and drop'}
            </p>
            <p class="mt-1 text-sm text-slate-500">PDF files only</p>
          </div>
        </div>
        {mode() === 'encode' && encodePdfName() && (
          <div class="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
            <File class="h-4 w-4 text-blue-600" />
            <span class="truncate text-sm font-medium text-blue-700">{encodePdfName()}</span>
          </div>
        )}
        {mode() === 'decode' && decodePdfName() && (
          <div class="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
            <File class="h-4 w-4 text-blue-600" />
            <span class="truncate text-sm font-medium text-blue-700">{decodePdfName()}</span>
          </div>
        )}
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Secret Message</label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.info('[PdfSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 resize-none hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              rows={4}
            />
            <p class="mt-2 text-xs text-slate-500">
              {secretMessage().length} characters
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick={downloadEncodedPdf}
              disabled={!secretMessage() || !encodePdfBytes() || isProcessing()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
              data-tooltip="Create a new PDF with your hidden message"
            >
              {isProcessing() ? (
                <>
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Download class="h-4 w-4" />
                  Download PDF with Hidden Message
                </>
              )}
            </button>
            <button
              onClick={() => setSecretMessage(SAMPLE_MESSAGE)}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
              data-tooltip="Load example text to try it out"
            >
              Use Sample
            </button>
          </div>
        </div>
      ) : (
        <div class="space-y-5">
          <button
            onClick={decodeMessage}
            disabled={!decodePdfBytes() || isProcessing()}
            class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 w-full flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
            data-tooltip="Extract the hidden message from the PDF"
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
            <div class={`rounded-xl border-2 p-5 transition-all duration-300 ${
              decodedMessage().includes('No hidden message') || decodedMessage().includes('Corrupted')
                ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg'
            }`} style={{ animation: 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <label class="mb-2 block text-sm font-semibold text-slate-700">
                {decodedMessage().includes('No hidden message') || decodedMessage().includes('Corrupted')
                  ? 'Result'
                  : 'Decoded Message'}
              </label>
              <div class={`whitespace-pre-wrap rounded-xl border-2 bg-white px-4 py-4 shadow-inner ${
                decodedMessage().includes('No hidden message') || decodedMessage().includes('Corrupted')
                  ? 'border-amber-200'
                  : 'border-emerald-200'
              }`}>
                {decodedMessage()}
              </div>
              {!decodedMessage().includes('No hidden message') && !decodedMessage().includes('Corrupted') && (
                <p class="mt-3 text-xs text-emerald-700">
                  ✓ Hidden message revealed successfully!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div class="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-bold text-slate-900">How it works</p>
            <p class="text-sm leading-relaxed text-slate-600">
              This method appends an encoded message to the end of the PDF file. 
              PDF readers ignore trailing data, but the message can be recovered by scanning for the hidden marker.
              The original PDF content remains unchanged and fully functional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfSteganography;
