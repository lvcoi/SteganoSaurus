import { createSignal, onMount, onCleanup, lazy, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Lock, Image, FileText, Tag, Smile, Shield, X } from 'lucide-solid';
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
    { id: 'emoji', label: 'Emoji', icon: Smile, tooltip: 'Hide text in emoji using zero-width characters' },
    { id: 'image', label: 'Image', icon: Image, tooltip: 'Encode messages in image pixels (LSB)' },
    { id: 'pdf', label: 'PDF', icon: FileText, tooltip: 'Embed hidden data in PDF files' },
    { id: 'exif', label: 'EXIF', icon: Tag, tooltip: 'Manipulate image metadata' },
  ];

  const descriptions = {
    emoji: 'Hide messages using invisible zero-width characters between emoji',
    image: 'Encode secret messages into images using LSB technique',
    pdf: 'Conceal data within PDF documents',
    exif: 'Hide information in image metadata',
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header - Modern dark style with enhanced interactions */}
      <header class="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div class="flex h-16 items-center px-6">
          <div class="flex items-center gap-3 group cursor-pointer">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-blue-500/60 group-hover:rotate-3">
              <Lock class="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-blue-200">SteganoSaurus</h1>
              <span class="text-xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12">🦕</span>
            </div>
          </div>
          <div 
            class="ml-auto flex items-center gap-2 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/50 hover:bg-emerald-500/20 cursor-default"
            data-tooltip="All processing happens locally in your browser"
          >
            <Shield class="h-4 w-4 text-emerald-400" />
            <span class="font-medium text-emerald-300">Client-side only</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div class="flex">
        {/* Sidebar Navigation - Enhanced with better hover states */}
        <aside class="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <nav class="flex flex-col gap-2 p-4">
            <div class="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-blue-400">
              Steganography Tools
            </div>
            {tabs.map((tab) => {
              const isActive = () => activeTab() === tab.id;
              return (
                <button
                  onClick={() => {
                    logger.info('[App] switching tab to', tab.id);
                    setActiveTab(tab.id);
                  }}
                  data-tooltip={tab.tooltip}
                  class={`group flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive() 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                      : 'border-transparent text-slate-300 hover:border-blue-400/50 hover:bg-white/5 hover:text-white'
                  }`}
                  style={isActive() ? { 'box-shadow': '0 4px 14px rgba(59, 130, 246, 0.4)' } : {}}
                  aria-current={isActive() ? 'page' : undefined}
                >
                  <Dynamic 
                    component={tab.icon} 
                    class={`h-5 w-5 transition-all duration-300 ${isActive() ? '' : 'group-hover:scale-110 group-hover:text-blue-400'}`} 
                  />
                  <span class="flex-1 text-left">{tab.label}</span>
                  {isActive() && (
                    <div class="h-2 w-2 rounded-full bg-white shadow-sm shadow-white/50" />
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Info Panel in Sidebar - Enhanced */}
          <div class="mx-4 mt-6 rounded-xl border-2 border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                <span class="text-sm">💡</span>
              </div>
              <h3 class="text-sm font-bold text-white">About</h3>
            </div>
            <p class="text-xs leading-relaxed text-blue-200/80">
              Hide messages in plain sight using secure client-side steganography. All processing happens in your browser—nothing is sent to any server.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main class="flex-1">
          <div class="mx-auto max-w-4xl px-8 py-8">
            {/* Page Header - Enhanced with better typography */}
            <div class="mb-8">
              <h2 class="mb-3 text-3xl font-extrabold tracking-tight text-white">
                {tabs.find(t => t.id === activeTab())?.label} Steganography
              </h2>
              <p class="text-lg text-blue-200/90">
                {descriptions[activeTab()]}
              </p>
            </div>

            {/* Error Display - Enhanced */}
            {errorVisible() && (
              <div class="mb-6 flex items-start justify-between gap-4 rounded-xl border-2 border-red-500/50 bg-red-900/20 p-4 backdrop-blur-sm animate-[scale-in_0.3s_ease-out]">
                <div class="flex items-start gap-3">
                  <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <span class="text-sm">⚠️</span>
                  </div>
                  <div class="text-sm font-medium text-red-200">{errorText()}</div>
                </div>
                <button 
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-300 transition-all duration-200 hover:bg-red-500/40 hover:text-white hover:scale-110" 
                  onClick={() => setErrorVisible(false)}
                  aria-label="Dismiss error"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content with improved loading state */}
            <Suspense fallback={
              <div class="rounded-2xl border-2 border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
                <div class="flex items-center justify-center py-20">
                  <div class="text-center">
                    <div class="relative mb-4 inline-flex h-16 w-16 items-center justify-center">
                      <div class="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
                      <Lock class="h-6 w-6 text-blue-500" />
                    </div>
                    <div class="text-sm font-semibold text-slate-700">Loading tools...</div>
                    <div class="mt-2 text-xs text-slate-500">Initializing secure environment</div>
                  </div>
                </div>
              </div>
            }>
              <div class="rounded-2xl border-2 border-slate-200 bg-white p-8 text-slate-900 shadow-2xl transition-all duration-300 hover:shadow-3xl">
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
