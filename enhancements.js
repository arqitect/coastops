(() => {
  const app = document.getElementById('app');

  function currentScreen() {
    return new URLSearchParams(window.location.search).get('screen') || 'today';
  }

  function enhanceToday() {
    if (currentScreen() !== 'today') return;
    const list = app.querySelector('.list');
    const firstJob = list?.querySelector('.job-row');
    if (!list || !firstJob || list.querySelector('.home-start-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'home-start-wrap';
    wrap.innerHTML = `
      <div class="home-start-context">
        <span>Next up</span>
        <strong>Sarah Chen · 9:00 AM</strong>
      </div>
      <button class="primary home-start" type="button" onclick="nav('active')">
        Start job <span class="arrow-inline">→</span>
      </button>
    `;
    firstJob.insertAdjacentElement('afterend', wrap);
  }

  function enhanceFinalCustomerScreen() {
    if (currentScreen() !== 'pay') return;
    const brand = app.querySelector('.customer-brand');
    if (!brand || brand.querySelector('.return-home')) return;

    const button = document.createElement('button');
    button.className = 'return-home';
    button.type = 'button';
    button.textContent = 'Return to home';
    button.addEventListener('click', () => window.nav('today'));
    brand.appendChild(button);
  }

  function enhance() {
    enhanceToday();
    enhanceFinalCustomerScreen();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
  enhance();
})();
