//////////////////////////////////////////
//  GLOBAL SCOPE
//

// intial files to cache during service working installation
const $INIT_CACHE_FILES = [];
const $CACHE_BLACKLIST = ["/manifest.json", "index.html"];

// other service worker config
const $SERVICE_CONFIG = {
	//cacheVersion: "v1",
	cacheVersion: Date.now(), // version based on date the worker is installed;
	cacheName: "lms-cache",
	cacheFullName: null,
	devMode: true,
};

$SERVICE_CONFIG.cacheFullName = $SERVICE_CONFIG.cacheName + "-" + $SERVICE_CONFIG.cacheVersion;

//////////////////////////////////////////
// EVENT: Service Worker Installed
//
// Initially add assets when worker is first installed
//
self.addEventListener("install", (event) => {
	console.log("Service Worker installed.");
	event.waitUntil(
		caches.open($SERVICE_CONFIG.cacheFullName).then((cache) => {
			return cache.addAll($INIT_CACHE_FILES); //initially add to cache
		})
	);
});

//////////////////////////////////////////
// EVENT: Service Worker Activated
//
// Check versioning and update cache
//
self.addEventListener("activate", (event) => {
	console.log("Service Worker activated.");
	console.log(`Current cache version: ${$SERVICE_CONFIG.cacheFullName}`);
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					// Check if the cache name is not the current cache version
					if (cacheName !== $SERVICE_CONFIG.cacheFullName) {
						// Delete the cache
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

//////////////////////////////////////////
// EVENT: Service Worker Fetch
//
// Intercept all fetch apis and get from cache.
// If it doesnt exist in cache, proceed with fetch API and then clone asset into cache, if not blacklisted
//
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			// Cache hit - return response from cache
			if (response) {
				console.log(`cache hit with request url: ${event.request.url}`);
				return response;
			}

			// Check if "blacklist" item; if so, fetch from network
			const isBlacklist = $CACHE_BLACKLIST.find((val) => event.request.url.indexOf(val) > -1);
			if (isBlacklist) {
				console.log(`*** Blacklisted item: ${event.request.url} ***`);
				return fetch(event.request);
			}

			// Cache miss - fetch from network and then clone
			return fetch(event.request)
				.then((response) => {
					// only include 'cors' for dev
					const checkCors = $SERVICE_CONFIG.devMode ? response.type !== "cors" : true;

					// Check if valid response
					if (!response || response.status !== 200 || (response.type !== "basic" && checkCors)) {
						return response;
					}

					// Clone the response to store in cache
					const responseToCache = response.clone();
					caches.open($SERVICE_CONFIG.cacheFullName).then((cache) => {
						cache.put(event.request, responseToCache);
					});
					return response;
				})
				.catch((error) => {
					console.error("Fetch error:", error);
					// ** TO DO: add error handling here
					throw error;
				});
		})
	);
});
