/* 科學社團專案管理範本站・共用互動（零外部資源） */
(function () {
  'use strict';
  var KEY = 'kxsq.';

  function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  /* 1. 導覽：標出目前這一頁 */
  function markNav(){
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var links = document.querySelectorAll('nav.main a');
    for (var i=0;i<links.length;i++){
      var f = (links[i].getAttribute('href')||'').toLowerCase();
      if (f === here) { links[i].setAttribute('aria-current','page'); }
    }
  }

  /* 2. 投影模式：一格一畫面，像投影片一樣翻
        分頁單位＝section.gate（關卡頁有五格）；沒有 gate 的頁面用 h2 切段。
        第一張是封面（h1 與導言，在第一個分界之前的東西）。 */
  var slides = [], cur = 0;

  function buildSlides(){
    var main = document.querySelector('main');
    if (!main || main.getAttribute('data-sliced')) return;

    /* 一張投影片＝一個講得完的單位。切法分兩層：
       外層以 main 的 section／h2 切成「章」；章內若還很長，
       再以 h3、提示詞卡、驗收清單、表格為界切開，每張重掛章名。 */
    function atoms(nodes){
      var out = [], cur = [];
      for (var i = 0; i < nodes.length; i++){
        var el = nodes[i];
        var brk = el.tagName === 'H3'
               || (el.classList && (el.classList.contains('prompt') ||
                                    el.classList.contains('checklist') ||
                                    el.classList.contains('pit')))
               || el.tagName === 'TABLE';
        if (brk && cur.length){ out.push(cur); cur = []; }
        cur.push(el);
        // 提示詞卡與清單自成一張，後面另起
        if (el.classList && (el.classList.contains('prompt') || el.classList.contains('checklist'))){
          out.push(cur); cur = [];
        }
      }
      if (cur.length) out.push(cur);
      return out;
    }

    var kids = [], i;
    for (i = 0; i < main.children.length; i++) kids.push(main.children[i]);
    var chapters = [], now = [];
    for (i = 0; i < kids.length; i++){
      var el = kids[i];
      if (el.tagName === 'FOOTER') continue;
      var isBreak = el.tagName === 'SECTION' || el.tagName === 'H2';
      if (isBreak && now.length){ chapters.push(now); now = []; }
      now.push(el);
    }
    if (now.length) chapters.push(now);

    var frag = document.createDocumentFragment();
    for (i = 0; i < chapters.length; i++){
      var ch = chapters[i];
      var lead = ch[0];
      // section 內部再切；非 section 的章（h2 開頭）直接整章一張
      var inner = null, title = '';
      if (lead.tagName === 'SECTION'){
        var head = lead.querySelector(':scope > header');
        var body = lead.querySelector(':scope > .body');
        var h2 = lead.querySelector('h2');
        title = h2 ? h2.textContent.trim() : '';
        if (body){
          inner = [];
          for (var k = 0; k < body.children.length; k++) inner.push(body.children[k]);
        }
      }
      if (inner && inner.length > 1){
        var parts = atoms(inner);
        for (var j = 0; j < parts.length; j++){
          var box = document.createElement('div');
          box.className = 'slide';
          if (j === 0){
            // 第一張帶著 section 的外殼與標題
            var shell = lead.cloneNode(false);
            var hd = lead.querySelector(':scope > header');
            if (hd) shell.appendChild(hd.cloneNode(true));
            var bd = document.createElement('div');
            bd.className = 'body';
            for (var m = 0; m < parts[j].length; m++) bd.appendChild(parts[j][m]);
            shell.appendChild(bd);
            box.appendChild(shell);
          } else {
            var tag = document.createElement('p');
            tag.className = 'slide-chapter';
            tag.textContent = title;
            box.appendChild(tag);
            var bd2 = document.createElement('div');
            bd2.className = 'body';
            for (var m2 = 0; m2 < parts[j].length; m2++) bd2.appendChild(parts[j][m2]);
            box.appendChild(bd2);
          }
          frag.appendChild(box);
        }
        if (lead.parentNode) lead.parentNode.removeChild(lead);
        for (var q = 1; q < ch.length; q++){
          var extra = document.createElement('div');
          extra.className = 'slide';
          extra.appendChild(ch[q]);
          frag.appendChild(extra);
        }
      } else {
        /* 沒有 section 外殼的章（h2 直接掛在 main 底下）也要切，
           不然像 method.html 那種一章就會擠成 2000px 高的一張。 */
        var h2b = null;
        for (var z = 0; z < ch.length; z++) if (ch[z].tagName === 'H2') { h2b = ch[z]; break; }
        var t2 = h2b ? h2b.textContent.trim() : '';
        var ps = atoms(ch);
        for (var y = 0; y < ps.length; y++){
          var one = document.createElement('div');
          one.className = 'slide';
          if (y > 0 && t2){
            var lab = document.createElement('p');
            lab.className = 'slide-chapter';
            lab.textContent = t2;
            one.appendChild(lab);
          }
          for (var r = 0; r < ps[y].length; r++) one.appendChild(ps[y][r]);
          frag.appendChild(one);
        }
      }
    }
    main.appendChild(frag);
    main.setAttribute('data-sliced', '1');
    slides = main.querySelectorAll('.slide');
  }

  function showSlide(n){
    if (!slides.length) return;
    cur = Math.max(0, Math.min(n, slides.length - 1));
    for (var i = 0; i < slides.length; i++) slides[i].classList.toggle('on', i === cur);
    var tag = document.getElementById('slideNo');
    if (tag) tag.textContent = (cur + 1) + ' / ' + slides.length;
    window.scrollTo(0, 0);
    /* 有些內容本來就高（嵌入的工具、實機截圖、長表格），硬切會把意思切碎。
       那幾張就讓它捲，但要明講，不要讓人以為畫面只有這樣。 */
    var hint = document.getElementById('slideScroll');
    if (hint){
      var bar = document.querySelector('.topbar');
      var avail = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0) - 90;
      var need = slides[cur].getBoundingClientRect().height;
      hint.hidden = !(need > avail * 1.02);
    }
  }

  function slideBar(){
    if (document.getElementById('slideBar')) return;
    var bar = document.createElement('div');
    bar.id = 'slideBar';
    bar.innerHTML = '<button type="button" id="slidePrev" aria-label="上一張">←</button>' +
                    '<span id="slideNo">1 / 1</span>' +
                    '<span id="slideScroll" hidden>↓ 這張要往下捲</span>' +
                    '<button type="button" id="slideNext" aria-label="下一張">→</button>';
    document.body.appendChild(bar);
    document.getElementById('slidePrev').addEventListener('click', function(){ showSlide(cur - 1); });
    document.getElementById('slideNext').addEventListener('click', function(){ showSlide(cur + 1); });
  }

  function projection(){
    var btn = document.querySelector('.projbtn');
    if (!btn) return;
    function apply(on){
      document.documentElement.classList.toggle('proj', on);
      document.body.classList.toggle('proj', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? '關閉投影模式' : '投影模式';
      if (on){ buildSlides(); slideBar(); showSlide(cur); }
      try { localStorage.setItem(KEY+'proj', on ? '1' : '0'); } catch(e){}
    }
    document.addEventListener('keydown', function(e){
      if (!document.body.classList.contains('proj')) return;
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' '){ e.preventDefault(); showSlide(cur + 1); }
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp'){ e.preventDefault(); showSlide(cur - 1); }
      if (e.key === 'Escape'){ apply(false); }
    });
    var saved = '0';
    try { saved = localStorage.getItem(KEY+'proj') || '0'; } catch(e){}
    apply(saved === '1');
    btn.addEventListener('click', function(){ apply(!document.body.classList.contains('proj')); });
    document.addEventListener('keydown', function(e){
      if ((e.key === 'p' || e.key === 'P') && (e.ctrlKey || e.metaKey) === false && e.altKey) {
        apply(!document.body.classList.contains('proj'));
      }
    });
  }

  /* 3. 提示詞卡一鍵複製（離線 file:// 也要能用，所以留備援） */
  function copyButtons(){
    var btns = document.querySelectorAll('.copy');
    for (var i=0;i<btns.length;i++) btns[i].addEventListener('click', function(){
      var btn = this;
      var box = btn.closest('.prompt') || btn.closest('.card') || document;
      var pre = box.querySelector('pre');
      if (!pre) return;
      var text = pre.textContent.replace(/\u00a0/g,' ').trim();
      function done(){
        var old = btn.textContent;
        btn.setAttribute('data-done','1');
        btn.textContent = '已複製';
        setTimeout(function(){ btn.removeAttribute('data-done'); btn.textContent = old; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function(){ fallback(text, done); });
      } else { fallback(text, done); }
    });
    function fallback(text, done){
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.top='-1000px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch(e){ ta.style.top='0'; ta.style.position='static'; }
      setTimeout(function(){ if (ta.parentNode) ta.parentNode.removeChild(ta); }, 100);
    }
  }

  /* 4. 驗收清單：勾了就記住（同一台電腦、同一個瀏覽器） */
  function checklists(){
    var page = (location.pathname.split('/').pop() || 'index.html');
    var lists = document.querySelectorAll('.checklist');
    for (var i=0;i<lists.length;i++) (function(list, li){
      var boxes = list.querySelectorAll('input[type=checkbox]');
      var out = list.parentNode.querySelector('.done-count');
      function tally(){
        if (!out) return;
        var n = list.querySelectorAll('input:checked').length;
        out.textContent = '已完成 ' + n + ' / ' + boxes.length + ' 項';
      }
      for (var j=0;j<boxes.length;j++) (function(box, k){
        var key = KEY + page + '.' + li + '.' + k;
        try { if (localStorage.getItem(key) === '1') box.checked = true; } catch(e){}
        box.addEventListener('change', function(){
          try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch(e){}
          tally();
        });
      })(boxes[j], j);
      tally();
    })(lists[i], i);
  }

  /* 5. demo 分頁籤（鍵盤左右鍵可切換） */
  function tabs(){
    var bar = document.querySelector('.tabs');
    if (!bar) return;
    var btns = [].slice.call(bar.querySelectorAll('button'));
    function show(id){
      for (var i=0;i<btns.length;i++){
        var on = btns[i].getAttribute('data-tab') === id;
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
        btns[i].tabIndex = on ? 0 : -1;
        var panel = document.getElementById(btns[i].getAttribute('data-tab'));
        if (panel) panel.hidden = !on;
      }
    }
    for (var i=0;i<btns.length;i++) (function(b, idx){
      b.addEventListener('click', function(){ show(b.getAttribute('data-tab')); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = btns[(idx + d + btns.length) % btns.length];
        show(n.getAttribute('data-tab')); n.focus();
      });
    })(btns[i], i);
    show(btns[0].getAttribute('data-tab'));
  }

  /* 6. 空的 iframe 佔位：還沒接上檔案時顯示說明（接上 src 就自動不顯示） */
  function framePlaceholders(){
    var frames = document.querySelectorAll('.frame');
    for (var i=0;i<frames.length;i++){
      var f = frames[i], ifr = f.querySelector('iframe'), ph = f.querySelector('.ph');
      if (!ifr || !ph) continue;
      var src = ifr.getAttribute('src');
      if (src && src.trim()) { ph.hidden = true; }
    }
  }

  ready(function(){
    markNav(); projection(); copyButtons(); checklists(); tabs(); framePlaceholders();
  });
})();
