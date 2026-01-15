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

        // Update WhatsApp Link
        var btn = document.getElementById('rentBtn');
        if (btn) {
            var msg = encodeURIComponent('Merhaba, ' + n + ' adet PC kiralamak istiyorum. Plan ve fiyat bilgisi alabilir miyim?');
            btn.href = 'https://wa.me/905437837518?text=' + msg;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> ' + n + ' PC Hemen Kirala';
        }
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
