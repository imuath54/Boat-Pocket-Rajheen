/*
 * Regression test for the DOMContentLoaded initialization cascade.
 *
 * Defect (fixed): initChart() called `new Chart(...)` without checking that
 * the CDN-hosted Chart.js global had actually loaded. When the CDN was
 * blocked, offline, or filtered by an ad blocker, the ReferenceError escaped
 * the DOMContentLoaded handler and every initializer registered after
 * initChart() never ran -- the mobile nav, smooth scrolling, contact form,
 * pricing buttons, header scroll effect and scroll animations were all dead.
 *
 * The test loads the page with the Chart.js request blocked on purpose, so it
 * reproduces that condition regardless of the machine's network access.
 *
 * Prerequisite: playwright (with a Chromium build) must be importable.
 * Run:  node tests/init-resilience.test.js
 */

const path = require('path');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    console.log('SKIP: playwright is not installed; cannot run DOM regression test.');
    process.exit(0);
}

const PAGE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const failures = [];

function check(name, condition, detail) {
    if (condition) {
        console.log('  PASS  ' + name);
    } else {
        console.log('  FAIL  ' + name + ' -- ' + detail);
        failures.push(name);
    }
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error)));

    const warnings = [];
    page.on('console', message => {
        if (message.type() === 'warning') warnings.push(message.text());
    });

    // Simulate an unavailable CDN: Chart.js never loads.
    await page.route('**/chart.min.js', route => route.abort());

    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    console.log('Chart.js blocked -- page must still initialize every feature:');

    check('no uncaught page error', pageErrors.length === 0, pageErrors.join(' | '));

    // initMobileNav(): clicking the toggle must flip the menu's active class.
    const navToggled = await page.evaluate(() => {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (!toggle || !menu) return null;
        toggle.click();
        return menu.classList.contains('active');
    });
    check('initMobileNav attached its click handler', navToggled === true, 'menu did not activate (got ' + navToggled + ')');

    // Scroll-animation setup runs after the initializers and sets inline opacity.
    const cardOpacity = await page.evaluate(() => {
        const card = document.querySelector('.feature-card');
        return card ? card.style.opacity : null;
    });
    check('scroll-animation setup ran', cardOpacity === '0', 'expected inline opacity "0", got ' + JSON.stringify(cardOpacity));

    // initContactForm(): a filled submit must be intercepted and confirmed.
    const dialogs = [];
    page.on('dialog', async dialog => {
        dialogs.push(dialog.message());
        await dialog.dismiss();
    });
    await page.fill('.contact-form input[type=text]', 'Regression');
    await page.fill('.contact-form input[type=email]', 'regression@example.invalid');
    await page.fill('.contact-form textarea', 'message body');
    await page.click('.contact-form button[type=submit]');
    await page.waitForTimeout(2600);
    check('initContactForm attached its submit handler', dialogs.length > 0, 'no dialog was raised; the form fell through to a native submit');

    // The chart itself is expected to be absent, but silently and without throwing.
    const chartMissing = await page.evaluate(() => typeof window.Chart === 'undefined');
    check('chart degraded gracefully', chartMissing === true, 'Chart global unexpectedly present; test did not exercise the blocked-CDN path');

    // initChart must detect the missing global itself and say so, rather than
    // throwing and relying on the surrounding try/catch to contain the damage.
    check('initChart reported the missing Chart.js global',
        warnings.some(text => text.indexOf('Chart.js unavailable') !== -1),
        'expected a console warning from initChart; got ' + JSON.stringify(warnings));

    await browser.close();

    console.log('');
    if (failures.length > 0) {
        console.log('FAILED: ' + failures.length + ' check(s): ' + failures.join(', '));
        process.exit(1);
    }
    console.log('OK: all checks passed.');
})().catch(error => {
    console.error('ERROR: test harness failure:', error);
    process.exit(2);
});
