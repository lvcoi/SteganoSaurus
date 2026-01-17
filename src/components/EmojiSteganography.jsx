import { createSignal, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Copy, Check } from 'lucide-solid';

const ZERO_WIDTH_CHARS = {
  '0': '\u200B',
  '1': '\u200C',
};
const MESSAGE_TERMINATOR = '###END###';

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
      const encoder = new TextEncoder();
      const bytes = encoder.encode(secretMessage() + MESSAGE_TERMINATOR);
      let binary = '';
      for (const b of bytes) binary += b.toString(2).padStart(8, '0');

      const encoded = binary
        .split('')
        .map(bit => {
          if (bit === '0') return ZERO_WIDTH_CHARS['0'];
          else return ZERO_WIDTH_CHARS['1'];
        })
        .join('');

      const result = coverEmoji() + encoded;
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

  return (
    <div class="space-y-6">
      <div class="flex gap-4 mb-6">
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: encode');
            setMode('encode');
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
            logger.info('[EmojiSteganography] set mode: decode');
            setMode('decode');
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

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
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
              onInput={(e) => {
                logger.debug('[EmojiSteganography] coverEmoji input len', e.currentTarget.value.length);
                setCoverEmoji(e.currentTarget.value);
              }}
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
              onInput={(e) => {
                logger.debug('[EmojiSteganography] output input len', e.currentTarget.value.length);
                setOutput(e.currentTarget.value);
              }}
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
