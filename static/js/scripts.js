

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['home', 'publications', 'awards']
const supported_languages = ['en', 'zh']
let site_config = {}
let render_version = 0
const ui_text = {
    en: { home: 'HOME', publications: 'PUBLICATIONS', awards: 'AWARDS', analytics: 'ANALYTICS', language: '中文', languageLabel: '切换语言' },
    zh: { home: '首页', publications: '发表论文', awards: '获奖情况', analytics: '数据统计', language: 'EN', languageLabel: 'Switch language' }
}

function getLanguage() {
    const queryLanguage = new URLSearchParams(window.location.search).get('lang')
    if (supported_languages.includes(queryLanguage)) return queryLanguage
    let savedLanguage
    try { savedLanguage = window.localStorage.getItem('site-language') } catch {}
    if (supported_languages.includes(savedLanguage)) return savedLanguage
    return 'en'
}

function loadMarkdown(name, language) {
    if (language === 'en') return fetch(content_dir + name + '.md').then(response => {
        if (!response.ok) throw new Error('Content unavailable')
        return response.text()
    })
    const localizedPath = content_dir + name + '-' + language + '.md'
    return fetch(localizedPath).then(response => {
        if (!response.ok) throw new Error('Localized content unavailable')
        return response.text()
    }).catch(() => fetch(content_dir + name + '.md').then(response => {
        if (!response.ok) throw new Error('Content unavailable')
        return response.text()
    }))
}

function renderLanguage(language) {
    const version = ++render_version
    const text = ui_text[language]
    Object.keys(site_config).filter(key => !key.endsWith('-zh')).forEach(key => {
        const element = document.getElementById(key)
        if (element) element.innerHTML = language === 'zh' && site_config[key + '-zh'] !== undefined ? site_config[key + '-zh'] : site_config[key]
    })
    document.documentElement.lang = language
    document.getElementById('home-nav').textContent = text.home
    document.getElementById('publications-nav').textContent = text.publications
    document.getElementById('awards-nav').textContent = text.awards
    document.getElementById('analytics-nav').textContent = text.analytics
    const toggle = document.getElementById('language-toggle')
    toggle.textContent = text.language
    toggle.setAttribute('aria-label', text.languageLabel)
    document.getElementById('publications-subtitle').innerHTML = '<i class="bi bi-file-text-fill"></i>&nbsp;' + text.publications
    document.getElementById('awards-subtitle').innerHTML = '<i class="bi bi-award-fill"></i>&nbsp;' + text.awards
    document.getElementById('analytics-title').innerHTML = '<i class="bi bi-graph-up"></i>&nbsp;' + text.analytics
    document.querySelector('.navbar-toggler').setAttribute('aria-label', language === 'zh' ? '展开导航' : 'Toggle navigation')
    try { window.localStorage.setItem('site-language', language) } catch {}
    section_names.forEach(name => loadMarkdown(name, language).then(markdown => {
        if (version !== render_version) return
        document.getElementById(name + '-md').innerHTML = marked.parse(markdown)
        if (window.MathJax && MathJax.typesetPromise) return MathJax.typesetPromise([document.getElementById(name + '-md')])
    }).catch(error => console.log(error)))
}


window.addEventListener('DOMContentLoaded', event => {
    let language = getLanguage()
    document.getElementById('language-toggle').addEventListener('click', () => {
        language = language === 'en' ? 'zh' : 'en'
        const url = new URL(window.location.href)
        url.searchParams.set('lang', language)
        window.history.replaceState(null, '', url)
        renderLanguage(language)
    })

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });


    // Yaml
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            site_config = yml
            Object.keys(yml).forEach(key => {
                if (key.endsWith('-zh')) return
                const localizedKey = language === 'zh' && Object.prototype.hasOwnProperty.call(yml, key + '-zh') ? key + '-zh' : key
                try {
                    const element = document.getElementById(key)
                    if (element) element.innerHTML = yml[localizedKey]
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[localizedKey].toString())
                }

            })
            renderLanguage(language)

            // Google Analytics (optional)
            try {
                const measurementId = (yml['ga-measurement-id'] || '').toString().trim();
                if (measurementId) {
                    const gaScript = document.createElement('script');
                    gaScript.async = true;
                    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
                    document.head.appendChild(gaScript);

                    window.dataLayer = window.dataLayer || [];
                    function gtag() { window.dataLayer.push(arguments); }
                    window.gtag = gtag;
                    gtag('js', new Date());
                    gtag('config', measurementId);
                }
            } catch (error) {
                console.log('Google Analytics init failed:', error);
            }

            // Visualization embed (optional, usually Looker Studio)
            try {
                const iframeUrl = (yml['analytics-iframe-url'] || '').toString().trim();
                const iframeHeight = (yml['analytics-iframe-height'] || '56.25%').toString().trim();
                const iframeEl = document.getElementById('analytics-iframe');
                const ratioEl = document.getElementById('analytics-ratio');
                const analyticsSection = document.getElementById('analytics');
                if (iframeEl && ratioEl && iframeUrl) {
                    iframeEl.src = iframeUrl;
                    ratioEl.style.setProperty('--bs-aspect-ratio', iframeHeight);
                } else if (analyticsSection) {
                    analyticsSection.style.display = 'none';
                }
            } catch (error) {
                console.log('Analytics visualization init failed:', error);
            }
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    renderLanguage(language)

}); 
