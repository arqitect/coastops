(() => {
  const app = document.getElementById('app');

  function currentScreen() {
    return new URLSearchParams(window.location.search).get('screen') || 'today';
  }

  function ensureStyles() {
    if (document.getElementById('coastops-enhancement-styles')) return;
    const style = document.createElement('style');
    style.id = 'coastops-enhancement-styles';
    style.textContent = `
      .primary {
        background: #171719 !important;
        box-shadow: 0 2px 8px rgba(20,20,22,.14) !important;
      }
      .primary:active { background:#000 !important; }
      .done-camera { background:#171719 !important; }

      .next-job-block {
        padding: 0 0 12px;
        border-bottom: 1px solid var(--line);
      }
      .next-job-block .job-row {
        border-bottom: 0;
        padding-bottom: 9px;
      }
      .next-job-block .home-start {
        min-height: 46px;
        border-radius: 10px;
        font-size: 14px;
        margin-top: 1px;
        background: var(--accent) !important;
        box-shadow: 0 2px 8px rgba(11,111,120,.18) !important;
      }
      .next-job-block .home-start:active { background: var(--accent-hover) !important; }

      .customer-brand { position:relative; padding-right:112px; min-height:47px; }
      .return-home {
        position:absolute;
        right:0;
        top:-5px;
        height:34px;
        padding:0 11px;
        border:1px solid var(--line-strong);
        border-radius:9px;
        background:#fff;
        color:var(--ink);
        font-size:11px;
        font-weight:680;
        white-space:nowrap;
        cursor:pointer;
      }
      .return-home:active { background:var(--surface-2); }
    `;
    document.head.appendChild(style);
  }

  function enhanceToday() {
    if (currentScreen() !== 'today') return;
    const list = app.querySelector('.list');
    const firstJob = list?.querySelector(':scope > .job-row');
    if (!list || !firstJob || list.querySelector('.next-job-block')) return;

    const block = document.createElement('div');
    block.className = 'next-job-block';
    firstJob.insertAdjacentElement('beforebegin', block);
    block.appendChild(firstJob);

    const start = document.createElement('button');
    start.className = 'primary home-start';
    start.type = 'button';
    start.innerHTML = `Start job <span class="arrow-inline">→</span>`;
    start.addEventListener('click', () => window.nav('active'));
    block.appendChild(start);
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
    ensureStyles();
    enhanceToday();
    enhanceFinalCustomerScreen();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
  enhance();
})();
