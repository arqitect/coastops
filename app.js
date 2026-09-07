(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const params = new URLSearchParams(location.search);
  const state = {
    shots: Number(params.get('shots') || 8),
    classified: params.get('classified') === '1',
    addOn: { name: 'Pet-hair removal', price: 40, message: 'There’s heavy pet hair embedded in the rear cargo area. I can take care of it while I’m here for an additional $40.' },
    approval: params.get('approval') || 'pending',
    paid: params.get('paid') === '1',
    started: true
  };
  let route = params.get('screen') || 'today';
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1700); }
  function nav(screen){ route=screen; try{ history.replaceState(null,'','?screen='+screen); }catch(e){} render(); window.scrollTo(0,0); }
  window.nav = nav; window.setRoute=(screen)=>{ route=screen; render(); };
  function topNav(title, right='') { return `<div class="navtop"><button class="icon-btn back" aria-label="Back" onclick="historyBack()">‹</button><div class="navtop-title">${title}</div><div>${right}</div></div>`; }
  function stage(current){ const labels=['Details','Photos','Finish']; return `<div class="stage">${labels.map((label,i)=>`<div class="stage-item ${i<current?'done':i===current?'current':''}"><div class="stage-bar"></div><div class="stage-label">${label}</div></div>`).join('')}</div>`; }
  window.historyBack=()=>{ const map={job:'today',active:'job',addon:'active',complete:'active',customer:'addon',pay:'complete'}; nav(map[route]||'today'); };
  const tabbar = `<div class="tabbar">
      <button class="tab active" onclick="nav('today')"><span class="tab-icon"></span><span>Today</span></button>
      <button class="tab"><span class="tab-icon"></span><span>Jobs</span></button>
      <button class="tab"><span class="tab-icon"></span><span>Customers</span></button>
      <button class="tab"><span class="tab-icon"></span><span>More</span></button>
    </div>`;
  function today(){ return `<main class="screen">
    <div class="topbar"><div class="brand">COASTAL DETAIL</div><div class="avatar">MD</div></div>
    <div class="headline-row"><div><h1>Today</h1><div class="date muted">Sunday, September 6</div></div></div>
    <div class="metrics"><div class="metric"><strong>$1,140</strong><span>Scheduled</span></div><div class="metric"><strong>4</strong><span>Jobs</span></div><div class="metric"><strong>$520</strong><span>Unpaid</span></div></div>
    <div class="section-head"><div class="section-title">Schedule</div><button class="link">View all</button></div>
    <div class="list">
      <button class="job-row" onclick="nav('job')"><div class="job-time">9:00<span class="next">NEXT</span></div><div><div class="job-name">Sarah Chen</div><div class="job-desc">Tesla Model Y · Full detail</div></div><div class="job-price">$220<span class="chev">›</span></div></button>
      <button class="job-row"><div class="job-time">11:30</div><div><div class="job-name">Owen Park</div><div class="job-desc">BMW X3 · Interior</div></div><div class="job-price">$180<span class="chev">›</span></div></button>
      <button class="job-row"><div class="job-time">2:00</div><div><div class="job-name">Maya Lopez</div><div class="job-desc">Subaru Outback · Wash + wax</div></div><div class="job-price">$160<span class="chev">›</span></div></button>
      <button class="job-row"><div class="job-time">4:30</div><div><div class="job-name">Chris Nguyen</div><div class="job-desc">Ford F-150 · Exterior detail</div></div><div class="job-price">$240<span class="chev">›</span></div></button>
    </div>
    <div class="attention"><div class="attention-head"><span>Needs attention</span><span class="count">2</span></div><div class="attention-row"><span>Invoice #1048 · 3 days overdue</span><strong>$260</strong></div><div class="attention-row"><span>Approval waiting · Jordan Lee</span><strong>+$45</strong></div></div>
    ${tabbar}
  </main>`; }
  function job(){ return `<main class="screen no-tabs">${topNav('Sarah Chen')}${stage(0)}
    <section class="summary"><h1>9:00 AM</h1><div class="vehicle">2025 Tesla Model Y · White</div><div class="summary-grid">
      <div class="summary-item"><label>Service</label><div>Full detail</div></div>
      <div class="summary-item"><label>Quoted</label><div>$220</div></div>
      <div class="summary-item"><label>Address</label><div>412 Bay Ave</div></div>
      <div class="summary-item"><label>Duration</label><div>~2 hours</div></div>
    </div></section>
    <div class="section-head" style="margin-top:13px"><div class="section-title">Job details</div></div>
    <div class="info-row"><div class="left"><div class="label">Customer note</div><div class="detail">Coffee stain on rear passenger seat</div></div><span class="chev">›</span></div>
    <div class="info-row"><div class="left"><div class="label">Customer</div><div class="detail">Sarah Chen · (831) 555-0142</div></div><span class="chev">›</span></div>
    <div class="info-row"><div class="left"><div class="label">Directions</div><div class="detail">Capitola · 12 min away</div></div><span class="value" style="color:var(--accent)">Open</span></div>
    <div class="section-head" style="margin-top:16px"><div class="section-title">Service scope</div></div>
    <div class="scope-list"><div class="scope-row"><span class="scope-dot"></span><span>Exterior wash + wheels</span></div><div class="scope-row"><span class="scope-dot"></span><span>Interior vacuum + surfaces</span></div><div class="scope-row"><span class="scope-dot"></span><span>Windows + final wipe-down</span></div></div>
    <div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="nav('active')">Start job <span class="arrow-inline">→</span></button></div>
  </main>`; }
  function active(){ return `<main class="screen no-tabs">${topNav('Active job')}${stage(1)}
    <div class="job-status">In progress · 9:07 AM</div>
    <div class="workspace-title"><h1>Sarah Chen</h1><div class="sub">Tesla Model Y · Full detail</div></div>
    <button class="photo-hub" onclick="nav('camera')">
      <div class="photo-hub-head"><div class="camera-icon"></div><div><div class="photo-hub-title">Job photos</div><div class="photo-hub-sub">Shoot freely. Organization happens afterward.</div></div><div class="camera-count">${state.shots} ›</div></div>
      ${state.classified ? `<div class="photo-groups"><div class="photo-group"><div class="group-thumb"></div><div class="group-meta"><strong>Exterior</strong><span>6</span></div></div><div class="photo-group"><div class="group-thumb"></div><div class="group-meta"><strong>Interior</strong><span>5</span></div></div><div class="photo-group"><div class="group-thumb"></div><div class="group-meta"><strong>Damage</strong><span>2</span></div></div></div>` : ''}
    </button>
    ${state.classified ? `<div class="inline-status"><strong>${state.shots} photos organized automatically.</strong> Review later only if needed.</div>` : `<div class="inline-status">No categories to pick while you work. <strong>Just keep shooting.</strong></div>`}
    <div class="workspace-actions"><button class="tool-row" onclick="nav('addon')"><div><strong>Add charge</strong><span>Extra work that changes the customer total</span></div><div class="arrow">›</div></button><button class="tool-row" onclick="toast('Customer note added')"><div><strong>Add note</strong><span>Private note or customer update</span></div><div class="arrow">›</div></button></div>
    <div class="activity"><div class="section-title">Job activity</div>
      <div class="activity-row active"><span class="activity-dot"></span><span>Job started</span><span class="activity-time">9:07</span></div>
      <div class="activity-row"><span class="activity-dot"></span><span>${state.shots} photos captured</span><span class="activity-time">9:18</span></div>
      ${state.approval==='approved'?`<div class="activity-row active"><span class="activity-dot"></span><span>Pet-hair removal approved · +$40</span><span class="activity-time">10:04</span></div>`:''}
    </div>
    ${state.classified ? `<div class="sticky-action"><div class="sticky-kicker">Next step</div><div class="sticky-split"><button class="secondary accent" onclick="nav('camera')">More photos</button><button class="primary" onclick="nav('complete')">Review & finish <span class="arrow-inline">→</span></button></div></div>` : `<div class="sticky-action"><div class="sticky-kicker">Next step</div><button class="primary" onclick="nav('camera')">Take job photos <span class="arrow-inline">→</span></button></div>`}
  </main>`; }
  function camera(){ const thumbs = Array.from({length:Math.min(state.shots,6)},(_,i)=>'<div class="thumb"></div>').join(''); return `<main class="camera-screen">
    <div class="viewfinder"><div class="car-shape"><div class="wheel left"></div><div class="wheel right"></div></div></div>
    <div class="camera-top"><button class="icon-btn" onclick="nav('active')">×</button><div class="camera-title">Sarah · Model Y</div><div style="width:42px"></div></div>
    <div class="camera-hint">No need to tag photos — just keep shooting</div>
    <div class="camera-bottom"><div class="filmstrip" id="filmstrip">${thumbs}</div><div class="capture-row"><div class="shot-count"><strong id="shotnum">${state.shots}</strong> photos</div><button class="shutter" aria-label="Take photo" onclick="capture()"></button><button class="done-camera" onclick="finishCapture()">Done</button></div></div>
  </main>`; }
  window.capture=()=>{ state.shots++; const strip=document.getElementById('filmstrip'); if(strip){ const t=document.createElement('div'); t.className='thumb'; strip.appendChild(t); if(strip.children.length>6) strip.removeChild(strip.firstChild); } const n=document.getElementById('shotnum'); if(n)n.textContent=state.shots; };
  window.finishCapture=()=>{ state.classified=true; nav('active'); setTimeout(()=>toast(`${state.shots} photos organized`),80); };
  function addon(){ return `<main class="screen no-tabs">${topNav('Add charge')}
    <div class="eyebrow">Sarah Chen · Active job</div><h1 style="font-size:27px;margin:7px 0 5px">Extra work</h1><div class="sub">Only send this if it changes what Sarah will pay.</div>
    <div class="suggested"><div><strong>Typical price: $35–50</strong><br><span>Based on your recent pet-hair add-ons · ~20 min</span></div><div class="price">$40</div></div>
    <div class="field"><label>ITEM</label><input class="input" id="addonName" value="${state.addOn.name}"></div>
    <div class="field"><label>PRICE</label><input class="input" id="addonPrice" inputmode="decimal" value="$${state.addOn.price}"></div>
    <div class="field"><label>MESSAGE TO CUSTOMER</label><textarea class="input" id="addonMsg">${state.addOn.message}</textarea></div>
    <div class="attachment"><div class="attachment-thumb"></div><div><strong>Photo attached</strong><span>Rear cargo area · 10:01 AM</span></div><button class="link" type="button">Change</button></div>
    <div class="sub" style="margin-top:12px">Sarah sees this photo, the reason, and the exact added price. Nothing else from the job is exposed.</div>
    <div class="sticky-action"><div class="sticky-kicker">Send to customer</div><button class="primary" onclick="sendApproval()">Send approval request <span class="arrow-inline">→</span></button></div>
  </main>`; }
  window.sendApproval=()=>{ state.addOn.name=document.getElementById('addonName').value; state.addOn.price=parseFloat(document.getElementById('addonPrice').value.replace(/[^0-9.]/g,''))||40; state.addOn.message=document.getElementById('addonMsg').value; state.approval='pending'; nav('customer'); };
  function customer(){ return `<main class="customer-shell"><div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">412 Bay Ave · Capitola, CA</div></div>
    <div class="eyebrow">Your detail is in progress</div><h1>Quick approval</h1><div class="sub">Mateo found one item that isn’t included in your original $220 quote.</div>
    <div class="proof-photo"><div class="caption">Rear cargo area · 10:01 AM</div></div>
    <div class="approval-card"><h2>${state.addOn.name}</h2><p class="sub" style="margin-top:7px">${state.addOn.message}</p><div class="price-line"><span class="sub">Added to today’s total</span><strong>+$${state.addOn.price}</strong></div></div>
    <div class="sub">Nothing is charged until you approve it.</div>
    <div class="customer-action"><div class="choice-row"><button class="secondary" onclick="decline()">No thanks</button><button class="primary" onclick="approve()">Approve +$${state.addOn.price}</button></div></div>
  </main>`; }
  window.approve=()=>{ state.approval='approved'; nav('active'); setTimeout(()=>toast(`Approved · +$${state.addOn.price}`),80); };
  window.decline=()=>{ state.approval='declined'; nav('active'); setTimeout(()=>toast('Customer declined extra work'),80); };
  function complete(){ const total=220+(state.approval==='approved'?state.addOn.price:0); return `<main class="screen no-tabs">${topNav('Finish job')}${stage(2)}
    <div class="complete-mark">✓</div><h1 style="font-size:28px">Ready to send</h1><div class="sub" style="margin-top:6px">Review the customer handoff before you close the job.</div>
    <div class="compare"><div class="compare-item"><div class="compare-img"></div><div class="compare-label">BEFORE</div></div><div class="compare-item"><div class="compare-img"></div><div class="compare-label">AFTER</div></div></div>
    <div class="auto-note"><div class="auto-mark"></div><div><strong>${state.shots} job photos organized</strong><span>Best before/after pair selected for the customer. All photos stay attached to the job.</span></div></div>
    <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval==='approved'?`<div class="bill-row"><span>${state.addOn.name}</span><strong>$${state.addOn.price}</strong></div>`:''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
    <div class="sticky-action"><div class="sticky-kicker">Complete job</div><button class="primary" onclick="nav('pay')">Send proof + request $${total} <span class="arrow-inline">→</span></button></div>
  </main>`; }
  function pay(){ const total=220+(state.approval==='approved'?state.addOn.price:0); return `<main class="customer-shell"><div class="customer-brand"><div class="name">COASTAL DETAIL</div><div class="meta">Job completed · 10:42 AM</div></div>
    <div class="complete-mark">✓</div><h1>Your Model Y is ready.</h1><div class="sub">Thanks, Sarah. Here’s your completed work and receipt.</div>
    <div class="compare"><div class="compare-item"><div class="compare-img"></div><div class="compare-label">BEFORE</div></div><div class="compare-item"><div class="compare-img"></div><div class="compare-label">AFTER</div></div></div>
    <div class="bill"><div class="bill-row"><span>Full detail</span><strong>$220</strong></div>${state.approval==='approved'?`<div class="bill-row"><span>${state.addOn.name}</span><strong>$${state.addOn.price}</strong></div>`:''}<div class="bill-row bill-total"><span>Total</span><strong>$${total}</strong></div></div>
    ${state.paid?`<div class="status-banner">Paid · Visa ending in 4242</div>`:''}
    <div class="customer-action"><button class="primary" onclick="payNow()">${state.paid?'Book next detail':'Pay $'+total}</button></div>
  </main>`; }
  window.payNow=()=>{ if(!state.paid){state.paid=true; render(); setTimeout(()=>toast('Payment received'),60);} else { toast('Rebooking flow would open here'); } };
  const screens={today,job,active,camera,addon,customer,complete,pay};
  function render(){ app.innerHTML=(screens[route]||today)(); }
  render();
})();
