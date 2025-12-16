document.addEventListener('DOMContentLoaded', function () {
    // Normalize DOM for subscriptions: find inline buttons and convert them
    const planButtons = document.querySelectorAll('.subscribe-btn');
    let manageBtn = document.getElementById('manageSubscriptionBtn');
    let currentEl = document.getElementById('currentSubscription');

    // If HTML hasn't been updated, try to find and assign elements by text
    if (!manageBtn) {
        const possible = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent && b.textContent.includes('إدارة الاشتراك'));
        if (possible) {
            possible.id = 'manageSubscriptionBtn';
            manageBtn = possible;
        }
    }

    if (!currentEl) {
        // find the big plan title paragraph and add id
        const possibleP = Array.from(document.querySelectorAll('p')).find(p => p.textContent && p.textContent.includes('الخطة'));
        if (possibleP) {
            possibleP.id = 'currentSubscription';
            currentEl = possibleP;
        }
    }

    async function refreshStatus() {
        if (!window.MediaApi) return;
        const sub = await window.MediaApi.getSubscription();
        if (sub && sub.expiresAt && sub.expiresAt > Date.now()) {
            currentEl.textContent = `نشترك: ${sub.plan} — ينتهي في ${new Date(sub.expiresAt).toLocaleDateString('ar-EG')}`;
            if (manageBtn) manageBtn.textContent = 'إدارة الاشتراك';
        } else {
            currentEl.textContent = 'أنت غير مشترك حالياً';
            if (manageBtn) manageBtn.textContent = 'اشترك الآن';
        }
    }

    async function doFakePayment(plan) {
        // Simple modal-less fake flow: prompt for last4 digits
        const last4 = prompt('أدخل آخر 4 أرقام من بطاقتك (اختياري)') || null;
        // call MediaApi.subscribe
        const res = await window.MediaApi.subscribe(plan, { method: 'card', last4 });
        window.MediaX && window.MediaX.showNotification && window.MediaX.showNotification('شكراً! تم تفعيل الاشتراك', 'success');
        await refreshStatus();
        return res;
    }

    planButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const plan = btn.dataset.plan || 'basic';
            btn.disabled = true;
            btn.textContent = 'جاري المعالجة...';
            try {
                await doFakePayment(plan);
            } catch (err) {
                window.MediaX && window.MediaX.showNotification && window.MediaX.showNotification('حدث خطأ في الدفع', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = btn.dataset.label || 'ترقية الآن';
            }
        });
    });

    if (manageBtn) {
        manageBtn.addEventListener('click', async () => {
            const sub = await window.MediaApi.getSubscription();
            if (sub) {
                if (confirm('هل تريد إلغاء اشتراكك؟')) {
                    await window.MediaApi.cancelSubscription();
                    window.MediaX && window.MediaX.showNotification && window.MediaX.showNotification('تم إلغاء الاشتراك', 'info');
                    await refreshStatus();
                }
            } else {
                // open basic plan by default
                await doFakePayment('basic');
            }
        });
    }

    refreshStatus();
    // Convert inline onclick alerts into subscribe buttons (if any)
    Array.from(document.querySelectorAll('button[onclick]')).forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes('جاري تحويلك لصفحة الدفع') || onclick.includes('page')) {
            b.removeAttribute('onclick');
            b.classList.add('subscribe-btn');
            if (!b.dataset.label) b.dataset.label = b.textContent.trim() || 'ترقية الآن';
            if (!b.dataset.plan) b.dataset.plan = 'basic';
            b.addEventListener('click', async () => {
                b.disabled = true;
                b.textContent = 'جاري المعالجة...';
                await doFakePayment(b.dataset.plan);
                b.disabled = false;
                b.textContent = b.dataset.label;
            });
        }
    });
});
