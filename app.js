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
    var kids = [], i;
    for (i = 0; i < main.children.length; i++) kids.push(main.children[i]);
    var groups = [], now = [];
    for (i = 0; i < kids.length; i++){
      var el = kids[i];
      if (el.tagName === 'FOOTER') continue;           // 頁尾不切成投影片
      var isBreak = (el.classList && el.classList.contains('gate')) || el.tagName === 'H2';
      if (isBreak && now.length){ groups.push(now); now = []; }
      now.push(el);
    }
    if (now.length) groups.push(now);
    for (i = 0; i < groups.length; i++){
      var g = groups[i];
      var box = document.createElement('div');
      box.className = 'slide';
      g[0].parentNode.insertBefore(box, g[0]);
      for (var j = 0; j < g.length; j++) box.appendChild(g[j]);
    }
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
  }

  function slideBar(){
    if (document.getElementById('slideBar')) return;
    var bar = document.createElement('div');
    bar.id = 'slideBar';
    bar.innerHTML = '<button type="button" id="slidePrev" aria-label="上一張">←</button>' +
                    '<span id="slideNo">1 / 1</span>' +
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
