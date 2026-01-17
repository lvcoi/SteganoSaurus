import { createSignal, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Copy, Check } from 'lucide-solid';

const ZERO_WIDTH_CHARS = {
  '0': '\u200B',
  '1': '\u200C',
};
const MESSAGE_TERMINATOR = '###END###';
const SAMPLE_MESSAGE = 'Meet at dawn. Bring the map.';
const SAMPLE_COVER = '🌟✨🎉🎊';

const encodeEmojiMessage = (message, cover) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message + MESSAGE_TERMINATOR);
  let binary = '';
  for (const b of bytes) binary += b.toString(2).padStart(8, '0');

  const encoded = binary
    .split('')
    .map(bit => (bit === '0' ? ZERO_WIDTH_CHARS['0'] : ZERO_WIDTH_CHARS['1']))
    .join('');

  return cover + encoded;
};

function EmojiSteganography() {
  const [mode, setMode] = createSignal('encode');
  const [secretMessage, setSecretMessage] = createSignal('');
  const [coverEmoji, setCoverEmoji] = createSignal('🌟✨🎉🎊');
  const [output, setOutput] = createSignal('');
  const [copied, setCopied] = createSignal(false);

  onMount(() => {
    logger.info('[EmojiSteganography] mounted');
  });

  const encodeMessage = () => {
    logger.info('[EmojiSteganography] encodeMessage invoked');
    try {
      if (!secretMessage() || !coverEmoji()) {
        logger.warn('[EmojiSteganography] encodeMessage aborted: missing secretMessage or coverEmoji');
        return;
      }
      const result = encodeEmojiMessage(secretMessage(), coverEmoji());
      setOutput(result);
      logger.info('[EmojiSteganography] encodeMessage complete', { secretLen: secretMessage().length, outputLen: result.length });
    } catch (err) {
      logger.error('[EmojiSteganography] encodeMessage error', err);
      logger.userError('Failed to encode message into emoji.', { err });
    }
  };

  const decodeMessage = () => {
    logger.info('[EmojiSteganography] decodeMessage invoked');
    try {
      if (!output()) {
        logger.warn('[EmojiSteganography] decodeMessage aborted: no output present');
        return;
      }

      const zwChars = output()
        .split('')
        .filter(char => char === ZERO_WIDTH_CHARS['0'] || char === ZERO_WIDTH_CHARS['1'])
        .map(char => {
          if (char === ZERO_WIDTH_CHARS['0']) return '0';
          else return '1';
        })
        .join('');

      const byteCount = Math.floor(zwChars.length / 8);
      const bytes = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        const byteStr = zwChars.slice(i * 8, i * 8 + 8);
        bytes[i] = parseInt(byteStr, 2);
      }
      const decoder = new TextDecoder();
      const decoded = decoder.decode(bytes);
      const terminatorIndex = decoded.indexOf(MESSAGE_TERMINATOR);
      const message = terminatorIndex === -1 ? decoded : decoded.slice(0, terminatorIndex);

      setSecretMessage(message);
      logger.info('[EmojiSteganography] decodeMessage complete', { decodedLen: message.length });
    } catch (err) {
      logger.error('[EmojiSteganography] decodeMessage error', err);
      logger.userError('Failed to decode message from emoji.', { err });
    }
  };

  const copyToClipboard = () => {
    logger.info('[EmojiSteganography] copyToClipboard clicked');
    try {
      navigator.clipboard.writeText(output())
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          logger.info('[EmojiSteganography] copied to clipboard');
        })
        .catch((err) => {
          logger.error('[EmojiSteganography] clipboard write failed', err);
          logger.userError('Clipboard write failed. Please copy manually.', { err });
        });
    } catch (err) {
      logger.error('[EmojiSteganography] unexpected clipboard error', err);
      logger.userError('Unexpected clipboard error.', { err });
    }
  };

  const useSampleEncode = () => {
    setSecretMessage(SAMPLE_MESSAGE);
    setCoverEmoji(SAMPLE_COVER);
    const result = encodeEmojiMessage(SAMPLE_MESSAGE, SAMPLE_COVER);
    setOutput(result);
  };

  const useSampleDecode = () => {
    const result = encodeEmojiMessage(SAMPLE_MESSAGE, SAMPLE_COVER);
    setOutput(result);
  };

  return (
    <div class="space-y-7">
      {/* Mode Toggle */}
      <div class="flex gap-3 p-1.5 bg-gray-100 rounded-xl">
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: encode');
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
            logger.info('[EmojiSteganography] set mode: decode');
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

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-800 mb-3">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white hover:border-gray-300"
              rows={4}
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-800 mb-3">
              Cover Emoji Text
            </label>
            <input
              type="text"
              value={coverEmoji()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] coverEmoji input len', e.currentTarget.value.length);
                setCoverEmoji(e.currentTarget.value);
              }}
              placeholder="🌟✨🎉"
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-2xl transition-all duration-200 bg-white hover:border-gray-300"
            />
          </div>

          <button
            onClick={encodeMessage}
            class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            Hide Message in Emoji
          </button>
          <button
            onClick={useSampleEncode}
            class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Use sample message
          </button>

          {output() && (
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
              <label class="block text-sm font-semibold text-gray-800 mb-3">
                Encoded Output (Copy This!)
              </label>
              <div class="relative">
                <div class="w-full px-4 py-4 bg-white border-2 border-green-300 rounded-xl text-2xl break-all shadow-sm">
                  {output()}
                </div>
                <button
                  onClick={copyToClipboard}
                  class="absolute top-3 right-3 p-2.5 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 shadow-md"
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
            <label class="block text-sm font-semibold text-gray-800 mb-3">
              Encoded Emoji Text
            </label>
            <textarea
              value={output()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] output input len', e.currentTarget.value.length);
                setOutput(e.currentTarget.value);
              }}
              placeholder="Paste encoded emoji text here..."
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-2xl transition-all duration-200 bg-white hover:border-gray-300"
              rows={4}
            />
          </div>

          <button
            onClick={useSampleDecode}
            class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Load sample encoded text
          </button>

          <button
            onClick={decodeMessage}
            class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            Reveal Hidden Message
          </button>

          {secretMessage() && (
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
              <label class="block text-sm font-semibold text-gray-800 mb-3">
                Decoded Message
              </label>
              <div class="px-4 py-4 bg-white border-2 border-green-300 rounded-xl shadow-sm">
                {secretMessage()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 p-5">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16" />
        <div class="relative flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mt-0.5">
            <span class="text-white text-lg">💡</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-blue-900 mb-1">How it works</p>
            <p class="text-sm text-blue-800 leading-relaxed">
              This method hides your message using invisible zero-width characters between the emoji. The emoji look normal but contain hidden data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmojiSteganography;
