import { createSignal } from 'solid-js';
import { Copy, Check } from 'lucide-solid';

const ZERO_WIDTH_CHARS = {
  '0': '\u200B',
  '1': '\u200C',
  '2': '\u200D',
  '3': '\uFEFF',
};

function EmojiSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [coverEmoji, setCoverEmoji] = createSignal('🌟✨🎉🎊🎈');
  const [output, setOutput] = createSignal('');
  const [copied, setCopied] = createSignal(false);

  const encodeMessage = () => {
    if (!secretMessage() || !coverEmoji()) return;

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

    const result = coverEmoji() + encoded;
    setOutput(result);
  };

  const decodeMessage = () => {
    if (!output()) return;

    const zwChars = output()
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

    setSecretMessage(decoded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              Cover Emoji Text
            </label>
            <input
              type="text"
              value={coverEmoji()}
              onInput={(e) => setCoverEmoji(e.currentTarget.value)}
              placeholder="🌟✨🎉"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
            />
          </div>

          <button
            onClick={encodeMessage}
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Hide Message in Emoji
          </button>

          {output() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Encoded Output (Copy This!)
              </label>
              <div class="relative">
                <div class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-2xl break-all">
                  {output()}
                </div>
                <button
                  onClick={copyToClipboard}
                  class="absolute top-2 right-2 p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {copied() ? (
                    <Check class="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy class="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Encoded Emoji Text
            </label>
            <textarea
              value={output()}
              onInput={(e) => setOutput(e.currentTarget.value)}
              placeholder="Paste encoded emoji text here..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-2xl"
              rows={4}
            />
          </div>

          <button
            onClick={decodeMessage}
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reveal Hidden Message
          </button>

          {secretMessage() && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Decoded Message
              </label>
              <div class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-green-50 border-green-200">
                {secretMessage()}
              </div>
            </div>
          )}
        </div>
      )}

      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>How it works:</strong> This method hides your message using invisible zero-width characters between the emoji. The emoji look normal but contain hidden data.
        </p>
      </div>
    </div>
  );
}

export default EmojiSteganography;
