export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      await setupPushNotifications(registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

async function setupPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

    // Send the subscription to your server
    await fetch('/api/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
}

export async function checkForAppUpdate() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available, show update prompt
          showUpdatePrompt();
        }
      });
    });
  }
}

export function showUpdatePrompt() {
  // You can implement your own UI for this
  const updatePrompt = document.createElement('div');
  updatePrompt.className = 'update-prompt';
  updatePrompt.innerHTML = `
    <div class="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <p class="mb-2">A new version is available!</p>
      <button onclick="window.location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded">
        Update Now
      </button>
    </div>
  `;
  document.body.appendChild(updatePrompt);
}

export async function checkConnectivity() {
  if (!navigator.onLine) {
    showOfflineNotification();
  }

  window.addEventListener('online', () => {
    hideOfflineNotification();
    syncOfflineData();
  });

  window.addEventListener('offline', () => {
    showOfflineNotification();
  });
}

export function showOfflineNotification() {
  const offlineNotification = document.createElement('div');
  offlineNotification.id = 'offline-notification';
  offlineNotification.className = 'fixed top-0 w-full bg-yellow-500 text-white p-2 text-center';
  offlineNotification.textContent = 'You are currently offline. Some features may be limited.';
  document.body.prepend(offlineNotification);
}

export function hideOfflineNotification() {
  const notification = document.getElementById('offline-notification');
  if (notification) {
    notification.remove();
  }
}

export async function syncOfflineData() {
  if ('serviceWorker' in navigator && navigator.onLine) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-offline-data');
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Install prompt handler
export function handleInstallPrompt() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  function showInstallPrompt() {
    const promptElement = document.createElement('div');
    promptElement.className = 'install-prompt';
    promptElement.innerHTML = `
      <div class="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-50">
        <p class="mb-2">Install AGS Platform for a better experience!</p>
        <div class="flex space-x-2">
          <button id="install-btn" class="bg-blue-500 text-white px-4 py-2 rounded">
            Install
          </button>
          <button id="dismiss-btn" class="bg-gray-300 px-4 py-2 rounded">
            Not Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(promptElement);

    document.getElementById('install-btn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
      promptElement.remove();
    });

    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
      promptElement.remove();
    });
  }
}
