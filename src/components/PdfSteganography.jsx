import { createSignal } from 'solid-js';
import { Download, FileText } from 'lucide-solid';

const ZERO_WIDTH_CHARS = {
  '0': '\u200B',
  '1': '\u200C',
};

function PdfSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [coverText, setCoverText] = createSignal('This is a sample document that contains hidden information. You can edit this text to be anything you want.');
  const [decodedMessage, setDecodedMessage] = createSignal('');

  const encodeMessage = () => {
    if (!secretMessage() || !coverText()) return;

    const binary = secretMessage()
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    const encoded = binary
      .split('')
      .map(bit => {
        if (bit === '0') return ZERO_WIDTH_CHARS['0'];
        else return ZERO_WIDTH_CHARS['1'];
      })
      .join('');

    return coverText() + encoded + '###END###';
  };

  const decodeMessage = () => {
    if (!coverText()) return;

    const zwChars = coverText()
      .split('')
      .filter(char => Object.values(ZERO_WIDTH_CHARS).includes(char))
      .map(char => {
        if (char === ZERO_WIDTH_CHARS['0']) return '0';
        else return '1';
      })
      .join('');

    let decoded = '';
    for (let i = 0; i < zwChars.length; i += 8) {
      const byte = zwChars.slice(i, i + 8);
      if (byte.length === 8) {
        decoded += String.fromCharCode(parseInt(byte, 2));
      }
    }

    setDecodedMessage(decoded);
  };

  const downloadAsText = () => {
    const encodedText = encodeMessage();
    if (!encodedText) return;

    const blob = new Blob([encodedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stego-document.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = async () => {
    const encodedText = encodeMessage();
    if (!encodedText) return;

    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length ${encodedText.length + 100}
>>
stream
BT
/F1 12 Tf
50 700 Td
(${encodedText.replace(/\n/g, ') Tj T* (')}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + encodedText.length}
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stego-document.pdf';
    link.click();
    URL.revokeObjectURL(url);
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cover Text (Visible Content)
            </label>
            <textarea
              value={coverText()}
              onInput={(e) => setCoverText(e.currentTarget.value)}
              placeholder="Enter the visible text for your document..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>

          <div class="flex gap-4">
            <button
              onClick={downloadAsText}
              disabled={!secretMessage() || !coverText()}
              class="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download class="w-5 h-5" />
              Download as TXT
            </button>
            <button
              onClick={downloadAsPdf}
              disabled={!secretMessage() || !coverText()}
              class="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileText class="w-5 h-5" />
              Download as PDF
            </button>
          </div>
        </div>
      ) : (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Encoded Text (Paste from Document)
            </label>
            <textarea
              value={coverText()}
              onInput={(e) => setCoverText(e.currentTarget.value)}
              placeholder="Paste the text from your encoded document here..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>

          <button
            onClick={decodeMessage}
            disabled={!coverText()}
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
        </div>
      )}

      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>How it works:</strong> This method hides your message using invisible zero-width characters embedded in the document text. The document appears normal but contains hidden data.
        </p>
      </div>
    </div>
  );
}

export default PdfSteganography;
