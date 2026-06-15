/* Live demo controller — the underlying magic, embedded in the landing page.
   3 quick inputs → Ontology.generate() → identity + first offer + 1cm + the graph. */
(function(){
  'use strict';
  const O = window.Ontology;
  if(!O){ console.error('Ontology engine missing'); return; }

  const state = { step:0, experiences:[], enjoy:[], audiences:[], text:'' };
  const TOTAL = 3;

  const $ = s => document.querySelector(s);
  const stepsEl = () => document.querySelectorAll('#demo .demo-step');

  function render(){
    // chips render once; here we just toggle visible step + dots + buttons
    stepsEl().forEach((el,i)=> el.classList.toggle('active', i===state.step));
    document.querySelectorAll('#demo .steps-dots i').forEach((d,i)=> d.classList.toggle('on', i<=state.step));
    const back = $('#demo-back'), next = $('#demo-next');
    back.style.visibility = state.step===0 ? 'hidden':'visible';
    next.textContent = state.step===TOTAL-1 ? '내 첫 오퍼 보기  ✨' : '다음  →';
    // gate
    const ok = state.step===0 ? (state.experiences.length||state.text.trim().length>3)
             : state.step===1 ? state.enjoy.length>0
             : state.audiences.length>0;
    next.disabled = !ok;
    next.style.opacity = ok ? 1 : .45;
    next.style.pointerEvents = ok ? 'auto':'none';
  }

  function buildChips(containerSel, items, key, multi){
    const c = $(containerSel); if(!c) return;
    c.innerHTML='';
    items.forEach(it=>{
      const b=document.createElement('button');
      b.className='chip'; b.type='button'; b.textContent=it.label; b.dataset.id=it.id;
      b.addEventListener('click',()=>{
        const arr = state[key];
        const idx = arr.indexOf(it.id);
        if(idx>=0){ arr.splice(idx,1); b.classList.remove('on'); }
        else {
          if(!multi){ arr.length=0; c.querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); }
          arr.push(it.id); b.classList.add('on');
        }
        render();
      });
      c.appendChild(b);
    });
  }

  function init(){
    buildChips('#chips-exp', O.EXPERIENCE.map(e=>({id:e.id,label:e.label})), 'experiences', true);
    buildChips('#chips-enjoy', Object.keys(O.ENJOY).map(k=>({id:k,label:O.ENJOY_LABEL[k]})), 'enjoy', true);
    buildChips('#chips-aud', Object.entries(O.AUDIENCE).map(([id,label])=>({id,label})), 'audiences', true);
    const ta = $('#demo-text'); if(ta) ta.addEventListener('input', e=>{ state.text=e.target.value; render(); });
    $('#demo-back').addEventListener('click', ()=>{ if(state.step>0){state.step--;render();} });
    $('#demo-next').addEventListener('click', ()=>{
      if(state.step<TOTAL-1){ state.step++; render(); }
      else runResult();
    });
    $('#demo-restart')?.addEventListener('click', ()=>{
      state.step=0; state.experiences=[]; state.enjoy=[]; state.audiences=[]; state.text='';
      document.querySelectorAll('#demo .chip').forEach(x=>x.classList.remove('on'));
      const ta=$('#demo-text'); if(ta) ta.value='';
      $('#demo-form').style.display='block'; $('#demo-result').style.display='none';
      render();
    });
    render();
  }

  function runResult(){
    const r = O.generate(state);
    const out = $('#demo-result');
    const p = r.primary;
    out.innerHTML = `
      <div class="result-id reveal">
        <div class="label">당신의 한 문장</div>
        <div class="big">${escapeId(r.identity)}</div>
        <div class="gauge mt16">
          <div class="gauge-top"><span>방향 선명도</span><span><b style="color:#E8B04B">${r.clarity}%</b> · 오늘 시작</span></div>
          <div class="track"><div class="fill" style="width:0%"></div></div>
          <div style="font-size:.78rem;color:#A99;margin-top:8px">매일 기록할수록 이 숫자는 올라갑니다. 그게 우리의 해자예요.</div>
        </div>
      </div>

      <div class="offer-card">
        <div class="tagrow">
          <span class="tag tag-amber">${p.format}</span>
          <span class="tag tag-sage">첫 테스트 오퍼</span>
        </div>
        <h3>${escapeId(p.title)}</h3>
        <div class="offer-row"><b>누구에게</b><span>${p.audience}</span></div>
        <div class="offer-row"><b>첫 가격</b><span>${p.price} <span class="muted">— 부담 없이 시작, 반응 보고 올리기</span></span></div>
        <div class="offer-row"><b>어디서 찾나</b><span>${p.channel}</span></div>
        <div class="offer-row"><b>오늘의 1cm</b><span><b style="color:var(--amber-deep)">${p.firstAction}</b></span></div>
        <div class="offer-why">💡 왜 당신인가 — ${p.why}</div>
      </div>

      <div class="onto" aria-label="경험이 오퍼가 되는 길">
        ${r.graph.experiences.slice(0,2).map(x=>`<span class="node exp">${x}</span>`).join('<span class="ar">+</span>')}
        <span class="ar">→</span>
        <span class="node">${r.topSkills.slice(0,2).join(' · ')}</span>
        <span class="ar">→</span>
        <span class="node off">${p.format}</span>
        <span class="ar">→</span>
        <span class="node">${p.audience}</span>
      </div>

      ${r.alternates.length?`<div class="mt24"><div class="q-help" style="margin-bottom:10px">다른 가능성도 열려 있어요</div>
      <div class="alt-row">
        ${r.alternates.map(a=>`<div class="alt"><b>${a.format}</b><span>${escapeId(a.title)}</span><br><small>${a.price}</small></div>`).join('')}
      </div></div>`:''}

      <div class="mt24 row" style="justify-content:space-between;align-items:center">
        <button id="demo-restart" class="btn btn-ghost">↺ 다시 해보기</button>
        <a href="app.html" class="btn btn-primary">이걸 진짜로 만들기 — 6주 프로그램 →</a>
      </div>
      <p class="muted mt16" style="font-size:.82rem">* 데모는 당신 입력을 저장하지 않습니다. 실제 제품은 <b>당신 것은 당신 것</b> — private-by-default.</p>
    `;
    $('#demo-form').style.display='none';
    out.style.display='block';
    // animate gauge + bind restart
    requestAnimationFrame(()=>{ setTimeout(()=>{ const f=out.querySelector('.fill'); if(f) f.style.width=r.clarity+'%'; out.querySelector('.reveal')?.classList.add('in'); },60); });
    out.querySelector('#demo-restart')?.addEventListener('click', ()=>{
      state.step=0; state.experiences=[]; state.enjoy=[]; state.audiences=[]; state.text='';
      document.querySelectorAll('#demo .chip').forEach(x=>x.classList.remove('on'));
      const ta=$('#demo-text'); if(ta) ta.value='';
      $('#demo-form').style.display='block'; out.style.display='none'; render();
    });
    out.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function escapeId(s){ return (s||'').replace(/</g,'&lt;'); }

  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
