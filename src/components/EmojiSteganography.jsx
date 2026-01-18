import { createSignal, onMount } from 'solid-js';
import { logger } from '../utils/logger.js';
import { Copy, Check, Sparkles, Eye, EyeOff, Key } from 'lucide-solid';

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
  const [showKey, setShowKey] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);

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
      setIsProcessing(true);
      setTimeout(() => {
        const result = encodeEmojiMessage(secretMessage(), coverEmoji(), obfuscationKey());
        setOutput(result);
        setIsProcessing(false);
        logger.info('[EmojiSteganography] encodeMessage complete', { secretLen: secretMessage().length, outputLen: result.length });
      }, 300);
    } catch (err) {
      setIsProcessing(false);
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
      setIsProcessing(true);
      setTimeout(() => {
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
        setIsProcessing(false);
        logger.info('[EmojiSteganography] decodeMessage complete', { decodedLen: message.length });
      }, 300);
    } catch (err) {
      setIsProcessing(false);
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
      {/* Mode Toggle - Enhanced */}
      <div class="inline-flex gap-1 rounded-xl border-2 border-slate-200 bg-slate-100 p-1.5">
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: encode');
            setMode('encode');
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'encode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'encode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Hide a secret message in emoji"
        >
          <span class="flex items-center gap-2">
            <EyeOff class="h-4 w-4" />
            Encode
          </span>
        </button>
        <button
          onClick={() => {
            logger.info('[EmojiSteganography] set mode: decode');
            setMode('decode');
          }}
          class={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
            mode() === 'decode'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
          }`}
          style={mode() === 'decode' ? { 'box-shadow': '0 4px 12px rgba(59, 130, 246, 0.4)' } : {}}
          data-tooltip="Reveal a hidden message from emoji"
        >
          <span class="flex items-center gap-2">
            <Eye class="h-4 w-4" />
            Decode
          </span>
        </button>
      </div>

      {mode() === 'encode' ? (
        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
              Secret Message
            </label>
            <textarea
              value={secretMessage()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] secretMessage input len', e.currentTarget.value.length);
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

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
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
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-2xl text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
            <p class="mt-2 text-xs text-slate-500">
              This text will be visible—the secret is hidden within it
            </p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Key class="h-4 w-4 text-slate-400" />
              Obfuscation Key (optional)
            </label>
            <div class="relative">
              <input
                type={showKey() ? 'text' : 'password'}
                value={obfuscationKey()}
                onInput={(e) => {
                  logger.debug('[EmojiSteganography] obfuscationKey input len', e.currentTarget.value.length);
                  setObfuscationKey(e.currentTarget.value);
                }}
                placeholder="Add a key to scramble the hidden bits"
                class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey())}
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 transition-colors hover:text-slate-600"
                data-tooltip={showKey() ? 'Hide key' : 'Show key'}
              >
                {showKey() ? <EyeOff class="h-4 w-4" /> : <Eye class="h-4 w-4" />}
              </button>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Use the same key when decoding to restore the message
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick={encodeMessage}
              disabled={!secretMessage() || !coverEmoji() || isProcessing()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
              data-tooltip="Embed your secret message into the emoji"
            >
              {isProcessing() ? (
                <>
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles class="h-4 w-4" />
                  Hide Message in Emoji
                </>
              )}
            </button>
            <button
              onClick={useSampleEncode}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
              data-tooltip="Load example data to try it out"
            >
              Use Sample
            </button>
          </div>

          {output() && (
            <div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-lg transition-all duration-300" style={{ animation: 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <label class="mb-2 block text-sm font-semibold text-slate-700">
                Encoded Output
              </label>
              <div class="relative">
                <div class="break-all rounded-xl border-2 border-emerald-200 bg-white px-4 py-4 text-2xl shadow-inner">
                  {output()}
                </div>
                <button
                  onClick={copyToClipboard}
                  class="absolute right-3 top-3 rounded-lg border-2 border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-110 active:scale-95"
                  data-tooltip={copied() ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied() ? (
                    <Check class="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy class="h-4 w-4 text-slate-600" />
                  )}
                </button>
              </div>
              <p class="mt-3 text-xs text-emerald-700">
                ✓ Message hidden successfully! Copy and share this emoji text.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">
              Encoded Emoji Text
            </label>
            <textarea
              value={output()}
              onInput={(e) => {
                logger.debug('[EmojiSteganography] output input len', e.currentTarget.value.length);
                setOutput(e.currentTarget.value);
              }}
              placeholder="Paste encoded emoji text here..."
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-2xl text-slate-900 shadow-sm transition-all duration-300 resize-none hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              rows={4}
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Key class="h-4 w-4 text-slate-400" />
              Obfuscation Key (optional)
            </label>
            <div class="relative">
              <input
                type={showKey() ? 'text' : 'password'}
                value={obfuscationKey()}
                onInput={(e) => {
                  logger.debug('[EmojiSteganography] obfuscationKey decode input len', e.currentTarget.value.length);
                  setObfuscationKey(e.currentTarget.value);
                }}
                placeholder="Enter the key used during encoding"
                class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey())}
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 transition-colors hover:text-slate-600"
                data-tooltip={showKey() ? 'Hide key' : 'Show key'}
              >
                {showKey() ? <EyeOff class="h-4 w-4" /> : <Eye class="h-4 w-4" />}
              </button>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Without the matching key, the decoded text will look scrambled
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick={decodeMessage}
              disabled={!output() || isProcessing()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 flex-1 flex items-center justify-center gap-2 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' }}
              data-tooltip="Extract the hidden message from the emoji"
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
            <button
              onClick={useSampleDecode}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
              data-tooltip="Load example encoded emoji to try decoding"
            >
              Load Sample
            </button>
          </div>

          {secretMessage() && (
            <div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-lg transition-all duration-300" style={{ animation: 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <label class="mb-2 block text-sm font-semibold text-slate-700">
                Decoded Message
              </label>
              <div class="rounded-xl border-2 border-emerald-200 bg-white px-4 py-4 shadow-inner">
                {secretMessage()}
              </div>
              <p class="mt-3 text-xs text-emerald-700">
                ✓ Hidden message revealed successfully!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box - Enhanced */}
      <div class="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-bold text-slate-900">How it works</p>
            <p class="text-sm leading-relaxed text-slate-600">
              This method hides your message using invisible zero-width characters between the emoji. 
              Add an optional key to obfuscate the hidden bit pattern so it is harder to detect or guess.
              The recipient needs to use the same key to decode the message correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmojiSteganography;
