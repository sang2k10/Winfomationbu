const SafeStorage = {
    memory: {},
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn(`SafeStorage: Failed to read key "${key}" from localStorage. Using RAM fallback.`, e);
            return this.memory[key] || null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`SafeStorage: Failed to write key "${key}" to localStorage. Using RAM fallback.`, e);
            this.memory[key] = value;
        }
    },
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`SafeStorage: Failed to remove key "${key}" from localStorage. Using RAM fallback.`, e);
            delete this.memory[key];
        }
    }
};

const Translations = {
    vi: {
        nav_home: "Trang Chủ",
        nav_trending: "Thịnh Hành",
        nav_top: "Top Anime",
        nav_upcoming: "Sắp Ra Mắt",
        nav_seasonal: "Theo Mùa",
        nav_rated: "Điểm Cao Nhất",
        btn_details: "Chi tiết",
        scored_by_label: "lượt đánh giá",
        view_more: "Xem thêm",
        upcoming_air_date: "Khởi chiếu:",
        search_placeholder: "Tìm kiếm anime...",
        shelf_trending: "Anime Đang Hot",
        shelf_top: "Top Anime Mọi Thời Đại",
        view_all: "Xem tất cả",
        season_winter: "Mùa Đông",
        season_spring: "Mùa Xuân",
        season_summer: "Mùa Hè",
        season_fall: "Mùa Thu",
        btn_apply: "Áp dụng",
        footer_desc: "Thông tin được cung cấp bởi Jikan API.",
        modal_score: "Điểm:",
        score_level: "Mức độ đánh giá:",
        modal_rank: "Xếp hạng:",
        modal_popularity: "Phổ biến:",
        modal_episodes: "Số tập:",
        modal_type: "Loại:",
        modal_status: "Trạng thái:",
        modal_duration: "Thời lượng:",
        modal_aired: "Phát sóng:",
        modal_studio: "Studio:",
        modal_synopsis: "Nội dung",
        modal_trailer: "Trailer",
        modal_highlight: "Xem Highlight",
        modal_characters: "Nhân vật & Diễn viên lồng tiếng",
        modal_gallery: "Thư viện hình ảnh",
        modal_videos: "Video & Clip",
        modal_reviews: "Đánh giá nổi bật",
        modal_similar: "Anime tương tự",
        modal_recommend_votes: "Đề xuất",
        modal_japanese: "Tiếng Nhật:",
        back_btn: "Quay lại",
        status_airing: "Đang chiếu",
        status_finished: "Đã hoàn thành",
        status_upcoming: "Sắp chiếu",
        no_results: "Không tìm thấy kết quả",
        loading: "Đang tải...",
        sort_by: "Sắp xếp:",
        sort_default: "Mặc định",
        sort_score_desc: "Điểm cao → thấp",
        sort_score_asc: "Điểm thấp → cao",
        sort_year_desc: "Mới nhất",
        sort_year_asc: "Cũ nhất",
        sort_title_asc: "Tên A-Z",
        sort_title_desc: "Tên Z-A",
        sort_members_desc: "Nhiều người xem",
        sort_scored_by_desc: "Lượt đánh giá",
        last_page: "Trang cuối"
    },
    en: {
        nav_home: "Home",
        nav_trending: "Trending",
        nav_top: "Top Anime",
        nav_upcoming: "Upcoming",
        nav_seasonal: "Seasonal",
        nav_rated: "Top Rated",
        btn_details: "Details",
        scored_by_label: "reviews",
        view_more: "View More",
        upcoming_air_date: "Release Date:",
        search_placeholder: "Search anime...",
        shelf_trending: "Trending Now",
        shelf_top: "Top Anime of All Time",
        view_all: "View All",
        season_winter: "Winter",
        season_spring: "Spring",
        season_summer: "Summer",
        season_fall: "Fall",
        btn_apply: "Apply",
        footer_desc: "Powered by Jikan API.",
        modal_score: "Score:",
        score_level: "Score Level:",
        modal_rank: "Rank:",
        modal_popularity: "Popularity:",
        modal_episodes: "Episodes:",
        modal_type: "Type:",
        modal_status: "Status:",
        modal_duration: "Duration:",
        modal_aired: "Aired:",
        modal_studio: "Studio:",
        modal_synopsis: "Synopsis",
        modal_trailer: "Trailer",
        modal_highlight: "Watch Highlight",
        modal_characters: "Characters & Voice Actors",
        modal_gallery: "Image Gallery",
        modal_videos: "Videos & Clips",
        modal_reviews: "Featured Reviews",
        modal_similar: "Similar Anime",
        modal_recommend_votes: "Recommended",
        modal_japanese: "Japanese:",
        back_btn: "Go Back",
        status_airing: "Airing",
        status_finished: "Finished Airing",
        status_upcoming: "Not yet aired",
        no_results: "No results found",
        loading: "Loading...",
        sort_by: "Sort:",
        sort_default: "Default",
        sort_score_desc: "Score: High → Low",
        sort_score_asc: "Score: Low → High",
        sort_year_desc: "Newest",
        sort_year_asc: "Oldest",
        sort_title_asc: "Title A-Z",
        sort_title_desc: "Title Z-A",
        sort_members_desc: "Most Popular",
        sort_scored_by_desc: "Most reviews",
        last_page: "Last Page"
    }
};


let currentLang = SafeStorage.getItem('winfo_lang') || 'vi';

function updateLanguage(lang) {
    if (!Translations[lang]) return;
    currentLang = lang;
    SafeStorage.setItem('winfo_lang', lang);
    document.documentElement.lang = lang;
    
    // Update simple texts
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (Translations[lang][key]) {
            // Keep icons if they exist inside the element
            const icon = el.querySelector('i');
            el.innerHTML = icon ? `${Translations[lang][key]} ${icon.outerHTML}` : Translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (Translations[lang][key]) {
            el.setAttribute('placeholder', Translations[lang][key]);
        }
    });
    
    // Update language toggle button text
    const langBtn = document.querySelector('.lang-text');
    if(langBtn) {
        langBtn.textContent = lang.toUpperCase();
    }
}

function getTranslation(key) {
    return Translations[currentLang][key] || key;
}

async function translateToVietnamese(text) {
    if (!text) return '';
    const cleanText = text.trim();
    if (cleanText.length === 0) return '';
    
    const cacheKey = `trans_vi_${cleanText.substring(0, 40).replace(/[^a-zA-Z0-9]/g, "_")}`;
    const cached = SafeStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`;
        const res = await fetch(url);
        const json = await res.json();
        const translated = json[0].map(item => item[0]).join('');
        SafeStorage.setItem(cacheKey, translated);
        return translated;
    } catch (e) {
        console.error("Translation error:", e);
        return cleanText; // fallback to English
    }
}

const AnimeTitleMap = {
    "chainsaw man": "Thợ Săn Quỷ (Chainsaw Man)",
    "demon slayer: kimetsu no yaiba": "Thanh Gươm Diệt Quỷ",
    "kimetsu no yaiba": "Thanh Gươm Diệt Quỷ",
    "demon slayer: kimetsu no yaiba - entertainment district arc": "Thanh Gươm Diệt Quỷ: Kỹ Viện Trấn",
    "demon slayer: kimetsu no yaiba - swordsmith village arc": "Thanh Gươm Diệt Quỷ: Làng Rèn Gươm",
    "demon slayer: kimetsu no yaiba - hashira training arc": "Thanh Gươm Diệt Quỷ: Đại Trụ Huấn Luyện",
    "demon slayer: kimetsu no yaiba movie: mugen resha-hen": "Thanh Gươm Diệt Quỷ: Chuyến Tàu Vô Tận",
    "attack on titan": "Đại Chiến Titan (Attack on Titan)",
    "shingeki no kyojin": "Đại Chiến Titan (Attack on Titan)",
    "one piece": "Đảo Hải Tặc (One Piece)",
    "naruto": "Naruto",
    "naruto: shippuden": "Naruto: Bão Táp Sa Mạc",
    "jujutsu kaisen": "Chú Thuật Hồi Chiến",
    "jujutsu kaisen 2nd season": "Chú Thuật Hồi Chiến (Mùa 2)",
    "my hero academia": "Học Viện Siêu Anh Hùng",
    "boku no hero academia": "Học Viện Siêu Anh Hùng",
    "death note": "Cuốn Sổ Tử Thần (Death Note)",
    "fullmetal alchemist: brotherhood": "Giả Kim Thuật Sư (Fullmetal Alchemist)",
    "hunter x hunter": "Thợ Săn Tí Hon (Hunter x Hunter)",
    "bleach": "Sứ Mạng Thần Chết (Bleach)",
    "dragon ball super": "Bảy Viên Ngọc Rồng Siêu Cấp",
    "dragon ball z": "Bảy Viên Ngọc Rồng Z",
    "dragon ball": "Bảy Viên Ngọc Rồng",
    "detective conan": "Thám Tử Lừng Danh Conan",
    "case closed": "Thám Tử Lừng Danh Conan",
    "steins;gate": "Cổng Thế Giới Steins;Gate",
    "sword art online": "Đao Kiếm Thần Vực (Sword Art Online)",
    "no game no life": "Không Trò Chơi Không Cuộc Sống (No Game No Life)",
    "one punch man": "Cú Đấm Hủy Diệt (One Punch Man)",
    "tokyo ghoul": "Ngạ Quỷ Vùng Tokyo (Tokyo Ghoul)",
    "your name.": "Tên Cậu Là Gì? (Your Name.)",
    "kimi no na wa.": "Tên Cậu Là Gì? (Your Name.)",
    "spirited away": "Vùng Đất Linh Hồn (Spirited Away)",
    "sen to chihiro no kamikakushi": "Vùng Đất Linh Hồn (Spirited Away)",
    "a silent voice": "Dáng Hình Thanh Âm (A Silent Voice)",
    "koe no katachi": "Dáng Hình Thanh Âm (A Silent Voice)",
    "weathering with you": "Đứa Con Của Thời Tiết",
    "tenki no ko": "Đứa Con Của Thời Tiết",
    "violet evergarden": "Búp Bê Ký Ức Violet Evergarden",
    "black clover": "Cỏ Ba Lá Đen (Black Clover)",
    "fairy tail": "Hội Pháp Sư Fairy Tail",
    "gintama": "Linh Hồn Bạc (Gintama)",
    "mob psycho 100": "Cậu Bé Siêu Năng Lực Mob Psycho 100",
    "frieren: beyond journey's end": "Frieren: Pháp Sư Tiễn Đưa",
    "sousou no frieren": "Frieren: Pháp Sư Tiễn Đưa",
    "the eminence in shadow": "Chúa Tể Bóng Tối (The Eminence in Shadow)",
    "kage no jitsuryokusha ni naritakute!": "Chúa Tể Bóng Tối (The Eminence in Shadow)",
    "solo leveling": "Tôi Thăng Cấp Một Mình (Solo Leveling)",
    "ore dake level up na ken": "Tôi Thăng Cấp Một Mình (Solo Leveling)",
    "mushoku tensei: jobless reincarnation": "Thất Nghiệp Chuyển Sinh",
    "mushoku tensei: isekai ittara honki dasu": "Thất Nghiệp Chuyển Sinh",
    "oshi no ko": "Đứa Con Của Thần Tượng (Oshi no Ko)",
    "blue lock": "Dự Án Xanh (Blue Lock)",
    "haikyu!!": "Vua Bóng Chuyền (Haikyu!!)",
    "kaguya-sama: love is war": "Cuộc Chiến Tỏ Tình",
    "kaguya-sama wa kokurasetai: tensai-tachi no renai zunousen": "Cuộc Chiến Tỏ Tình",
    "vinland saga": "Chiến Ca Vinland",
    "monster": "Quái Vật (Monster)",
    "code geass: lelouch of the rebellion": "Lelouch Lam Hỏa Hoàng Tử",
    "neon genesis evangelion": "Chiến Binh Nhân Tạo Evangelion",
    "cowboy bebop": "Cao Bồi Không Gian",
    "your lie in april": "Lời Nói Dối Tháng Tư",
    "shigatsu wa kimi no uso": "Lời Nói Dối Tháng Tư",
    "toradora!": "Cọp và Rồng (Toradora!)",
    "clannad": "Thế Giới Khác (Clannad)",
    "anohana: the flower we saw that day": "Đóa Hoa Ngày Ấy Chúng Ta Vẫn Chưa Biết Tên",
    "ano hi mita hana no namae wo bokutachi wa mada shiranai.": "Đóa Hoa Ngày Ấy Chúng Ta Vẫn Chưa Biết Tên",
    "angel beats!": "Nhịp Đập Thiên Đường (Angel Beats!)",
    "re:zero - starting life in another world": "Re:Zero - Bắt Đầu Lại Ở Thế Giới Khác",
    "re:zero kara hajimeru isekai seikatsu": "Re:Zero - Bắt Đầu Lại Ở Thế Giới Khác",
    "that time i got reincarnated as a slime": "Lúc Đó Tôi Đã Chuyển Sinh Thành Slime",
    "tensei shitara slime datta ken": "Lúc Đó Tôi Đã Chuyển Sinh Thành Slime",
    "overlord": "Chúa Tể Overlord",
    "the rising of the shield hero": "Sự Trỗi Dậy Của Khiên Anh Hùng",
    "tate no yuusha no nariagari": "Sự Trỗi Dậy Của Khiên Anh Hùng",
    "konosuba: god's blessing on this wonderful world!": "Konosuba: Mở Ra Thế Giới Tuyệt Vời",
    "kono subarashii sekai ni shukufuku wo!": "Konosuba: Mở Ra Thế Giới Tuyệt Vời",
    "spy x family": "Gia Đình Điệp Viên (Spy x Family)",
    "horimiya": "Hội Học Sinh Horimiya (Horimiya)",
    "classroom of the elite": "Lớp Học Đề Cao Thực Lực",
    "youkoso jitsuryoku shijou shugi no kyoushitsu e": "Lớp Học Đề Cao Thực Lực",
    "darling in the franxx": "Người Yêu Dấu Trong Franxx",
    "tokyo revengers": "Băng Đảng Tokyo Revengers",
    "cyberpunk: edgerunners": "Cyberpunk: Kẻ Bên Lề",
    "hell's paradise": "Địa Ngục Cực Lạc",
    "jigokuraku": "Địa Ngục Cực Lạc",
    "pluto": "Quái Vật Cơ Khí Pluto",
    "haikyuu!!": "Vua Bóng Chuyền (Haikyu!!)",
    "dr. stone": "Tiến Sĩ Đá (Dr. Stone)",
    "black butler": "Hắc Quản Gia",
    "kuroshitsuji": "Hắc Quản Gia",
    "noragami": "Vị Thần Đi Bụi",
    "assassination classroom": "Lớp Học Ám Sát",
    "ansatsu kyoushitsu": "Lớp Học Ám Sát"
};

async function getVietnameseTitle(englishTitle, originalTitle) {
    const eng = (englishTitle || "").trim().toLowerCase();
    const orig = (originalTitle || "").trim().toLowerCase();
    
    if (eng && AnimeTitleMap[eng]) return AnimeTitleMap[eng];
    if (orig && AnimeTitleMap[orig]) return AnimeTitleMap[orig];
    
    // Check map with substring match for high compatibility
    for (const key in AnimeTitleMap) {
        if (eng && (eng === key || eng.startsWith(key + ":") || key.startsWith(eng + ":"))) {
            return AnimeTitleMap[key];
        }
        if (orig && (orig === key || orig.startsWith(key + ":") || key.startsWith(orig + ":"))) {
            return AnimeTitleMap[key];
        }
    }
    
    return '';
}

function formatAiredDate(dateStr) {
    if (!dateStr || dateStr === 'N/A' || dateStr === '?') return '?';
    if (currentLang !== 'vi') return dateStr;
    
    let formatted = dateStr;
    const months = {
        'Jan': 'Tháng 1', 'Feb': 'Tháng 2', 'Mar': 'Tháng 3', 'Apr': 'Tháng 4',
        'May': 'Tháng 5', 'Jun': 'Tháng 6', 'Jul': 'Tháng 7', 'Aug': 'Tháng 8',
        'Sep': 'Tháng 9', 'Oct': 'Tháng 10', 'Nov': 'Tháng 11', 'Dec': 'Tháng 12',
        'January': 'Tháng 1', 'February': 'Tháng 2', 'March': 'Tháng 3', 'April': 'Tháng 4',
        'June': 'Tháng 6', 'July': 'Tháng 7', 'August': 'Tháng 8', 'September': 'Tháng 9',
        'October': 'Tháng 10', 'November': 'Tháng 11', 'December': 'Tháng 12'
    };
    
    const match = dateStr.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);
    if (match) {
        const monthEng = match[1];
        const day = match[2];
        const year = match[3];
        const monthVi = months[monthEng] || monthEng;
        return `${day} ${monthVi}, ${year}`;
    }
    
    for (const eng in months) {
        const regex = new RegExp(`\\b${eng}\\b`, 'g');
        formatted = formatted.replace(regex, months[eng]);
    }
    return formatted;
}

function translateDuration(durationStr) {
    if (!durationStr || durationStr === '?' || durationStr === 'unknown') return '?';
    if (currentLang !== 'vi') return durationStr;
    let res = durationStr;
    res = res.replace(/min per ep/gi, 'phút mỗi tập');
    res = res.replace(/min/gi, 'phút');
    res = res.replace(/hr per ep/gi, 'giờ mỗi tập');
    res = res.replace(/hr/gi, 'giờ');
    res = res.replace(/per ep/gi, 'mỗi tập');
    res = res.replace(/unknown/gi, 'không rõ');
    return res;
}
