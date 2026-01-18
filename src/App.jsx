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
      {/* Header - Modern dark style */}
      <header class="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div class="flex h-16 items-center px-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 transition-transform hover:scale-105">
              <Lock class="h-5 w-5 text-white" />
            </div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight text-white">SteganoSaurus</h1>
              <span class="text-xl">🦕</span>
            </div>
          </div>
          <div class="ml-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
            <Lock class="h-4 w-4 text-blue-300" />
            <span class="text-blue-100">Client-side only</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div class="flex">
        {/* Sidebar Navigation - Modern dark style */}
        <aside class="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <nav class="flex flex-col gap-1 p-4">
            <div class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Steganography Tools
            </div>
            {tabs.map((tab) => {
              return (
                <button
                  onClick={() => {
                    logger.info('[App] switching tab to', tab.id);
                    setActiveTab(tab.id);
                  }}
                  class={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab() === tab.id
                      ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'border-white/10 text-gray-300 hover:border-blue-500/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Dynamic component={tab.icon} class="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Info Panel in Sidebar */}
          <div class="mx-4 mt-6 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div class="mb-2 flex items-center gap-2">
              <div class="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20">
                <span class="text-sm">💡</span>
              </div>
              <h3 class="text-sm font-semibold text-white">About</h3>
            </div>
            <p class="text-xs leading-relaxed text-blue-200">
              Hide messages in plain sight using secure client-side steganography. All processing happens in your browser.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main class="flex-1">
          <div class="mx-auto max-w-4xl px-8 py-8">
            {/* Page Header */}
            <div class="mb-8">
              <h2 class="mb-2 text-3xl font-bold tracking-tight text-white">
                {tabs.find(t => t.id === activeTab())?.label} Steganography
              </h2>
              <p class="text-blue-200">
                {activeTab() === 'emoji' && 'Hide messages using invisible zero-width characters between emoji'}
                {activeTab() === 'image' && 'Encode secret messages into images using LSB technique'}
                {activeTab() === 'pdf' && 'Conceal data within PDF documents'}
                {activeTab() === 'exif' && 'Hide information in image metadata'}
              </p>
            </div>

            {/* Error Display */}
            {errorVisible() && (
              <div class="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-500/50 bg-red-900/20 p-4 backdrop-blur-sm">
                <div class="text-sm text-red-200">{errorText()}</div>
                <button 
                  class="text-sm font-medium text-red-300 transition-colors hover:text-red-100" 
                  onClick={() => setErrorVisible(false)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Content with improved loading state */}
            <Suspense fallback={
              <div class="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
                <div class="flex items-center justify-center py-20">
                  <div class="text-center">
                    <div class="relative mb-4 inline-flex h-16 w-16 items-center justify-center">
                      <div class="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
                      <Lock class="h-6 w-6 text-blue-400" />
                    </div>
                    <div class="text-sm font-medium text-gray-700">Loading tools...</div>
                    <div class="mt-2 text-xs text-gray-500">Initializing secure environment</div>
                  </div>
                </div>
              </div>
            }>
              <div class="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
                {activeTab() === 'emoji' && <EmojiSteganography />}
                {activeTab() === 'image' && <ImageSteganography />}
                {activeTab() === 'pdf' && <PdfSteganography />}
                {activeTab() === 'exif' && <ExifSteganography />}
              </div>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
