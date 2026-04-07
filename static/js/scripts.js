

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['home', 'publications', 'awards']


window.addEventListener('DOMContentLoaded', event => {

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
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }

            })

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
                if (iframeEl && ratioEl && iframeUrl) {
                    iframeEl.src = iframeUrl;
                    ratioEl.style.setProperty('--bs-aspect-ratio', iframeHeight);
                } else if (iframeEl && ratioEl) {
                    ratioEl.style.display = 'none';
                    const noteEl = document.getElementById('analytics-note');
                    if (noteEl) {
                        noteEl.innerHTML = 'Visualization is ready. Please set analytics-iframe-url in contents/config.yml to show your Looker Studio dashboard.';
                    }
                }
            } catch (error) {
                console.log('Analytics visualization init failed:', error);
            }
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    section_names.forEach((name, idx) => {
        fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            }).then(() => {
                // MathJax
                MathJax.typeset();
            })
            .catch(error => console.log(error));
    })

}); 
