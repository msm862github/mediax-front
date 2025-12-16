// Movies Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Get filter elements
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sortFilter = document.getElementById('sortFilter');
    const qualityFilter = document.getElementById('qualityFilter');
    const moviesGrid = document.getElementById('moviesGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // Get all movie cards
    let allCards = Array.from(document.querySelectorAll('.content-card'));
    let visibleCards = 8; // Number of cards to show initially

    // Filter movies
    function filterMovies() {
        const selectedGenre = genreFilter.value;
        const selectedYear = yearFilter.value;
        const selectedQuality = qualityFilter.value;

        allCards.forEach(card => {
            const cardGenre = card.dataset.genre;
            const cardYear = card.dataset.year;
            const cardQuality = card.dataset.quality;

            let showCard = true;

            // Genre filter
            if (selectedGenre !== 'all' && cardGenre !== selectedGenre) {
                showCard = false;
            }

            // Year filter
            if (selectedYear !== 'all') {
                if (selectedYear === 'older' && parseInt(cardYear) >= 2020) {
                    showCard = false;
                } else if (selectedYear !== 'older' && cardYear !== selectedYear) {
                    showCard = false;
                }
            }

            // Quality filter
            if (selectedQuality !== 'all' && cardQuality !== selectedQuality) {
                showCard = false;
            }

            // Show or hide card
            if (showCard) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease-in-out';
            } else {
                card.style.display = 'none';
            }
        });

        // Update visible cards count
        updateVisibleCards();
    }

    // Sort movies
    function sortMovies() {
        const sortBy = sortFilter.value;
        const cardsArray = Array.from(allCards);

        cardsArray.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return parseInt(b.dataset.year) - parseInt(a.dataset.year);
                case 'rating':
                    const ratingA = parseFloat(a.querySelector('.rating').textContent.trim());
                    const ratingB = parseFloat(b.querySelector('.rating').textContent.trim());
                    return ratingB - ratingA;
                case 'title':
                    const titleA = a.querySelector('.card-title').textContent;
                    const titleB = b.querySelector('.card-title').textContent;
                    return titleA.localeCompare(titleB, 'ar');
                default: // popular
                    return 0;
            }
        });

        // Re-append sorted cards
        cardsArray.forEach(card => {
            moviesGrid.appendChild(card);
        });

        allCards = cardsArray;
    }

    // Update visible cards
    function updateVisibleCards() {
        const visibleMovies = allCards.filter(card => card.style.display !== 'none');

        visibleMovies.forEach((card, index) => {
            if (index < visibleCards) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        // Show/hide load more button
        if (visibleMovies.length <= visibleCards) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'flex';
        }
    }

    // Load more movies
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            visibleCards += 8;
            updateVisibleCards();

            // Scroll to first newly visible card
            const firstNewCard = allCards[visibleCards - 8];
            if (firstNewCard) {
                firstNewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Add event listeners to filters
    if (genreFilter) {
        genreFilter.addEventListener('change', filterMovies);
    }
    if (yearFilter) {
        yearFilter.addEventListener('change', filterMovies);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            sortMovies();
            filterMovies();
        });
    }
    if (qualityFilter) {
        qualityFilter.addEventListener('change', filterMovies);
    }

    // Helper to resolve a content id from a card
    function getContentIdFromCard(card) {
        if (!card) return null;
        return card.dataset.id || card.dataset.contentId || card.dataset.slug || card.querySelector('.card-title')?.textContent.trim();
    }

    // Add to watchlist functionality (uses `js/api.js` MediaApi)
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.stopPropagation();

            const card = this.closest('.content-card');
            const contentId = getContentIdFromCard(card);
            if (!contentId) {
                showNotification('حدث خطأ: معرّف المحتوى غير موجود', 'error');
                return;
            }

            try {
                const added = await window.MediaApi.toggleWatchlist(contentId);
                const svg = this.querySelector('svg');
                if (added) {
                    svg.setAttribute('fill', 'currentColor');
                    showNotification('تمت الإضافة إلى القائمة', 'success');
                } else {
                    svg.setAttribute('fill', 'none');
                    showNotification('تمت الإزالة من القائمة', 'info');
                }
            } catch (err) {
                console.error('Watchlist toggle error', err);
                showNotification('حدث خطأ أثناء تحديث القائمة', 'error');
            }
        });
    });

    // Show notification
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Initial setup
    updateVisibleCards();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .content-card.hidden {
        display: none !important;
    }

    .load-more-container {
        display: flex;
        justify-content: center;
        margin: 3rem 0;
    }

    .load-more-container .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .load-more-container .btn svg {
        width: 1.25rem;
        height: 1.25rem;
    }
`;
document.head.appendChild(style);
