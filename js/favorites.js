document.addEventListener('DOMContentLoaded', async function () {
    if (!window.MediaApi) return;
    const grid = document.querySelector('.content-grid');

    function makeCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.id;
        const imgUrl = `https://picsum.photos/seed/${encodeURIComponent(item.imageSeed || item.id)}/300/450`;
        card.innerHTML = `
            <div class="card-image">
                <img data-src="${imgUrl}" alt="${item.title}">
                <div class="card-overlay">
                    <button class="play-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"/></svg>
                    </button>
                    <div class="card-actions">
                        <button class="action-btn remove-btn" title="إزالة">✖</button>
                    </div>
                </div>
                <span class="card-badge">${item.quality || ''}</span>
            </div>
            <div class="card-info">
                <h4 class="card-title">${item.title}</h4>
                <div class="card-meta"><span class="rating">${item.rating}</span><span class="year">${item.year}</span></div>
            </div>
        `;
        return card;
    }

    const ids = await window.MediaApi.getFavorites();
    let sample = [];
    try {
        const res = await fetch('data/sample_contents.json');
        sample = await res.json();
    } catch (e) { }

    const items = ids.map(id => sample.find(s => s.id === id)).filter(Boolean);
    grid.innerHTML = '';
    items.forEach(it => grid.appendChild(makeCard(it)));

    window.initializeLazyLoading && initializeLazyLoading();
    window.initializeCards && initializeCards();

    grid.addEventListener('click', async (e) => {
        const btn = e.target.closest('.remove-btn');
        if (!btn) return;
        const card = btn.closest('.content-card');
        const id = card?.dataset.id;
        if (!id) return;
        await window.MediaApi.toggleFavorite(id);
        card.remove();
        window.MediaX && window.MediaX.showNotification && window.MediaX.showNotification('تمت الإزالة من المفضلة', 'info');
    });
});
