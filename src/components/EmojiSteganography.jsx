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

const hashKeyToSeed = (key) => {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const obfuscateBinary = (binary, key) => {
  if (!key) return binary;
  let seed = hashKeyToSeed(key);
  let result = '';
  for (let i = 0; i < binary.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const maskBit = seed & 1 ? '1' : '0';
    result += binary[i] === maskBit ? '0' : '1';
  }
  return result;
};

const encodeEmojiMessage = (message, cover, obfuscationKey) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message + MESSAGE_TERMINATOR);
  let binary = '';
  for (const b of bytes) binary += b.toString(2).padStart(8, '0');
  binary = obfuscateBinary(binary, obfuscationKey);

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
  const [obfuscationKey, setObfuscationKey] = createSignal('');

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
      const result = encodeEmojiMessage(secretMessage(), coverEmoji(), obfuscationKey());
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

      const deobfuscatedBinary = obfuscateBinary(zwChars, obfuscationKey());
      const byteCount = Math.floor(deobfuscatedBinary.length / 8);
      const bytes = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        const byteStr = deobfuscatedBinary.slice(i * 8, i * 8 + 8);
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
    setObfuscationKey('');
    const result = encodeEmojiMessage(SAMPLE_MESSAGE, SAMPLE_COVER, '');
    setOutput(result);
  };

  const useSampleDecode = () => {
    setObfuscationKey('');
    const result = encodeEmojiMessage(SAMPLE_MESSAGE, SAMPLE_COVER, '');
    setOutput(result);
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="inline-flex gap-1 rounded-lg border border-blue-500/30 bg-blue-950/30 p-1 backdrop-blur-sm">
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: encode');
            setMode('encode');
          }}
          class={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
            mode() === 'encode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-blue-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: decode');
            setMode('decode');
          }}
          class={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
            mode() === 'decode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-blue-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          Decode
        </button>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] secretMessage input len', e.currentTarget.value.length);
                setSecretMessage(e.currentTarget.value);
              }}
              placeholder="Enter your secret message..."
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
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
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-2xl shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Obfuscation Key (optional)
            </label>
            <input
              type="text"
              value={obfuscationKey()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] obfuscationKey input len', e.currentTarget.value.length);
                setObfuscationKey(e.currentTarget.value);
              }}
              placeholder="Add a key to scramble the hidden bits"
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p class="mt-2 text-xs text-gray-500">
              Use the same key when decoding to restore the message.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick={encodeMessage}
              class="group flex-1 rounded-lg border border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60"
            >
              Hide Message in Emoji
            </button>
            <button
              onClick={useSampleEncode}
              class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-blue-50"
            >
              Use Sample
            </button>
          </div>

          {output() && (
            <div class="rounded-lg border border-green-200 bg-green-50 p-5">
              <label class="mb-3 block text-sm font-medium text-gray-900">
                Encoded Output
              </label>
              <div class="relative">
                <div class="break-all rounded-lg border border-green-300 bg-white px-4 py-4 text-2xl">
                  {output()}
                </div>
                <button
                  onClick={copyToClipboard}
                  class="absolute right-3 top-3 rounded-md border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
                >
                  {copied() ? (
                    <Check class="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy class="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Encoded Emoji Text
            </label>
            <textarea
              value={output()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] output input len', e.currentTarget.value.length);
                setOutput(e.currentTarget.value);
              }}
              placeholder="Paste encoded emoji text here..."
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-2xl shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-900">
              Obfuscation Key (optional)
            </label>
            <input
              type="text"
              value={obfuscationKey()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] obfuscationKey decode input len', e.currentTarget.value.length);
                setObfuscationKey(e.currentTarget.value);
              }}
              placeholder="Enter the key used during encoding"
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p class="mt-2 text-xs text-gray-500">
              Without the matching key, the decoded text will look scrambled.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick={decodeMessage}
              class="flex-1 rounded-lg border border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60"
            >
              Reveal Hidden Message
            </button>
            <button
              onClick={useSampleDecode}
              class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-blue-50"
            >
              Load Sample
            </button>
          </div>

          {secretMessage() && (
            <div class="rounded-lg border border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg">
              <label class="mb-3 block text-sm font-medium text-gray-900">
                Decoded Message
              </label>
              <div class="rounded-lg border border-green-300 bg-white px-4 py-4 shadow-sm">
                {secretMessage()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div class="rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-blue-500/20">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-medium text-gray-900">How it works</p>
            <p class="text-sm leading-relaxed text-gray-600">
              This method hides your message using invisible zero-width characters between the emoji. Add an optional key to obfuscate the hidden bit pattern so it is harder to detect or guess.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmojiSteganography;
