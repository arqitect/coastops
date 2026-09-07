(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  if (!app) return;

  const STARTED_KEY = 'coastops-demo-started';
  const BEFORE_KEY = 'coastops-demo-before-count';
  const query = new URLSearchParams(location.search);
  let started = sessionStorage.getItem(STARTED_KEY) === '1' || query.get('started') === '1' || query.get('work') === '1';
  let beforeCount = Number(sessionStorage.getItem(BEFORE_KEY) || query.get('before') || 0);

  const style = document.createElement('style');
  style.textContent = `
    .started-banner,
    .prestart-banner {
      display:grid; grid-template-columns:10px minmax(0,1fr) auto; gap:10px; align-items:center;
      margin:0 0 18px; padding:12px 13px; border-radius:11px;
    }
    .started-banner { border:1px solid var(--accent-border); background:var(--accent-soft); }
    .prestart-banner { border:1px solid var(--line); background:var(--surface-2); }
    .live-dot { width:9px; height:9px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 4px rgba(11,111,120,.10); }
    .prestart-dot { width:9px; height:9px; border-radius:50%; background:#a6a6a6; }
    .started-copy strong, .job-started-inline strong, .prestart-copy strong { display:block; font-size:13px; margin-bottom:2px; }
    .started-copy span, .job-started-inline span:last-child, .prestart-copy span { display:block; font-size:10px; color:var(--muted); line-height:1.3; }
    .started-badge, .prestart-badge { font-size:9px; font-weight:820; letter-spacing:.07em; border-radius:999px; padding:5px 7px; background:#fff; }
    .started-badge { color:var(--accent-ink); border:1px solid var(--accent-border); }
    .prestart-badge { color:var(--muted); border:1px solid var(--line-strong); }
    .job-started-inline { display:grid; grid-template-columns:10px minmax(0,1fr); gap:10px; align-items:center; padding:10px 0 11px; border-bottom:1px solid var(--line); }
    .next.started { color:var(--accent-ink); white-space:nowrap; font-size:8.5px; }
    .next.prep { color:var(--muted); white-space:nowrap; font-size:8.5px; }
    .next-job-row.started { background:linear-gradient(90deg,var(--accent-soft),rgba(231,243,243,0)); }
    .next-job-row.started { grid-template-columns:64px minmax(0,1fr) auto; }
    .next-job-block .home-start.resume { font-weight:760; }

    .client-view-strip {
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      margin:-4px 0 14px; padding:8px 10px; border:1px solid rgba(46,151,92,.32);
      border-radius:9px; background:rgba(46,151,92,.07); color:#246b45;
    }
    .client-view-badge { font-size:9px; font-weight:820; letter-spacing:.08em; }
    .client-view-strip > span:last-child { font-size:9.5px; font-weight:620; color:var(--muted); white-space:nowrap; }
    .phone.client-mode {
      box-shadow:
        inset 0 0 0 3px rgba(47,164,99,.72),
        inset 0 0 28px rgba(47,164,99,.09),
        0 0 0 2px rgba(47,164,99,.34),
        0 0 26px rgba(47,164,99,.28) !important;
    }

    .record-line.editable .record-lock { color:var(--accent-ink); }
    .camera-remove {
      display:block; margin:0 auto 8px; min-height:34px; padding:0 12px; border:0; border-radius:8px;
      background:rgba(255,255,255,.09); color:rgba(255,255,255,.82); font-size:11px; font-weight:650;
    }
    .camera-remove:disabled { opacity:.38; }
    .camera-screen, .camera-screen * {
      touch-action:manipulation;
      -webkit-user-select:none;
      user-select:none;
      -webkit-tap-highlight-color:transparent;
    }
    .shutter { touch-action:none !important; }
  `;
  document.head.appendChild(style);

  document.addEventListener('dblclick', event => {
    if (event.target.closest('.shutter')) event.preventDefault();
  }, { passive:false });

  function route() {
    return new URLSearchParams(location.search).get('screen') || 'today';
  }

  function rewriteToast(text) {
    if (!toastEl) return;
    setTimeout(() => {
      toastEl.textContent = text;
      toastEl.classList.add('show');
    }, 105);
  }

  const originalStartJob = window.startJob;
  if (typeof originalStartJob === 'function') {
    window.startJob = (...args) => {
      // Enter the pre-service walkaround. The operational job does not start yet.
      const result = originalStartJob(...args);
      rewriteToast('Before walkaround opened · job not started yet');
      return result;
    };
  }

  const originalBeginWork = window.beginWork;
  if (typeof originalBeginWork === 'function') {
    window.beginWork = (...args) => {
      started = true;
      sessionStorage.setItem(STARTED_KEY, '1');
      const result = originalBeginWork(...args);
      rewriteToast('Job started · before photos saved');
      return result;
    };
  }

  const originalFinishCapture = window.finishCapture;
  if (typeof originalFinishCapture === 'function') {
    window.finishCapture = (...args) => {
      const beforeMode = /Before walkaround/i.test(app.querySelector('.camera-title')?.textContent || '');
      const count = Number(document.getElementById('shotnum')?.textContent || 0);
      if (beforeMode && count > 0) {
        beforeCount = count;
        sessionStorage.setItem(BEFORE_KEY, String(count));
      }
      const result = originalFinishCapture(...args);
      if (beforeMode && count > 0) rewriteToast(`${count} before photos saved · editable until job starts`);
      return result;
    };
  }

  function makeActiveBanner(text) {
    const work = /^In progress/i.test(text || '');
    return `<div class="started-banner"><span class="live-dot"></span><div class="started-copy"><strong>${work ? 'Job in progress' : 'Job started'}</strong><span>${work ? 'Started after before walkaround · Work in progress' : 'Started after before walkaround'}</span></div><span class="started-badge">ACTIVE</span></div>`;
  }

  function makePrestartBanner() {
    return `<div class="prestart-banner"><span class="prestart-dot"></span><div class="prestart-copy"><strong>Before walkaround</strong><span>Job has not started yet</span></div><span class="prestart-badge">PRE-SERVICE</span></div>`;
  }

  function enhanceActive() {
    if (route() !== 'active') return;
    const old = app.querySelector('.job-status');
    if (!old || app.querySelector('.started-banner') || app.querySelector('.prestart-banner')) return;
    const holder = document.createElement('div');
    holder.innerHTML = started ? makeActiveBanner(old.textContent.trim()) : makePrestartBanner();
    old.replaceWith(holder.firstElementChild);

    const hubSub = app.querySelector('.photo-hub-sub');
    if (!started && hubSub) hubSub.textContent = 'Shoot freely. Add or remove photos until you start the job.';

    const record = app.querySelector('.record-line');
    if (record) {
      const right = record.querySelector('.record-lock');
      if (!started) {
        record.classList.add('editable');
        if (right) right.textContent = 'Edit photos ›';
        record.onclick = () => window.openCamera('before');
      } else {
        if (right) right.textContent = 'Saved ›';
      }
    }

    const sticky = app.querySelector('.sticky-action');
    const primary = sticky?.querySelector('.primary');
    const kicker = sticky?.querySelector('.sticky-kicker');
    if (!started && beforeCount > 0 && primary && /Start work/i.test(primary.textContent)) {
      primary.innerHTML = 'Start job <span class="arrow-inline">→</span>';
      if (kicker) kicker.textContent = 'Before photos ready';
    }
  }

  function enhanceToday() {
    if (route() !== 'today') return;
    const row = app.querySelector('.next-job-row');
    const label = row?.querySelector('.next');
    const button = app.querySelector('.home-start');
    if (!row || !label || !button) return;

    if (started) {
      row.classList.add('started');
      label.classList.add('started');
      label.textContent = 'IN PROGRESS';
      button.classList.add('resume');
      button.innerHTML = 'Resume job <span class="arrow-inline">→</span>';
      button.onclick = () => window.nav('active');
      return;
    }

    if (beforeCount > 0) {
      label.classList.add('prep');
      label.textContent = 'WALKAROUND';
      button.innerHTML = 'Continue walkaround <span class="arrow-inline">→</span>';
    } else {
      button.innerHTML = 'Start walkaround <span class="arrow-inline">→</span>';
    }
  }

  function enhanceJobDetail() {
    if (route() !== 'job') return;
    const sticky = app.querySelector('.sticky-action');
    const button = sticky?.querySelector('.primary');
    const kicker = sticky?.querySelector('.sticky-kicker');

    if (started) {
      const summary = app.querySelector('.summary');
      if (summary && !app.querySelector('.job-started-inline')) {
        summary.insertAdjacentHTML('afterend', `<div class="job-started-inline"><span class="live-dot"></span><div><strong>Job in progress</strong><span>Before walkaround completed · resume active workflow</span></div></div>`);
      }
      if (button) {
        button.innerHTML = 'Resume job <span class="arrow-inline">→</span>';
        button.onclick = () => window.nav('active');
      }
      if (kicker) kicker.textContent = 'Active now';
    } else {
      if (button) button.innerHTML = `${beforeCount > 0 ? 'Continue' : 'Start'} walkaround <span class="arrow-inline">→</span>`;
      if (kicker) kicker.textContent = 'Pre-service';
    }
  }

  function removeLastBeforePhoto() {
    const current = Number(document.getElementById('shotnum')?.textContent || 0);
    if (current <= 0) return;
    const next = current - 1;
    beforeCount = next;
    sessionStorage.setItem(BEFORE_KEY, String(next));
    const params = new URLSearchParams();
    params.set('screen', 'camera');
    params.set('mode', 'before');
    params.set('before', String(next));
    location.href = `${location.pathname}?${params.toString()}`;
  }

  function enhanceCamera() {
    if (route() !== 'camera') return;
    const title = app.querySelector('.camera-title')?.textContent || '';
    if (!/Before walkaround/i.test(title) || started) return;
    const bottom = app.querySelector('.camera-bottom');
    if (!bottom) return;
    const count = Number(document.getElementById('shotnum')?.textContent || 0);
    let button = bottom.querySelector('.camera-remove');
    if (!button) {
      button = document.createElement('button');
      button.className = 'camera-remove';
      button.type = 'button';
      button.textContent = 'Remove last photo';
      button.onclick = removeLastBeforePhoto;
      bottom.insertBefore(button, bottom.querySelector('.capture-row'));
    }
    button.disabled = count <= 0;
  }

  function enhanceCustomerView() {
    const r = route();
    const isClient = r === 'customer' || r === 'pay';
    app.classList.toggle('client-mode', isClient);
    if (!isClient) return;
    const shell = app.querySelector('.customer-shell');
    if (!shell || shell.querySelector('.client-view-strip')) return;
    shell.insertAdjacentHTML('afterbegin', `<div class="client-view-strip"><span class="client-view-badge">CUSTOMER VIEW</span><span>Shareable link · no app needed</span></div>`);
  }

  function enhance() {
    if (route() !== 'customer' && route() !== 'pay') app.classList.remove('client-mode');
    enhanceActive();
    enhanceToday();
    enhanceJobDetail();
    enhanceCamera();
    enhanceCustomerView();
  }

  const observer = new MutationObserver(() => queueMicrotask(enhance));
  observer.observe(app, { childList:true, subtree:true, characterData:true });
  enhance();
})();
