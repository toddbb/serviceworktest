self.addEventListener("activate", (event) => {
	console.log("Service Worker activated");
});

self.addEventListener("install", (event) => {
	console.log("Service Worker installed.");
	event.waitUntil(
		caches.open("test-cache-v2").then((cache) => {
			return cache.addAll(["assets/images/avatar-placeholder.jpg"]);
		})
	);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				// Cache hit - return response from cache
				console.log(`cache hit with request = ${event.request}`);
				return response;
			}

			// Check if the request is for a .js file; never cache .js files
			/* if (event.request.url.endsWith(".js")) {
				return fetch(event.request);
			}
 */
			// Cache miss - fetch from network
			return fetch(event.request)
				.then((response) => {
					// Check if valid response
					/// only include 'cors' for dev
					if (!response || response.status !== 200 || (response.type !== "basic" && response.type !== "cors")) {
						return response;
					}
					// Clone the response to store in cache
					const responseToCache = response.clone();
					caches.open("test-cache-v2").then((cache) => {
						cache.put(event.request, responseToCache);
					});
					return response;
				})
				.catch((error) => {
					console.error("Fetch error:", error);
					// You can handle fetch errors here
					throw error;
				});
		})
	);
});
