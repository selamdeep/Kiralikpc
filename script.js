(function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    function current() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
    function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('theme', t); } catch (e) { } btn.textContent = t === 'dark' ? '🌙' : '☀️'; btn.setAttribute('aria-pressed', t === 'dark'); }
    setTheme(current());
    btn.addEventListener('click', function () { setTheme(current() === 'dark' ? 'light' : 'dark'); });
})();
// Basit i18n (TR/EN)
(function i18n() {
    var inline = null;
    function setLang(l, dict) {
        try { localStorage.setItem('lang', l); } catch (e) { }
        document.documentElement.setAttribute('lang', l);
        var t = dict || inline || {};
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (t[key]) el.innerHTML = t[key];
        });
        document.querySelectorAll('[data-i18n-plan]').forEach(function (card) {
            var planKey = card.getAttribute('data-i18n-plan');
            var map = { hourly: 'Saatlik', daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
            var mapEn = { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
            card.setAttribute('data-plan', l === 'en' ? mapEn[planKey] : map[planKey]);
        });
    }
    var init = (function () { try { var u = new URL(location.href); return u.searchParams.get('lang') || localStorage.getItem('lang') || 'tr'; } catch (e) { return 'tr'; } })();
    function loadDict(lang) {
        return fetch('i18n.' + lang + '.json').then(function (r) { return r.ok ? r.json() : null }).catch(function () { return null });
    }
    loadDict(init).then(function (json) { if (json) { inline = json; } setLang(init, inline); });
    var btn = document.getElementById('langToggle');
    if (btn) { btn.addEventListener('click', function () { var next = (document.documentElement.getAttribute('lang') === 'tr') ? 'en' : 'tr'; loadDict(next).then(function (json) { if (json) { inline = json; } setLang(next, inline); }); }); }
})();
// Scroll to top button
(function toTop() {
    var btn = document.getElementById('toTop'); if (!btn) return;
    window.addEventListener('scroll', function () { btn.style.display = (window.scrollY > 400) ? 'inline-flex' : 'none'; });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();

// Yıl ve fiyatları configten çek
document.getElementById('yil').textContent = new Date().getFullYear();
function applyPrices(src) {
    if (!src) return;
    var h = src.hour, d = src.day, w = src.week, m = src.month;
    if (h) document.getElementById('p_hour').textContent = h;
    if (d) document.getElementById('p_day').textContent = d;
    if (w) document.getElementById('p_week').textContent = w;
    if (m) document.getElementById('p_month').textContent = m;
    window.sitePricing = src;
    try { document.dispatchEvent(new CustomEvent('prices:updated', { detail: src })); } catch (e) { }
}
(function syncPrices() {
    if (window.sitePricing) applyPrices(window.sitePricing);
    fetch('prices.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null }).then(function (json) { if (json) applyPrices(json); }).catch(function () { });
})();
// WhatsApp linklerini dinamikleştir
(function syncWhatsApp() {
    if (!window.whatsapp) return;
    var anchors = document.querySelectorAll('a[href^="https://wa.me/"], a.plan-wa');
    function utm() {
        var u = new URL(location.href);
        var src = u.searchParams.get('utm_source') || 'site';
        var med = u.searchParams.get('utm_medium') || 'direct';
        var cmp = u.searchParams.get('utm_campaign') || '';
        var parts = ['utm_source=' + src, 'utm_medium=' + med]; if (cmp) parts.push('utm_campaign=' + cmp); return parts.join('&');
    }
    anchors.forEach(function (a) {
        try {
            var msg = '';
            if (a.classList.contains('plan-wa')) {
                var card = a.closest('.price-card');
                var plan = card?.getAttribute('data-plan') || '';
                var priceElSel = card?.getAttribute('data-price-el') || '';
                var priceVal = priceElSel ? (document.querySelector(priceElSel)?.textContent || '').trim() : '';
                var lang = document.documentElement.getAttribute('lang') || 'tr';
                if (lang === 'en') {
                    msg = 'Hello, I would like to get info about ' + plan + ' PC rental. Price: ₺' + priceVal + '. (source: site)';
                } else {
                    msg = 'Merhaba, ' + plan + ' PC kiralama için bilgi almak istiyorum. Fiyat: ₺' + priceVal + '. (kaynak: site)';
                }
            } else {
                var url = new URL(a.href);
                msg = url.searchParams.get('text') || '';
            }
            var base = 'https://wa.me/' + window.whatsapp + (msg ? ('?text=' + encodeURIComponent(msg)) : '');
            var tag = utm();
            a.href = base + (base.includes('?') ? '&' : '?') + tag;
            a.setAttribute('rel', 'noopener noreferrer');
        } catch (e) { }
    });
})();
// Mailto dinamik: konu ve gövde plan kartına göre
(function dynamicMailto() {
    var mail = document.querySelector('a[href^="mailto:"]'); if (!mail) return;
    function utm() {
        var u = new URL(location.href);
        var src = u.searchParams.get('utm_source') || 'site';
        var med = u.searchParams.get('utm_medium') || 'direct';
        var cmp = u.searchParams.get('utm_campaign') || '';
        var parts = ['utm_source=' + src, 'utm_medium=' + med]; if (cmp) parts.push('utm_campaign=' + cmp); return parts.join('&');
    }
    var selected = document.querySelector('.price-card');
    var plan = selected?.getAttribute('data-plan') || 'PC Kiralama';
    var body = 'Merhaba, ' + plan + ' PC kiralama hakkında bilgi almak istiyorum.';
    var url = new URL(mail.href);
    url.searchParams.set('subject', plan + " Hk.");
    url.searchParams.set('body', body + "\n\n" + utm());
    mail.href = url.toString();
})();
// Plausible Analytics (privacy-friendly)
(function loadPlausible() {
    var s = document.createElement('script');
    s.defer = true; s.setAttribute('data-domain', 'www.pattyburg.com');
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
})();
// CTA click tracking (Plausible)
(function trackCTAs() {
    function track(name, props) {
        if (window.plausible) { window.plausible(name, { props: props }); }
    }
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a,button'); if (!a) return;
        if (a.matches('a[href^="https://wa.me/"]')) track('cta:whatsapp', { id: a.textContent.trim() });
        if (a.matches('a[href^="#fiyat"]')) track('cta:planlari-gor');
        if (a.id === 'themeToggle') track('ui:theme-toggle', { to: document.documentElement.getAttribute('data-theme') });
    });
})();

// JSON-LD: Service + FAQPage
(function addJsonLd() {
    function render() {
        var low = (window.sitePricing && window.sitePricing.hour) ? String(window.sitePricing.hour) : '25';
        var high = (window.sitePricing && window.sitePricing.month) ? String(window.sitePricing.month) : '3200';
        var service = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "PC Kiralama",
            "areaServed": "TR",
            "serviceType": "Remote PC Rental",
            "provider": { "@type": "Organization", "name": "PC Kiralama" },
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": low,
                "highPrice": high,
                "priceCurrency": "TRY"
            }
        };
        var faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                { "@type": "Question", "name": "Bot kurabilir miyim?", "acceptedAnswer": { "@type": "Answer", "text": "Evet, kullanıcı sorumluluğunda; yasa dışı işlemler yasaktır." } },
                { "@type": "Question", "name": "Hangi bağlantı yöntemleri var?", "acceptedAnswer": { "@type": "Answer", "text": "RDP varsayılan, Parsec ve AnyDesk desteklenir." } },
                { "@type": "Question", "name": "Gecikme ve hız nasıl?", "acceptedAnswer": { "@type": "Answer", "text": "İstanbul lokasyon; Türkiye içi düşük gecikme, bağlantınıza bağlıdır." } }
            ]
        };
        var el1 = document.getElementById('jsonld-service');
        var el2 = document.getElementById('jsonld-faq');
        if (!el1) { el1 = document.createElement('script'); el1.type = 'application/ld+json'; el1.id = 'jsonld-service'; document.head.appendChild(el1); }
        if (!el2) { el2 = document.createElement('script'); el2.type = 'application/ld+json'; el2.id = 'jsonld-faq'; document.head.appendChild(el2); }
        el1.textContent = JSON.stringify(service);
        el2.textContent = JSON.stringify(faq);
    }
    render();
    document.addEventListener('prices:updated', render);
})();
// PC Configurator Logic
(function vizConfig() {
    var slider = document.getElementById('pcSlider');
    var countEl = document.getElementById('pcCount');
    var priceEl = document.getElementById('estPrice');
    var viz = document.getElementById('pcViz');
    if (!slider) return;

    function update() {
        var n = parseInt(slider.value);
        countEl.textContent = n;

        // Pricing Logic
        // 5+ PCs: 5% discount
        // 10+ PCs: 10% discount (Max)
        var unitPrice = 3200;
        if (n >= 10) {
            unitPrice *= 0.90;
        } else if (n >= 5) {
            unitPrice *= 0.95;
        }

        priceEl.textContent = Math.floor(n * unitPrice).toLocaleString('tr-TR');
    }

    slider.addEventListener('input', update);
    update(); // Init
})();

// Service Worker kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (reg) {
            if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            reg.addEventListener('updatefound', function () {
                var nw = reg.installing; if (!nw) return;
                nw.addEventListener('statechange', function () {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                        reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
        }).catch(function () { });
    });
}
