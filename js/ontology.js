/* ============================================================================
   My Next Chapter AI — Ontology Engine  (the "underlying magic")
   ----------------------------------------------------------------------------
   This is the road, not the cargo. We do NOT store the user's private data;
   we own the typed graph that turns lived experience into a first paying offer.

   Objects:  Experience → Skill → Asset → Offer → Customer → Channel → Action
   Links:    (Experience+Enjoy) ⇒ Skill ;  (Skill+Audience) ⇒ Offer ;
             Offer ⇒ {Price, Channel, FirstAction, Identity}

   Everything below runs client-side and is deterministic, so the live demo is
   reproducible and inspectable — but rich enough to feel like a coach who
   actually read your life.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- 1. EXPERIENCE NODES : keyword → skills / assets / domain ----------- */
  // Each experience contributes weighted skills. Matching is keyword-based so
  // free-text like "한국에서 중학교 영어 교사였어요" still lights up the right skills.
  const EXPERIENCE = [
    { id:'teacher',  label:'교사·강사',     kw:['교사','선생','강사','학교','교육','수업','가르','과외','학원','튜터'],
      skills:{teach:3, curriculum:2, evaluate:2, explain:2}, assets:['수업 경험','학생/학부모 신뢰'] },
    { id:'nurse',    label:'간호·의료',     kw:['간호','병원','의료','약사','요양','케어','보건','치료','재활'],
      skills:{care:3, health:3, listen:2, calm:2}, assets:['의료 지식','돌봄 경험'] },
    { id:'designer', label:'디자인·크리에이티브', kw:['디자인','디자이너','그래픽','브랜딩','일러','편집','ui','ux','포토','영상'],
      skills:{design:3, visual:2, brand:2, make:2}, assets:['포트폴리오','심미안'] },
    { id:'marketer', label:'마케팅·홍보',   kw:['마케','홍보','광고','sns','인스타','콘텐츠','퍼포먼스','브랜드','pr'],
      skills:{market:3, copy:2, social:2, story:2}, assets:['채널 운영 감각'] },
    { id:'counsel',  label:'상담·코칭',     kw:['상담','코치','코칭','심리','멘토','컨설','카운','테라'],
      skills:{listen:3, coach:3, empathy:2, structure:1}, assets:['경청 신뢰','상담 경험'] },
    { id:'realtor',  label:'부동산',         kw:['부동산','리얼터','중개','매물','집','렌트','모기지','에이전트'],
      skills:{localknow:3, negotiate:2, bigdecision:3, network:2}, assets:['지역 정보','큰 결정 가이드 경험'] },
    { id:'finance',  label:'재정·회계·보험', kw:['회계','재정','세무','보험','은행','금융','투자','경리','financial','부기'],
      skills:{numbers:3, plan:2, bigdecision:2, trust:2}, assets:['숫자 신뢰','계획 능력'] },
    { id:'cook',     label:'요리·푸드',     kw:['요리','음식','베이','반찬','식단','요식','셰프','쿠킹','김치','한식'],
      skills:{food:3, health:1, make:2, care:1}, assets:['손맛','레시피'] },
    { id:'language', label:'통번역·언어',   kw:['통역','번역','언어','영어','이중언어','바이링','translat','interpret'],
      skills:{language:3, bridge:3, explain:2}, assets:['이중언어','문화 다리'] },
    { id:'beauty',   label:'뷰티·웰니스',   kw:['뷰티','미용','네일','헤어','메이크','피부','스킨','웰니스','요가','필라','운동','퍼스널'],
      skills:{beauty:3, style:2, care:2, make:1}, assets:['스타일 감각','시술/지도 경험'] },
    { id:'arts',     label:'음악·미술·예술', kw:['음악','피아노','미술','그림','악기','노래','공예','art','music','댄스','무용'],
      skills:{art:3, teach:2, make:2, creative:2}, assets:['예술 실력','지도 경험'] },
    { id:'parenting',label:'육아·살림',     kw:['육아','엄마','아이','살림','홈','정리','수납','가정','자녀','출산','모유'],
      skills:{parenting:3, organize:2, care:2, patience:2}, assets:['양육 노하우','또래 신뢰'] },
    { id:'tech',     label:'IT·개발',       kw:['개발','it','프로그','코딩','엔지니어','데이터','소프트','ai','자동화','노코드'],
      skills:{tech:3, automate:2, structure:2, analyze:2}, assets:['기술 역량'] },
    { id:'pm',       label:'기획·PM·운영',  kw:['기획','pm','운영','프로젝트','매니저','전략','오퍼레이','컨설턴트','경영'],
      skills:{structure:3, execute:2, coordinate:2, analyze:2}, assets:['실행/조율 경험'] },
    { id:'sales',    label:'영업·세일즈',   kw:['영업','세일','판매','리테일','매장','고객','b2b','account'],
      skills:{sales:3, network:2, relationship:2, negotiate:1}, assets:['세일즈 감각','고객 관계'] },
    { id:'writer',   label:'글쓰기·콘텐츠', kw:['작가','글','기자','에디터','블로그','뉴스레터','출판','카피','writing'],
      skills:{write:3, story:2, structure:1}, assets:['글쓰기','서사 능력'] },
    { id:'admin',    label:'사무·행정·번역', kw:['사무','행정','비서','어시','데이터입력','문서','오피스','엑셀'],
      skills:{organize:3, structure:2, execute:2}, assets:['꼼꼼한 실행력'] },
  ];

  /* ---- 2. ENJOY NODES : the energy gradient (what charges vs drains) ------- */
  const ENJOY = {
    teach:    {skills:{teach:2, explain:1}},
    organize: {skills:{organize:2, structure:1}},
    listen:   {skills:{listen:2, empathy:1, coach:1}},
    make:     {skills:{make:2, design:1, creative:1}},
    write:    {skills:{write:2, story:1}},
    connect:  {skills:{network:2, relationship:1, coordinate:1}},
    analyze:  {skills:{analyze:2, numbers:1, structure:1}},
  };
  const ENJOY_LABEL = {
    teach:'가르치고 설명하기', organize:'정리하고 구조화하기', listen:'들어주고 도와주기',
    make:'만들고 꾸미기', write:'글로 표현하기', connect:'사람들 연결·모임', analyze:'분석하고 계획하기',
  };

  /* ---- 3. AUDIENCE NODES --------------------------------------------------- */
  const AUDIENCE = {
    parents:   '한인 학부모',
    newcomers: '이민 초기 가족',
    moms:      '또래 엄마들',
    smallbiz:  '한인 소상공인',
    seniors:   '한인 시니어',
    students:  '학생·청소년',
    women:     '커리어 전환 여성',
    pros:      '한인 전문직',
  };

  /* ---- 4. OFFER ARCHETYPES : (Skill + Audience) ⇒ Offer ------------------- */
  // want: skills that make this offer a fit, with weights.
  // priceLow/High in USD for a *first test* offer (deliberately small).
  // format drives the identity verb. firstAction = the 1cm.
  const OFFERS = [
    { id:'consult-1on1', format:'1:1 컨설팅', verb:'정리해주는',
      want:{localknow:3, bigdecision:3, coach:2, listen:2, language:2, numbers:2, parenting:2},
      audiences:['parents','newcomers','women','pros'],
      priceLow:49, priceHigh:120, unit:'세션',
      title:(a,x)=>`${AUDIENCE[a]}${josa(AUDIENCE[a],'을를')} 위한 1:1 ${x.topic} 컨설팅`,
      channel:(a)=>channelFor(a),
      first:(a)=>`${AUDIENCE[a]} 3명에게 "30분 무료 상담" 메시지 보내기`,
      why:'당신은 이미 주변에서 같은 질문을 자주 받아 왔습니다 — 그 대화가 곧 상품입니다.' },

    { id:'workshop', format:'그룹 워크숍', verb:'가르치는',
      want:{teach:3, curriculum:2, explain:2, art:2, food:2, beauty:1, organize:1, tech:2},
      audiences:['parents','moms','women','students'],
      priceLow:25, priceHigh:60, unit:'2시간 워크숍',
      title:(a,x)=>`${AUDIENCE[a]} 대상 ${x.topic} 실전 워크숍`,
      channel:(a)=>channelFor(a),
      first:(a)=>`교회·한국학교 게시판에 "${'소규모 워크숍'}" 모집 글 1개 올리기`,
      why:'한 명에게 가르치던 것을 다섯 명에게 동시에 — 시간당 가치가 5배가 됩니다.' },

    { id:'course', format:'온라인 클래스', verb:'가르치는',
      want:{teach:3, curriculum:2, tech:2, language:2, design:1, write:2},
      audiences:['parents','women','students','moms'],
      priceLow:39, priceHigh:99, unit:'클래스',
      title:(a,x)=>`${x.topic} 온라인 클래스 (${AUDIENCE[a]} 맞춤)`,
      channel:(a)=>'카카오 오픈채팅 + 인스타 릴스로 사전 등록',
      first:(a)=>`클래스 1강(15분) 분량의 목차만 먼저 적어보기`,
      why:'경험이 한 번 강의로 굳으면, 자는 동안에도 팔립니다.' },

    { id:'coaching', format:'코칭 프로그램', verb:'곁에서 이끄는',
      want:{coach:3, listen:3, empathy:2, parenting:2, structure:1, plan:1},
      audiences:['moms','women','newcomers'],
      priceLow:120, priceHigh:400, unit:'4주 프로그램',
      title:(a,x)=>`${AUDIENCE[a]}${josa(AUDIENCE[a],'을를')} 위한 4주 ${x.topic} 코칭`,
      channel:(a)=>channelFor(a),
      first:(a)=>`"4주 후 이렇게 달라집니다" 한 문단으로 약속 적기`,
      why:'사람들은 정보가 아니라 "끝까지 함께 가 줄 사람"에 돈을 냅니다.' },

    { id:'dfy', format:'서비스 대행', verb:'대신 해주는',
      want:{design:3, market:3, copy:2, social:2, tech:2, write:2, automate:2, numbers:2},
      audiences:['smallbiz','pros'],
      priceLow:150, priceHigh:600, unit:'프로젝트',
      title:(a,x)=>`${AUDIENCE[a]}${josa(AUDIENCE[a],'을를')} 위한 ${x.topic} 대행`,
      channel:(a)=>'한인 소상공인 모임 / 한인 비즈니스 디렉토리 직접 연락',
      first:(a)=>`주변 한인 사장님 3곳의 ${'온라인 상태'}를 보고 개선점 1개씩 메모`,
      why:'바쁜 사장님들은 "할 줄 아는데 할 시간이 없는 일"에 기꺼이 지불합니다.' },

    { id:'community', format:'커뮤니티·멤버십', verb:'연결하는',
      want:{network:3, relationship:2, coordinate:2, listen:1, parenting:1},
      audiences:['moms','women','newcomers','pros'],
      priceLow:15, priceHigh:39, unit:'월',
      title:(a,x)=>`${AUDIENCE[a]} 멤버십 커뮤니티`,
      channel:(a)=>'기존 단톡방 → 유료 소그룹으로 전환',
      first:(a)=>`지금 연결된 사람 8명에게 "이런 모임 만들면 올래요?" 물어보기`,
      why:'당신이 이미 가진 신뢰 네트워크가 곧 첫 멤버입니다.' },

    { id:'product', format:'디지털 제품·키트', verb:'만들어 파는',
      want:{food:3, organize:3, write:2, design:2, health:2, parenting:2, plan:2},
      audiences:['moms','parents','women','seniors'],
      priceLow:9, priceHigh:49, unit:'개',
      title:(a,x)=>`${x.topic} 가이드/키트 (디지털 다운로드)`,
      channel:(a)=>'인스타 + 한인 맘카페에서 무료 미리보기 → 결제 링크',
      first:(a)=>`A4 한 장짜리 "${'체크리스트'}" 초안 만들기`,
      why:'한 번 만들면 재고도, 배송도 없이 무한히 팔리는 자산이 됩니다.' },

    { id:'local', format:'로컬 서비스', verb:'직접 돌보는',
      want:{food:3, beauty:3, care:2, style:2, health:2},
      audiences:['moms','seniors','women','parents'],
      priceLow:30, priceHigh:150, unit:'회',
      title:(a,x)=>`동네 ${AUDIENCE[a]} 대상 ${x.topic} 서비스`,
      channel:(a)=>'동네 한인 맘카페 + 입소문(추천 1건당 할인)',
      first:(a)=>`이번 주 안에 지인 1명에게 무료/반값으로 한 번 해보고 후기 받기`,
      why:'가장 가까운 동네에서 "한 명의 진짜 고객"이 모든 것의 시작입니다.' },

    { id:'content', format:'콘텐츠·뉴스레터', verb:'기록해 나누는',
      want:{write:3, story:2, social:2, market:2, health:1, parenting:1},
      audiences:['women','moms','parents','newcomers'],
      priceLow:0, priceHigh:9, unit:'월(후원/구독)',
      title:(a,x)=>`${x.topic}에 대한 주간 뉴스레터/릴스`,
      channel:(a)=>'인스타 릴스로 도달 → 뉴스레터로 소유 → 유료 전환',
      first:(a)=>`당신의 경험에서 나온 "남들이 모르는 팁" 1개를 짧게 써보기`,
      why:'당신의 이야기는 비용이 0이고, 신뢰와 미래 고객을 동시에 만듭니다.' },
  ];

  /* ---- topic inference : experience → human-readable offer topic ----------- */
  const TOPIC = {
    teacher:'학습·입시', nurse:'건강·돌봄', designer:'브랜드·디자인', marketer:'SNS·마케팅',
    counsel:'마음·진로', realtor:'첫 집·정착', finance:'가계 재정·세금', cook:'건강 한식·식단',
    language:'영어·서류·통역', beauty:'뷰티·셀프케어', arts:'음악·미술', parenting:'육아·살림',
    tech:'AI·자동화', pm:'실행·기획', sales:'세일즈', writer:'글쓰기·콘텐츠', admin:'업무 정리',
  };

  /* Korean particle (josa) helper — picks 을/를, 이/가, 은/는 by final consonant.
     Keeps generated copy grammatical, which matters for trust with the target. */
  function hasBatchim(word){
    if(!word) return false;
    const c = word.charCodeAt(word.length-1);
    if (c < 0xAC00 || c > 0xD7A3) return false; // not Hangul syllable → treat as no batchim
    return (c - 0xAC00) % 28 !== 0;
  }
  function josa(word, pair){ // pair: '을를' | '이가' | '은는' | '와과'
    const b = hasBatchim(word);
    const map = { '을를':['을','를'], '이가':['이','가'], '은는':['은','는'], '와과':['과','와'] };
    const [withB, withoutB] = map[pair] || ['을','를'];
    return b ? withB : withoutB;
  }

  function channelFor(a){
    const m = {
      parents:'한국학교·학부모 단톡방', newcomers:'한인 정착 카페·교회',
      moms:'한인 맘카페·또래 단톡방', smallbiz:'한인 상공회·비즈니스 모임',
      seniors:'한인 교회·시니어 센터', students:'한국학교·학부모 추천',
      women:'한인 여성 모임·교회 소그룹', pros:'한인 전문직 네트워크·링크드인',
    };
    return m[a] || '한인 커뮤니티';
  }

  /* ---- 5. ENGINE : the typed transform ------------------------------------ */
  function tokenize(text){ return (text||'').toLowerCase(); }

  function detectExperiences(input){
    // input.experiences: array of {id} or free text in input.text
    const hits = {};
    const text = tokenize([input.text, (input.experienceText||'')].join(' '));
    (input.experiences||[]).forEach(id => { hits[id] = (hits[id]||0) + 2; });
    EXPERIENCE.forEach(e => {
      for (const k of e.kw){ if (text.includes(k)) { hits[e.id] = (hits[e.id]||0) + 1; break; } }
    });
    return EXPERIENCE.filter(e => hits[e.id]).map(e => ({ node:e, weight:hits[e.id] }));
  }

  function accumulateSkills(detected, enjoy){
    const skills = {};
    detected.forEach(({node, weight}) => {
      for (const [s,v] of Object.entries(node.skills)) skills[s] = (skills[s]||0) + v * Math.min(weight,2);
    });
    (enjoy||[]).forEach(e => {
      const def = ENJOY[e]; if(!def) return;
      for (const [s,v] of Object.entries(def.skills)) skills[s] = (skills[s]||0) + v;
    });
    return skills;
  }

  function scoreOffers(skills, audiences){
    return OFFERS.map(of => {
      let score = 0, matched = [];
      for (const [s,w] of Object.entries(of.want)){
        if (skills[s]){ score += w * skills[s]; matched.push(s); }
      }
      // audience alignment bonus
      const aud = (audiences||[]).find(a => of.audiences.includes(a));
      if (aud) score += 6;
      const audience = aud || of.audiences[0];
      return { offer:of, score, audience, matched };
    }).sort((a,b)=> b.score - a.score);
  }

  // direction clarity: how much aligned signal we have (paramagnetic→ferromagnetic)
  function magnetization(skills, ranked, detected){
    const top = ranked[0]?.score || 0;
    const second = ranked[1]?.score || 0;
    const totalSkill = Object.values(skills).reduce((a,b)=>a+b,0);
    // clarity rises with (a) signal volume and (b) separation between #1 and #2
    const volume = Math.min(1, totalSkill / 20);
    const focus = top ? Math.min(1, (top - second) / Math.max(top, 1) + 0.30) : 0;
    const richness = Math.min(1, detected.length / 3);
    const raw = 0.22 + 0.34*volume + 0.14*focus + 0.10*richness; // ~0.22..0.80 at day 0
    return Math.round(Math.min(0.80, raw) * 100); // cap day-0 low so the loop has visible headroom to grow
  }

  function identitySentence(detected, top){
    const of = top.offer; const audience = AUDIENCE[top.audience];
    const topic = TOPIC[detected[0]?.node?.id] || '문제';
    // compressed one-liner: who you help + your verb (grammatical 을/를)
    return `당신은 ${audience}의 ${topic}${josa(topic,'을를')} ${of.verb} 사람입니다.`;
  }

  function buildOffer(rankedItem, detected){
    const of = rankedItem.offer;
    const topic = TOPIC[detected[0]?.node?.id] || '전문';
    const ctx = { topic };
    const a = rankedItem.audience;
    const price = of.priceLow === 0
      ? `무료 → $${of.priceHigh}/${of.unit}`
      : `$${of.priceLow}–$${of.priceHigh} / ${of.unit}`;
    return {
      id: of.id,
      format: of.format,
      title: of.title(a, ctx),
      audience: AUDIENCE[a],
      price,
      priceLow: of.priceLow, priceHigh: of.priceHigh, unit: of.unit,
      channel: of.channel(a),
      firstAction: of.first(a),
      why: of.why,
      score: rankedItem.score,
    };
  }

  /**
   * Main entry. input = {
   *   experiences:[id...], experienceText:'', enjoy:[key...], audiences:[key...], text:''
   * }
   * Returns the full "magic" result object.
   */
  function generate(input){
    const detected = detectExperiences(input);
    const safeDetected = detected.length ? detected
      : [{ node: EXPERIENCE.find(e=>e.id==='parenting'), weight:1 }]; // graceful cold-start
    const skills = accumulateSkills(safeDetected, input.enjoy);
    const ranked = scoreOffers(skills, input.audiences).filter(r => r.score > 0);
    const safeRanked = ranked.length ? ranked : scoreOffers({listen:2,care:1}, input.audiences);

    const primary = buildOffer(safeRanked[0], safeDetected);
    const alternates = safeRanked.slice(1,3).map(r => buildOffer(r, safeDetected));
    const clarity = magnetization(skills, safeRanked, safeDetected);
    const identity = identitySentence(safeDetected, safeRanked[0]);

    // top skills, human-readable
    const SKILL_LABEL = {
      teach:'가르치기', curriculum:'커리큘럼 설계', evaluate:'평가·피드백', explain:'쉽게 설명',
      care:'돌봄', health:'건강 지식', listen:'경청', calm:'안정시키기', coach:'코칭', empathy:'공감',
      design:'디자인', visual:'비주얼', brand:'브랜딩', make:'만들기', market:'마케팅', copy:'카피',
      social:'SNS 운영', story:'스토리텔링', localknow:'지역 정보', negotiate:'협상', bigdecision:'큰 결정 가이드',
      network:'네트워킹', numbers:'숫자·재정', plan:'계획', trust:'신뢰', food:'요리', language:'이중언어',
      bridge:'문화 다리', beauty:'뷰티', style:'스타일', art:'예술', creative:'창의', parenting:'양육',
      organize:'정리·구조화', patience:'인내', tech:'기술', automate:'자동화', structure:'구조화',
      analyze:'분석', execute:'실행', coordinate:'조율', sales:'세일즈', relationship:'관계', write:'글쓰기',
    };
    const topSkills = Object.entries(skills).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([k]) => SKILL_LABEL[k] || k);

    return {
      identity,
      clarity,
      topSkills,
      assets: [].concat(...safeDetected.map(d => d.node.assets)).slice(0,4),
      detected: safeDetected.map(d => d.node.label),
      primary,
      alternates,
      // the typed graph, exposed so the demo can SHOW the ontology (the road)
      graph: {
        experiences: safeDetected.map(d => d.node.label),
        skills: topSkills,
        offer: primary.format,
        customer: primary.audience,
        channel: primary.channel,
        action: primary.firstAction,
      },
    };
  }

  /* ---- 6. CLOSED-LOOP : the estimator update (used by the MVP app) --------
     Each daily note is a noisy observation that sharpens our estimate of the
     user's state and *raises direction clarity*. This is the moat in motion:
     a generic chatbot resets to zero every session; here the number only grows.
  ------------------------------------------------------------------------- */
  function updateClarity(prevClarity, note){
    let bump = 1.2;                              // showing up at all moves the needle
    if (note && note.did && note.did.length > 8) bump += 1.6;     // took an action
    if (note && note.heard && note.heard.length > 8) bump += 2.2; // talked to a customer (strongest signal)
    if (note && note.learned && note.learned.length > 8) bump += 1.0;
    const next = Math.min(99, (prevClarity || 35) + bump);
    return Math.round(next * 10) / 10;
  }

  // A coach line that references accumulated context (proves "remembers you").
  function coachLine(profile, notes){
    const n = notes.length;
    if (n === 0) return '첫 기록을 남겨보세요. 오늘 단 한 줄이면 충분합니다.';
    const last = notes[n-1];
    const streak = computeStreak(notes);
    const talkedToCustomer = notes.some(x => (x.heard||'').length > 8);
    if (last.blocked && last.blocked.length > 4)
      return `어제 "${trim(last.blocked,24)}"에서 막혔다고 했죠. 오늘은 그걸 둘로 쪼개 — 더 작은 쪽 하나만 해봅시다.`;
    if (talkedToCustomer)
      return `이미 고객의 말을 들어본 사람이에요. 그 한마디를 오퍼 문구에 그대로 넣어보세요.`;
    if (streak >= 3)
      return `${streak}일 연속이에요. 멈추지 않는 사람만 첫 고객을 만납니다. 오늘의 1cm로 넘어가죠.`;
    return `좋아요. ${profile && profile.identityShort ? profile.identityShort + ' — ' : ''}어제보다 한 걸음 더 가봅시다.`;
  }

  function computeStreak(notes){
    if(!notes.length) return 0;
    // notes carry .day (YYYY-MM-DD); count trailing consecutive days
    const days = [...new Set(notes.map(n=>n.day))].sort();
    let streak = 1;
    for (let i=days.length-1;i>0;i--){
      const a = new Date(days[i]); const b = new Date(days[i-1]);
      if ((a-b)/86400000 === 1) streak++; else break;
    }
    return streak;
  }

  function trim(s,n){ s=s||''; return s.length>n ? s.slice(0,n)+'…' : s; }

  /* ---- exports ------------------------------------------------------------ */
  global.Ontology = {
    EXPERIENCE, ENJOY, ENJOY_LABEL, AUDIENCE, OFFERS, TOPIC,
    generate, updateClarity, coachLine, computeStreak,
  };
})(typeof window !== 'undefined' ? window : globalThis);
