const CACHE_NAME = 'business-agent-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/config/constants.ts',
  '/components/ChatView.tsx',
  '/components/CanvasView.tsx',
  '/components/CompetitiveScannerView.tsx',
  '/components/FinancialProjectionsView.tsx',
  '/components/ImageGeneratorView.tsx',
  '/components/MemoryManagementView.tsx',
  '/components/SettingsView.tsx',
  '/components/Sidebar.tsx',
  '/components/TemplateLibraryView.tsx',
  '/components/icons.tsx',
  '/functions/toolRegistry.ts',
  '/memory/memoryManager.ts',
  '/services/geminiService.ts',
  '/storage/cacheStore.ts',
  '/storage/canvasStore.ts',
  '/storage/chatHistoryStore.ts',
  '/storage/db.ts',
  '/storage/financialStore.ts',
  '/storage/memoryStore.ts',
  '/storage/settingsStore.ts',
  '/storage/storageService.ts',
  '/storage/vectorStore.ts',
  '/usecases/canvasUseCase.ts',
  '/usecases/chatUseCase.ts',
  '/usecases/competitiveAnalysisUseCase.ts',
  '/usecases/financialProjectionsUseCase.ts',
  '/usecases/imageGeneratorUseCase.ts',
  '/usecases/templateLibraryUseCase.ts',
  // CDNs
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/dexie@^4.0.0/dist/dexie.mjs',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@google/genai@^1.28.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Cache hit
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
