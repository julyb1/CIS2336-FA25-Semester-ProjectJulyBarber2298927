const POST_URL = '/api/book'; // change when integrating backend

/* Navigation */
function initNavigation(){
  const toggle = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-list');
  if (toggle){
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('show');
    });
  }


  document.querySelectorAll('[data-nav]').forEach(a => {
    const href = a.getAttribute('href');
    const current = location.pathname.split('/').pop() || 'index.html';
    if (href === current || (href === 'index.html' && current === '')) {
      a.classList.add('active');
    }
  });
}


function initFAQ(){
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const ans = btn.nextElementSibling;
      if (ans) ans.hidden = expanded;
    });
  });
}


const demoBooked = {
  R101: [{ date: "2025-11-20", start: "10:00", end: "11:00" }],
  R201: [],
  R301: [],
  R401: [],
  AUD: []
};
function timeToMinutes(t){ const [hh,mm]=t.split(':').map(Number); return hh*60+mm; }
function overlaps(a,b,c,d){ return Math.max(a,c) < Math.min(b,d); }
function checkAvailability(room,date,start,end){
  if(!room||!date||!start||!end) return {ok:false,reason:'Missing fields'};
  const bookings = demoBooked[room] || [];
  const s=timeToMinutes(start), e=timeToMinutes(end);
  for(const b of bookings){
    if(b.date===date){
      const bs=timeToMinutes(b.start), be=timeToMinutes(b.end);
      if(overlaps(s,e,bs,be)) return {ok:false,reason:`Conflict ${b.start}-${b.end}`};
    }
  }
  return {ok:true};
}


function initBookingForm(){
  const form = document.getElementById('booking-form');
  if(!form) return;
  const messageEl = document.getElementById('form-message');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    const room = formData.get('room');
    const date = formData.get('date');
    const start = formData.get('start');
    const end = formData.get('end');
    const name = formData.get('name');
    const email = formData.get('email');

    if(!room||!date||!start||!end||!name||!email){
      messageEl.textContent = 'Please complete all required fields.';
      return;
    }

    const now = new Date();
    const sel = new Date(date + 'T' + start);
    if(sel < now){
      messageEl.textContent = 'Cannot book a date/time in the past.';
      return;
    }

    if(timeToMinutes(end) <= timeToMinutes(start)){
      messageEl.textContent = 'End time must be later than start time.';
      return;
    }

    const avail = checkAvailability(room,date,start,end);
    if(!avail.ok){
      messageEl.textContent = 'Room unavailable: ' + avail.reason;
      return;
    }

    const payload = {room,date,start,end,name,email};

    try {
      const resp = await fetch(POST_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });

      if(resp.ok){
        const data = await resp.json().catch(()=>({status:'ok'}));
        messageEl.textContent = 'Booking confirmed by server. Thank you!';
        form.reset();
      } else if (resp.status === 409){
        messageEl.textContent = 'Server reports a conflict. Booking not saved.';
      } else {
        messageEl.textContent = `Server error (${resp.status}). Showing demo confirmation instead.`;
        messageEl.textContent = `Demo confirmation: ${room} ${date} ${start}-${end}`;
        form.reset();
      }
    } catch(err){
      messageEl.textContent = `No backend detected — demo confirmation: ${room} ${date} ${start}-${end}`;
      if(!demoBooked[room]) demoBooked[room]=[];
      demoBooked[room].push({date,start,end});
      form.reset();
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFAQ();
  initBookingForm();
});