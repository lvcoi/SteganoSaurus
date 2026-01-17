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
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header class="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Lock class="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                  SteganoSaurus <span class="text-2xl">🦕</span>
                </h1>
                <p class="text-sm text-blue-200">Secure steganography toolkit</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div class="text-center mb-8">
          <p class="text-lg text-blue-100 max-w-2xl mx-auto">
            Hide messages in plain sight with secure client-side encryption for emoji, images, PDFs, and EXIF data
          </p>
          <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <Lock class="w-4 h-4" />
            All processing is local to your browser.
          </div>
        </div>

        {/* Main Card */}
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Tabs Navigation */}
          <div class="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <nav class="flex">
              {tabs.map((tab) => {
                return (
                  <button
                    onClick={() => {
                      logger.info('[App] switching tab to', tab.id);
                      setActiveTab(tab.id);
                    }}
                    class={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 relative ${
                      activeTab() === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    <div class="flex items-center justify-center gap-2.5">
                      <Dynamic component={tab.icon} class="w-5 h-5" />
                      <span class="font-semibold">{tab.label}</span>
                    </div>
                    {activeTab() === tab.id && (
                      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div class="p-8 md:p-10 lg:p-12 bg-gradient-to-br from-white to-gray-50/30">
            {errorVisible() && (
              <div class="mb-6 rounded-xl border border-red-300 bg-gradient-to-br from-red-50 to-red-100/50 text-red-800 p-4 flex items-start justify-between gap-4 shadow-sm">
                <div class="text-sm font-medium">{errorText()}</div>
                <button 
                  class="text-sm font-semibold underline hover:no-underline transition-all" 
                  onClick={() => setErrorVisible(false)}
                >
                  Dismiss
                </button>
              </div>
            )}
            <Suspense fallback={
              <div class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <div class="text-sm text-gray-600 font-medium">Loading tools...</div>
                </div>
              </div>
            }>
              {activeTab() === 'emoji' && <EmojiSteganography />}
              {activeTab() === 'image' && <ImageSteganography />}
              {activeTab() === 'pdf' && <PdfSteganography />}
              {activeTab() === 'exif' && <ExifSteganography />}
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <div class="mt-8 text-center">
          <div class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Lock class="w-4 h-4 text-blue-300" />
            <p class="text-sm text-blue-100 font-medium">
              100% client-side processing • Your data never leaves your device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
