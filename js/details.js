// MediaX - Details Page JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeSeasonSelector();
    initializeEpisodeCards();
    initializeTrailerButton();
    initializeReviewActions();
    loadContentFromQuery();
});

async function loadContentFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    // try to load sample data
    let sample = [];
    try {
        const res = await fetch('data/sample_contents.json');
        sample = await res.json();
    } catch (e) {
        console.warn('No sample data available', e);
    }

    const item = sample.find(s => s.id === id);
    if (!item) return;

    // Populate title, poster, meta
    const titleEl = document.querySelector('.details-title') || document.querySelector('#detailsTitle');
    if (titleEl) {
        titleEl.textContent = item.title;
        titleEl.dataset.id = item.id;
    }

    const poster = document.querySelector('.details-poster img') || document.querySelector('#detailsPoster');
    if (poster) {
        const src = `https://picsum.photos/seed/${encodeURIComponent(item.imageSeed || item.id)}/600/900`;
        if (poster.tagName.toLowerCase() === 'img') poster.src = src; else poster.style.backgroundImage = `url(${src})`;
    }

    const desc = document.querySelector('.details-description');
    if (desc) desc.textContent = item.description || `وصف تجريبي لـ ${item.title}`;

    // Similar content
    const similarGrid = document.querySelector('.similar-grid');
    if (similarGrid && sample && sample.length) {
        similarGrid.innerHTML = '';
        sample.slice(0, 6).forEach(s => {
            if (s.id === item.id) return;
            const card = document.createElement('div');
            card.className = 'content-card';
            card.dataset.id = s.id;
            card.innerHTML = `
                <div class="card-image">
                    <img data-src="https://picsum.photos/seed/${encodeURIComponent(s.imageSeed || s.id)}/300/450" alt="${s.title}">
                    <div class="card-overlay"><button class="play-btn"></button></div>
                </div>
                <div class="card-info"><h4 class="card-title">${s.title}</h4></div>
            `;
            similarGrid.appendChild(card);
        });
        initializeLazyLoading();
        initializeCards();
    }

    // Episodes / Seasons (if series)
    const episodesGrid = document.querySelector('.episodes-grid');
    const seasonContainer = document.querySelector('.season-selector');
    if (episodesGrid) {
        episodesGrid.innerHTML = '';

        if (item.seasons && Array.isArray(item.seasons) && item.seasons.length) {
            // render season buttons
            if (seasonContainer) {
                seasonContainer.innerHTML = '';
                item.seasons.forEach(s => {
                    const btn = document.createElement('button');
                    btn.className = 'season-btn';
                    btn.dataset.season = s.season;
                    btn.textContent = `الموسم ${s.season}`;
                    seasonContainer.appendChild(btn);
                });
                // make first season active and load
                const first = seasonContainer.querySelector('.season-btn');
                if (first) {
                    first.classList.add('active');
                    loadSeasonEpisodes(first.dataset.season, item);
                }
            } else {
                // fallback: just list episodes of first season
                const s = item.seasons[0];
                renderEpisodesList(s.episodes, item.title);
            }
        } else {
            // legacy: numeric episodes count
            const epCount = item.episodes || 8;
            const eps = [];
            for (let i = 1; i <= epCount; i++) eps.push({ id: item.id + '-ep' + i, title: `${item.title} - حلقة ${i}`, duration: 25 + i, imageSeed: item.id + '-ep' + i });
            renderEpisodesList(eps, item.title);
        }

        initializeLazyLoading();
        initializeEpisodeCards();
    }

    // Wire watch now button to player
    const watchNowBtn = document.querySelector('.details-actions .btn-primary');
    if (watchNowBtn) {
        watchNowBtn.addEventListener('click', () => {
            window.location.href = `player.html?content=${encodeURIComponent(item.id)}`;
        });
    }
}

function fmtMinutes(m) {
    return (Math.floor(m) + ' دقيقة');
}

// Season Selector
function initializeSeasonSelector() {
    const seasonBtns = document.querySelectorAll('.season-btn');

    seasonBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            seasonBtns.forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Get season number
            const season = btn.dataset.season;

            // Load episodes for this season
            loadSeasonEpisodes(season);
        });
    });
}

async function loadSeasonEpisodes(season) {
    console.log(`Loading episodes for season ${season}`);

    // Show loading state
    const episodesGrid = document.querySelector('.episodes-grid');
    if (!episodesGrid) return;

    episodesGrid.style.opacity = '0.5';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));

        // Find current item on the page to get seasons data
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        let sample = [];
        try { const res = await fetch('data/sample_contents.json'); sample = await res.json(); } catch (e) { }
        const item = sample.find(s => s.id === id);
        if (!item || !item.seasons) {
            episodesGrid.style.opacity = '1';
            return;
        }

        const seasonObj = item.seasons.find(s => String(s.season) === String(season));
        if (seasonObj) {
            renderEpisodesList(seasonObj.episodes, item.title);
        }

        // Restore opacity
        episodesGrid.style.opacity = '1';

        if (window.MediaX) {
            window.MediaX.showNotification(`تم تحميل حلقات الموسم ${season}`, 'success');
        }
    } catch (error) {
        console.error('Error loading episodes:', error);
        episodesGrid.style.opacity = '1';
    }
}

function renderEpisodesList(episodes, seriesTitle) {
    const episodesGrid = document.querySelector('.episodes-grid');
    if (!episodesGrid) return;
    episodesGrid.innerHTML = '';
    episodes.forEach(ep => {
        const epCard = document.createElement('div');
        epCard.className = 'episode-card';
        epCard.innerHTML = `
            <div class="episode-thumb"><img data-src="https://picsum.photos/seed/${encodeURIComponent(ep.imageSeed || ep.id)}/400/225" alt="${ep.title}"></div>
            <div class="episode-info"><h5 class="episode-title">${ep.title}</h5><p class="episode-meta">${fmtMinutes(ep.duration || 45)} • ${new Date().getFullYear()}</p></div>
            <div class="episode-actions"><button class="play-btn-small">تشغيل</button></div>
        `;
        episodesGrid.appendChild(epCard);
    });
}

// Episode Cards
function initializeEpisodeCards() {
    const episodeCards = document.querySelectorAll('.episode-card');

    episodeCards.forEach(card => {
        const playBtn = card.querySelector('.play-btn-small');

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleEpisodePlay(card);
            });
        }

        card.addEventListener('click', () => {
            handleEpisodeClick(card);
        });
    });
}

function handleEpisodePlay(card) {
    const title = card.querySelector('.episode-title')?.textContent;
    console.log('Playing episode:', title);

    if (window.MediaX) {
        window.MediaX.showNotification('جاري تشغيل الحلقة...', 'success');
    }

    // TODO: Navigate to player page
    // window.location.href = `player.html?episode=${episodeId}`;
}

function handleEpisodeClick(card) {
    const title = card.querySelector('.episode-title')?.textContent;
    console.log('Episode clicked:', title);

    // Could show episode details modal or navigate to player
}

// Trailer Button
function initializeTrailerButton() {
    const trailerBtn = document.querySelector('.trailer-btn');

    if (trailerBtn) {
        trailerBtn.addEventListener('click', () => {
            openTrailerModal();
        });
    }
}

function openTrailerModal() {
    console.log('Opening trailer modal');

    if (window.MediaX) {
        window.MediaX.showNotification('جاري تحميل الإعلان...', 'info');
    }

    // TODO: Create and show video modal
    // createVideoModal('trailer-url.mp4');
}

// Review Actions
function initializeReviewActions() {
    const reviewActionBtns = document.querySelectorAll('.review-action-btn');

    reviewActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleReviewAction(btn);
        });
    });
}

function handleReviewAction(btn) {
    const action = btn.textContent.includes('مفيد') ? 'helpful' : 'reply';

    if (action === 'helpful') {
        toggleHelpful(btn);
    } else if (action === 'reply') {
        showReplyForm(btn);
    }
}

function toggleHelpful(btn) {
    const isActive = btn.classList.contains('active');

    if (isActive) {
        btn.classList.remove('active');
        btn.style.color = '';
        console.log('Removed helpful vote');
    } else {
        btn.classList.add('active');
        btn.style.color = 'var(--primary-color)';
        console.log('Added helpful vote');

        if (window.MediaX) {
            window.MediaX.showNotification('شكراً لتقييمك!', 'success');
        }
    }
}

function showReplyForm(btn) {
    const reviewCard = btn.closest('.review-card');

    // Check if reply form already exists
    if (reviewCard.querySelector('.reply-form')) {
        return;
    }

    // Create reply form
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <textarea class="reply-input" placeholder="اكتب ردك هنا..." rows="3"></textarea>
        <div class="reply-actions">
            <button class="btn btn-primary btn-sm submit-reply">إرسال</button>
            <button class="btn btn-secondary btn-sm cancel-reply">إلغاء</button>
        </div>
    `;

    // Add styles
    Object.assign(replyForm.style, {
        marginTop: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    });

    reviewCard.appendChild(replyForm);

    // Focus on textarea
    const textarea = replyForm.querySelector('.reply-input');
    textarea.focus();

    // Handle submit
    const submitBtn = replyForm.querySelector('.submit-reply');
    submitBtn.addEventListener('click', () => {
        const replyText = textarea.value.trim();

        if (replyText) {
            console.log('Submitting reply:', replyText);

            if (window.MediaX) {
                window.MediaX.showNotification('تم إرسال الرد بنجاح!', 'success');
            }

            replyForm.remove();
        } else {
            if (window.MediaX) {
                window.MediaX.showNotification('الرجاء كتابة رد', 'error');
            }
        }
    });

    // Handle cancel
    const cancelBtn = replyForm.querySelector('.cancel-reply');
    cancelBtn.addEventListener('click', () => {
        replyForm.remove();
    });
}

// Add to Watchlist (uses `js/api.js` MediaApi)
const addToListBtn = document.querySelector('.details-actions .btn-secondary');
function getContentIdFromPage() {
    const page = document.querySelector('.details-page') || document.body;
    return page.dataset.id || page.dataset.contentId || document.querySelector('.details-title')?.dataset.id || document.querySelector('.details-title')?.textContent?.trim();
}

if (addToListBtn) {
    addToListBtn.addEventListener('click', async () => {
        const contentId = getContentIdFromPage();
        if (!contentId) {
            if (window.MediaX) window.MediaX.showNotification('معرّف المحتوى غير موجود', 'error');
            return;
        }

        try {
            const added = await window.MediaApi.toggleWatchlist(contentId);
            if (added) {
                addToListBtn.classList.add('added');
                addToListBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                    </svg>
                    في القائمة
                `;

                if (window.MediaX) window.MediaX.showNotification('تمت الإضافة إلى قائمة المشاهدة', 'success');
            } else {
                addToListBtn.classList.remove('added');
                addToListBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    أضف للقائمة
                `;

                if (window.MediaX) window.MediaX.showNotification('تمت الإزالة من قائمة المشاهدة', 'info');
            }
        } catch (err) {
            console.error('Watchlist toggle error', err);
            if (window.MediaX) window.MediaX.showNotification('حدث خطأ أثناء تحديث القائمة', 'error');
        }
    });
}

// Add to Favorites (uses `js/api.js` MediaApi)
const favoriteBtn = document.querySelectorAll('.details-actions .btn-icon')[0];
if (favoriteBtn) {
    favoriteBtn.addEventListener('click', async () => {
        const contentId = getContentIdFromPage();
        if (!contentId) {
            if (window.MediaX) window.MediaX.showNotification('معرّف المحتوى غير موجود', 'error');
            return;
        }

        try {
            const added = await window.MediaApi.toggleFavorite(contentId);
            if (added) {
                favoriteBtn.classList.add('favorited');
                favoriteBtn.querySelector('svg').style.fill = 'currentColor';
                if (window.MediaX) window.MediaX.showNotification('تمت الإضافة إلى المفضلة', 'success');
            } else {
                favoriteBtn.classList.remove('favorited');
                favoriteBtn.querySelector('svg').style.fill = 'none';
                if (window.MediaX) window.MediaX.showNotification('تمت الإزالة من المفضلة', 'info');
            }
        } catch (err) {
            console.error('Favorite toggle error', err);
            if (window.MediaX) window.MediaX.showNotification('حدث خطأ أثناء تحديث المفضلة', 'error');
        }
    });
}

// Share Button
const shareBtn = document.querySelectorAll('.details-actions .btn-icon')[1];
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        handleShare();
    });
}

async function handleShare() {
    const title = document.querySelector('.details-title')?.textContent || 'MediaX';
    const url = window.location.href;

    // Check if Web Share API is supported
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: `شاهد ${title} على MediaX`,
                url: url
            });

            console.log('Shared successfully');
        } catch (error) {
            console.log('Share cancelled or failed:', error);
        }
    } else {
        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(url);

            if (window.MediaX) {
                window.MediaX.showNotification('تم نسخ الرابط!', 'success');
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }
}

// Watch Now Button
const watchNowBtn = document.querySelector('.details-actions .btn-primary');
if (watchNowBtn) {
    watchNowBtn.addEventListener('click', () => {
        const title = document.querySelector('.details-title')?.textContent;
        console.log('Starting playback:', title);

        if (window.MediaX) {
            window.MediaX.showNotification('جاري التحميل...', 'info');
        }

        // TODO: Navigate to player
        // window.location.href = `player.html?content=${contentId}`;
    });
}

// Smooth scroll to sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Lazy load images in episodes
const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
};

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        }
    });
}, observerOptions);

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

console.log('Details page initialized! 🎬');
