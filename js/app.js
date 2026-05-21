const app = {
  state: {
    currentRoute: "home",
    categoryPage: 1,
    searchTimeout: null,
    theme: SafeStorage.getItem("winfo_theme") || "dark",
    currentSort: "default",
    lastPage: null,
    currentCategoryData: [],
  },

  animeCache: {}, // RAM cache for instant hover popup lookups

  getRelativePathPrefix() {
    const path = window.location.pathname;
    if (
      path.includes("/detail") ||
      path.includes("/trending") ||
      path.includes("/top") ||
      path.includes("/upcoming") ||
      path.includes("/seasonal")
    ) {
      return "../";
    }
    return "";
  },


  init() {
    document.documentElement.setAttribute("data-theme", this.state.theme);
    updateLanguage(currentLang);

    // Initialize dynamic popup panels in DOM
    this.initHoverPreview();
    this.initLightbox();

    this.bindEvents();

    // Detect current page by markers
    if (document.getElementById("home-page-marker")) {
      this.state.currentRoute = "home";
      this.loadHome();
    } else if (document.getElementById("trending-page-marker")) {
      this.state.currentRoute = "trending";
      this.loadCategory("trending");
    } else if (document.getElementById("top-page-marker")) {
      this.state.currentRoute = "top";
      this.loadCategory("top");
    } else if (document.getElementById("upcoming-page-marker")) {
      this.state.currentRoute = "upcoming";
      this.loadCategory("upcoming");
    } else if (document.getElementById("seasonal-page-marker")) {
      this.state.currentRoute = "seasonal";
      this.populateYearSelect();
      this.loadCategory("seasonal");
    } else if (document.getElementById("detail-page-marker")) {
      this.state.currentRoute = "detail";
      const id = new URLSearchParams(window.location.search).get("id");
      if (id) {
        this.loadDetail(id);
      } else {
        window.location.href = this.getRelativePathPrefix() || "./";
      }
    }
  },

  fillOCDSlots() {
    const grids = document.querySelectorAll(
      ".anime-grid, .timeline-items-grid",
    );
    grids.forEach((grid) => {
      grid.querySelectorAll(".ocd-placeholder").forEach((el) => el.remove());
      if (grid.classList.contains("rank-list")) return;

      const cardCount = grid.children.length;
      if (cardCount === 0) return;

      const columns = window
        .getComputedStyle(grid)
        .gridTemplateColumns.split(" ").length;
      const remainder = cardCount % columns;

      if (remainder !== 0) {
        const missing = columns - remainder;
        for (let i = 0; i < missing; i++) {
          const placeholder = document.createElement("div");
          placeholder.className = "anime-card ocd-placeholder";
          placeholder.style.opacity = "0.4";
          placeholder.style.cursor = "default";
          placeholder.style.pointerEvents = "none";
          placeholder.style.display = "flex";
          placeholder.style.flexDirection = "column";
          placeholder.style.alignItems = "center";
          placeholder.style.justifyContent = "center";
          placeholder.style.background = "var(--bg-secondary)";
          placeholder.style.minHeight = "300px";
          placeholder.style.boxShadow = "none";

          placeholder.innerHTML = `
                        <i class="fa-solid fa-bomb" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 15px;"></i>
                        
                    `;
          grid.appendChild(placeholder);
        }
      }
    });
  },


  bindEvents() {
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.fillOCDSlots(), 200);
    });
    // Logo click
    const logo = document.querySelector(".logo");
    if (logo) {
      logo.addEventListener(
        "click",
        () => (window.location.href = this.getRelativePathPrefix() || "./"),
      );
    }

    // Back button in Detail View
    const backBtn = document.getElementById("backToPreviousBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = this.getRelativePathPrefix() || "./";
        }
      });
    }

    // Theme Toggle
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        this.state.theme = this.state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", this.state.theme);
        SafeStorage.setItem("winfo_theme", this.state.theme);
        const icon = themeToggle.querySelector("i");
        if (icon)
          icon.className =
            this.state.theme === "dark"
              ? "fa-solid fa-moon"
              : "fa-solid fa-sun";
      });
    }

    // Language Toggle - Instantly reloads page on transition for a clean reload of dynamic content
    const langToggle = document.getElementById("langToggle");
    if (langToggle) {
      langToggle.addEventListener("click", () => {
        const newLang = currentLang === "vi" ? "en" : "vi";
        SafeStorage.setItem("winfo_lang", newLang);
        location.reload();
      });
    }

    // Search Input with Debounce
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.state.searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 3) {
          const dropdown = document.getElementById("searchResultsDropdown");
          if (dropdown) dropdown.style.display = "none";
          return;
        }
        this.state.searchTimeout = setTimeout(
          () => this.handleSearch(query),
          500,
        );
      });
    }

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box")) {
        const dropdown = document.getElementById("searchResultsDropdown");
        if (dropdown) dropdown.style.display = "none";
      }
    });

    // Seasonal Apply Button
    const applySeasonBtn = document.getElementById("applySeasonBtn");
    if (applySeasonBtn) {
      applySeasonBtn.addEventListener("click", () => {
        this.state.categoryPage = 1;
        this.loadCategory("seasonal");
      });
    }

    // Mobile Menu
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => {
        const topMenu = document.querySelector(".top-menu");
        if (topMenu) topMenu.classList.toggle("show");
      });
    }

    // Initialize theme icon
    const themeIconEl = document.querySelector("#themeToggle i");
    if (themeIconEl) {
      themeIconEl.className =
        this.state.theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
    }

    // Scroll To Top Button
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
          scrollTopBtn.classList.add("visible");
        } else {
          scrollTopBtn.classList.remove("visible");
        }
      });
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Sort Select
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      this.state.currentSort = SafeStorage.getItem("winfo_sort") || "default";
      sortSelect.value = this.state.currentSort;
      sortSelect.addEventListener("change", () => {
        this.state.currentSort = sortSelect.value;
        SafeStorage.setItem("winfo_sort", this.state.currentSort);
        this.applySort();
      });
    }
  },

  populateYearSelect() {
    const yearSelect = document.getElementById("yearSelect");
    if (!yearSelect) return;
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 1; y >= 1990; y--) {
      const option = document.createElement("option");
      option.value = y;
      option.textContent = y;
      if (y === currentYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  },

  async loadHome() {
    const trendingGrid = document.getElementById("trendingGrid");
    const topGrid = document.getElementById("topGrid");
    const heroBanner = document.getElementById("heroBanner");

    if (trendingGrid) trendingGrid.innerHTML = Components.createSkeletonLoader(6);
    if (topGrid) topGrid.innerHTML = Components.createSkeletonLoader(6);

    let trending = { data: [] };
    let top = { data: [] };

    // Load Trending shelf & Hero slider
    try {
      trending = await API.getTrendingNow();
      if (heroBanner && trending.data?.length > 0) {
        heroBanner.innerHTML = Components.createHeroBanner(trending.data);
        this.initHeroSlider();
      }
      const uniqueTrending = this._dedupeById(trending.data || []);
      uniqueTrending.forEach((a) => (this.animeCache[a.mal_id] = a));

      if (trendingGrid) {
        if (uniqueTrending.length > 0) {
          trendingGrid.innerHTML = uniqueTrending
            .slice(0, 6)
            .map(Components.createAnimeCard)
            .join("");
        } else {
          trendingGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-secondary);">${getTranslation("no_results")}</p>`;
        }
      }
    } catch (error) {
      console.error("Failed to load trending shelf:", error);
      if (trendingGrid) {
        trendingGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:30px 10px;">
            <p style="color:var(--text-secondary); margin-bottom:12px;">${currentLang === "vi" ? "Không thể tải danh sách thịnh hành." : "Failed to load trending items."}</p>
            <button onclick="location.reload()" class="primary-btn" style="font-size:0.85rem; padding:6px 16px;"><i class="fa-solid fa-rotate-right"></i> ${currentLang === "vi" ? "Thử lại" : "Retry"}</button>
          </div>`;
      }
    }

    // Load Top Leaderboard shelf
    try {
      top = await API.getTopAnime();
      const uniqueTop = this._dedupeById(top.data || []);
      uniqueTop.forEach((a) => (this.animeCache[a.mal_id] = a));

      if (topGrid) {
        if (uniqueTop.length > 0) {
          topGrid.className = "rank-list";
          topGrid.innerHTML = uniqueTop
            .slice(0, 6)
            .map((anime, idx) => Components.createRankRow(anime, idx + 1))
            .join("");
        } else {
          topGrid.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-secondary);">${getTranslation("no_results")}</p>`;
        }
      }
    } catch (error) {
      console.error("Failed to load top shelf:", error);
      if (topGrid) {
        topGrid.innerHTML = `
          <div style="text-align:center; padding:30px 10px;">
            <p style="color:var(--text-secondary); margin-bottom:12px;">${currentLang === "vi" ? "Không thể tải bảng xếp hạng." : "Failed to load leaderboard."}</p>
            <button onclick="location.reload()" class="primary-btn" style="font-size:0.85rem; padding:6px 16px;"><i class="fa-solid fa-rotate-right"></i> ${currentLang === "vi" ? "Thử lại" : "Retry"}</button>
          </div>`;
      }
    }

    this.bindCardClicks();
    if (currentLang === "vi") this.translateTitlesOnPage();
  },

  async loadCategory(route) {
    // Toggle sort controls display: hide on upcoming, show on others
    const sortControls = document.querySelector(".sort-controls");
    if (sortControls) {
      if (route === "upcoming") {
        sortControls.style.display = "none";
      } else {
        sortControls.style.display = "flex";
      }
    }

    // Separate logic for Rank Leaderboard vertical listing
    if (route === "top") {
      // Force default sort to score_desc when entering rankings page
      this.state.currentSort = "score_desc";
      const sortSelect = document.getElementById("sortSelect");
      if (sortSelect) sortSelect.value = "score_desc";

      const grid = document.getElementById("categoryGrid");
      if (grid) {
        grid.className = "rank-list";
        grid.innerHTML = Components.createSkeletonLoader(10);
      }
      const paginationControls = document.getElementById("paginationControls");
      if (paginationControls) paginationControls.style.display = "none";

      // Ensure "View More" button exists
      let viewMoreBtn = document.getElementById("topViewMoreBtn");
      if (!viewMoreBtn && grid) {
        viewMoreBtn = document.createElement("button");
        viewMoreBtn.id = "topViewMoreBtn";
        viewMoreBtn.className = "primary-btn view-more-btn";
        viewMoreBtn.style.margin = "40px auto 0";
        viewMoreBtn.style.display = "none";
        grid.parentNode.insertBefore(viewMoreBtn, grid.nextSibling);
      }

      const categoryTitle = document.getElementById("categoryTitle");
      if (categoryTitle)
        categoryTitle.textContent = getTranslation(`nav_${route}`);

      // Initialize/Reset Leaderboard state
      this.topLeaderboard = {
        items: [],
        loadedCount: 0,
        currentPage: 1,
        lastPage: null,
      };

      try {
        // Fetch actual top score list by avoiding bypopularity filter
        const res = await API.getTopAnime("", 1);
        this.topLeaderboard.items = this._dedupeById(res.data);
        this.topLeaderboard.currentPage = 1;
        this.topLeaderboard.lastPage = res.lastPage;

        this.renderTopLeaderboardRows();
      } catch (err) {
        console.error("Failed to load top leaderboard", err);
        if (grid)
          grid.innerHTML = `<p style="padding: 40px; text-align: center;">${getTranslation("no_results")}</p>`;
      }
      return;
    }

    const grid = document.getElementById("categoryGrid");
    if (!grid) return;
    grid.innerHTML = Components.createSkeletonLoader(12);
    this.renderPagination(route);

    const categoryTitle = document.getElementById("categoryTitle");
    if (categoryTitle) {
      categoryTitle.textContent = getTranslation(`nav_${route}`);
    }

    try {
      let apiResult;
      if (route === "trending")
        apiResult = await API.getTrendingNow(this.state.categoryPage);
      else if (route === "upcoming")
        apiResult = await API.getUpcoming(this.state.categoryPage);
      else if (route === "seasonal") {
        const yearSelect = document.getElementById("yearSelect");
        const seasonSelect = document.getElementById("seasonSelect");
        const year = yearSelect ? yearSelect.value : new Date().getFullYear();
        const season = seasonSelect ? seasonSelect.value : "spring";
        apiResult = await API.getSeasonal(
          year,
          season,
          this.state.categoryPage,
        );
      }

      const rawData = apiResult?.data || [];
      const lastPage = apiResult?.lastPage || 1;

      const uniqueData = this._dedupeById(rawData);
      this.state.currentCategoryData = uniqueData;

      // Save to RAM Cache
      uniqueData.forEach((a) => (this.animeCache[a.mal_id] = a));

      // Apply sorting
      const sortedData = this._applySorting([...uniqueData]);

      if (route === "upcoming") {
        const monthsVi = {
          1: "Tháng 1",
          2: "Tháng 2",
          3: "Tháng 3",
          4: "Tháng 4",
          5: "Tháng 5",
          6: "Tháng 6",
          7: "Tháng 7",
          8: "Tháng 8",
          9: "Tháng 9",
          10: "Tháng 10",
          11: "Tháng 11",
          12: "Tháng 12",
        };
        const monthsEn = {
          1: "January",
          2: "February",
          3: "March",
          4: "April",
          5: "May",
          6: "June",
          7: "July",
          8: "August",
          9: "September",
          10: "October",
          11: "November",
          12: "December",
        };

        // Sort ascending chronologically (tăng dần)
        const sortedUpcoming = [...uniqueData].sort((a, b) => {
          const dateA = a.aired?.from ? new Date(a.aired.from) : null;
          const dateB = b.aired?.from ? new Date(b.aired.from) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        });

        const grouped = {};
        sortedUpcoming.forEach((anime) => {
          let year = anime.aired?.prop?.from?.year;
          let month = anime.aired?.prop?.from?.month;

          // Parse from string if prop is missing
          if ((!year || !month) && anime.aired?.string) {
            const str = anime.aired.string.toLowerCase();
            const yrMatch = str.match(/\b(20\d{2})\b/);
            if (yrMatch) year = parseInt(yrMatch[1]);

            const mMatch = str.match(/([a-z]{3})/);
            if (mMatch) {
              const mStr = mMatch[1];
              const shortMonths = [
                "jan",
                "feb",
                "mar",
                "apr",
                "may",
                "jun",
                "jul",
                "aug",
                "sep",
                "oct",
                "nov",
                "dec",
              ];
              const idx = shortMonths.findIndex((sm) => mStr.startsWith(sm));
              if (idx !== -1) month = idx + 1;
            }
          }

          let groupKey;
          if (year && month) {
            groupKey = `${year}-${String(month).padStart(2, "0")}`;
          } else if (year) {
            groupKey = `${year}-unknown`;
          } else {
            groupKey = "TBA";
          }

          if (!grouped[groupKey]) grouped[groupKey] = [];
          grouped[groupKey].push(anime);
        });

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
          if (a === "TBA") return 1;
          if (b === "TBA") return -1;
          return a.localeCompare(b);
        });

        let timelineHtml = '<div class="seasonal-timeline">';
        sortedKeys.forEach((key) => {
          const animeList = grouped[key];
          if (animeList.length === 0) return;

          let groupTitle = "";
          if (key === "TBA") {
            groupTitle =
              currentLang === "vi"
                ? "Chưa xác định thời gian (TBA)"
                : "To Be Announced (TBA)";
          } else if (key.endsWith("-unknown")) {
            const year = key.split("-")[0];
            groupTitle = currentLang === "vi" ? `Năm ${year}` : `Year ${year}`;
          } else {
            const parts = key.split("-");
            const year = parts[0];
            const month = parseInt(parts[1]);
            const monthName =
              currentLang === "vi" ? monthsVi[month] : monthsEn[month];
            groupTitle =
              currentLang === "vi"
                ? `${monthName}, ${year}`
                : `${monthName} ${year}`;
          }

          const countSuffix =
            currentLang === "vi"
              ? ` (${animeList.length} bộ)`
              : ` (${animeList.length} anime)`;
          groupTitle += countSuffix;

          timelineHtml += `
                        <div class="timeline-group">
                            <div class="timeline-month-header">
                                <div class="timeline-dot"></div>
                                <h3>${groupTitle}</h3>
                            </div>
                            <div class="timeline-items-grid">
                                ${animeList.map(Components.createUpcomingAnimeCard).join("")}
                            </div>
                        </div>
                    `;
        });
        timelineHtml += "</div>";
        grid.innerHTML = timelineHtml;
      } else {
        grid.innerHTML = sortedData.map(Components.createAnimeCard).join("");
      }

      this.bindCardClicks();
      this.renderPagination(route, lastPage);
      if (currentLang === "vi") this.translateTitlesOnPage();
      this.fillOCDSlots();
    } catch (error) {
      console.error(`Failed to load category ${route}`, error);
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 20px;"></i>
          <p style="font-size: 1.1rem; color: var(--text-secondary);">${currentLang === "vi" ? "Đã xảy ra lỗi khi tải dữ liệu từ máy chủ." : "An error occurred while loading data from the server."}</p>
          <button onclick="location.reload()" class="primary-btn" style="margin-top: 20px;"><i class="fa-solid fa-rotate-right"></i> ${currentLang === "vi" ? "Thử lại" : "Retry"}</button>
        </div>`;
      const paginationControls = document.getElementById("paginationControls");
      if (paginationControls) paginationControls.innerHTML = "";
    }
  },

  renderTopLeaderboardRows() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    const nextLimit = Math.min(100, this.topLeaderboard.loadedCount + 10);

    this.ensureLeaderboardItems(nextLimit).then(() => {
      const finalItems = this.topLeaderboard.items.slice(0, nextLimit);

      // Build the rows html
      const rowsHtml = finalItems
        .map((anime, idx) => Components.createRankRow(anime, idx + 1))
        .join("");
      grid.innerHTML = rowsHtml;
      this.topLeaderboard.loadedCount = finalItems.length;

      // Update RAM Cache with loaded items
      finalItems.forEach((item) => {
        this.animeCache[item.mal_id] = item;
      });

      this.bindCardClicks();
      if (currentLang === "vi") this.translateTitlesOnPage();

      // Handle the "View More" button visibility
      const viewMoreBtn = document.getElementById("topViewMoreBtn");
      if (viewMoreBtn) {
        viewMoreBtn.setAttribute("data-i18n", "view_more");
        viewMoreBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> ${getTranslation("view_more")}`;

        if (
          this.topLeaderboard.loadedCount >= 100 ||
          (this.topLeaderboard.lastPage &&
            this.topLeaderboard.currentPage >= this.topLeaderboard.lastPage &&
            this.topLeaderboard.items.length <= this.topLeaderboard.loadedCount)
        ) {
          viewMoreBtn.style.display = "none";
        } else {
          viewMoreBtn.style.display = "flex";
          // Rebind click listener
          viewMoreBtn.onclick = () => {
            viewMoreBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${getTranslation("loading")}`;
            this.renderTopLeaderboardRows();
          };
        }
      }
    });
  },

  async ensureLeaderboardItems(requiredCount) {
    while (
      this.topLeaderboard.items.length < requiredCount &&
      this.topLeaderboard.items.length < 100
    ) {
      const nextPg = this.topLeaderboard.currentPage + 1;
      if (this.topLeaderboard.lastPage && nextPg > this.topLeaderboard.lastPage)
        break;

      const res = await API.getTopAnime("", nextPg);
      const deduped = this._dedupeById(res.data);
      this.topLeaderboard.items = this.topLeaderboard.items.concat(deduped);
      this.topLeaderboard.currentPage = nextPg;
      this.topLeaderboard.lastPage = res.lastPage;
    }
  },

  _applySorting(data) {
    const sort = this.state.currentSort;
    if (!sort || sort === "default") return data;

    return data.sort((a, b) => {
      switch (sort) {
        case "score_desc":
          return (b.score || 0) - (a.score || 0);
        case "score_asc":
          return (a.score || 0) - (b.score || 0);
        case "scored_by_desc":
          return (b.scored_by || 0) - (a.scored_by || 0);
        case "year_desc":
          return (b.year || 0) - (a.year || 0);
        case "year_asc":
          return (a.year || 0) - (b.year || 0);
        case "title_asc": {
          const titleA = (a.title_english || a.title || "").toLowerCase();
          const titleB = (b.title_english || b.title || "").toLowerCase();
          return titleA.localeCompare(titleB);
        }
        case "title_desc": {
          const titleA = (a.title_english || a.title || "").toLowerCase();
          const titleB = (b.title_english || b.title || "").toLowerCase();
          return titleB.localeCompare(titleA);
        }
        case "members_desc":
          return (b.members || 0) - (a.members || 0);
        default:
          return 0;
      }
    });
  },

  applySort() {
    if (this.state.currentRoute === "top") {
      // Leaderboard client sorting
      if (!this.topLeaderboard || this.topLeaderboard.items.length === 0)
        return;
      const sorted = this._applySorting([
        ...this.topLeaderboard.items.slice(0, this.topLeaderboard.loadedCount),
      ]);
      const grid = document.getElementById("categoryGrid");
      if (grid) {
        grid.innerHTML = sorted
          .map((anime, idx) => Components.createRankRow(anime, idx + 1))
          .join("");
        this.bindCardClicks();
        if (currentLang === "vi") this.translateTitlesOnPage();
        this.fillOCDSlots();
      }
      return;
    }

    const grid = document.getElementById("categoryGrid");
    if (!grid || this.state.currentCategoryData.length === 0) return;

    const sortedData = this._applySorting([...this.state.currentCategoryData]);
    if (this.state.currentRoute === "upcoming") {
      grid.innerHTML = sortedData
        .map(Components.createUpcomingAnimeCard)
        .join("");
    } else {
      grid.innerHTML = sortedData.map(Components.createAnimeCard).join("");
    }
    this.bindCardClicks();
    if (currentLang === "vi") this.translateTitlesOnPage();
  },

  renderPagination(route, lastPage = null) {
    const container = document.getElementById("paginationControls");
    if (!container) return;
    const currentPage = this.state.categoryPage;

    if (lastPage !== null && lastPage <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    html += `<button class="page-btn first-btn" ${currentPage === 1 ? "disabled" : ""} title="${getTranslation("nav_home")}"><i class="fa-solid fa-angles-left"></i></button>`;
    html += `<button class="page-btn prev-btn" ${currentPage === 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>`;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = currentPage + 2;
    if (lastPage) {
      endPage = Math.min(lastPage, currentPage + 2);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    if (startPage > 1) {
      html += `<button class="page-btn page-num-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        html += `<button class="page-btn page-num-btn active">${i}</button>`;
      } else {
        html += `<button class="page-btn page-num-btn" data-page="${i}">${i}</button>`;
      }
    }

    if (lastPage && endPage < lastPage) {
      if (endPage < lastPage - 1) {
        html += `<span class="page-ellipsis">…</span>`;
      }
      html += `<button class="page-btn page-num-btn" data-page="${lastPage}">${lastPage}</button>`;
    } else if (!lastPage) {
      html += `<span class="page-ellipsis">…</span>`;
    }

    const hasMore = lastPage ? currentPage < lastPage : true;
    html += `<button class="page-btn next-btn" ${!hasMore ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>`;
    html += `<button class="page-btn last-btn" ${!lastPage || currentPage === lastPage ? "disabled" : ""} title="${getTranslation("last_page")}"><i class="fa-solid fa-angles-right"></i></button>`;
    container.innerHTML = html;

    container.querySelectorAll(".page-num-btn[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.state.categoryPage = parseInt(btn.getAttribute("data-page"));
        this.loadCategory(route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    const firstBtn = container.querySelector(".first-btn");
    if (firstBtn && currentPage > 1)
      firstBtn.addEventListener("click", () => {
        this.state.categoryPage = 1;
        this.loadCategory(route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

    const prevBtn = container.querySelector(".prev-btn");
    if (prevBtn && currentPage > 1)
      prevBtn.addEventListener("click", () => {
        this.state.categoryPage--;
        this.loadCategory(route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

    const nextBtn = container.querySelector(".next-btn");
    if (nextBtn && hasMore)
      nextBtn.addEventListener("click", () => {
        this.state.categoryPage++;
        this.loadCategory(route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

    const lastBtn = container.querySelector(".last-btn");
    if (lastBtn && lastPage && currentPage < lastPage) {
      lastBtn.addEventListener("click", () => {
        this.state.categoryPage = lastPage;
        this.loadCategory(route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  },

  async handleSearch(query) {
    const dropdown = document.getElementById("searchResultsDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `<div style="padding: 15px; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
    dropdown.style.display = "block";

    try {
      const results = await API.searchAnime(query);
      if (results.length === 0) {
        dropdown.innerHTML = `<div style="padding: 15px; text-align: center;">${getTranslation("no_results")}</div>`;
        return;
      }

      // Populate RAM cache
      results.forEach((a) => (this.animeCache[a.mal_id] = a));

      dropdown.innerHTML = results
        .map((anime) => {
          const title = anime.title_english || anime.title;
          const img =
            anime.images?.webp?.small_image_url ||
            anime.images?.jpg?.small_image_url;
          return `
                    <div class="search-item" onclick="app.openDetailModal(${anime.mal_id})">
                        <img src="${img}" class="search-item-img" alt="${title}">
                        <div>
                            <div class="search-item-title">${title}</div>
                            <div class="search-item-title-vi" data-english-title="${title}" data-original-title="${anime.title}"></div>
                            <div class="search-item-meta">${anime.year || "?"} • ${anime.type || "?"} • ⭐ ${anime.score || "?"}</div>
                        </div>
                    </div>
                `;
        })
        .join("");

      if (currentLang === "vi") this.translateTitlesOnPage();
    } catch (error) {
      dropdown.innerHTML = `<div style="padding: 15px; text-align: center;">Error searching.</div>`;
    }
  },

  bindCardClicks() {
    document
      .querySelectorAll(".anime-card, .rank-list-item")
      .forEach((card) => {
        // Avoid duplicate listeners
        card.removeEventListener("click", this._cardClickHandler);
        card._cardClickHandler = () => {
          const id = card.getAttribute("data-id");
          this.openDetailModal(id);
        };
        card.addEventListener("click", card._cardClickHandler);
      });
  },

  openDetailModal(id) {
    window.location.href = `${this.getRelativePathPrefix()}detail/?id=${id}`;
  },

  async loadDetail(id) {
    const dropdown = document.getElementById("searchResultsDropdown");
    if (dropdown) dropdown.style.display = "none";
    const detailBody = document.getElementById("detailViewBody");
    if (!detailBody) return;

    detailBody.innerHTML = `<div class="detail-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    try {
      // PRIORITY LOAD: Fetch core data first (details + characters), then load the rest in background
      const [data, charactersData] = await Promise.all([
        API.getAnimeDetails(id),
        API.getAnimeCharacters(id).catch(() => []),
      ]);

      // Render banner if element exists
      const heroBanner = document.getElementById("detailHeroBanner");
      if (heroBanner) {
        let heroData = { ...data };

        try {
          const vidsData = await API.getAnimeVideos(id);

          if (!heroData.trailer?.youtube_id && vidsData?.promo?.length) {
            const promo = vidsData.promo.find((v) => v.trailer?.youtube_id);

            if (promo) {
              heroData.trailer = {
                youtube_id: promo.trailer.youtube_id,
              };
            }
          }

          heroBanner.innerHTML = Components.createDetailHero(heroData);
        } catch {
          heroBanner.innerHTML = Components.createDetailHero(data);
        }
        this._bindHeroVideo();
        this._bindBannerMute(data.trailer?.youtube_id);
      }

      // Render initial content immediately
      detailBody.innerHTML = Components.createDetailContent(
        data,
        charactersData,
        [],
        [],
        null,
        [],
      );

      // Bind highlight modal events immediately
      this._bindHighlightModal(data.trailer?.youtube_id);

      // Bind recommendations click
      detailBody.querySelectorAll(".rec-card").forEach((card) => {
        card.addEventListener("click", () =>
          this.openDetailModal(card.getAttribute("data-id")),
        );
      });

      // Translate titles and synopsis right away
      if (currentLang === "vi") {
        const synopsisEl = detailBody.querySelector(".detail-synopsis");
        if (synopsisEl) {
          const original = synopsisEl.getAttribute("data-english-synopsis");
          if (original) {
            translateToVietnamese(original).then((t) => {
              if (t) synopsisEl.textContent = t;
            });
          }
        }
        this.translateTitlesOnPage();
      }

      // BACKGROUND LOAD: Fetch remaining data without blocking UI
      Promise.all([
        API.getAnimeRecommendations(id).catch(() => []),
        API.getAnimePictures(id).catch(() => []),
        API.getAnimeVideos(id).catch(() => null),
        API.getAnimeReviews(id).catch(() => []),
      ]).then(([recsData, picsData, vidsData, reviewsData]) => {
        // Re-render with full data (only body, leaving banner running)
        detailBody.innerHTML = Components.createDetailContent(
          data,
          charactersData,
          recsData,
          picsData,
          vidsData,
          reviewsData,
        );

        // Dynamic cover image swap: update hero background with a different picture (keyart) if available
        if (picsData && picsData.length > 0) {
          const targetPic = picsData[1] || picsData[0];
          if (targetPic) {
            const nextImg =
              targetPic.large_image_url ||
              targetPic.webp?.large_image_url ||
              targetPic.jpg?.large_image_url ||
              targetPic.webp?.image_url ||
              targetPic.jpg?.image_url;
            const detailHeroBg = document.getElementById("detailHeroBg");
            if (detailHeroBg && nextImg) {
              detailHeroBg.style.backgroundImage = `url('${nextImg}')`;
            }
          }
        }

        let activeTrailerId = data.trailer?.youtube_id;
        if (
          !activeTrailerId &&
          vidsData &&
          vidsData.promo &&
          vidsData.promo.length > 0
        ) {
          const promoWithYt = vidsData.promo.find((p) => p.trailer?.youtube_id);
          if (promoWithYt) {
            activeTrailerId = promoWithYt.trailer.youtube_id;
          }
        }
        this._bindHighlightModal(activeTrailerId);

        detailBody.querySelectorAll(".rec-card").forEach((card) => {
          card.addEventListener("click", () =>
            this.openDetailModal(card.getAttribute("data-id")),
          );
        });

        if (currentLang === "vi") {
          detailBody
            .querySelectorAll(".detail-synopsis, .review-content")
            .forEach(async (el) => {
              const original = el.getAttribute("data-english-synopsis");
              if (original) {
                const translated = await translateToVietnamese(original);
                if (translated) el.textContent = translated;
              }
            });
          this.translateTitlesOnPage();
        }
      });
    } catch (error) {
      console.error("Detail loading error:", error);
      detailBody.innerHTML = `<div style="padding: 80px 20px; text-align: center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 20px;"></i>
                <p style="font-size: 1.1rem; color: var(--text-secondary);">${currentLang === "vi" ? "Không thể tải thông tin chi tiết. Vui lòng thử lại." : "Failed to load details. Please try again."}</p>
                <button onclick="location.reload()" class="primary-btn" style="margin-top: 20px;"><i class="fa-solid fa-rotate-right"></i> ${currentLang === "vi" ? "Thử lại" : "Retry"}</button>
            </div>`;
    }
  },

  _bindHighlightModal(trailerId) {
    const playHighlightBtn = document.getElementById("playHighlightBtn");
    const closeHighlightBtn = document.getElementById("closeHighlightBtn");
    const highlightModal = document.getElementById("highlightModal");
    const highlightVideoIframe = document.getElementById(
      "highlightVideoIframe",
    );

    const openModal = (ytId) => {
      if (highlightModal && highlightVideoIframe) {
        highlightVideoIframe.src = `https://www.youtube.com/embed/${ytId || trailerId}?autoplay=1&enablejsapi=1`;
        highlightModal.classList.add("show");
      }
    };

    const closeModal = () => {
      if (highlightModal && highlightVideoIframe) {
        highlightVideoIframe.src = "";
        highlightModal.classList.remove("show");
      }
    };

    if (playHighlightBtn)
      playHighlightBtn.addEventListener("click", () => openModal(trailerId));
    if (closeHighlightBtn)
      closeHighlightBtn.addEventListener("click", closeModal);
    if (highlightModal) {
      highlightModal.addEventListener("click", (e) => {
        if (e.target === highlightModal) closeModal();
      });
    }
    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  },

  _bindBannerMute(trailerId) {
    const muteBtn = document.getElementById("bannerMuteBtn");
    const iframe = document.getElementById("heroVideoIframe");
    if (!muteBtn || !iframe) return;

    let isMuted = true;
    muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      try {
        if (isMuted) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "mute" }),
            "*",
          );
        } else {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "unMute" }),
            "*",
          );
        }
      } catch (e) {
        console.error("Failed to toggle mute via postMessage", e);
      }
      muteBtn.innerHTML = isMuted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    });
  },

  _bindHeroVideo() {
    const iframeWrap = document.getElementById("heroVideoWrap");
    const iframe = document.getElementById("heroVideoIframe");
    if (!iframeWrap || !iframe) return;

    const src = iframe.getAttribute("data-src");
    if (!src) return;

    let loaded = false;
    iframe.onload = () => {
      if (loaded) return;
      loaded = true;
      setTimeout(() => {
        iframeWrap.classList.add("playing");
      }, 1600);
    };

    iframe.src = src;

    setTimeout(() => {
      if (!loaded && iframeWrap) {
        loaded = true;
        setTimeout(() => {
          iframeWrap.classList.add("playing");
        }, 1600);
      }
    }, 20000);
  },

  _dedupeById(arr) {
    const seen = new Set();
    return arr.filter((a) => {
      if (seen.has(a.mal_id)) return false;
      seen.add(a.mal_id);
      return true;
    });
  },

  async translateTitlesOnPage() {
    if (currentLang !== "vi") return;

    document.querySelectorAll(".hero-title-vi").forEach(async (el) => {
      if (el.textContent.trim()) return;
      const eng = el.getAttribute("data-english-title");
      const orig = el.getAttribute("data-original-title");
      const vi = await getVietnameseTitle(eng, orig);
      if (vi) {
        el.textContent = vi;
        el.style.display = "block";
      }
    });

    document.querySelectorAll(".hero-synopsis").forEach(async (el) => {
      if (el.getAttribute("data-translated") === "true") return;
      const originalText = el.getAttribute("data-english-synopsis");
      if (originalText) {
        const translated = await translateToVietnamese(originalText);
        if (translated) {
          el.textContent = translated.split(".")[0] + ".";
          el.setAttribute("data-translated", "true");
        }
      }
    });

    document.querySelectorAll(".card-title-vi").forEach(async (el) => {
      if (el.textContent.trim()) return;
      const vi = await getVietnameseTitle(
        el.getAttribute("data-english-title"),
        el.getAttribute("data-original-title"),
      );
      if (vi) {
        el.textContent = vi;
        el.setAttribute("title", vi);
      }
    });

    const detailTitleVi = document.querySelector(".detail-title-vi");
    if (detailTitleVi) {
      const vi = await getVietnameseTitle(
        detailTitleVi.getAttribute("data-english-title"),
        detailTitleVi.getAttribute("data-original-title"),
      );
      detailTitleVi.textContent = vi || "";
      detailTitleVi.style.display = vi ? "block" : "none";
    }

    document.querySelectorAll(".search-item-title-vi").forEach(async (el) => {
      if (el.textContent.trim()) return;
      const vi = await getVietnameseTitle(
        el.getAttribute("data-english-title"),
        el.getAttribute("data-original-title"),
      );
      if (vi) {
        el.textContent = vi;
        el.style.display = "block";
      }
    });
  },

  // ===== Auto-Rotating Hero Slider Implementation =====
  initHeroSlider() {
    const wrap = document.querySelector(".hero-slider-wrap");
    if (!wrap) return;

    this.heroSlides = wrap.querySelectorAll(".hero-slide");
    this.heroDots = wrap.querySelectorAll(".hero-dot");
    this.heroCurrentIndex = 0;
    this.heroMutedState = {}; // Mute cache: standard browser permissions force muted on load

    if (this.heroSlides.length <= 1) return;

    // Auto transition intervals (6 seconds)
    clearInterval(this.heroInterval);
    this.heroInterval = setInterval(() => {
      this.nextHeroSlide();
    }, 30000);

    // Bind dots click navigation
    this.heroDots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        clearInterval(this.heroInterval);
        this.showHeroSlide(idx);
        // Restart timer
        this.heroInterval = setInterval(() => {
          this.nextHeroSlide();
        }, 30000);
      });
    });

    // Bind mute controls
    wrap.querySelectorAll(".hero-mute-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        this.toggleHeroSlideMute(idx);
      });
    });

    // Autoplay the first active slide background video
    this.loadHeroSlideVideo(0);
  },

  showHeroSlide(index) {
    if (index === this.heroCurrentIndex) return;

    const prevIdx = this.heroCurrentIndex;
    this.heroCurrentIndex = index;

    // Halt background video playback on the previous slide to conserve network resources & CPU
    this.unloadHeroSlideVideo(prevIdx);

    // Adjust active classes
    this.heroSlides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    this.heroDots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    // Load background video trailer for the newly active slide
    this.loadHeroSlideVideo(index);
  },

  nextHeroSlide() {
    if (!this.heroSlides || this.heroSlides.length <= 1) return;
    const nextIdx = (this.heroCurrentIndex + 1) % this.heroSlides.length;
    this.showHeroSlide(nextIdx);
  },

  loadHeroSlideVideo(idx) {
    const slide = this.heroSlides[idx];
    if (!slide) return;

    const iframe = slide.querySelector(".hero-slide-video-iframe");
    const videoWrap = slide.querySelector(".hero-slide-video-wrap");
    if (!iframe || !videoWrap) return;

    const src = iframe.getAttribute("data-src");
    if (!src) return;

    const isMuted = this.heroMutedState[idx] !== false; // Default: muted background play

    // Register event listener BEFORE setting src to avoid race conditions
    let loaded = false;
    iframe.onload = () => {
      if (loaded) return;
      loaded = true;
      setTimeout(() => {
        videoWrap.classList.add("playing");
        try {
          if (isMuted) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "mute" }),
              "*",
            );
          } else {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "command", func: "unMute" }),
              "*",
            );
          }
        } catch (err) {}
      }, 1000);
    };

    iframe.src = src;

    // Fallback in case onload is blocked or delayed
    setTimeout(() => {
      if (!loaded) {
        loaded = true;
        videoWrap.classList.add("playing");
      }
    }, 4000);
  },

  unloadHeroSlideVideo(idx) {
    const slide = this.heroSlides[idx];
    if (!slide) return;

    const iframe = slide.querySelector(".hero-slide-video-iframe");
    const videoWrap = slide.querySelector(".hero-slide-video-wrap");
    if (iframe && videoWrap) {
      iframe.src = ""; // set blank to save performance
      videoWrap.classList.remove("playing");
    }
  },

  toggleHeroSlideMute(idx) {
    const slide = this.heroSlides[idx];
    if (!slide) return;

    const iframe = slide.querySelector(".hero-slide-video-iframe");
    const btn = slide.querySelector(".hero-mute-btn");
    if (!iframe || !btn) return;

    const isMuted = this.heroMutedState[idx] !== false;
    const newMute = !isMuted;
    this.heroMutedState[idx] = newMute;

    try {
      if (newMute) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "mute" }),
          "*",
        );
      } else {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "unMute" }),
          "*",
        );
      }
    } catch (e) {
      console.error("Failed to post message to slide iframe", e);
    }

    btn.innerHTML = newMute
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  },

  // ===== Hover Preview Tooltip Implementation =====
  initHoverPreview() {
    let preview = document.getElementById("animeHoverPreview");
    if (!preview) {
      preview = document.createElement("div");
      preview.id = "animeHoverPreview";
      preview.className = "anime-hover-preview";
      document.body.appendChild(preview);
    }
    this.hoverPreviewEl = preview;
    this.hoverTimeout = null;
    this.hoverActiveId = null;

    // Mouse hover event delegation with custom active bounds checking
    document.body.addEventListener("mouseover", (e) => {
      const target = e.target.closest(".anime-card, .rank-list-item");
      if (!target) return;

      const id = target.getAttribute("data-id");
      if (!id) return;

      if (this.hoverActiveId === id) return;

      clearTimeout(this.hoverTimeout);
      this.hoverActiveId = id;

      // Apply 250ms delay bounds to guarantee smooth rapid scrubbing over catalog shelves
      this.hoverTimeout = setTimeout(() => {
        this.showHoverPreview(target, id);
      }, 250);
    });

    document.body.addEventListener("mouseout", (e) => {
      const target = e.target.closest(".anime-card, .rank-list-item");
      if (!target) return;

      const related = e.relatedTarget
        ? e.relatedTarget.closest(".anime-card, .rank-list-item")
        : null;
      if (related === target) return;

      clearTimeout(this.hoverTimeout);
      this.hoverActiveId = null;
      this.hideHoverPreview();
    });
  },

  async getAnimeFromCacheOrApi(id) {
    if (this.animeCache[id]) return this.animeCache[id];
    try {
      const data = await API.getAnimeDetails(id);
      this.animeCache[id] = data;
      return data;
    } catch (e) {
      console.error("Failed to query hover metadata", e);
      return null;
    }
  },

  async showHoverPreview(card, id) {
    if (this.hoverActiveId !== id) return;
    const anime = await this.getAnimeFromCacheOrApi(id);
    if (!anime || this.hoverActiveId !== id) return;

    const title = anime.title_english || anime.title;
    const score = anime.score ? anime.score.toFixed(1) : "?";
    const rank = anime.rank ? `#${anime.rank}` : "N/A";
    const genres =
      anime.genres
        ?.slice(0, 3)
        .map((g) => `<span class="preview-tag">${g.name}</span>`)
        .join("") || "";
    const synopsis = anime.synopsis
      ? anime.synopsis.split(".")[0] + "."
      : "No synopsis available.";
    const graphicHtml = anime.score ? getScoreGraphic(anime.score) : "";

    // Inject content structures
    this.hoverPreviewEl.innerHTML = `
            <div class="preview-title">${title}</div>
            <div class="preview-title-vi" data-english-title="${title}" data-original-title="${anime.title}"></div>
            <div class="preview-meta-row">
                <span class="preview-score"><i class="fa-solid fa-star" style="color:#FFD700;"></i> ${score}</span>
                <span>•</span>
                <span class="preview-rank"><i class="fa-solid fa-trophy" style="color:var(--accent-color);"></i> ${rank}</span>
            </div>
            <div class="preview-score-graphic">${graphicHtml}</div>
            <div class="preview-genres">${genres}</div>
            <div class="preview-synopsis">${synopsis}</div>
        `;

    if (currentLang === "vi") {
      const viEl = this.hoverPreviewEl.querySelector(".preview-title-vi");
      if (viEl) {
        const vi = await getVietnameseTitle(
          viEl.getAttribute("data-english-title"),
          viEl.getAttribute("data-original-title"),
        );
        if (vi) viEl.textContent = vi;
      }
      const synEl = this.hoverPreviewEl.querySelector(".preview-synopsis");
      if (synEl && anime.synopsis) {
        const viSyn = await translateToVietnamese(anime.synopsis);
        if (viSyn) synEl.textContent = viSyn.split(".")[0] + ".";
      }
    }

    // Dynamically compute positioning: prefer right or left based on available space and cursor collision
    const rect = card.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const popupWidth = 300;
    const gap = 15;
    const estHeight = 250;

    let left = 0;
    let top = rect.top + scrollTop - 10; // align with the top of the card by default

    const spaceOnRight = window.innerWidth - rect.right;
    const spaceOnLeft = rect.left;

    if (spaceOnRight >= popupWidth + gap) {
      // Place on the right of the card
      left = rect.right + scrollLeft + gap;
      this.hoverPreviewEl.classList.remove(
        "place-left",
        "place-top",
        "place-bottom",
      );
      this.hoverPreviewEl.classList.add("place-right");
    } else if (spaceOnLeft >= popupWidth + gap) {
      // Place on the left of the card
      left = rect.left + scrollLeft - popupWidth - gap;
      this.hoverPreviewEl.classList.remove(
        "place-right",
        "place-top",
        "place-bottom",
      );
      this.hoverPreviewEl.classList.add("place-left");
    } else {
      // Mobile fallback: center horizontally and place above or below
      left = Math.max(
        10,
        rect.left + scrollLeft + (rect.width - popupWidth) / 2,
      );
      if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
      }
      if (rect.top < estHeight) {
        top = rect.bottom + scrollTop + gap;
        this.hoverPreviewEl.classList.remove(
          "place-right",
          "place-left",
          "place-top",
        );
        this.hoverPreviewEl.classList.add("place-bottom");
      } else {
        top = rect.top + scrollTop - estHeight - gap;
        this.hoverPreviewEl.classList.remove(
          "place-right",
          "place-left",
          "place-bottom",
        );
        this.hoverPreviewEl.classList.add("place-top");
      }
    }

    // Vertical collision boundary checks when placed on left/right
    if (
      this.hoverPreviewEl.classList.contains("place-right") ||
      this.hoverPreviewEl.classList.contains("place-left")
    ) {
      const viewportHeight = window.innerHeight;
      if (rect.top + estHeight > viewportHeight) {
        const diff = rect.top + estHeight - viewportHeight;
        top = Math.max(scrollTop + 10, rect.top + scrollTop - diff - 10);
      }
    }

    this.hoverPreviewEl.style.left = `${left}px`;
    this.hoverPreviewEl.style.top = `${top}px`;
    this.hoverPreviewEl.classList.add("show");
  },

  hideHoverPreview() {
    if (this.hoverPreviewEl) {
      this.hoverPreviewEl.classList.remove("show");
    }
  },

  // ===== High-End Built-in Photo Lightbox Modal Implementation =====
  initLightbox() {
    let lightbox = document.getElementById("lightboxModal");
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightboxModal";
      lightbox.className = "lightbox-modal";
      lightbox.innerHTML = `
                <button class="lightbox-close">&times;</button>
                <button class="lightbox-arrow lightbox-prev"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="lightbox-content">
                    <img id="lightboxImage" src="" alt="Lightbox">
                </div>
                <button class="lightbox-arrow lightbox-next"><i class="fa-solid fa-chevron-right"></i></button>
            `;
      document.body.appendChild(lightbox);
    }

    this.lightboxEl = lightbox;
    this.lightboxImg = lightbox.querySelector("#lightboxImage");
    this.lightboxIndex = 0;

    // Core bindings
    lightbox
      .querySelector(".lightbox-close")
      .addEventListener("click", () => this.closeLightbox());
    lightbox.querySelector(".lightbox-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      this.prevLightbox();
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", (e) => {
      e.stopPropagation();
      this.nextLightbox();
    });
    lightbox.addEventListener("click", (e) => {
      if (
        e.target === lightbox ||
        e.target.closest(".lightbox-content") === null
      ) {
        this.closeLightbox();
      }
    });

    // Event delegation across detail thumbnail frames
    document.body.addEventListener("click", (e) => {
      const item = e.target.closest(".gallery-item");
      if (item) {
        const idx = parseInt(item.getAttribute("data-index"), 10);
        if (!isNaN(idx)) {
          this.openLightbox(idx);
        }
      }
    });

    // Keyboard arrow & escape shortcut hooks
    document.addEventListener("keydown", (e) => {
      if (!this.lightboxEl.classList.contains("show")) return;
      if (e.key === "ArrowLeft") this.prevLightbox();
      else if (e.key === "ArrowRight") this.nextLightbox();
      else if (e.key === "Escape") this.closeLightbox();
    });
  },

  openLightbox(idx) {
    if (!this.detailGalleryImages || this.detailGalleryImages.length === 0)
      return;
    this.lightboxIndex = idx;
    this.lightboxImg.src = this.detailGalleryImages[this.lightboxIndex];
    this.lightboxEl.classList.add("show");
    document.body.style.overflow = "hidden"; // Scroll lock
  },

  closeLightbox() {
    if (this.lightboxEl) {
      this.lightboxEl.classList.remove("show");
      document.body.style.overflow = ""; // Scroll restore
    }
  },

  prevLightbox() {
    if (!this.detailGalleryImages || this.detailGalleryImages.length === 0)
      return;
    this.lightboxIndex =
      (this.lightboxIndex - 1 + this.detailGalleryImages.length) %
      this.detailGalleryImages.length;
    this.lightboxImg.src = this.detailGalleryImages[this.lightboxIndex];
  },

  nextLightbox() {
    if (!this.detailGalleryImages || this.detailGalleryImages.length === 0)
      return;
    this.lightboxIndex =
      (this.lightboxIndex + 1) % this.detailGalleryImages.length;
    this.lightboxImg.src = this.detailGalleryImages[this.lightboxIndex];
  },
};

document.addEventListener('DOMContentLoaded', () => app.init());
