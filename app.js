(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const params = new URLSearchParams(location.search);

  const initialConditions = Number(params.get('conditions') || 0);
  const state = {
    started: params.get('started') === '1' || params.get('work') === '1',
    beforeShots: Number(params.get('before') || 0),
    workShots: Number(params.get('workshots') || 0),
    finishShots: Number(params.get('finishshots') || 0),
    workStarted: params.get('work') === '1',
    conditions: initialConditions,
    conditionsReviewed: params.get('conditionsReviewed') === '1' || initialConditions > 0,
    addOn: {
      name: 'Pet-hair removal',
      price: 40,
      message: 'There’s heavy pet hair embedded in the rear cargo area. I can take care of it while I’m here for an additional $40.'
    },
    approval: params.get('approval') || 'none',
    paid: params.get('paid') === '1',
    recordOpen: false,
    quoteApproved: false,
    proofBefore: 2,
    proofAfter: 1,
    rebookWindow: '6 weeks',
    rebooked: false
  };

  let route = params.get('screen') || 'today';
  let cameraMode = params.get('mode') || (state.workStarted ? 'work' : 'before');

  function totalWorkShots() {
    return state.workShots + state.finishShots;
  }

  function totalShots() {
    return state.beforeShots + totalWorkShots();
  }

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

  function customerStrip(label = 'CUSTOMER VIEW') {
    return `<div class="client-view-strip"><span class="client-view-badge">${label}</span><span>Private link · no app needed</span></div>`;
  }

  function demoBridge(label, target) {
    return `<button class="demo-bridge" onclick="nav('${target}')"><span>DEMO</span>${label} →</button>`;
  }

  window.historyBack = () => {
    const map = {
      quote: 'today',
      quoteCustomer: 'quote',
      quoteConfirmed: 'quoteCustomer',
      job: 'today',
      active: 'job',
      camera: cameraMode === 'proof' ? 'proofcheck' : 'active',
      conditions: 'active',
      addon: 'active',
      customer: 'addon',
      customerResponse: 'customer',
      proofcheck: 'active',
      complete: 'proofcheck',
      pay: 'complete',
      rebook: 'pay',
      rebookConfirmed: 'rebook'
    };
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
      <div class="topbar"><div class="brand">COASTAL DETAIL</div><button class="top-action" onclick="nav('quote')">New request</button></div>
      <div class="headline-row"><div><h1>Today</h1><div class="date muted">Sunday, September 6</div></div></div>
      <div class="metrics"><div class="metric"><strong>$1,140</strong><span>Scheduled</span></div><div class="metric"><strong>4</strong><span>Jobs</span></div><div class="metric"><strong>$520</strong><span>Unpaid</span></div></div>
      <div class="stack-note"><span class="stack-dot"></span><div><strong>Fits your existing stack</strong><span>Google Calendar synced · Square stays connected</span></div></div>
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

  function quote() {
    return `<main class="screen no-tabs">${topNav('New request')}
      <div class="eyebrow">Booking request · 2 min ago</div>
      <h1 class="compact-title">Sarah Chen</h1>
      <div class="sub">2025 Tesla Model Y · White · Capitola</div>

      <div class="request-card">
        <div class="request-row"><span>Requested</span><strong>Full detail</strong></div>
        <div class="request-row"><span>Preferred time</span><strong>Sunday · 9:00 AM</strong></div>
        <div class="request-row"><span>Customer note</span><strong>Coffee stain, rear seat</strong></div>
      </div>

      <div class="quote-guidance">
        <div class="quote-kicker">Price guidance</div>
        <div class="guidance-main"><div><strong>$220 recommended</strong><span>Full detail template $200 · Model Y / prior jobs suggest +$20</span></div><div class="guidance-price">$220</div></div>
        <div class="history-chip">Your last 8 similar jobs · $210–235 · ~2 hr</div>
      </div>

      <div class="field"><label>QUOTE</label><input class="input" id="quotePrice" inputmode="decimal" value="$220"></div>
      <div class="field"><label>MESSAGE</label><textarea class="input" id="quoteMsg">Full detail for your Model Y, including the rear-seat stain you mentioned. I can be there Sunday at 9:00 AM.</textarea></div>

      <div class="integration-line"><span>↻</span><div><strong>No migration required</strong><small>Keep Google Calendar and Square; CoastOps handles the job workflow.</small></div></div>
      <div class="sticky-action"><div class="sticky-kicker">One tap to customer</div><button class="primary" onclick="sendQuote()">Send $220 quote <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  window.sendQuote = () => {
    state.quoteApproved = false;
    nav('quoteCustomer');
  };

  function quoteCustomer() {
    return `<main class="customer-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Mateo · Mobile detailing</div></div>
      <div class="eyebrow">Quote from Mateo</div>
      <h1>Full detail · $220</h1>
      <div class="sub">Sunday at 9:00 AM · 2025 Tesla Model Y</div>
      <div class="customer-service-card">
        <div><strong>Full detail</strong><span>Exterior, wheels, interior, windows + rear-seat stain</span></div>
        <strong>$220</strong>
      </div>
      <div class="plain-note">No account needed. Approving confirms the service, price and appointment.</div>
      <div class="customer-action"><button class="primary" onclick="approveQuote()">Approve $220</button></div>
    </main>`;
  }

  window.approveQuote = () => {
    state.quoteApproved = true;
    nav('quoteConfirmed');
  };

  function quoteConfirmed() {
    return `<main class="customer-shell confirmation-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Mateo · Mobile detailing</div></div>
      <div class="confirm-mark">✓</div>
      <h1>You’re booked.</h1>
      <div class="sub">Full detail · $220<br>Sunday at 9:00 AM</div>
      <div class="confirmation-card"><strong>We’ll text you before arrival.</strong><span>No app or account needed.</span></div>
      ${demoBridge('Continue on Mateo’s phone', 'today')}
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
      <div class="approval-proof"><span class="approval-check">✓</span><div><strong>Quote approved · $220</strong><span>Sarah approved yesterday at 6:14 PM · booking link</span></div></div>
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
      : `${state.beforeShots} photos · ${state.conditions || 3} conditions ${state.conditionsReviewed ? 'confirmed' : 'to review'}`;
    return `<button class="record-line" onclick="openCamera('before')"><div><strong>Before photos</strong><span>${detail}</span></div><div class="record-lock">Edit ›</div></button>`;
  }

  function conditionRecord() {
    if (!state.beforeShots || !state.conditions) return '';
    return `<button class="condition-record ${state.conditionsReviewed ? 'confirmed' : ''}" onclick="nav('conditions')"><span class="condition-icon">${state.conditionsReviewed ? '✓' : '!'}</span><div><strong>${state.conditions} existing conditions ${state.conditionsReviewed ? 'confirmed' : 'found'}</strong><span>${state.conditionsReviewed ? 'Included in the pre-job record' : 'Quick review before the job starts'}</span></div><span>›</span></button>`;
  }

  function suggestedIssue() {
    if (!state.workStarted || !totalWorkShots() || state.approval !== 'none') return '';
    return `<button class="issue-suggestion" onclick="nav('addon')"><div class="issue-kicker">Needs review</div><div class="issue-main"><div><strong>Pet hair · rear cargo</strong><span>Suggested add-on from your price history</span></div><div class="issue-price">+$40 ›</div></div></button>`;
  }

  function approvalRecord() {
    if (state.approval === 'approved') {
      return `<div class="approval-saved"><span class="approval-check">✓</span><div><strong>Customer approved · +$${state.addOn.price}</strong><span>Sarah · 10:04 AM · photo, price and response saved</span></div></div>`;
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
    const hubCount = state.workStarted ? totalWorkShots() : state.beforeShots;

    let nextAction;
    if (!state.beforeShots) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="openCamera('before')">Take before photos <span class="arrow-inline">→</span></button></div>`;
    } else if (!state.conditionsReviewed) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Before record</div><button class="primary" onclick="nav('conditions')">Review ${state.conditions || 3} conditions <span class="arrow-inline">→</span></button></div>`;
    } else if (!state.workStarted) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Before record ready</div><button class="primary" onclick="beginWork()">Start job <span class="arrow-inline">→</span></button></div>`;
    } else if (!totalWorkShots()) {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="openCamera('work')">Take job photos <span class="arrow-inline">→</span></button></div>`;
    } else {
      nextAction = `<div class="sticky-action"><div class="sticky-kicker">Next step</div><div class="sticky-split"><button class="secondary accent" onclick="openCamera('work')">More photos</button><button class="primary" onclick="nav('proofcheck')">Review & finish <span class="arrow-inline">→</span></button></div></div>`;
    }

    return `<main class="screen no-tabs">${topNav(state.started ? 'Active job' : 'Before walkaround')}${stage(phase)}
      ${startedBanner()}
      <div class="workspace-title"><h1>Sarah Chen</h1><div class="sub">Tesla Model Y · Full detail</div></div>
      <button class="photo-hub" onclick="openCamera('${state.workStarted ? 'work' : 'before'}')">
        <div class="photo-hub-head"><div class="camera-icon"></div><div><div class="photo-hub-title">${hubTitle}</div><div class="photo-hub-sub">${hubSub}</div></div><div class="camera-count">${hubCount} ›</div></div>
      </button>
      ${beforeRecord()}
      ${conditionRecord()}
      ${suggestedIssue()}
      ${approvalRecord()}
      ${!state.workStarted && !state.beforeShots ? `<div class="inline-status">Job is still pre-start. Capture the walkaround first. <strong>No categories to choose.</strong></div>` : ''}
      ${state.workStarted && !totalWorkShots() ? `<button class="utility-line" onclick="nav('addon')"><span>Add extra work manually</span><span>›</span></button>` : ''}
      ${nextAction}
    </main>`;
  }

  window.beginWork = () => {
    state.started = true;
    state.workStarted = true;
    nav('active');
    setTimeout(() => toast('Job started · before record preserved'), 70);
  };

  window.openCamera = mode => {
    cameraMode = mode;
    nav('camera');
  };

  function camera() {
    const count = cameraMode === 'before' ? state.beforeShots : cameraMode === 'proof' ? state.finishShots : totalWorkShots();
    const thumbs = Array.from({ length: Math.min(count, 6) }, (_, i) => cameraMode === 'before'
      ? `<button class="thumb editable-thumb" aria-label="Remove before photo ${i + 1}" onclick="removeBeforePhoto(event)"><span>×</span></button>`
      : '<div class="thumb"></div>').join('');
    const hint = cameraMode === 'before'
      ? (state.started ? 'Before set is editable · capture times and edits are retained' : 'Walk around once · add or remove photos before starting the job')
      : cameraMode === 'proof'
        ? (state.finishShots === 0 ? 'Quick finish check · rear seats first' : 'One more · passenger exterior')
        : 'Keep shooting — organization happens later';
    const title = cameraMode === 'before' ? 'Before walkaround' : cameraMode === 'proof' ? 'Finish coverage' : 'Sarah · Model Y';
    return `<main class="camera-screen">
      <div class="viewfinder"><div class="car-shape"><div class="wheel left"></div><div class="wheel right"></div></div></div>
      <div class="camera-top"><button class="icon-btn" onclick="historyBack()">×</button><div class="camera-title">${title}</div><div style="width:42px"></div></div>
      <div class="camera-hint">${hint}</div>
      <div class="camera-bottom"><div class="filmstrip" id="filmstrip">${thumbs}</div><div class="capture-row"><div class="shot-count"><strong id="shotnum">${count}</strong> ${cameraMode === 'proof' ? 'recommended' : 'photos'}</div><button class="shutter" aria-label="Take photo" onclick="capture()"></button><button class="done-camera" onclick="finishCapture()">Done</button></div></div>
    </main>`;
  }

  window.capture = () => {
    if (cameraMode === 'before') state.beforeShots++;
    else if (cameraMode === 'proof') state.finishShots++;
    else state.workShots++;
    render();
  };

  window.removeBeforePhoto = event => {
    event?.stopPropagation?.();
    if (state.beforeShots <= 0) return;
    state.beforeShots--;
    if (!state.beforeShots) {
      state.conditions = 0;
      state.conditionsReviewed = false;
    }
    render();
  };

  window.finishCapture = () => {
    const count = cameraMode === 'before' ? state.beforeShots : cameraMode === 'proof' ? state.finishShots : totalWorkShots();
    if (!count) { toast('Take at least one photo first'); return; }
    if (cameraMode === 'before') {
      state.conditions = 3;
      state.conditionsReviewed = false;
      nav('conditions');
      setTimeout(() => toast(`${state.beforeShots} photos saved · 3 existing conditions found`), 80);
    } else if (cameraMode === 'proof') {
      nav('proofcheck');
      setTimeout(() => toast(state.finishShots >= 2 ? 'Finish coverage complete' : 'One recommended shot remains'), 80);
    } else {
      nav('active');
      setTimeout(() => toast(`${totalWorkShots()} job photos organized`), 80);
    }
  };

  function conditions() {
    const items = [
      ['Rear bumper', 'Light scratch near passenger corner'],
      ['Front-right wheel', 'Existing curb rash'],
      ['Passenger door', 'Small door ding below handle']
    ];
    return `<main class="screen no-tabs">${topNav('Review conditions')}
      <div class="eyebrow">Found in the before walkaround</div>
      <h1 class="compact-title">Confirm what was already here.</h1>
      <div class="sub">CoastOps found likely pre-existing conditions from the photos you just took. You stay in control.</div>
      <div class="condition-list">${items.map((item, i) => `<div class="condition-item"><div class="condition-thumb variant-${i + 1}"></div><div><strong>${item[0]}</strong><span>${item[1]}</span></div><span class="condition-check">✓</span></div>`).join('')}</div>
      <button class="utility-line" onclick="toast('Add condition manually')"><span>+ Add something CoastOps missed</span><span>›</span></button>
      <div class="plain-note">Capture times and any later edits stay in the job record. Sarah only sees this record if you choose to share it.</div>
      <div class="sticky-action"><div class="sticky-kicker">One quick review</div><button class="primary" onclick="confirmConditions()">Confirm 3 conditions <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  window.confirmConditions = () => {
    state.conditions = 3;
    state.conditionsReviewed = true;
    nav('active');
    setTimeout(() => toast('Pre-job record confirmed'), 70);
  };

  function addon() {
    return `<main class="screen no-tabs">${topNav('Review extra work')}
      <div class="eyebrow">Suggested from job photo</div><h1 class="compact-title">Pet hair detected</h1><div class="sub">Rear cargo area · photographed at 9:48 AM</div>
      <div class="attachment hero-attachment"><div class="attachment-thumb"></div><div><strong>Rear cargo area</strong><span>Job photo · 9:48 AM</span></div><button class="link" type="button" onclick="toast('Original job photo opened')">View</button></div>
      <div class="suggested"><div><strong>Suggested price: $40</strong><br><span>Your last 6 pet-hair add-ons: $35–50 · ~20 min</span></div><div class="price">$40</div></div>
      <div class="field"><label>ITEM</label><input class="input" id="addonName" value="${state.addOn.name}"></div>
      <div class="field"><label>PRICE</label><input class="input" id="addonPrice" inputmode="decimal" value="$${state.addOn.price}"></div>
      <div class="field"><label>MESSAGE TO CUSTOMER</label><textarea class="input" id="addonMsg">${state.addOn.message}</textarea></div>
      <div class="approval-footnote">Customer sees the photo, reason and exact added price. You can change anything before sending.</div>
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
    return `<main class="customer-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Your detail is in progress</div></div>
      <div class="eyebrow">Quick approval</div><h1>One extra item</h1><div class="sub">Mateo found something outside your approved $220 service.</div>
      <div class="proof-photo"><div class="caption">Rear cargo area · 9:48 AM</div></div>
      <div class="approval-card"><h2>${state.addOn.name}</h2><p class="sub" style="margin-top:7px">${state.addOn.message}</p><div class="price-line"><span class="sub">Added to today’s total</span><strong>+$${state.addOn.price}</strong></div></div>
      <div class="plain-note">Your choice is saved with today’s service so there is no ambiguity later.</div>
      <div class="customer-action"><div class="choice-row approval-choice"><button class="primary" onclick="approve()">Approve +$${state.addOn.price}</button><button class="secondary" onclick="decline()">No thanks</button></div></div>
    </main>`;
  }

  window.approve = () => {
    state.approval = 'approved';
    nav('customerResponse');
  };

  window.decline = () => {
    state.approval = 'declined';
    nav('customerResponse');
  };

  function customerResponse() {
    const approved = state.approval === 'approved';
    return `<main class="customer-shell confirmation-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Your detail is in progress</div></div>
      <div class="confirm-mark">${approved ? '✓' : '—'}</div>
      <h1>${approved ? 'Approved.' : 'No problem.'}</h1>
      <div class="sub">${approved ? `$${state.addOn.price} ${state.addOn.name.toLowerCase()} was added to today’s service.` : `${state.addOn.name} was declined. Your original $220 service is unchanged.`}</div>
      <div class="confirmation-card"><strong>Mateo has been notified.</strong><span>You can close this page.</span></div>
      ${demoBridge('Continue on Mateo’s phone', 'active')}
    </main>`;
  }

  function proofcheck() {
    const missing = Math.max(0, 2 - state.finishShots);
    const ready = missing === 0;
    return `<main class="screen no-tabs">${topNav('Finish check')}${stage(3)}
      <div class="eyebrow">CoastOps checked the job photos</div>
      <h1 class="finish-title">${ready ? 'Proof coverage looks good.' : `${missing} quick shot${missing === 1 ? '' : 's'} recommended.`}</h1>
      <div class="sub finish-sub">${ready ? 'You photographed naturally. CoastOps found enough coverage to build the customer handoff.' : 'You can finish now, but these photos will make the proof package stronger.'}</div>

      <div class="coverage-list">
        <div class="coverage-row done"><span class="coverage-mark">✓</span><div><strong>Exterior transformation</strong><span>Covered by ${Math.max(2, totalWorkShots() - 1)} job photos</span></div><span>Ready</span></div>
        <div class="coverage-row ${state.finishShots >= 1 ? 'done' : 'missing'}"><span class="coverage-mark">${state.finishShots >= 1 ? '✓' : '!'}</span><div><strong>Rear seats</strong><span>${state.finishShots >= 1 ? 'Clear finished photo added' : 'No clear finished angle found'}</span></div><span>${state.finishShots >= 1 ? 'Ready' : 'Shoot'}</span></div>
        <div class="coverage-row ${state.finishShots >= 2 ? 'done' : 'missing'}"><span class="coverage-mark">${state.finishShots >= 2 ? '✓' : '!'}</span><div><strong>Passenger exterior</strong><span>${state.finishShots >= 2 ? 'Clear finished photo added' : 'Final angle is weak'}</span></div><span>${state.finishShots >= 2 ? 'Ready' : 'Shoot'}</span></div>
      </div>

      <div class="auto-note"><div class="auto-mark"></div><div><strong>No checklist while you work</strong><span>CoastOps waits until finish to catch missing proof instead of interrupting every photo.</span></div></div>

      <div class="sticky-action"><div class="sticky-kicker">${ready ? 'Proof ready' : 'About 15 seconds'}</div>${ready
        ? `<button class="primary" onclick="nav('complete')">Review proof package <span class="arrow-inline">→</span></button>`
        : `<div class="sticky-split"><button class="secondary" onclick="nav('complete')">Finish anyway</button><button class="primary" onclick="openCamera('proof')">Take ${missing} shot${missing === 1 ? '' : 's'} <span class="arrow-inline">→</span></button></div>`
      }</div>
    </main>`;
  }

  function proofChoice(kind, label, selected, count) {
    return `<div class="proof-choice">
      <div class="compare-img ${kind === 'after' ? 'after-image' : ''}"></div>
      <div class="proof-choice-meta"><div><strong>${label}</strong><span>Photo ${selected} of ${Math.max(selected, count)} · selected automatically</span></div><button onclick="cycleProof('${kind}')">Change</button></div>
    </div>`;
  }

  window.cycleProof = kind => {
    if (kind === 'before') state.proofBefore = state.proofBefore >= Math.max(2, state.beforeShots) ? 1 : state.proofBefore + 1;
    else state.proofAfter = state.proofAfter >= Math.max(2, totalWorkShots()) ? 1 : state.proofAfter + 1;
    render();
    setTimeout(() => toast(`${kind === 'before' ? 'Before' : 'After'} proof updated`), 40);
  };

  function complete() {
    const total = 220 + (state.approval === 'approved' ? state.addOn.price : 0);
    return `<main class="screen no-tabs">${topNav('Proof package')}${stage(3)}
      <div class="complete-mark">✓</div><h1 class="finish-title">Ready to send.</h1><div class="sub finish-sub">CoastOps picked the strongest proof. Change either image if you prefer another.</div>
      <div class="proof-summary"><div><strong>${totalShots()}</strong><span>job photos</span></div><div><strong>${state.conditions || 3}</strong><span>existing conditions</span></div><div><strong>${state.approval === 'approved' ? 1 : 0}</strong><span>approved add-on</span></div></div>
      <div class="proof-choice-grid">
        ${proofChoice('before', 'BEFORE', state.proofBefore, state.beforeShots)}
        ${proofChoice('after', 'AFTER', state.proofAfter, totalWorkShots())}
      </div>
      <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval === 'approved' ? `<div class="bill-row"><span>${state.addOn.name}</span><strong>$${state.addOn.price}</strong></div>` : ''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
      <div class="sticky-action"><div class="sticky-kicker">Complete job</div><button class="primary" onclick="nav('pay')">Send proof + request $${total} <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  function serviceRecord() {
    if (!state.recordOpen) return '';
    return `<div class="service-record">
      <div><strong>${totalShots()}</strong><span>job photos</span></div>
      <div><strong>${state.conditions || 3}</strong><span>existing conditions</span></div>
      <div><strong>${state.approval === 'approved' ? '1' : '0'}</strong><span>approved extra</span></div>
    </div>`;
  }

  window.toggleRecord = () => {
    state.recordOpen = !state.recordOpen;
    render();
  };

  function pay() {
    const total = 220 + (state.approval === 'approved' ? state.addOn.price : 0);
    return `<main class="customer-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Completed today · 10:42 AM</div></div>
      <div class="complete-mark">✓</div><h1>Your Model Y is ready.</h1><div class="sub">Full detail completed. Here’s your finished car and today’s total.</div>
      <div class="compare customer-compare"><div class="compare-item"><div class="compare-img"></div><div class="compare-label">BEFORE</div></div><div class="compare-item"><div class="compare-img"></div><div class="compare-label">AFTER</div></div></div>
      <div class="completed-service"><span>Full detail</span><strong>Completed ✓</strong></div>
      <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval === 'approved' ? `<div class="bill-row"><span>${state.addOn.name} · approved</span><strong>$${state.addOn.price}</strong></div>` : ''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
      <button class="service-record-toggle" onclick="toggleRecord()"><span>${state.recordOpen ? 'Hide' : 'View'} service record</span><span>${state.recordOpen ? '−' : '+'}</span></button>
      ${serviceRecord()}
      ${state.paid ? `<div class="status-banner"><strong>Paid · $${total}</strong><span>Visa ending in 4242 · receipt sent</span></div>` : `<div class="payment-provider">Secure payment · Square</div>`}
      <div class="customer-action"><button class="primary" onclick="payNow()">${state.paid ? 'Book maintenance detail' : 'Pay $' + total}</button></div>
    </main>`;
  }

  window.payNow = () => {
    if (!state.paid) {
      state.paid = true;
      render();
      setTimeout(() => toast('Payment received'), 60);
    } else {
      nav('rebook');
    }
  };

  function rebook() {
    const options = ['4 weeks', '6 weeks', '8 weeks'];
    return `<main class="customer-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Maintenance scheduling</div></div>
      <div class="eyebrow">Keep it this clean</div>
      <h1>When should Mateo come back?</h1>
      <div class="sub">Pick a rough interval. Mateo will confirm the exact date with you.</div>
      <div class="rebook-options">${options.map(option => `<button class="${state.rebookWindow === option ? 'selected' : ''}" onclick="selectRebook('${option}')"><span><strong>${option}</strong>${option === '6 weeks' ? '<small>Recommended</small>' : ''}</span><span>${state.rebookWindow === option ? '✓' : '›'}</span></button>`).join('')}</div>
      <div class="plain-note">No subscription. This just sends a maintenance request using the same vehicle and service history.</div>
      <div class="customer-action"><button class="primary" onclick="confirmRebook()">Request ${state.rebookWindow} <span class="arrow-inline">→</span></button></div>
    </main>`;
  }

  window.selectRebook = option => {
    state.rebookWindow = option;
    render();
  };

  window.confirmRebook = () => {
    state.rebooked = true;
    nav('rebookConfirmed');
  };

  function rebookConfirmed() {
    return `<main class="customer-shell confirmation-shell">${customerStrip()}
      <div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Maintenance scheduling</div></div>
      <div class="confirm-mark">✓</div>
      <h1>Request sent.</h1>
      <div class="sub">Mateo will reach out around ${state.rebookWindow} from now to confirm a maintenance detail.</div>
      <div class="confirmation-card"><strong>Your Model Y history is already attached.</strong><span>No forms to fill out again.</span></div>
      ${demoBridge('Return to operator home', 'today')}
    </main>`;
  }

  const screens = {
    today,
    quote,
    quoteCustomer,
    quoteConfirmed,
    job,
    active,
    camera,
    conditions,
    addon,
    customer,
    customerResponse,
    proofcheck,
    complete,
    pay,
    rebook,
    rebookConfirmed
  };

  function render() {
    const customerView = ['quoteCustomer', 'quoteConfirmed', 'customer', 'customerResponse', 'pay', 'rebook', 'rebookConfirmed'].includes(route);
    app.classList.toggle('customer-view-frame', customerView);
    document.body.classList.toggle('customer-view-mode', customerView);
    app.innerHTML = (screens[route] || today)();
  }

  render();
})();
