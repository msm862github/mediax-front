// MediaX - Main JavaScript File
// ================================

// Global State
const state = {
    isSearchOpen: false,
    currentSlide: 0,
    isScrolled: false
};

// DOM Elements
const elements = {
    header: document.getElementById('header'),
    searchBtn: document.getElementById('searchBtn'),
    searchClose: document.getElementById('searchClose'),
    searchOverlay: document.getElementById('searchOverlay'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sliders: document.querySelectorAll('.content-slider')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeHeader();
    initializeSearch();
    initializeSliders();
    initializeMobileMenu();
    normalizeContentIds();
    initializeCards();
    initializeScrollAnimations();
});

// Assign deterministic data-id attributes to static cards missing them
function normalizeContentIds() {
    const cards = document.querySelectorAll('.content-card');
    const seen = new Set();
    function slugify(text) {
        return (text || '').toString().trim().toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    cards.forEach((card, idx) => {
        if (!card.dataset.id) {
            const title = card.querySelector('.card-title')?.textContent || `content-${idx + 1}`;
            let base = slugify(title) || `content-${idx + 1}`;
            let id = base;
            let i = 1;
            while (seen.has(id)) {
                id = `${base}-${i++}`;
            }
            seen.add(id);
            card.dataset.id = id;
        } else {
            seen.add(card.dataset.id);
        }
    });

    // Remove inline onclick handlers from play buttons so JS handlers manage navigation
    document.querySelectorAll('.play-btn[onclick]').forEach(btn => btn.removeAttribute('onclick'));
}

// Header Scroll Effect
function initializeHeader() {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 50;

        if (scrolled !== state.isScrolled) {
            state.isScrolled = scrolled;
            elements.header.classList.toggle('scrolled', scrolled);
        }
    });
}

// Search Functionality
function initializeSearch() {
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', openSearch);
    }

    if (elements.searchClose) {
        elements.searchClose.addEventListener('click', closeSearch);
    }

    if (elements.searchOverlay) {
        elements.searchOverlay.addEventListener('click', (e) => {
            if (e.target === elements.searchOverlay) {
                closeSearch();
            }
        });
    }

    // Close search on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isSearchOpen) {
            closeSearch();
        }
    });

    // Wire search input to sample data
    const searchInput = document.querySelector('.search-input');
    const resultsContainer = document.querySelector('.search-results');
    let sampleCache = null;

    async function loadSample() {
        if (sampleCache) return sampleCache;
        try {
            const res = await fetch('data/sample_contents.json');
            if (!res.ok) return [];
            sampleCache = await res.json();
            return sampleCache;
        } catch (e) {
            return [];
        }
    }

    const doSearch = debounce(async (term) => {
        if (!resultsContainer) return;
        const q = (term || '').trim().toLowerCase();
        if (!q) {
            resultsContainer.innerHTML = '<p class="search-empty">اكتب للبحث...</p>';
            return;
        }

        const sample = await loadSample();
        const matches = sample.filter(item => {
            return (item.title || '').toLowerCase().includes(q) || (item.genre || '').toLowerCase().includes(q) || (item.type || '').toLowerCase().includes(q);
        }).slice(0, 20);

        if (!matches.length) {
            resultsContainer.innerHTML = '<p class="search-empty">لا توجد نتائج</p>';
            return;
        }

        resultsContainer.innerHTML = '';
        matches.forEach(m => {
            const row = document.createElement('a');
            row.className = 'search-result-item';
            row.href = `details.html?id=${encodeURIComponent(m.id)}`;
            row.innerHTML = `
                <img data-src="https://picsum.photos/seed/${encodeURIComponent(m.imageSeed || m.id)}/80/120" alt="${m.title}">
                <div class="search-result-info"><strong>${m.title}</strong><span>${m.genre || ''} • ${m.year || ''}</span></div>
            `;
            resultsContainer.appendChild(row);
        });

        // ensure lazy load on results
        initializeLazyLoading();
    }, 250);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => doSearch(e.target.value));
    }
}

function openSearch() {
    state.isSearchOpen = true;
    elements.searchOverlay.classList.add('active');

    // Focus on search input
    setTimeout(() => {
        const searchInput = elements.searchOverlay.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }, 300);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeSearch() {
    state.isSearchOpen = false;
    elements.searchOverlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
}

// Content Sliders
function initializeSliders() {
    elements.sliders.forEach((slider, index) => {
        const prevBtn = slider.querySelector('.slider-btn-prev');
        const nextBtn = slider.querySelector('.slider-btn-next');
        const cardsContainer = slider.querySelector('.content-cards');

        if (prevBtn && nextBtn && cardsContainer) {
            prevBtn.addEventListener('click', () => scrollSlider(cardsContainer, 'right'));
            nextBtn.addEventListener('click', () => scrollSlider(cardsContainer, 'left'));

            // Touch/Swipe support
            let startX = 0;
            let scrollLeft = 0;

            cardsContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX - cardsContainer.offsetLeft;
                scrollLeft = cardsContainer.scrollLeft;
            });

            cardsContainer.addEventListener('touchmove', (e) => {
                const x = e.touches[0].pageX - cardsContainer.offsetLeft;
                const walk = (x - startX) * 2;
                cardsContainer.scrollLeft = scrollLeft - walk;
            });
        }
    });
}

function scrollSlider(container, direction) {
    const scrollAmount = container.offsetWidth * 0.8;
    const targetScroll = direction === 'left'
        ? container.scrollLeft + scrollAmount
        : container.scrollLeft - scrollAmount;

    container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
    });
}

// Mobile Menu
function initializeMobileMenu() {
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
        nav.classList.toggle('active');
        elements.mobileMenuBtn.classList.toggle('active');
    }
}

// Card Interactions
function initializeCards() {
    const cards = document.querySelectorAll('.content-card');

    cards.forEach(card => {
        // Play button click
        const playBtn = card.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePlayClick(card);
            });
        }

        // Add to list button
        const addBtn = card.querySelector('.action-btn:first-child');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleAddToList(card);
            });
        }

        // Favorite button
        const favoriteBtn = card.querySelector('.action-btn:last-child');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFavorite(card);
            });
        }

        // Card click - go to details
        card.addEventListener('click', () => {
            handleCardClick(card);
        });
    });

    // Apply saved states (watchlist / favorites) if MediaApi available
    (async function applySavedStates() {
        if (!window.MediaApi) return;
        try {
            const watchlist = await window.MediaApi.getWatchlist();
            const favorites = await window.MediaApi.getFavorites();
            cards.forEach(card => {
                const id = card.dataset.id;
                const addBtn = card.querySelector('.action-btn:first-child');
                const favBtn = card.querySelector('.action-btn:last-child');
                if (id && watchlist.includes(id) && addBtn) addBtn.classList.add('added');
                if (id && favorites.includes(id) && favBtn) favBtn.classList.add('favorited');
            });
        } catch (e) {
            // ignore
        }
    })();
}

function handlePlayClick(card) {
    const id = card.dataset.id || card.dataset.contentId || card.querySelector('.card-title')?.textContent?.trim();
    const title = card.querySelector('.card-title')?.textContent || id;
    console.log('Playing:', title);
    showNotification('جاري تشغيل المحتوى...', 'success');
    // Navigate to player page with content id
    if (id) {
        window.location.href = `player.html?content=${encodeURIComponent(id)}`;
    }
}

function handleAddToList(card) {
    const title = card.querySelector('.card-title')?.textContent;
    const id = card.dataset.id;
    if (!id || !window.MediaApi) {
        showNotification('حدث خطأ في الإضافة', 'error');
        return;
    }
    const btn = card.querySelector('.action-btn:first-child');
    (async () => {
        try {
            const added = await window.MediaApi.toggleWatchlist(id);
            if (added) {
                btn.classList.add('added');
                showNotification('تمت الإضافة إلى قائمة المشاهدة', 'success');
            } else {
                btn.classList.remove('added');
                showNotification('تمت الإزالة من قائمة المشاهدة', 'info');
            }
        } catch (e) {
            showNotification('حدث خطأ في الإضافة', 'error');
        }
    })();
}

function handleFavorite(card) {
    const id = card.dataset.id;
    const btn = card.querySelector('.action-btn:last-child');
    if (!id || !window.MediaApi) {
        showNotification('حدث خطأ', 'error');
        return;
    }
    (async () => {
        try {
            const favorited = await window.MediaApi.toggleFavorite(id);
            if (favorited) {
                btn.classList.add('favorited');
                showNotification('تمت الإضافة إلى المفضلة', 'success');
            } else {
                btn.classList.remove('favorited');
                showNotification('تمت الإزالة من المفضلة', 'info');
            }
        } catch (e) {
            showNotification('حدث خطأ', 'error');
        }
    })();
}

function handleCardClick(card) {
    const id = card.dataset.id || card.dataset.contentId || card.querySelector('.card-title')?.textContent?.trim();
    const title = card.querySelector('.card-title')?.textContent || id;
    console.log('Viewing details for:', title);
    if (id) {
        window.location.href = `details.html?id=${encodeURIComponent(id)}`;
    }
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe content rows
    const rows = document.querySelectorAll('.content-row, .categories-section');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(30px)';
        row.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(row);
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 2rem',
        background: type === 'success' ? 'var(--primary-color)' :
            type === 'error' ? '#dc2626' :
                'var(--secondary-color)',
        color: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: '9999',
        fontWeight: '600',
        animation: 'slideDown 0.3s ease-out',
        fontFamily: 'var(--font-primary)'
    });

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Lazy Loading Images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLazyLoading);
} else {
    initializeLazyLoading();
}

// Export functions for use in other scripts
window.MediaX = {
    showNotification,
    openSearch,
    closeSearch,
    scrollSlider
};

console.log('MediaX initialized successfully! 🎬');

// --- Seed demo content from `data/sample_contents.json` if present ---
(function seedDemoContent() {
    async function fetchSample() {
        try {
            const res = await fetch('data/sample_contents.json');
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    function makeCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.id;
        card.dataset.genre = item.genre || '';
        card.dataset.year = item.year || '';
        card.dataset.quality = item.quality || '';

        const imgUrl = `https://picsum.photos/seed/${encodeURIComponent(item.imageSeed || item.id)}/300/450`;

        card.innerHTML = `
            <div class="card-image">
                <img data-src="${imgUrl}" alt="${item.title}">
                <div class="card-overlay">
                    <button class="play-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <div class="card-actions">
                        <button class="action-btn" title="أضف للقائمة">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                        <button class="action-btn" title="المفضلة">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <span class="card-badge">${item.quality || ''}</span>
            </div>
            <div class="card-info">
                <h4 class="card-title">${item.title}</h4>
                <div class="card-meta">
                    <span class="rating">${item.rating}</span>
                    <span class="year">${item.year}</span>
                </div>
            </div>
        `;

        return card;
    }

    async function seed() {
        const sample = await fetchSample();
        if (!sample || !sample.length) return;

        const cardContainers = Array.from(document.querySelectorAll('.content-cards'))
            .concat(Array.from(document.querySelectorAll('.content-grid')));

        cardContainers.forEach(container => {
            // If container already has many items, skip
            if (container.querySelectorAll('.content-card').length >= 8) return;

            // Add up to 12 demo cards
            for (let i = 0; i < Math.min(12, sample.length); i++) {
                const item = sample[i % sample.length];
                const card = makeCard(item);
                container.appendChild(card);
            }
        });

        // After adding cards, initialize lazy loading and card behaviors
        initializeLazyLoading();
        initializeCards();

        // Update watchlist count if present
        const watchlistCountEl = document.getElementById('watchlistCount');
        if (watchlistCountEl) {
            const grid = document.querySelector('.content-grid');
            const count = grid ? grid.querySelectorAll('.content-card').length : 0;
            watchlistCountEl.textContent = `لديك ${count} عناصر في القائمة`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', seed);
    } else {
        seed();
    }
})();
