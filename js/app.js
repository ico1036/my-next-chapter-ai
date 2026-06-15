/* My Next Chapter AI — MVP app.
   Closed-loop in action: every note sharpens the estimate, raises clarity,
   and the coach speaks from accumulated context. Persisted in localStorage so
   a reload proves "it remembers you" — the thing a fresh ChatGPT can't do. */
(function(){
  'use strict';
  const O = window.Ontology;
  const KEY = 'mnc_state_v1';
  const $ = s => document.querySelector(s);

  let S = load();

  function load(){
    try{ const raw = localStorage.getItem(KEY); if(raw) return JSON.parse(raw); }catch(e){}
    return null;
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }
  function today(){ const d=new Date(); return d.toISOString().slice(0,10); }

  /* ---------- onboarding ---------- */
  const ob = { step:0, experiences:[], enjoy:[], audiences:[], text:'' };
  function chips(sel, items, key, multi){
    const c=$(sel); if(!c) return; c.innerHTML='';
    items.forEach(it=>{
      const b=document.createElement('button'); b.type='button'; b.className='chip'; b.textContent=it.label; b.dataset.id=it.id;
      b.onclick=()=>{ const a=ob[key]; const i=a.indexOf(it.id);
        if(i>=0){a.splice(i,1);b.classList.remove('on');}
        else{ if(!multi){a.length=0;c.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));} a.push(it.id); b.classList.add('on'); }
        obRender(); };
      c.appendChild(b);
    });
  }
  function obRender(){
    document.querySelectorAll('#ob-form .demo-step').forEach((el,i)=>el.classList.toggle('active', i===ob.step));
    document.querySelectorAll('#ob-form .steps-dots i').forEach((d,i)=>d.classList.toggle('on', i<=ob.step));
    $('#ob-back').style.visibility = ob.step===0?'hidden':'visible';
    $('#ob-next').textContent = ob.step===2 ? '대시보드 만들기 →' : '다음 →';
    const ok = ob.step===0 ? (ob.experiences.length||ob.text.trim().length>3)
             : ob.step===1 ? ob.enjoy.length>0 : ob.audiences.length>0;
    $('#ob-next').style.opacity=ok?1:.45; $('#ob-next').style.pointerEvents=ok?'auto':'none';
  }
  function initOnboarding(){
    chips('#ob-exp', O.EXPERIENCE.map(e=>({id:e.id,label:e.label})), 'experiences', true);
    chips('#ob-enjoy', Object.keys(O.ENJOY).map(k=>({id:k,label:O.ENJOY_LABEL[k]})), 'enjoy', true);
    chips('#ob-aud', Object.entries(O.AUDIENCE).map(([id,label])=>({id,label})), 'audiences', true);
    $('#ob-text').oninput = e=>{ ob.text=e.target.value; obRender(); };
    $('#ob-back').onclick = ()=>{ if(ob.step>0){ob.step--;obRender();} };
    $('#ob-next').onclick = ()=>{ if(ob.step<2){ob.step++;obRender();} else finishOnboarding(); };
    obRender();
  }
  function finishOnboarding(){
    const r = O.generate(ob);
    S = {
      profile: {
        input: { experiences:ob.experiences, enjoy:ob.enjoy, audiences:ob.audiences, text:ob.text },
        identity: r.identity,
        identityShort: r.identity.replace('당신은 ','').replace(' 사람입니다.',''),
        clarityBase: r.clarity,
        clarity: r.clarity,
        offer: r.primary,
        alternates: r.alternates,
        topSkills: r.topSkills,
      },
      notes: [],
      startDay: today(),
    };
    save();
    showDashboard();
  }

  /* ---------- dashboard ---------- */
  function showDashboard(){
    $('#onboarding').style.display='none';
    $('#dashboard').style.display='block';
    renderDashboard();
    bindNote();
  }

  function renderDashboard(){
    const p = S.profile, notes = S.notes;
    $('#identity-sentence').textContent = p.identity;
    const clarity = Math.round(p.clarity);
    $('#clarity-num').textContent = clarity;
    setTimeout(()=>{ $('#clarity-fill').style.width = clarity+'%'; }, 60);

    // offer box
    const o = p.offer;
    $('#offer-box').innerHTML = `
      <div class="tagrow" style="margin-bottom:10px"><span class="tag tag-amber">${o.format}</span></div>
      <div class="serif" style="font-size:1.08rem;line-height:1.3;margin-bottom:10px">${esc(o.title)}</div>
      <div class="offer-row" style="grid-template-columns:84px 1fr"><b>고객</b><span>${o.audience}</span></div>
      <div class="offer-row" style="grid-template-columns:84px 1fr"><b>가격</b><span>${o.price}</span></div>
      <div class="offer-row" style="grid-template-columns:84px 1fr"><b>채널</b><span>${o.channel}</span></div>`;

    // coach + today
    $('#coach-line').textContent = O.coachLine(p, notes);
    const todayAction = (notes.length && notes[notes.length-1].tomorrow && notes[notes.length-1].tomorrow.length>2)
      ? notes[notes.length-1].tomorrow : o.firstAction;
    $('#today-action').textContent = todayAction;

    // streak + day pill
    const streak = O.computeStreak(notes);
    const distinctDays = new Set(notes.map(n=>n.day)).size || 1;
    $('#day-pill').textContent = 'Day ' + Math.max(1, distinctDays);
    $('#streak-text').innerHTML = notes.length
      ? `<b>${streak}일</b> 연속 · 총 <b>${notes.length}개</b>의 기록 · 고객 대화 <b>${notes.filter(n=>(n.heard||'').length>4).length}회</b>`
      : '아직 시작 전 — 오늘 첫 기록을 남겨보세요.';

    renderTimeline();
    renderReport();
  }

  function renderTimeline(){
    const t = $('#timeline'); const notes=[...S.notes].reverse();
    if(!notes.length){ t.innerHTML='<p class="empty">아직 기록이 없습니다.</p>'; return; }
    t.innerHTML = notes.map(n=>`
      <div class="tl-item">
        <div class="day">${n.day} · ${n.label||''}</div>
        <div class="body">
          ${n.did?`<div>✅ <b>한 일</b> — ${esc(n.did)}</div>`:''}
          ${n.heard?`<div>👂 <b>고객의 말</b> — ${esc(n.heard)}</div>`:''}
          ${n.learned?`<div>💡 <b>배운 것</b> — ${esc(n.learned)}</div>`:''}
          ${n.blocked?`<div>🚧 <b>막힘</b> — ${esc(n.blocked)}</div>`:''}
          ${n.tomorrow?`<div>➡️ <b>내일</b> — ${esc(n.tomorrow)}</div>`:''}
        </div>
      </div>`).join('');
  }

  function renderReport(){
    const notes = S.notes;
    const box = $('#report-box');
    if(notes.length < 1){ box.innerHTML='<p class="empty">기록이 쌓이면 이번 주 전진 거리와 다음 한 가지 제안이 여기 나타납니다.</p>'; return; }
    const recent = notes.slice(-7);
    const actions = recent.filter(n=>(n.did||'').length>2).length;
    const convos = recent.filter(n=>(n.heard||'').length>4).length;
    const learns = recent.filter(n=>(n.learned||'').length>2).length;
    const blocks = recent.filter(n=>(n.blocked||'').length>2).map(n=>n.blocked);
    const grew = Math.round(S.profile.clarity - S.profile.clarityBase);
    const next = recent[recent.length-1].tomorrow && recent[recent.length-1].tomorrow.length>2
      ? recent[recent.length-1].tomorrow
      : (convos===0 ? '이번 주엔 고객 후보 1명과 직접 대화해보기' : '들은 고객의 말을 오퍼 문구에 반영하기');
    box.innerHTML = `
      <div class="report-line"><span>실행한 행동</span><b>${actions}회</b></div>
      <div class="report-line"><span>고객과의 대화</span><b>${convos}회</b></div>
      <div class="report-line"><span>새로 배운 것</span><b>${learns}개</b></div>
      <div class="report-line"><span>방향 선명도 상승</span><b style="color:var(--amber-deep)">+${grew}p</b></div>
      ${blocks.length?`<div class="report-line"><span>해결할 막힘</span><b>${esc(blocks[blocks.length-1])}</b></div>`:''}
      <div class="coach-bubble" style="margin-top:14px"><div class="who">다음 주 한 가지</div>${esc(next)}</div>`;
  }

  function bindNote(){
    $('#save-note').onclick = ()=>{
      const note = {
        day: today(),
        label: '',
        did: val('#n-did'), heard: val('#n-heard'), learned: val('#n-learned'),
        blocked: val('#n-blocked'), tomorrow: val('#n-tomorrow'),
        ts: new Date().toISOString(),
      };
      if(!note.did && !note.heard && !note.learned && !note.tomorrow){ toast('한 줄이라도 적어주세요 🙂'); return; }
      // closed-loop update: the estimate sharpens, clarity rises
      S.profile.clarity = O.updateClarity(S.profile.clarity, note);
      S.notes.push(note);
      save();
      ['#n-did','#n-heard','#n-learned','#n-blocked','#n-tomorrow'].forEach(s=>{ if($(s)) $(s).value=''; });
      renderDashboard();
      toast('기록 저장 완료 — 코치가 당신을 더 알게 됐어요 (+선명도)');
      $('#coach-line').scrollIntoView({behavior:'smooth', block:'center'});
    };
  }

  function val(s){ const el=$(s); return el ? el.value.trim() : ''; }
  function esc(s){ return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  let toastT;
  function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }

  /* ---------- reset ---------- */
  $('#reset-btn').onclick = ()=>{
    if(confirm('모든 기록을 지우고 처음부터 시작할까요?')){ localStorage.removeItem(KEY); location.reload(); }
  };

  /* ---------- boot ---------- */
  if(S && S.profile){ showDashboard(); }
  else { initOnboarding(); }
})();
