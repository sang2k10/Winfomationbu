function getScoreGraphic(score) {
    if (!score) return '';
    const rating = Math.max(1, Math.min(5, Math.round(score / 2)));
    return `<img class="score-level-graphic" src="img/${rating}.png" alt="Score Level ${rating}" title="Rating: ${score}/10">`;
}

// Helper to get nested translation status
function getStatus(statusEn) {
    if (statusEn === 'Currently Airing') return getTranslation('status_airing');
    if (statusEn === 'Finished Airing') return getTranslation('status_finished');
    if (statusEn === 'Not yet aired') return getTranslation('status_upcoming');
    return statusEn || '?';
}

// Detect if a title is romanji (not full Japanese script)
function getRomanji(anime) {
    if (anime.title_english && anime.title) {
        const isJapanese = /[\u3000-\u9fff\uff00-\uffef]/.test(anime.title);
        if (!isJapanese) return anime.title;
    }
    return null;
}

const Components = {
    createSkeletonLoader(count = 1) {
        let html = '';
        for (let i = 0; i < count; i++) html += `<div class="skeleton"></div>`;
        return html;
    },

    createAnimeCard(anime) {
        const title = anime.title_english || anime.title;
        const imgUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
        const score = anime.score ? anime.score.toFixed(1) : '?';
        const year = anime.year || '?';
        return `
            <div class="anime-card" data-id="${anime.mal_id}">
                <div class="score-badge"><i class="fa-solid fa-star" style="color:#FFD700;"></i> ${score}</div>
                <div class="card-img-container">
                    <img src="${imgUrl}" alt="${title}" loading="lazy">
                    <div class="card-overlay">
                        <p style="font-weight:700;margin-bottom:5px;">${getStatus(anime.status)}</p>
                        <p style="font-size:0.9rem;">${anime.genres?.map(g => g.name).slice(0, 3).join(', ') || ''}</p>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-title" title="${title}">${title}</div>
                    <div class="card-title-vi" data-english-title="${title}" data-original-title="${anime.title}" title=""></div>
                    <div class="card-meta">
                        <span>${anime.type || 'TV'}</span>
                        <span>${year}</span>
                    </div>
                </div>
            </div>`;
    },

    createHeroBanner(animeList) {
        if (!animeList || animeList.length === 0) return '';
        // Extract top 5 items for the home rotating hero slider
        const featured = animeList.slice(0, 5);

        const slidesHtml = featured.map((anime, idx) => {
            const title = anime.title_english || anime.title;
            const posterUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
            const synopsis = anime.synopsis ? anime.synopsis.split('.')[0] + '.' : '';
            const trailerId =
                anime.trailer?.youtube_id ||
                anime.trailer?.embed_url?.match(/embed\/([^?]+)/)?.[1] ||
                null;
            const activeClass = idx === 0 ? 'active' : '';
            const bannerBgUrl = trailerId
                ? `https://img.youtube.com/vi/${trailerId}/maxresdefault.jpg`
                : posterUrl;

            // We use data-video-src to load the YouTube player only when the slide is active, saving performance and RAM
            const videoWrap = trailerId
              ? `
                <div class="hero-slide-video-wrap" id="homeVideoWrap_${idx}">
                    <iframe
                        class="hero-slide-video-iframe"
                        id="homeVideoIframe_${idx}"
                        data-src="https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=1&playlist=${trailerId}&enablejsapi=1&origin=${location.origin}"
                        allow="autoplay; encrypted-media"
                        allowfullscreen
                    ></iframe>
                </div>
                <button class="hero-mute-btn" data-index="${idx}" title="Bật/tắt âm"><i class="fa-solid fa-volume-xmark"></i></button>
            `
              : "";

            return `
                <div class="hero-slide ${activeClass}" data-index="${idx}" data-id="${anime.mal_id}">
                    <div class="hero-banner-bg" style="background-image: url('${bannerBgUrl}')"></div>
                    ${videoWrap}
                    <div class="hero-overlay"></div>
                    <div class="hero-container container">
                        <img class="hero-poster" src="${posterUrl}" alt="${title}">
                        <div class="hero-content">
                            <h2 class="hero-title">${title}</h2>
                            <h3 class="hero-title-vi" data-english-title="${title}" data-original-title="${anime.title}"></h3>
                            <p class="hero-synopsis" data-english-synopsis="${anime.synopsis || ''}">${synopsis}</p>
                            <button class="primary-btn" onclick="app.openDetailModal(${anime.mal_id})" data-i18n="btn_details">
                                <i class="fa-solid fa-circle-info"></i> ${getTranslation('btn_details')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const dotsHtml = featured.map((_, idx) => {
            return `<span class="hero-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`;
        }).join('');

        return `
            <div class="hero-slider-wrap">
                ${slidesHtml}
                <div class="hero-dots-container">
                    ${dotsHtml}
                </div>
            </div>`;
    },

    createRankRow(anime, rank) {
        const title = anime.title_english || anime.title;
        const imgUrl = anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url;
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';
        const members = anime.members ? anime.members.toLocaleString() : '0';
        const reviewers = anime.scored_by ? anime.scored_by.toLocaleString() : 'N/A';
        const episodes = anime.episodes || '?';
        const type = anime.type || 'TV';
        const genres = anime.genres?.slice(0, 3).map(g => `<span class="tag">${g.name}</span>`).join('') || '';

        let rankBadgeClass = '';
        if (rank === 1) rankBadgeClass = 'rank-gold';
        else if (rank === 2) rankBadgeClass = 'rank-silver';
        else if (rank === 3) rankBadgeClass = 'rank-bronze';

        const graphicHtml = score !== 'N/A' ? getScoreGraphic(anime.score) : '';

        return `
            <div class="rank-list-item" data-id="${anime.mal_id}">
                <div class="rank-badge ${rankBadgeClass}">#${rank}</div>
                <img src="${imgUrl}" class="rank-poster" alt="${title}" loading="lazy">
                <div class="rank-details">
                    <div class="rank-main-info">
                        <div class="rank-title" title="${title}">${title}</div>
                        <div class="card-title-vi" data-english-title="${title}" data-original-title="${anime.title}" title=""></div>
                        <div class="rank-meta-row">
                            <span><strong>${type}</strong> (${episodes} eps)</span>
                            <span>•</span>
                            <span class="rank-genres">${genres}</span>
                        </div>
                    </div>
                    <div class="rank-stats">
                        <div class="rank-score-wrap">
                            <span class="rank-score-val"><i class="fa-solid fa-star" style="color:#FFD700;"></i> ${score}</span>
                            ${graphicHtml}
                        </div>
                        <div class="rank-counts">
                            <span><i class="fa-solid fa-user-pen"></i> ${reviewers} <span data-i18n="scored_by_label">${getTranslation('scored_by_label')}</span></span>
                            <span>•</span>
                            <span><i class="fa-solid fa-heart" style="color:var(--accent-color);"></i> ${members} <span data-i18n="nav_seasonal">Theo dõi</span></span>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    createUpcomingAnimeCard(anime) {
        const title = anime.title_english || anime.title;
        const imgUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
        const airDate = anime.aired?.string ? formatAiredDate(anime.aired.string) : '?';
        return `
            <div class="anime-card upcoming-card" data-id="${anime.mal_id}">
                <div class="card-img-container">
                    <img src="${imgUrl}" alt="${title}" loading="lazy">
                </div>
                <div class="card-info">
                    <div class="card-title" title="${title}">${title}</div>
                    <div class="card-title-vi" data-english-title="${title}" data-original-title="${anime.title}" title=""></div>
                    <div class="upcoming-date">
                        <i class="fa-regular fa-calendar-days"></i> <span data-i18n="upcoming_air_date">${getTranslation('upcoming_air_date')}</span> <strong>${airDate}</strong>
                    </div>
                    <div class="card-meta" style="margin-top: 8px;">
                        <span>${anime.type || 'TV'}</span>
                        <span>${anime.genres?.map(g => g.name).slice(0, 2).join(', ') || ''}</span>
                    </div>
                </div>
            </div>`;
    },

    // Netflix-style detail hero: auto-playing muted video in banner
    createDetailHero(anime) {
        const title = anime.title_english || anime.title;
        const imgUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
        const trailerId =
            anime.trailer?.youtube_id ||
            anime.trailer?.embed_url?.match(/embed\/([^?]+)/)?.[1] ||
            null;
        const genresHtml = anime.genres?.slice(0, 3).map(g => `<span class="tag" style="font-size:0.75rem;padding:3px 10px;">${g.name}</span>`).join('') || '';
        const heroBgUrl = trailerId
            ? `https://img.youtube.com/vi/${trailerId}/hqdefault.jpg`
            : imgUrl;

        // YouTube embed: autoplay + mute + no controls + loop using data-src to prevent premature loading
        const iframeWrap = trailerId
          ? `
            <div class="detail-hero-iframe-wrap" id="heroVideoWrap">
                <iframe
                    id="heroVideoIframe"
                    data-src="https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=1&playlist=${trailerId}&enablejsapi=1&origin=${location.origin}"
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                ></iframe>
            </div>
            <button class="banner-mute-btn" id="bannerMuteBtn" title="Bật/tắt âm"><i class="fa-solid fa-volume-xmark"></i></button>
        `
          : "";

        return `
            <div class="detail-hero">
                <div class="detail-hero-bg" id="detailHeroBg" style="background-image: url('${heroBgUrl}')"></div>
                ${iframeWrap}
                <div class="detail-hero-overlay"></div>
                <div class="detail-hero-info">
                    <div class="hero-mini-title">${title}</div>
                    <div class="hero-mini-vi detail-title-vi" data-english-title="${title}" data-original-title="${anime.title}"></div>
                    <div class="hero-mini-genres">${genresHtml}</div>
                </div>
            </div>`;
    },

    createDetailContent(anime, characters, recommendations, pictures, videos, reviews) {
        const title = anime.title_english || anime.title;
        const imgUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
        const trailerId =
            anime.trailer?.youtube_id ||
            anime.trailer?.embed_url?.match(/embed\/([^?]+)/)?.[1] ||
            null;
        const romanji = getRomanji(anime);

        let activeTrailerId = trailerId;
        if (!activeTrailerId && videos && videos.promo && videos.promo.length > 0) {
            const promoWithYt = videos.promo.find(p => p.trailer?.youtube_id);
            if (promoWithYt) {
                activeTrailerId = promoWithYt.trailer.youtube_id;
            }
        }

        // --- Trailer embed (in body, separate from banner) ---
        const trailerHtml = activeTrailerId ? `
            <div class="trailer-container">
                <iframe src="https://www.youtube.com/embed/${activeTrailerId}?enablejsapi=1"
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>` : '';

        const genresHtml = anime.genres?.map(g => `<span class="tag">${g.name}</span>`).join('') || '';
        const studiosHtml = anime.studios?.map(s => s.name).join(', ') || 'N/A';
        const aired = anime.aired?.string || 'N/A';

        // --- Characters (top 12 sorted by Main first, then Supporting by popularity) ---
        let charsHtml = '';
        if (characters?.length > 0) {
            const sortedChars = [...characters].sort((a, b) => {
                const roleA = a.role === 'Main' ? 1 : 0;
                const roleB = b.role === 'Main' ? 1 : 0;
                if (roleA !== roleB) return roleB - roleA;
                return (b.favorites || 0) - (a.favorites || 0);
            });
            const blocks = sortedChars.slice(0, 12).map(c => {
                const charName = c.character.name;
                const charImg = c.character.images?.webp?.image_url || c.character.images?.jpg?.image_url || '';
                const va = c.voice_actors?.find(v => v.language === 'Japanese');
                const vaName = va?.person.name || '';
                const vaImg = va?.person.images?.jpg?.image_url || '';
                return `
                    <div class="character-card">
                        <img src="${charImg}" class="char-img" alt="${charName}" onerror="this.style.display='none'">
                        <div class="char-info">
                            <div class="char-name">${charName}</div>
                            <div class="char-role">${c.role}</div>
                        </div>
                        ${va ? `<div class="va-info" style="text-align:right;">
                            <div class="va-name">${vaName}</div>
                            <div class="va-lang">Japanese</div>
                        </div>
                        <img src="${vaImg}" class="va-img" alt="${vaName}" onerror="this.style.display='none'">` : ''}
                    </div>`;
            }).join('');
            charsHtml = `
                <h3 class="section-title" style="margin-top:40px;" data-i18n="modal_characters">${getTranslation('modal_characters')}</h3>
                <div class="characters-grid">${blocks}</div>`;
        }

        // --- Recommendations (top 8) ---
        let recsHtml = '';
        if (recommendations?.length > 0) {
            const blocks = recommendations.slice(0, 8).map(r => {
                const rTitle = r.entry.title_english || r.entry.title;
                const rImg = r.entry.images?.webp?.large_image_url || r.entry.images?.jpg?.large_image_url;
                return `
                    <div class="rec-card anime-card" data-id="${r.entry.mal_id}">
                        <div class="card-img-container" style="aspect-ratio:2/3;">
                            <img src="${rImg}" alt="${rTitle}" loading="lazy">
                        </div>
                        <div class="card-info">
                            <div class="card-title" title="${rTitle}">${rTitle}</div>
                            <div class="card-title-vi" data-english-title="${rTitle}" data-original-title="${r.entry.title}" title=""></div>
                        </div>
                    </div>`;
            }).join('');
            recsHtml = `
                <h3 class="section-title" style="margin-top:40px;" data-i18n="modal_similar">${getTranslation('modal_similar')}</h3>
                <div class="anime-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));">${blocks}</div>`;
        }

        // --- Gallery (Removed as requested by the user) ---
        let picsHtml = '';

        // --- Videos (promos + music) ---
        let videosHtml = '';
        if (videos?.promo?.length > 0 || videos?.music_videos?.length > 0) {
            const promos = (videos.promo || []).slice(0, 4);
            const mvs = (videos.music_videos || []).slice(0, 2);
            const allVids = [...promos, ...mvs].filter(v => v.trailer?.youtube_id || v.video?.youtube_id);
            if (allVids.length > 0) {
                const blocks = allVids.map(v => {
                    const ytId = v.trailer?.youtube_id || v.video?.youtube_id;
                    const thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                    return `
                        <div class="vid-card" onclick="document.getElementById('highlightModal').classList.add('show');document.getElementById('highlightVideoIframe').src='https://www.youtube.com/embed/${ytId}?autoplay=1'">
                            <div class="vid-thumb">
                                <img src="${thumb}" alt="${v.title || 'Video'}" loading="lazy">
                                <div class="vid-play-icon"><i class="fa-solid fa-play"></i></div>
                            </div>
                            <div class="vid-info">${v.title || 'Promo'}</div>
                        </div>`;
                }).join('');
                videosHtml = `
                    <h3 class="section-title" style="margin-top:40px;" data-i18n="modal_videos">${getTranslation('modal_videos')}</h3>
                    <div class="vids-grid">${blocks}</div>`;
            }
        } else if (activeTrailerId) {
            const thumb = `https://img.youtube.com/vi/${activeTrailerId}/mqdefault.jpg`;
            videosHtml = `
                <h3 class="section-title" style="margin-top:40px;" data-i18n="modal_videos">${getTranslation('modal_videos')}</h3>
                <div class="vids-grid">
                    <div class="vid-card" onclick="document.getElementById('highlightModal').classList.add('show');document.getElementById('highlightVideoIframe').src='https://www.youtube.com/embed/${activeTrailerId}?autoplay=1'">
                        <div class="vid-thumb">
                            <img src="${thumb}" alt="Trailer" loading="lazy">
                            <div class="vid-play-icon"><i class="fa-solid fa-play"></i></div>
                        </div>
                        <div class="vid-info">Official Trailer</div>
                    </div>
                </div>`;
        }

        // --- Reviews ---
        let reviewsHtml = '';
        if (reviews?.length > 0) {
            const blocks = reviews.slice(0, 2).map(r => {
                const content = r.review.substring(0, 400) + '...';
                return `
                    <div class="review-box" style="background:var(--bg-secondary);padding:20px;border-radius:16px;margin-bottom:20px;border:1px solid var(--border-color);">
                        <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
                            <strong>${r.user.username}</strong>
                            <span style="color:var(--accent-color);font-weight:bold;"><i class="fa-solid fa-star"></i> ${r.score}/10</span>
                        </div>
                        <p class="review-content" data-english-synopsis="${r.review.replace(/"/g, '&quot;')}">${content}</p>
                    </div>`;
            }).join('');
            reviewsHtml = `
                <h3 class="section-title" style="margin-top:40px;" data-i18n="modal_reviews">${getTranslation('modal_reviews')}</h3>
                <div>${blocks}</div>`;
        }

        return `
            <div class="detail-view-container">
                <div class="detail-sidebar">
                    <img class="detail-poster" src="${imgUrl}" alt="${title}">
                    <div class="sidebar-info-box">
                        <p><strong><i class="fa-solid fa-star" style="color:var(--accent-color)"></i> <span data-i18n="modal_score">${getTranslation('modal_score')}</span></strong> <span style="display:flex;align-items:center;gap:6px;">${anime.score || 'N/A'} ${anime.score ? getScoreGraphic(anime.score) : ''}</span></p>
                        <p><strong><i class="fa-solid fa-user-pen" style="color:var(--accent-color)"></i> <span data-i18n="scored_by_label">${getTranslation('scored_by_label')}</span></strong> ${anime.scored_by ? anime.scored_by.toLocaleString() : 'N/A'}</p>
                        <p><strong><i class="fa-solid fa-trophy" style="color:var(--accent-color)"></i> <span data-i18n="modal_rank">${getTranslation('modal_rank')}</span></strong> #${anime.rank || 'N/A'}</p>
                        <p><strong><i class="fa-solid fa-fire" style="color:var(--accent-color)"></i> <span data-i18n="modal_popularity">${getTranslation('modal_popularity')}</span></strong> #${anime.popularity || 'N/A'}</p>
                        <hr style="border:0;border-top:1px solid var(--border-color);margin:15px 0;">
                        <p><strong><span data-i18n="modal_type">${getTranslation('modal_type')}</span></strong> ${anime.type || '?'}</p>
                        <p><strong><span data-i18n="modal_episodes">${getTranslation('modal_episodes')}</span></strong> ${anime.episodes || '?'}</p>
                        <p><strong><span data-i18n="modal_status">${getTranslation('modal_status')}</span></strong> ${getStatus(anime.status)}</p>
                        <p><strong><span data-i18n="modal_duration">${getTranslation('modal_duration')}</span></strong> ${translateDuration(anime.duration)}</p>
                        <p><strong><span data-i18n="modal_aired">${getTranslation('modal_aired')}</span></strong> ${formatAiredDate(aired)}</p>
                        <p><strong><span data-i18n="modal_studio">${getTranslation('modal_studio')}</span></strong> ${studiosHtml}</p>
                    </div>
                </div>

                <div class="detail-info">
                    <h2 class="detail-title">${title}</h2>
                    <h3 class="detail-title-vi" data-english-title="${title}" data-original-title="${anime.title}"></h3>
                    ${anime.title_japanese ? `
                    <div class="japanese-title-block">
                        <span class="jp-label" data-i18n="modal_japanese">${getTranslation('modal_japanese')}</span>
                        <span class="jp-text">${anime.title_japanese}</span>
                        ${romanji ? `<span class="jp-romanji">（${romanji}）</span>` : ''}
                    </div>` : ''}

                    <div class="detail-actions">
                        <div class="detail-tags">${genresHtml}</div>
                        
                    </div>

                    <h3 class="section-title" data-i18n="modal_synopsis">${getTranslation('modal_synopsis')}</h3>
                    <p class="detail-synopsis" data-english-synopsis="${(anime.synopsis || '').replace(/"/g, '&quot;')}">${anime.synopsis || 'No synopsis available.'}</p>

                    ${activeTrailerId ? `<h3 class="section-title" style="margin-top:30px;" data-i18n="modal_trailer">${getTranslation('modal_trailer')}</h3>${trailerHtml}` : ''}

                    ${videosHtml}
                    ${charsHtml}
                    ${reviewsHtml}
                    ${recsHtml}
                </div>
            </div>

            <!-- Highlight Video Modal -->
            <div id="highlightModal" class="highlight-modal">
                <div class="highlight-modal-content">
                    <button class="close-highlight-btn" id="closeHighlightBtn">&times;</button>
                    <div class="highlight-video-wrapper">
                        <iframe id="highlightVideoIframe" src="" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            </div>`;
    }
};
