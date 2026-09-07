(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const params = new URLSearchParams(location.search);

  const state = {
    started: params.get('started') === '1' || params.get('work') === '1',
    beforeShots: Number(params.get('before') || 0),
    workShots: Number(params.get('workshots') || 0),
    workStarted: params.get('work') === '1',
    conditions: Number(params.get('conditions') || 0),
    addOn: {
      name: 'Pet-hair removal',
      price: 40,
      message: 'There’s heavy pet hair embedded in the rear cargo area. I can take care of it while I’m here for an additional $40.'
    },
    approval: params.get('approval') || 'none',
    paid: params.get('paid') === '1'
  };

  let route = params.get('screen') || 'today';
  let cameraMode = params.get('mode') || (state.workStarted ? 'work' : 'before');

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 1700);
  }

  function nav(screen) {
    route = screen;
    try { history.replaceState(null, '', '?screen=' + screen); } catch (e) {}
    render();
    window.scrollTo(0, 0);
  }

  window.nav = nav;
  window.setRoute = screen => { route = screen; render(); };

  function topNav(title, right = '') {
    return `<div class="navtop"><button class="icon-btn back" aria-label="Back" onclick="historyBack()">‹</button><div class="navtop-title">${title}</div><div>${right}</div></div>`;
  }

  function stage(current) {
    const labels = ['Details', 'Before', 'Work', 'Finish'];
    return `<div class="stage">${labels.map((label, i) => `<div class="stage-item ${i < current ? 'done' : i === current ? 'current' : ''}"><div class="stage-bar"></div><div class="stage-label">${label}</div></div>`).join('')}</div>`;
  }

  window.historyBack = () => {
    const map = { job: 'today', active: 'job', camera: 'active', addon: 'active', complete: 'active', customer: 'addon', pay: 'complete' };
    nav(map[route] || 'today');
  };

  const tabbar = `<div class="tabbar">
      <button class="tab active" onclick="nav('today')"><span class="tab-icon"></span><span>Today</span></button>
      <button class="tab" onclick="toast('Jobs view is outside this focused demo')"><span class="tab-icon"></span><span>Jobs</span></button>
      <button class="tab" onclick="toast('Customer history is shown inside Sarah’s job')"><span class="tab-icon"></span><span>Customers</span></button>
      <button class="tab" onclick="toast('Settings are outside this focused demo')"><span class="tab-icon"></span><span>More</span></button>
    </div>`;

  function today() {
    return `<main class="screen">
      <div class="topbar"><div class="brand">COASTAL DETAIL</div><div class="avatar">MD</div></div>
      <div class="headline-row"><div><h1>Today</h1><div class="date muted">Sunday, September 6</div></div></div>
      <div class="metrics"><div class="metric"><strong>$1,140</strong><span>Scheduled</span></div><div class="metric"><strong>4</strong><span>Jobs</span></div><div class="metric"><strong>$520</strong><span>Unpaid</span></div></div>
      <div class="section-head"><div class="section-title">Schedule</div></div>
      <div class="list">
        <div class="next-job-block">
          <div class="job-row next-job-row ${state.started ? 'started' : ''}" role="button" tabindex="0" onclick="nav('job')"><div class="job-time">9:00<span class="next ${state.started ? 'started' : ''}">${state.started ? 'IN PROGRESS' : 'NEXT'}</span></div><div><div class="job-name">Sarah Chen</div><div class="job-desc">Tesla Model Y · Full detail</div></div><div class="job-price">$220<span class="chev">›</span></div></div>
          <button class="primary home-start ${state.started ? 'resume' : ''}" onclick="${state.started ? "nav('active')" : 'startJob()'}">${state.started ? 'Resume job' : 'Begin walkaround'} <span class="arrow-inline">→</span></button>
        </div>
        <div class="job-row passive"><div class="job-time">11:30</div><div><div class="job-name">Owen Park</div><div class="job-desc">BMW X3 · Interior</div></div><div class="job-price">$180</div></div>
        <div class="job-row passive"><div class="job-time">2:00</div><div><div class="job-name">Maya Lopez</div><div class="job-desc">Subaru Outback · Wash + wax</div></div><div class="job-price">$160</div></div>
        <div class="job-row passive"><div class="job-time">4:30</div><div><div class="job-name">Chris Nguyen</div><div class="job-desc">Ford F-150 · Exterior detail</div></div><div class="job-price">$240</div></div>
      </div>
      <div class="attention"><div class="attention-head"><span>Needs attention</span><span class="count">2</span></div><div class="attention-row"><span>Invoice #1048 · 3 days overdue</span><strong>$260</strong></div><div class="attention-row"><span>Approval waiting · Jordan Lee</span><strong>+$45</strong></div></div>
      ${tabbar}
    </main>`;
  }

  window.startJob = () => {
    nav('active');
    setTimeout(() => toast('Before walkaround · job not started yet'), 70);
  };

  function job() {
    return `<main class="screen no-tabs">${topNav('Sarah Chen')}${stage(0)}
      <section class="summary"><h1>9:00 AM</h1><div class="vehicle">2025 Tesla Model Y · White</div><div class="summary-grid">
        <div class="summary-item"><label>Service</label><div>Full detail</div></div>
        <div class="summary-item"><label>Quoted</label><div>$220</div></div>
        <div class="summary-item"><label>Address</label><div>412 Bay Ave</div></div>
        <div class="summary-item"><label>Duration</label><div>~2 hours</div></div>
      </div></section>
      ${state.started ? `<div class="job-started-inline"><span class="live-dot"></span><div><strong>Job in progress</strong><span>Started 9:13 AM · Resume the active workflow</span></div></div>` : ''}
      <div class="approval-proof"><span class="approval-check">✓</span><div><strong>Quote approved · $220</strong><span>Sarah approved yesterday at 6:14 PM</span></div></div>
      <div class="section-head"><div class="section-title">Job details</div></div>
      <div class="info-row"><div class="left"><div class="label">Customer note</div><div class="detail">Coffee stain on rear passenger seat</div></div><span class="chev">›</span></div>
      <div class="info-row"><div class="left"><div class="label">Vehicle history</div><div class="detail">3 prior services · 18 previous photos</div></div><span class="chev">›</span></div>
      <div class="info-row"><div class="left"><div class="label">Directions</div><div class="detail">Capitola · 12 min away</div></div><span class="value" style="color:var(--accent)">Open</span></div>
      <div class="section-head scope-head"><div class="section-title">Service scope</div></div>
      <div class="scope-list"><div class="scope-row"><span class="scope-dot"></span><span>Exterior wash + wheels</span></div><div class="scope-row"><span class="scope-dot"></span><span>Interior vacuum + surfaces</span></div><div class="scope-row"><span class="scope-dot"></span><span>Windows + final wipe-down</span></div></div>
      <div class="sticky-action"><div class="sticky-kicker">${state.started ? 'Active now' : 'Next step'}</div><button class="primary" onclick="${state.started ? "nav('active')" : 'startJob()'}">${state.started ? 'Resume job' : 'Begin walkaround'} <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  function beforeRecord() {
    if (!state.beforeShots) return '';
    const detail = state.started
      ? `${state.beforeShots} photos · capture times retained · edits audited`
      : `${state.beforeShots} photos · ${state.conditions || 2} conditions documented · editable`;
    return `<button class="record-line" onclick="openCamera('before')"><div><strong>Before photos</strong><span>${detail}</span></div><div class="record-lock">Edit ›</div></button>`;
  }

  function suggestedIssue() {
    if (!state.workStarted || !state.workShots || state.approval !== 'none') return '';
    return `<button class="issue-suggestion" onclick="nav('addon')"><div class="issue-kicker">Needs review</div><div class="issue-main"><div><strong>Pet hair · rear cargo</strong><span>Suggested add-on from your price history</span></div><div class="issue-price">+$40 ›</div></div></button>`;
  }

  function approvalRecord() {
    if (state.approval === 'approved') {
      return `<div class="approval-saved"><span class="approval-check">✓</span><div><strong>Customer approval saved · +$${state.addOn.price}</strong><span>Sarah · 10:04 AM · request, photo and price locked to job</span></div></div>`;
    }
    if (state.approval === 'declined') {
      return `<div class="approval-saved declined"><span class="approval-check">—</span><div><strong>Extra work declined</strong><span>Sarah · 10:04 AM · response saved to job</span></div></div>`;
    }
    return '';
  }

  function startedBanner() {
    if (!state.started) {
      return `<div class="prestart-banner"><span class="prestart-dot"></span><div><strong>Pre-job walkaround</strong><span>Job has not started yet · capture before photos first</span></div><span class="prestart-badge">PRE-JOB</span></div>`;
    }
    return `<div class="started-banner"><span class="live-dot"></span><div class="started-copy"><strong>Job in progress</strong><span>Started 9:13 AM · before-photo timestamps preserved</span></div><span class="started-badge">ACTIVE</span></div>`;
  }

  function active() {
    const phase = state.workStarted ? 2 : 1;
    const hubTitle = state.workStarted ? 'Job photos' : 'Before walkaround';
    const hubSub = state.workStarted ? 'Keep shooting as you work. CoastOps organizes later.' : 'Shoot freely. Capture times preserve what happened before the job starts.';
    const hubCount = state.workStarted ? state.workShots : state.beforeShots;

    let nextAction;
    if (!state.beforeShots) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="openCamera('before')">Take before photos <span class="arrow-inline">→</span></button></div>`;
    } else if (!state.workStarted) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Before photos ready</div><button class="primary" onclick="beginWork()">Start job <span class="arrow-inline">→</span></button></div>`;
    } else if (!state.workShots) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="openCamera('work')">Take job photos <span class="arrow-inline">→</span></button></div>`;
    } else {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><div class="sticky-split"><button class="secondary accent" onclick="openCamera('work')">More photos</button><button class="primary" onclick="nav('complete')">Review & finish <span class="arrow-inline">→</span></button></div></div>`;
    }

    return `<main class="screen no-tabs">${topNav(state.started ? 'Active job' : 'Before walkaround')}${stage(phase)}
      ${startedBanner()}
      <div class="workspace-title"><h1>Sarah Chen</h1><div class="sub">Tesla Model Y · Full detail</div></div>
      <button class="photo-hub" onclick="openCamera('${state.workStarted ? 'work' : 'before'}')">
        <div class="photo-hub-head"><div class="camera-icon"></div><div><div class="photo-hub-title">${hubTitle}</div><div class="photo-hub-sub">${hubSub}</div></div><div class="camera-count">${hubCount} ›</div></div>
      </button>
      ${beforeRecord()}
      ${suggestedIssue()}
      ${approvalRecord()}
      ${!state.workStarted && !state.beforeShots ? `<div class="inline-status">Job is still pre-start. Capture the walkaround first. <strong>No categories to choose.</strong></div>` : ''}
      ${state.workStarted && !state.workShots ? `<button class="utility-line" onclick="nav('addon')"><span>Add extra work manually</span><span>›</span></button>` : ''}
      ${nextAction}
    </main>`;
  }

  window.beginWork = () => {
    state.started = true;
    state.workStarted = true;
    nav('active');
    setTimeout(() => toast('Job started · before-photo timestamps saved'), 70);
  };

  window.openCamera = mode => {
    cameraMode = mode;
    nav('camera');
  };

  function camera() {
    const count = cameraMode === 'before' ? state.beforeShots : state.workShots;
    const thumbs = Array.from({ length: Math.min(count, 6) }, (_, i) => cameraMode === 'before'
      ? `<button class="thumb editable-thumb" aria-label="Remove before photo ${i + 1}" onclick="removeBeforePhoto(event)"><span>×</span></button>`
      : '<div class="thumb"></div>').join('');
    const hint = cameraMode === 'before'
      ? (state.started ? 'Before set is editable · capture times and edits are retained' : 'Walk around once · add or remove photos before starting the job')
      : 'Keep shooting — organization happens later';
    const title = cameraMode === 'before' ? 'Before walkaround' : 'Sarah · Model Y';
    return `<main class="camera-screen">
      <div class="viewfinder"><div class="car-shape"><div class="wheel left"></div><div class="wheel right"></div></div></div>
      <div class="camera-top"><button class="icon-btn" onclick="nav('active')">×</button><div class="camera-title">${title}</div><div style="width:42px"></div></div>
      <div class="camera-hint">${hint}</div>
      <div class="camera-bottom"><div class="filmstrip" id="filmstrip">${thumbs}</div><div class="capture-row"><div class="shot-count"><strong id="shotnum">${count}</strong> photos</div><button class="shutter" aria-label="Take photo" onclick="capture()"></button><button class="done-camera" onclick="finishCapture()">Done</button></div></div>
    </main>`;
  }

  window.capture = () => {
    if (cameraMode === 'before') state.beforeShots++;
    else state.workShots++;
    render();
  };

  window.removeBeforePhoto = event => {
    event?.stopPropagation?.();
    if (state.beforeShots <= 0) return;
    state.beforeShots--;
    if (!state.beforeShots) state.conditions = 0;
    render();
  };

  window.finishCapture = () => {
    const count = cameraMode === 'before' ? state.beforeShots : state.workShots;
    if (!count) { toast('Take at least one photo first'); return; }
    if (cameraMode === 'before') {
      state.conditions = 2;
      nav('active');
      setTimeout(() => toast(`${state.beforeShots} before photos saved · 2 conditions documented`), 80);
    } else {
      nav('active');
      setTimeout(() => toast(`${state.workShots} photos organized`), 80);
    }
  };

  function addon() {
    return `<main class="screen no-tabs">${topNav('Review extra work')}
      <div class="eyebrow">Suggested from job photo</div><h1 class="compact-title">Pet hair detected</h1><div class="sub">Rear cargo area · photographed at 9:48 AM</div>
      <div class="attachment hero-attachment"><div class="attachment-thumb"></div><div><strong>Rear cargo area</strong><span>Job photo · 9:48 AM</span></div><button class="link" type="button" onclick="toast('Original job photo opened')">View</button></div>
      <div class="suggested"><div><strong>Suggested price: $40</strong><br><span>Your last 6 pet-hair add-ons: $35–50 · ~20 min</span></div><div class="price">$40</div></div>
      <div class="field"><label>ITEM</label><input class="input" id="addonName" value="${state.addOn.name}"></div>
      <div class="field"><label>PRICE</label><input class="input" id="addonPrice" inputmode="decimal" value="$${state.addOn.price}"></div>
      <div class="field"><label>MESSAGE TO CUSTOMER</label><textarea class="input" id="addonMsg">${state.addOn.message}</textarea></div>
      <div class="approval-footnote">Customer will see the photo, reason and exact added price. Their response is time-stamped and saved with the job.</div>
      <div class="sticky-action"><div class="sticky-kicker">Confirm suggestion</div><button class="primary" onclick="sendApproval()">Send approval request <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  window.sendApproval = () => {
    state.addOn.name = document.getElementById('addonName').value;
    state.addOn.price = parseFloat(document.getElementById('addonPrice').value.replace(/[^0-9.]/g, '')) || 40;
    state.addOn.message = document.getElementById('addonMsg').value;
    state.approval = 'pending';
    nav('customer');
  };

  function customer() {
    return `<main class="customer-shell"><div class="client-view-strip"><span class="client-view-badge">CUSTOMER VIEW</span><span>Shareable link · no app needed</span></div><div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">412 Bay Ave · Capitola, CA</div></div>
      <div class="eyebrow">Your detail is in progress</div><h1>Quick approval</h1><div class="sub">Mateo found one item that isn’t included in your approved $220 quote.</div>
      <div class="proof-photo"><div class="caption">Rear cargo area · 9:48 AM</div></div>
      <div class="approval-card"><h2>${state.addOn.name}</h2><p class="sub" style="margin-top:7px">${state.addOn.message}</p><div class="price-line"><span class="sub">Added to today’s total</span><strong>+$${state.addOn.price}</strong></div></div>
      <div class="approval-footnote customer-note">Your response is time-stamped and saved with this job.</div>
      <div class="customer-action"><div class="choice-row approval-choice"><button class="primary" onclick="approve()">Approve +$${state.addOn.price}</button><button class="secondary" onclick="decline()">No thanks</button></div></div>
    </main>`;
  }

  window.approve = () => {
    state.approval = 'approved';
    nav('active');
    setTimeout(() => toast(`Approved by Sarah · +$${state.addOn.price}`), 80);
  };

  window.decline = () => {
    state.approval = 'declined';
    nav('active');
    setTimeout(() => toast('Customer declined extra work'), 80);
  };

  function complete() {
    const total = 220 + (state.approval === 'approved' ? state.addOn.price : 0);
    const totalShots = state.beforeShots + state.workShots;
    return `<main class="screen no-tabs">${topNav('Finish job')}${stage(3)}
      <div class="complete-mark">✓</div><h1 class="finish-title">Proof package ready</h1><div class="sub finish-sub">CoastOps assembled the customer handoff from the job record.</div>
      <div class="proof-summary"><div><strong>${totalShots}</strong><span>job photos</span></div><div><strong>${state.conditions || 2}</strong><span>conditions</span></div><div><strong>${state.approval === 'approved' ? 1 : 0}</strong><span>approved add-on</span></div></div>
      <div class="compare compact-compare"><div class="compare-item"><div class="compare-img"></div><div class="compare-label">BEFORE</div></div><div class="compare-item"><div class="compare-img"></div><div class="compare-label">AFTER</div></div></div>
      <div class="auto-note"><div class="auto-mark"></div><div><strong>Best proof selected automatically</strong><span>Original capture timestamps, before-photo edit history and approval remain attached to the job.</span></div></div>
      <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval === 'approved' ? `<div class="bill-row"><span>${state.addOn.name}</span><strong>$${state.addOn.price}</strong></div>` : ''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
      <div class="sticky-action"><div class="sticky-kicker">Complete job</div><button class="primary" onclick="nav('pay')">Send proof + request $${total} <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  function pay() {
    const total = 220 + (state.approval === 'approved' ? state.addOn.price : 0);
    const totalShots = state.beforeShots + state.workShots;
    return `<main class="customer-shell"><div class="client-view-strip"><span class="client-view-badge">CUSTOMER VIEW</span><span>Shareable link · no app needed</span></div><div class="customer-brand final-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Job completed · 10:42 AM</div><button class="return-home" onclick="nav('today')">Return to home</button></div>
      <div class="complete-mark">✓</div><h1>Your Model Y is ready.</h1><div class="sub">Thanks, Sarah. Your detail is documented and ready for payment.</div>
      <div class="customer-proof-line">${totalShots} job photos · ${state.conditions || 2} conditions documented · ${state.approval === 'approved' ? '1 approved add-on' : 'no added work'}</div>
      <div class="compare"><div class="compare-item"><div class="compare-img"></div><div class="compare-label">BEFORE</div></div><div class="compare-item"><div class="compare-img"></div><div class="compare-label">AFTER</div></div></div>
      <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval === 'approved' ? `<div class="bill-row"><span>${state.addOn.name}</span><strong>$${state.addOn.price}</strong></div>` : ''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
      ${state.paid ? `<div class="status-banner">Paid · Visa ending in 4242</div>` : ''}
      <div class="customer-action"><button class="primary" onclick="payNow()">${state.paid ? 'Book next detail' : 'Pay $' + total}</button></div>
    </main>`;
  }

  window.payNow = () => {
    if (!state.paid) {
      state.paid = true;
      render();
      setTimeout(() => toast('Payment received'), 60);
    } else {
      toast('Rebooking flow would open here');
    }
  };

  const screens = { today, job, active, camera, addon, customer, complete, pay };
  function render() {
    const customerView = route === 'customer' || route === 'pay';
    app.classList.toggle('customer-view-frame', customerView);
    document.body.classList.toggle('customer-view-mode', customerView);
    app.innerHTML = (screens[route] || today)();
  }
  render();
})();
