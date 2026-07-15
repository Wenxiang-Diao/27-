(() => {
  const data = window.KNOWLEDGE_DATA;
  const bank = window.QUESTION_DATA || {papers: [], practices: [], stats: {}};
  const $ = s => document.querySelector(s);
  const content = $('#content'), nav = $('#courseNav'), sidebar = $('#sidebar');
  const learned = new Set(JSON.parse(localStorage.getItem('gw-learned') || '[]'));
  const savedAnswers = JSON.parse(localStorage.getItem('gw-question-answers') || '{}');
  let allOpen = false;

  if (!data) { content.innerHTML = '<div class="empty">知识库数据未生成。</div>'; return; }
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pdfHref = (source, page = 1) => `../${encodeURIComponent(source)}#page=${page}`;
  const route = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const findCourse = id => data.courses.find(c => c.id === id);
  const chapterBy = (course, id) => course?.chapters.find(c => c.id === id);
  const findItem = (items, id) => items.find(x => x.id === id);
  const questionCount = item => item.sections.reduce((n, s) => n + s.questions.length, 0);
  const activeMode = () => ['knowledge','papers','practice'].includes(route()[0]) ? route()[0] : 'home';

  function renderNav() {
    const [mode, itemId, chapterId] = route();
    $('#searchWrap').hidden = mode !== 'knowledge';
    $('#progressWrap').hidden = mode !== 'knowledge';
    document.querySelectorAll('[data-mode]').forEach(a => a.classList.toggle('active', a.dataset.mode === mode));
    if (mode === 'papers' || mode === 'practice') {
      const items = mode === 'papers' ? bank.papers : bank.practices;
      nav.innerHTML = `<a class="nav-section-home" href="#/${mode}">← ${mode === 'papers' ? '全部模拟卷' : '全部专项练习'}</a>` + items.map(item => `
        <a class="nav-item ${item.id === itemId ? 'active' : ''}" href="#/${mode}/${item.id}">
          <strong>${esc(item.title)}</strong><small>${questionCount(item)} 道题 · ${item.rawPages.length} 页</small>
        </a>`).join('');
      return;
    }
    nav.innerHTML = `<a class="nav-section-home" href="#/knowledge">← 知识点首页</a>` + data.courses.map(course => `
      <div class="nav-course ${course.id === itemId ? 'open active' : ''}" data-course="${course.id}">
        <button class="nav-course-button" data-open-course="${course.id}">
          <span class="course-badge" style="background:${course.color}">${esc(course.icon)}</span>
          <span>${esc(course.name)}</span><span class="nav-caret">›</span>
        </button>
        <div class="nav-chapters">${course.chapters.map(ch => `
          <a class="nav-chapter ${ch.id === chapterId ? 'active' : ''}" href="#/knowledge/${course.id}/${ch.id}">${esc(ch.title)}</a>
        `).join('')}</div>
      </div>`).join('');
    nav.querySelectorAll('[data-open-course]').forEach(button => button.addEventListener('click', () => {
      const wrap = button.closest('.nav-course'), course = findCourse(button.dataset.openCourse);
      wrap.classList.toggle('open');
      if (course?.chapters[0] && !wrap.classList.contains('active')) location.hash = `#/knowledge/${course.id}/${course.chapters[0].id}`;
    }));
  }

  function renderHub() {
    const chapters = data.courses.reduce((n,c) => n + c.chapterCount, 0);
    const cards = [
      ['knowledge','知识点','按科目、章节、小节逐级整理的完整讲义',`${data.courses.length} 科 · ${chapters} 章`,'知'],
      ['papers','模拟卷','三套综合模拟试卷，可逐题选择和提交',`${bank.papers.length} 套 · ${bank.stats.paperQuestions || 0} 道`,'卷'],
      ['practice','专项练习','按操作系统、数据库、算法等科目集中训练',`${bank.practices.length} 类 · ${bank.stats.practiceQuestions || 0} 道`,'练']
    ];
    content.innerHTML = `<section class="hero hub-hero"><p class="eyebrow">STATE GRID · COMPUTER EXAM</p><h1>知识、模拟、专项，一站复习</h1><p>所有内容均已保存到本地网页。先系统学习知识点，再用模拟卷与专项题查漏补缺。</p></section>
      <section class="hub-grid">${cards.map(c => `<a class="hub-card" href="#/${c[0]}"><span class="hub-icon">${c[4]}</span><h2>${c[1]}</h2><p>${c[2]}</p><strong>${c[3]} <i>→</i></strong></a>`).join('')}</section>`;
  }

  function renderKnowledge() {
    const chapterTotal = data.courses.reduce((n,c) => n + c.chapterCount, 0);
    const topicTotal = data.courses.reduce((n,c) => n + c.topicCount, 0);
    content.innerHTML = `<div class="breadcrumbs"><a href="#/home">首页</a><span>›</span><span>知识点</span></div>
      <section class="hero"><p class="eyebrow">分级知识库</p><h1>从科目到知识点，逐层学清楚</h1><p>内容按“科目 → 章节 → 小节 → 知识点”整理，可搜索、标记掌握，并跳转原 PDF 核对。</p>
      <div class="stat-row"><div class="stat"><strong>${data.courses.length}</strong><span>考试科目</span></div><div class="stat"><strong>${chapterTotal}</strong><span>分级章节</span></div><div class="stat"><strong>${topicTotal}</strong><span>知识主题</span></div></div></section>
      <section class="course-grid">${data.courses.map(course => `<article class="course-card" data-go="${course.id}" style="--course-color:${course.color}" tabindex="0"><span class="course-badge" style="background:${course.color}">${esc(course.icon)}</span><h2>${esc(course.name)}</h2><p>${esc(course.description)}</p><div class="card-meta"><span>${course.chapterCount} 章</span><span>${course.topicCount} 个主题</span><span>${course.pageCount} 页</span></div></article>`).join('')}</section>`;
    content.querySelectorAll('[data-go]').forEach(card => { const go = () => { const c = findCourse(card.dataset.go); if (c?.chapters[0]) location.hash = `#/knowledge/${c.id}/${c.chapters[0].id}`; }; card.addEventListener('click', go); card.addEventListener('keydown', e => e.key === 'Enter' && go()); });
  }

  function topicHtml(topic) {
    const done = learned.has(topic.id);
    return `<article class="topic" id="${topic.id}"><div class="topic-head"><h3>${esc(topic.title)}</h3><button class="learned ${done ? 'done' : ''}" data-learned="${topic.id}">${done ? '已掌握 ✓' : '标记掌握'}</button></div>${topic.blocks.map(block => `<div class="page-block">${block.lines.map(line => `<p>${esc(line)}</p>`).join('')}<div class="page-source"><a class="${block.confidence < .72 ? 'ocr-warn' : ''}" href="${pdfHref(block.source, block.page)}" target="_blank">来源：第 ${block.page} 页${block.confidence < .72 ? ' · 建议核对原页' : ''}</a></div></div>`).join('')}</article>`;
  }

  function questionHtml(question, index, grade = false) {
    const saved = savedAnswers[question.id] || {selected: [], text: '', submitted: false};
    const isText = question.type === 'text' || question.options.length < 2;
    const answer = grade ? (question.answer || '') : '';
    const typeLabel = isText ? '填答题' : question.type === 'multiple' ? '多选题' : question.type === 'judge' ? '判断题' : '单选题';
    const status = saved.submitted ? answer ? (sameAnswer(saved.selected, answer) ? '回答正确 ✓' : `回答有误，正确答案：${answer}`) : '已提交，暂不判分' : '';
    const options = isText ? `<textarea class="text-answer" rows="3" placeholder="在此填写答案">${esc(saved.text || '')}</textarea>` : `<div class="option-list">${question.options.map(option => { const chosen=saved.selected?.includes(option.label), revealed=saved.submitted&&answer; return `<label class="option ${chosen ? 'selected' : ''} ${revealed&&answer.includes(option.label)?'correct-option':''} ${revealed&&chosen&&!answer.includes(option.label)?'wrong-option':''}"><input type="${question.multiple ? 'checkbox' : 'radio'}" name="${question.id}" value="${option.label}" ${chosen ? 'checked' : ''}><span class="option-label">${option.label}</span><span>${esc(option.text)}</span></label>`; }).join('')}</div>`;
    return `<article class="question-card ${saved.submitted && answer ? (sameAnswer(saved.selected, answer) ? 'is-correct' : 'is-wrong') : ''}" id="${question.id}" data-question="${question.id}" data-answer="${esc(answer)}" data-text="${isText}"><div class="question-meta"><span>第 ${esc(question.number || index + 1)} 题</span><span class="question-type">${typeLabel}</span></div><h3>${esc(question.stem)}</h3>${options}<div class="question-actions"><a href="${pdfHref(question.source, question.page)}" target="_blank">来源：第 ${question.page} 页</a><span class="submit-note" aria-live="polite">${status}</span><button class="submit-answer" ${isText ? '' : saved.selected?.length ? '' : 'disabled'}>${saved.submitted ? '更新提交' : '提交本题'}</button></div><div class="answer-explanation" ${saved.submitted && question.explanation ? '' : 'hidden'}>${question.explanation ? `<strong>简析</strong><p>${esc(question.explanation)}</p>` : ''}</div></article>`;
  }
  const sameAnswer = (selected = [], answer = '') => [...selected].sort().join('') === [...answer].sort().join('');

  const resetButtonHtml = (questions, label, compact = false) => `<button class="reset-scope ${compact ? 'compact' : ''}" data-reset-ids="${questions.map(q => q.id).join(',')}" data-reset-label="${esc(label)}">重置答题</button>`;

  function bindResetButtons() {
    content.querySelectorAll('[data-reset-ids]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const ids = button.dataset.resetIds.split(',').filter(Boolean);
      const answered = ids.filter(id => savedAnswers[id]);
      if (!answered.length) { alert(`“${button.dataset.resetLabel}”当前没有已保存的答题记录。`); return; }
      if (!confirm(`确定要清除“${button.dataset.resetLabel}”的 ${answered.length} 道已作答记录吗？`)) return;
      answered.forEach(id => delete savedAnswers[id]);
      if (Object.keys(savedAnswers).length) localStorage.setItem('gw-question-answers', JSON.stringify(savedAnswers));
      else localStorage.removeItem('gw-question-answers');
      render();
    }));
  }

  function exerciseHtml(section) {
    return `<div class="exercise-intro"><div><strong>${section.questions.length} 道可选题</strong><span>已校对答案的题目提交后自动判分并显示简析。</span></div>${resetButtonHtml(section.questions, section.title, true)}</div><div class="question-list">${section.questions.map((q,i) => questionHtml(q,i,true)).join('')}</div>`;
  }

  function renderChapter(course, chapter) {
    const ci = course.chapters.indexOf(chapter), prev = course.chapters[ci-1], next = course.chapters[ci+1];
    const firstPage = chapter.sections[0]?.topics[0]?.blocks[0]?.page || 1;
    content.innerHTML = `<div class="breadcrumbs"><a href="#/home">首页</a><span>›</span><a href="#/knowledge">知识点</a><span>›</span><span>${esc(course.name)}</span><span>›</span><span>${esc(chapter.title)}</span></div><header class="chapter-head"><div><p class="eyebrow">${esc(course.name)} · 第 ${ci+1}/${course.chapters.length} 章</p><h1>${esc(chapter.title)}</h1><p>${chapter.sections.length} 个小节 · 逐项展开阅读</p></div><a class="source-link" href="${pdfHref(course.source, firstPage)}" target="_blank">打开原 PDF ↗</a></header>${chapter.sections.map((section, i) => `<details class="section-card" ${i === 0 ? 'open' : ''}><summary>${esc(section.title)}<span class="section-kind">${section.kind === 'exercise' ? `${(section.questions || []).length} 道练习` : `${section.topics.length} 个主题`}</span></summary><div class="section-body">${section.kind === 'exercise' ? exerciseHtml(section) : section.topics.map(topicHtml).join('')}</div></details>`).join('')}<nav class="pager">${prev ? `<a href="#/knowledge/${course.id}/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/knowledge/${course.id}/${next.id}">${esc(next.title)} →</a>` : ''}</nav>`;
    content.querySelectorAll('[data-learned]').forEach(button => button.addEventListener('click', () => toggleLearned(button)));
    bindQuestions();
    bindResetButtons();
  }

  function renderCollectionLanding(mode) {
    const items = mode === 'papers' ? bank.papers : bank.practices;
    const noun = mode === 'papers' ? '模拟卷' : '专项练习';
    content.innerHTML = `<div class="breadcrumbs"><a href="#/home">首页</a><span>›</span><span>${noun}</span></div><section class="hero compact-hero"><p class="eyebrow">${mode === 'papers' ? '综合自测' : '按科强化'}</p><h1>${noun}</h1><p>${mode === 'papers' ? '完整导入三套模拟试卷。已有答案的试卷提交后会立即判分；模拟题1只记录作答。' : '五类专项题库按原资料导入，可逐题选择、提交，并查看原 PDF 页。'}</p></section><section class="collection-grid">${items.map(item => `<article class="collection-card"><a class="collection-main" href="#/${mode}/${item.id}"><div><span class="pill">${item.hasAnswers ? '含参考答案' : '暂无答案'}</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p></div><div class="collection-meta"><strong>${questionCount(item)}</strong><span>道结构化题</span><strong>${item.rawPages.length}</strong><span>页原文</span></div></a>${resetButtonHtml(item.sections.flatMap(s => s.questions), item.title, true)}</article>`).join('')}</section>`;
    bindResetButtons();
  }

  function rawPagesHtml(item) {
    return `<details class="section-card source-transcript"><summary>按原 PDF 页查看全文<span class="section-kind">${item.rawPages.length} 页</span></summary><div class="section-body"><p class="muted">这里保留了清理广告后的分页文本，可用于核对公式、图表或未能结构化的题目。</p>${item.rawPages.map(p => `<details class="raw-page"><summary>第 ${p.page} 页</summary><div>${p.lines.map(line => `<p>${esc(line)}</p>`).join('')}<a href="${pdfHref(item.source,p.page)}" target="_blank">打开原 PDF 第 ${p.page} 页 ↗</a></div></details>`).join('')}</div></details>`;
  }

  function renderCollectionItem(mode, item) {
    const noun = mode === 'papers' ? '模拟卷' : '专项练习', grade = true;
    let offset = 0;
    const sections = item.sections.map((section, si) => { const html = section.questions.map((q,i) => questionHtml(q,offset+i,grade)).join(''); offset += section.questions.length; return `<details class="section-card" ${si === 0 ? 'open' : ''}><summary>${esc(section.title)}<span class="section-kind">${section.questions.length} 道题</span></summary><div class="section-body"><div class="exercise-intro"><strong>${grade ? '提交后自动判分' : '可选择并提交'}</strong><span>${grade ? '答错会显示正确选项。' : '本资料暂不自动判分。'}</span></div><div class="question-list">${html}</div></div></details>`; }).join('');
    const notes = item.answerNotes?.length ? `<details class="section-card answer-notes"><summary>参考答案原文<span class="section-kind">${item.answerNotes.length} 条</span></summary><div class="section-body">${item.answerNotes.map(x => `<p>${esc(x)}</p>`).join('')}</div></details>` : '';
    content.innerHTML = `<div class="breadcrumbs"><a href="#/home">首页</a><span>›</span><a href="#/${mode}">${noun}</a><span>›</span><span>${esc(item.title)}</span></div><header class="chapter-head"><div><p class="eyebrow">${noun} · ${questionCount(item)} 道结构化题</p><h1>${esc(item.title)}</h1><p>${esc(item.description)}</p></div><div class="chapter-actions">${resetButtonHtml(item.sections.flatMap(s => s.questions), item.title)}<a class="source-link" href="${pdfHref(item.source)}" target="_blank">打开原 PDF ↗</a></div></header>${sections}${notes}${rawPagesHtml(item)}`;
    bindQuestions();
    bindResetButtons();
  }

  function bindQuestions() {
    content.querySelectorAll('.question-card').forEach(card => {
      const button = card.querySelector('.submit-answer'), note = card.querySelector('.submit-note');
      const inputs = [...card.querySelectorAll('input')], textarea = card.querySelector('.text-answer');
      const refresh = () => { const selected = inputs.filter(i => i.checked).map(i => i.value); if (!textarea) button.disabled = !selected.length; card.querySelectorAll('.option').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked)); };
      inputs.forEach(input => input.addEventListener('change', refresh));
      button.addEventListener('click', () => {
        const selected = inputs.filter(i => i.checked).map(i => i.value), text = textarea?.value.trim() || '';
        if (!textarea && !selected.length) return;
        savedAnswers[card.dataset.question] = {selected, text, submitted: true}; localStorage.setItem('gw-question-answers', JSON.stringify(savedAnswers));
        const answer = card.dataset.answer;
        card.classList.remove('is-correct','is-wrong');
        if (answer) { const ok = sameAnswer(selected, answer); card.classList.add(ok ? 'is-correct' : 'is-wrong'); note.textContent = ok ? '回答正确 ✓' : `回答有误，正确答案：${answer}`; card.querySelectorAll('.option').forEach(label=>{const value=label.querySelector('input').value;label.classList.toggle('correct-option',answer.includes(value));label.classList.toggle('wrong-option',selected.includes(value)&&!answer.includes(value));}); }
        else note.textContent = '已提交，暂不判分';
        const explanation=card.querySelector('.answer-explanation'); if(explanation?.textContent.trim()) explanation.hidden=false;
        button.textContent = '更新提交';
      });
    });
  }

  function toggleLearned(button) { const id = button.dataset.learned; learned.has(id) ? learned.delete(id) : learned.add(id); localStorage.setItem('gw-learned', JSON.stringify([...learned])); button.classList.toggle('done', learned.has(id)); button.textContent = learned.has(id) ? '已掌握 ✓' : '标记掌握'; updateProgress(); }
  function updateProgress() { const total = data.courses.reduce((n,c) => n + c.topicCount, 0); const valid = [...learned].filter(id => searchIndex.some(x => x.topicId === id)).length; const pct = total ? Math.round(valid / total * 100) : 0; $('#progressText').textContent = `学习进度 ${pct}%（${valid}/${total}）`; $('#progressBar').style.width = `${pct}%`; }

  const searchIndex = [];
  data.courses.forEach(course => course.chapters.forEach(chapter => chapter.sections.forEach(section => (section.topics || []).forEach(topic => searchIndex.push({course,chapter,topicId:topic.id,title:topic.title,text:[topic.title,...topic.blocks.flatMap(b=>b.lines)].join(' ')})))));
  function highlight(text,q) { const i=text.toLowerCase().indexOf(q.toLowerCase()); if(i<0)return esc(text.slice(0,70)); const s=Math.max(0,i-22),e=Math.min(text.length,i+q.length+38); return `${s?'…':''}${esc(text.slice(s,i))}<mark>${esc(text.slice(i,i+q.length))}</mark>${esc(text.slice(i+q.length,e))}${e<text.length?'…':''}`; }
  $('#searchInput').addEventListener('input', e => { const q=e.target.value.trim(), box=$('#searchResults'); if(!q){box.hidden=true;return;} const hits=searchIndex.filter(x=>x.text.toLowerCase().includes(q.toLowerCase())).slice(0,30); box.innerHTML=hits.length?hits.map((x,i)=>`<button class="search-hit" data-hit="${i}"><strong>${esc(x.title)}</strong><small>${esc(x.course.name)} · ${esc(x.chapter.title)}</small><span>${highlight(x.text,q)}</span></button>`).join(''):'<div class="empty">没有找到匹配内容</div>'; box.hidden=false; box.querySelectorAll('[data-hit]').forEach(b=>b.addEventListener('click',()=>{const h=hits[+b.dataset.hit];location.hash=`#/knowledge/${h.course.id}/${h.chapter.id}`;box.hidden=true;e.target.value='';setTimeout(()=>document.getElementById(h.topicId)?.scrollIntoView({block:'center'}),80);closeMobile();})); });

  function render() {
    const [mode,id,subId] = route();
    if (!mode || mode === 'home') renderHub();
    else if (mode === 'knowledge') { const course=findCourse(id), chapter=chapterBy(course,subId); course&&chapter ? renderChapter(course,chapter) : renderKnowledge(); }
    else if (mode === 'papers' || mode === 'practice') { const items=mode==='papers'?bank.papers:bank.practices, item=findItem(items,id); item ? renderCollectionItem(mode,item) : renderCollectionLanding(mode); }
    else renderHub();
    renderNav(); updateProgress(); window.scrollTo(0,0); closeMobile();
  }
  function closeMobile(){sidebar.classList.remove('open');$('#backdrop').hidden=true;}
  $('#menuButton').addEventListener('click',()=>{sidebar.classList.add('open');$('#backdrop').hidden=false;}); $('#backdrop').addEventListener('click',closeMobile);
  $('#expandButton').addEventListener('click',()=>{allOpen=!allOpen;document.querySelectorAll('.section-card').forEach(d=>d.open=allOpen);$('#expandButton').textContent=allOpen?'收起全部':'展开全部';});
  const savedTheme=localStorage.getItem('gw-theme');if(savedTheme)document.documentElement.dataset.theme=savedTheme;
  $('#themeButton').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('gw-theme',t);});
  window.addEventListener('hashchange',render); render();
})();
