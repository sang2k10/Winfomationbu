const API_BASE = 'https://api.jikan.moe/v4';

// Simple Cache implementation using SafeStorage
const Cache = {
    get: (key) => {
        const item = SafeStorage.getItem(`winfo_${key}`);
        if (!item) return null;
        try {
            const data = JSON.parse(item);
            if (Date.now() - data.timestamp > 30 * 60 * 1000) {
                SafeStorage.removeItem(`winfo_${key}`);
                return null;
            }
            return data.payload;
        } catch (e) { return null; }
    },
    set: (key, payload) => {
        try {
            SafeStorage.setItem(`winfo_${key}`, JSON.stringify({ timestamp: Date.now(), payload }));
        } catch (e) { console.warn("Could not cache data", e); }
    }
};

// Rate limiter / Queue
let lastRequestTime = 0;
let queuePromise = Promise.resolve();
const requestDelay = 350;

function fetchWithRetry(url, retries = 3) {
    const execute = async () => {
        let lastError = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const now = Date.now();
            const wait = requestDelay - (now - lastRequestTime);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));
            lastRequestTime = Date.now();
            try {
                const response = await fetch(url);
                if (response.status === 429) {
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                lastError = error;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        throw lastError || new Error('Fetch failed after retries');
    };
    const currentPromise = queuePromise.catch(() => {}).then(execute);
    queuePromise = currentPromise;
    return currentPromise;
}

// Helper: return { data, lastPage } from a list endpoint
const EXPLICIT_GENRES = [9, 12, 49]; // Ecchi, Hentai, Erotica
const EXPLICIT_RATINGS = ['Rx', 'R-18', 'Hentai', 'Erotica', 'Ecchi'];

function cleanAnimeData(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(anime => {
        if (!anime) return false;
        
        // Check rating
        if (anime.rating) {
            const r = anime.rating.toLowerCase();
            if (EXPLICIT_RATINGS.some(rate => r.includes(rate.toLowerCase()))) {
                return false;
            }
        }
        
        // Check genres
        if (anime.genres && Array.isArray(anime.genres)) {
            const hasExplicitGenre = anime.genres.some(g => 
                EXPLICIT_GENRES.includes(g.mal_id) || 
                EXPLICIT_RATINGS.some(rate => g.name.toLowerCase().includes(rate.toLowerCase()))
            );
            if (hasExplicitGenre) return false;
        }

        // Check explicit genres list (Jikan API v4 property)
        if (anime.explicit_genres && Array.isArray(anime.explicit_genres) && anime.explicit_genres.length > 0) {
            return false;
        }
        
        return true;
    });
}

function wrapList(raw) {
    const cleanData = cleanAnimeData(raw.data || []);
    return {
        data: cleanData,
        lastPage: raw.pagination?.last_visible_page || null
    };
}

const API = {
    async getTopAnime(filter = '', page = 1) {
        const cacheKey = `top_${filter}_${page}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/top/anime?filter=${filter}&page=${page}&limit=24&sfw=true`);
        const result = wrapList(raw);
        Cache.set(cacheKey, result);
        return result;
    },

    async getTrendingNow(page = 1) {
        const cacheKey = `trending_${page}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/seasons/now?page=${page}&limit=24&sfw=true`);
        const result = wrapList(raw);
        Cache.set(cacheKey, result);
        return result;
    },

    async getUpcoming(page = 1) {
        const cacheKey = `upcoming_${page}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/seasons/upcoming?page=${page}&limit=24&sfw=true`);
        const result = wrapList(raw);
        Cache.set(cacheKey, result);
        return result;
    },

    async getSeasonal(year, season, page = 1) {
        const cacheKey = `season_${year}_${season}_${page}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/seasons/${year}/${season}?page=${page}&limit=24&sfw=true`);
        const result = wrapList(raw);
        Cache.set(cacheKey, result);
        return result;
    },

    async searchAnime(query) {
        if (!query || query.length < 3) return [];
        const cacheKey = `search_${query}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`);
        const cleanData = cleanAnimeData(raw.data || []);
        Cache.set(cacheKey, cleanData);
        return cleanData;
    },

    async getAnimeDetails(id) {
        const cacheKey = `details_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/full`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    },

    async getAnimeCharacters(id) {
        const cacheKey = `characters_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/characters`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    },

    async getAnimeRecommendations(id) {
        const cacheKey = `recommendations_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/recommendations`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    },

    async getAnimePictures(id) {
        const cacheKey = `pictures_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/pictures`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    },

    async getAnimeVideos(id) {
        const cacheKey = `videos_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/videos`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    },

    async getAnimeReviews(id) {
        const cacheKey = `reviews_${id}`;
        const cached = Cache.get(cacheKey);
        if (cached) return cached;
        const raw = await fetchWithRetry(`${API_BASE}/anime/${id}/reviews`);
        Cache.set(cacheKey, raw.data);
        return raw.data;
    }
};
