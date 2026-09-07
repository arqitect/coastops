(() => {
  const app = document.getElementById('app');
  if (!app) return;

  let started = sessionStorage.getItem('coastops-demo-started') === '1' || new URLSearchParams(location.search).get('started') === '1';

  const style = document.createElement('style');
  style.textContent = `
    .started-banner {
      display:grid; grid-template-columns:10px minmax(0,1fr) auto; gap:10px; align-items:center;
      margin:0 0 18px; padding:12px 13px; border:1px solid var(--accent-border);
      border-radius:11px; background:var(--accent-soft);
    }
    .live-dot { width:9px; height:9px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 4px rgba(11,111,120,.10); }
    .started-copy strong, .job-started-inline strong { display:block; font-size:13px; margin-bottom:2px; }
    .started-copy span, .job-started-inline span:last-child { display:block; font-size:10px; color:var(--muted); line-height:1.3; }
    .started-badge { font-size:9px; font-weight:820; letter-spacing:.07em; color:var(--accent-ink); border:1px solid var(--accent-border); border-radius:999px; padding:5px 7px; background:#fff; }
    .job-started-inline { display:grid; grid-template-columns:10px minmax(0,1fr); gap:10px; align-items:center; padding:10px 0 11px; border-bottom:1px solid var(--line); }
    .next.started { color:var(--accent-ink); white-space:nowrap; font-size:8.5px; }
    .next-job-row.started { background:linear-gradient(90deg,var(--accent-soft),rgba(231,243,243,0)); }
    .next-job-block .home-start.resume { font-weight:760; }
    .next-job-row.started { grid-template-columns:64px minmax(0,1fr) auto; }

    .client-view-strip {
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      margin:-4px 0 14px; padding:8px 10px; border:1px solid var(--accent-border);
      border-radius:9px; background:var(--accent-soft); color:var(--accent-ink);
    }
    .client-view-badge { font-size:9px; font-weight:820; letter-spacing:.08em; }
    .client-view-strip > span:last-child { font-size:9.5px; font-weight:620; color:var(--muted); white-space:nowrap; }
  `;
  document.head.appendChild(style);

  const originalStartJob = window.startJob;
  if (typeof originalStartJob === 'function') {
    window.startJob = (...args) => {
      started = true;
      sessionStorage.setItem('coastops-demo-started', '1');
      return originalStartJob(...args);
    };
  }

  function route() {
    return new URLSearchParams(location.search).get('screen') || 'today';
  }

  function makeStartedBanner(text) {
    const work = /^In progress/i.test(text || '');
    return `<div class="started-banner"><span class="live-dot"></span><div class="started-copy"><strong>${work ? 'Job in progress' : 'Job started'}</strong><span>${work ? 'Started 9:07 AM · Work began 9:13 AM' : 'Started 9:07 AM · Before walkaround'}</span></div><span class="started-badge">ACTIVE</span></div>`;
  }

  function enhanceActive() {
    if (route() !== 'active') return;
    const old = app.querySelector('.job-status');
    if (!old || app.querySelector('.started-banner')) return;
    started = true;
    sessionStorage.setItem('coastops-demo-started', '1');
    const holder = document.createElement('div');
    holder.innerHTML = makeStartedBanner(old.textContent.trim());
    old.replaceWith(holder.firstElementChild);
  }

  function enhanceToday() {
    if (route() !== 'today' || !started) return;
    const row = app.querySelector('.next-job-row');
    const label = row?.querySelector('.next');
    const button = app.querySelector('.home-start');
    if (!row || !label || !button) return;
    row.classList.add('started');
    label.classList.add('started');
    label.textContent = 'IN PROGRESS';
    button.classList.add('resume');
    button.innerHTML = 'Resume job <span class="arrow-inline">→</span>';
    button.onclick = () => window.nav('active');
  }

  function enhanceJobDetail() {
    if (route() !== 'job' || !started) return;
    const summary = app.querySelector('.summary');
    if (summary && !app.querySelector('.job-started-inline')) {
      summary.insertAdjacentHTML('afterend', `<div class="job-started-inline"><span class="live-dot"></span><div><strong>Job started</strong><span>9:07 AM · Resume the active workflow</span></div></div>`);
    }
    const sticky = app.querySelector('.sticky-action');
    const button = sticky?.querySelector('.primary');
    const kicker = sticky?.querySelector('.sticky-kicker');
    if (button) {
      button.innerHTML = 'Resume job <span class="arrow-inline">→</span>';
      button.onclick = () => window.nav('active');
    }
    if (kicker) kicker.textContent = 'Active now';
  }

  function enhanceCustomerView() {
    const r = route();
    if (r !== 'customer' && r !== 'pay') return;
    const shell = app.querySelector('.customer-shell');
    if (!shell || shell.querySelector('.client-view-strip')) return;
    shell.insertAdjacentHTML('afterbegin', `<div class="client-view-strip"><span class="client-view-badge">CUSTOMER VIEW</span><span>Shareable link · no app needed</span></div>`);
  }

  function enhance() {
    enhanceActive();
    enhanceToday();
    enhanceJobDetail();
    enhanceCustomerView();
  }

  const observer = new MutationObserver(() => queueMicrotask(enhance));
  observer.observe(app, { childList:true, subtree:true });
  enhance();
})();
