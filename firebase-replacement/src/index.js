export default {
	async fetch(request, env) {
	  // Rate limiting setup
	  const IP = request.headers.get('CF-Connecting-IP');
	  const cacheKey = `${IP}-requests`;
	  
	  // Get current request count from KV store if you have it enabled
	  // Or use other rate limiting methods provided by Cloudflare
	  
	  // Validate origin
	  const url = new URL(request.url);
	  const origin = url.searchParams.get("origin") || request.headers.get("Origin") || "*";
	  const allowedOrigins = [
		'https://www.radioentezar.net',
		'https://radioentezar.net',
		'https://radioentezar.github.io',
	  ];
	  
	  if (!allowedOrigins.includes(origin)) {
		return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
		  status: 403,
		  headers: { 'Content-Type': 'application/json' }
		});
	  }

	  // Validate request parameters
	  const address = url.searchParams.get("address");
	  const maps = url.searchParams.get("maps");
	  const autocomplete = url.searchParams.get("autocomplete");

	  // Add request validation
	  if (address && address.length > 100) {
		return new Response(JSON.stringify({ error: "Invalid address parameter" }), {
		  status: 400,
		  headers: { 'Content-Type': 'application/json' }
		});
	  }

	  const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
  
	  // Handle Maps API script request with additional security
	  if (maps === "true") {
		try {
		  const referer = request.headers.get('Referer');
		  if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
			return new Response(JSON.stringify({ error: "Invalid referer" }), {
			  status: 403,
			  headers: { 'Content-Type': 'application/json' }
			});
		  }

		  const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=places&loading=async&v=weekly`;
		  const mapsResponse = await fetch(mapsUrl, {
			headers: {
			  'Referer': origin,
			  'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
			  'Accept': '*/*',
			  'Accept-Language': 'en-US,en;q=0.9',
			  'Origin': origin
			}
		  });
		  
		  const scriptContent = await mapsResponse.text();
		  return new Response(scriptContent, {
			headers: {
			  'Content-Type': 'application/javascript',
			  'Access-Control-Allow-Origin': origin,
			  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			  'Access-Control-Allow-Headers': 'Content-Type, Origin, Referer',
			  'Access-Control-Allow-Credentials': 'true',
			  'Cache-Control': 'no-cache'
			}
		  });
		} catch (error) {
		  console.error('Maps API Error:', error);
		  return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		  });
		}
	  }
  
	  // Handle Places Autocomplete request
	  if (autocomplete === "true" && address) {
		try {
		  const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&types=(cities)&key=${GOOGLE_MAPS_API_KEY}`;
		  const placesRes = await fetch(placesUrl);
		  const placesData = await placesRes.json();
		  
		  return new Response(JSON.stringify({ predictions: placesData.predictions }), {
			headers: {
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin': origin,
			  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			  'Access-Control-Allow-Headers': 'Content-Type'
			}
		  });
		} catch (error) {
		  return new Response(JSON.stringify({ error: "Failed to fetch suggestions" }), {
			status: 500,
			headers: {
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin': origin
			}
		  });
		}
	  }
  
	  // Handle CORS preflight
	  if (request.method === "OPTIONS") {
		return new Response(null, {
		  headers: {
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Max-Age": "86400"
		  }
		});
	  }
  
	  // Handle geocoding request
	  if (!address) {
		return new Response(JSON.stringify({ error: "Missing address parameter" }), { 
		  status: 400,
		  headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": origin
		  }
		});
	  }
  
	  try {
		// Geocoding API call
		const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
		const geoRes = await fetch(geoUrl);
		const geoData = await geoRes.json();
  
		if (geoData.status !== "OK" || !geoData.results.length) {
		  return new Response(JSON.stringify({ error: "Address not found" }), { 
			status: 404,
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": origin
			}
		  });
		}
  
		// Timezone API call
		const location = geoData.results[0].geometry.location;
		const timestamp = Math.floor(Date.now() / 1000);
		const tzUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${location.lat},${location.lng}&timestamp=${timestamp}&key=${GOOGLE_MAPS_API_KEY}`;
		const tzRes = await fetch(tzUrl);
		const tzData = await tzRes.json();
  
		return new Response(JSON.stringify({ geocode: geoData.results[0], timezone: tzData }), {
		  headers: { 
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": origin
		  }
		});
  
	  } catch (error) {
		return new Response(JSON.stringify({ error: "Failed to fetch location data" }), { 
		  status: 500,
		  headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": origin
		  }
		});
	  }
	}
  };
  