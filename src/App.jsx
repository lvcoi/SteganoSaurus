import { createSignal, onMount, onCleanup, lazy, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Lock, Image, FileText, Tag, Smile } from 'lucide-solid';
import { logger } from './utils/logger.js';

const EmojiSteganography = lazy(() => import('./components/EmojiSteganography.jsx'));
const ImageSteganography = lazy(() => import('./components/ImageSteganography.jsx'));
const PdfSteganography = lazy(() => import('./components/PdfSteganography.jsx'));
const ExifSteganography = lazy(() => import('./components/ExifSteganography.jsx'));

function App() {
  const [activeTab, setActiveTab] = createSignal('emoji');
  const [errorVisible, setErrorVisible] = createSignal(false);
  const [errorText, setErrorText] = createSignal('');

  onMount(() => {
    logger.info('[App] mounted');
    const handler = (e) => {
      const msg = e?.detail?.message || 'An unexpected error occurred';
      setErrorText(msg);
      setErrorVisible(true);
    };
    window.addEventListener('steg:error', handler);
    onCleanup(() => {
      window.removeEventListener('steg:error', handler);
    });
  });

  const tabs = [
    { id: 'emoji', label: 'Emoji', icon: Smile },
    { id: 'image', label: 'Image', icon: Image },
    { id: 'pdf', label: 'PDF', icon: FileText },
    { id: 'exif', label: 'EXIF', icon: Tag },
  ];

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
          <div class="flex items-center justify-center mb-4">
            <Lock class="w-12 h-12 text-blue-600" />
          </div>
          <h1 class="text-5xl font-bold text-gray-900 mb-4">
            SteganoVault
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Hide messages in plain sight. Secure steganography for emoji, images, PDFs, and EXIF data.
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              {tabs.map((tab) => {
                return (
                  <button
                    onClick={() => {
                      logger.info('[App] switching tab to', tab.id);
                      setActiveTab(tab.id);
                    }}
                    class={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab() === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div class="flex items-center justify-center gap-2">
                      <Dynamic component={tab.icon} class="w-5 h-5" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div class="p-8">
            {errorVisible() && (
              <div class="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-800 p-4 flex items-start justify-between gap-4">
                <div class="text-sm">{errorText()}</div>
                <button class="text-sm underline" onClick={() => setErrorVisible(false)}>Dismiss</button>
              </div>
            )}
            <Suspense fallback={<div class="text-sm text-gray-500">Loading tools...</div>}>
              {activeTab() === 'emoji' && <EmojiSteganography />}
              {activeTab() === 'image' && <ImageSteganography />}
              {activeTab() === 'pdf' && <PdfSteganography />}
              {activeTab() === 'exif' && <ExifSteganography />}
            </Suspense>
          </div>
        </div>

        <div class="mt-12 text-center text-gray-500 text-sm">
          <p>All processing happens in your browser. Your data never leaves your device.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
