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
  var projectionTabState = null, projectionScrollY = 0;

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

  /* 切完再量一次。上面那套是照「意思」切的，猜不到實際高度；
     真的高過畫面的，就把尾巴挪到下一張。只剩一塊內容時不再切
     （那種是單一張長圖或長卡片，硬切會把它切爛，交給捲動提示）。 */
  function fitSlides(){
    var main = document.querySelector('main');
    if (!main) return;
    var bar = document.querySelector('.topbar');
    var avail = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0) - 90;
    if (avail < 240) return;
    function movable(host){
      var out = [];
      for (var i = 0; i < host.children.length; i++){
        if (!host.children[i].classList.contains('slide-chapter')) out.push(host.children[i]);
      }
      return out;
    }
    /* 有些整章包在一個 section 或一張 card 裡，外面看只有一個孩子。
       這種要鑽進去拿裡面的內容切，不然整章會擠成一張四千像素的投影片。 */
    function hostOf(s){
      var h = s.querySelector('.body') || s, guard = 0;
      while (guard++ < 6){
        var m = movable(h);
        if (m.length !== 1) break;
        var one = m[0], ok = one.tagName === 'SECTION' || one.tagName === 'ARTICLE' ||
                             (one.tagName === 'DIV' && (one.classList.contains('card') ||
                                                        one.classList.contains('body')));
        /* 分頁面板必須整塊保留。若把面板內容拆到不同 slide，退出投影後
           分頁只能藏住第一塊，後面的內容會漏到其他分頁。 */
        if (one.getAttribute && one.getAttribute('role') === 'tabpanel') break;
        /* keep-together 是一個完整圖表／圖說單位；高於一張時寧可整張捲動，
           不鑽進去把 figcaption 拆到下一張。 */
        if (one.classList && one.classList.contains('keep-together')) break;
        if (!ok || one.children.length < 2) break;
        h = one.querySelector(':scope > .body') || one;
      }
      return h;
    }

    var guard = 0, list = main.querySelectorAll('.slide');
    for (var i = 0; i < list.length && guard < 400; i++){
      var s = list[i];
      s.classList.add('on');
      var host = hostOf(s);
      var spill = null;
      while (s.scrollHeight > avail && movable(host).length > 1 && guard++ < 400){
        if (!spill){
          spill = document.createElement('div');
          spill.className = 'slide';
          var lab = s.querySelector('.slide-chapter');
          var h2n = s.querySelector('h2') || s.querySelector('h3');
          var name = lab ? lab.textContent : (h2n ? h2n.textContent.trim() : '');
          if (name){
            var p = document.createElement('p');
            p.className = 'slide-chapter';
            p.textContent = name;
            spill.appendChild(p);
          }
          var bd = document.createElement('div');
          bd.className = 'body';
          spill.appendChild(bd);
          s.parentNode.insertBefore(spill, s.nextSibling);
        }
        var sink = spill.querySelector('.body');
        var kids = movable(host);
        sink.insertBefore(kids[kids.length - 1], sink.firstChild);
        /* 搬走幾塊之後，剩下的可能又縮成「單一個大容器」，要重找一次，
           不然會停在一張還是塞不下的卡片上。 */
        host = hostOf(s);
      }
      s.classList.remove('on');
      list = main.querySelectorAll('.slide');
    }
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
    function prepareTabs(){
      var panels = [].slice.call(document.querySelectorAll('[role="tabpanel"]'));
      var tabButtons = [].slice.call(document.querySelectorAll('[role="tab"]'));
      var selectedTab = tabButtons.filter(function(tab){ return tab.getAttribute('aria-selected') === 'true'; })[0];
      projectionTabState = {
        selectedId: selectedTab ? selectedTab.getAttribute('data-tab') : null,
        panels: panels.map(function(panel){ return {el:panel, hidden:panel.hidden}; }),
        buttons: tabButtons.map(function(tab){
          return {el:tab, selected:tab.getAttribute('aria-selected'), tabIndex:tab.tabIndex};
        })
      };
      /* 投影時每個面板都是一張可翻到的內容；不能沿用一般分頁的 hidden。 */
      for (var i = 0; i < panels.length; i++) panels[i].hidden = false;
    }
    function restoreTabs(){
      if (!projectionTabState) return;
      projectionTabState.panels.forEach(function(item){ item.el.hidden = item.hidden; });
      projectionTabState.buttons.forEach(function(item){
        if (item.selected === null) item.el.removeAttribute('aria-selected');
        else item.el.setAttribute('aria-selected', item.selected);
        item.el.tabIndex = item.tabIndex;
      });
      if (projectionTabState.selectedId){
        projectionTabState.panels.forEach(function(item){
          item.el.hidden = item.el.id !== projectionTabState.selectedId;
        });
        projectionTabState.buttons.forEach(function(item){
          var on = item.el.getAttribute('data-tab') === projectionTabState.selectedId;
          item.el.setAttribute('aria-selected', on ? 'true' : 'false');
          item.el.tabIndex = on ? 0 : -1;
        });
      }
      projectionTabState = null;
    }
    function apply(on){
      var wasOn = document.body.classList.contains('proj');
      if (on && !wasOn){
        projectionScrollY = window.scrollY || 0;
        prepareTabs();
      }
      document.documentElement.classList.toggle('proj', on);
      document.body.classList.toggle('proj', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? '關閉投影模式' : '投影模式';
      if (on){ buildSlides(); fitSlides(); slideBar(); showSlide(cur); }
      else if (wasOn){
        restoreTabs();
        requestAnimationFrame(function(){ window.scrollTo(0, projectionScrollY); });
      }
      try { localStorage.setItem(KEY+'proj', on ? '1' : '0'); } catch(e){}
      document.dispatchEvent(new CustomEvent('kxsq:projectionchange', {detail:{on:on}}));
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
        navigator.clipboard.writeText(text).then(done, function(){ fallback(text, done, btn, pre); });
      } else { fallback(text, done, btn, pre); }
    });
    function fallback(text, done, btn, pre){
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.top='-1000px';
      document.body.appendChild(ta); ta.select();
      var copied = false;
      try { copied = document.execCommand('copy') === true; } catch(e){ copied = false; }
      if (copied){
        done();
        setTimeout(function(){ if (ta.parentNode) ta.parentNode.removeChild(ta); }, 100);
        return;
      }

      /* 有些 file:// 瀏覽器會明確回傳 false。此時不能假裝成功，
         改成留下可選取的文字，讓老師按 Ctrl+C 手動複製。 */
      if (ta.parentNode) ta.parentNode.removeChild(ta);
      var owner = btn.closest('.prompt, .card');
      var oldManual = owner && owner.querySelector('.copy-manual');
      if (oldManual) oldManual.parentNode.removeChild(oldManual);
      ta = document.createElement('textarea');
      ta.className = 'copy-manual';
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.setAttribute('aria-label','自動複製失敗，請按 Ctrl+C 手動複製');
      pre.parentNode.insertBefore(ta, pre.nextSibling);
      var old = btn.textContent;
      btn.textContent = '請按 Ctrl+C';
      ta.focus();
      ta.select();
      setTimeout(function(){ btn.textContent = old; }, 3000);
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
    function jumpInProjection(id){
      if (!document.body.classList.contains('proj')) return false;
      if (projectionTabState) projectionTabState.selectedId = id;
      for (var i=0;i<btns.length;i++){
        btns[i].setAttribute('aria-selected', btns[i].getAttribute('data-tab') === id ? 'true' : 'false');
      }
      var panel = document.getElementById(id);
      var slide = panel && panel.closest('.slide');
      if (slide){
        var list = [].slice.call(slides);
        var index = list.indexOf(slide);
        if (index >= 0) showSlide(index);
      }
      return true;
    }
    for (var i=0;i<btns.length;i++) (function(b, idx){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-tab');
        if (!jumpInProjection(id)) show(id);
      });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = btns[(idx + d + btns.length) % btns.length];
        var id = n.getAttribute('data-tab');
        if (!jumpInProjection(id)) show(id);
        n.focus();
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
      if (!src || !src.trim()) { ph.hidden = false; continue; }
      /* 桌面版的「另開」連結會一直顯示；iframe 真載入失敗時，
         再把備援說明蓋回來，避免只剩一個空框。 */
      ph.hidden = true;
      (function(frame, placeholder){
        frame.addEventListener('load', function(){ placeholder.hidden = true; });
        frame.addEventListener('error', function(){ placeholder.hidden = false; });
      })(ifr, ph);
    }
  }

  /* 7. 大張教材圖表：離線放大／縮小，放大後仍可捲動與拖曳。
        處理 main 裡的 SVG、內容截圖與明標 data-zoomable 的 HTML 圖表；
        QR code、logo、小圖示不加控制。 */
  function mediaViewers(){
    var main = document.querySelector('main');
    if (!main) return;
    var all = main.querySelectorAll('svg, img, [data-zoomable]');
    var count = 0;

    function isContentImage(el){
      if (el.closest('.media-viewer') || el.hasAttribute('data-no-zoom')) return false;
      if (el.hasAttribute('data-zoomable')) return true;
      if (el.tagName.toLowerCase() === 'svg') return true;
      var src = (el.getAttribute('src') || '').toLowerCase();
      var alt = (el.getAttribute('alt') || '').toLowerCase();
      var cls = (el.className || '').toString().toLowerCase();
      if (/qr|qrcode|logo|icon/.test(src + ' ' + alt + ' ' + cls)) return false;
      /* 目前的內容圖都是教學截圖：放在 figure、使用全寬，
         或是 demo 的大張預覽圖。不用實際像素寬度判斷，避免 lazy image 還沒載入時漏掉。 */
      return !!el.closest('figure') || el.style.width === '100%' ||
             /(?:^|\/)(?:wall|submit)-preview\./.test(src);
    }

    function labelOf(el){
      if (el.tagName.toLowerCase() === 'img') return el.getAttribute('alt') || '教材圖';
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      var title = el.querySelector('title');
      return title ? title.textContent.trim() : '教材圖表';
    }

    function button(text, aria, viewportId){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'media-zoom-button';
      b.textContent = text;
      b.setAttribute('aria-label', aria);
      b.setAttribute('aria-controls', viewportId);
      return b;
    }

    for (var i = 0; i < all.length; i++) (function(target){
      if (!isContentImage(target)) return;
      count++;
      var label = labelOf(target);
      var viewportId = 'mediaViewport' + count;
      var viewer = document.createElement('div');
      viewer.className = 'media-viewer';
      viewer.setAttribute('role', 'group');
      viewer.setAttribute('aria-label', '教材檢視工具：' + label);
      /* 保留原圖的 max-width，避免 420px 截圖在 100% 時突然變大。 */
      viewer.style.maxWidth = target.style.maxWidth || '100%';

      var controls = document.createElement('div');
      controls.className = 'media-zoom-controls';
      controls.setAttribute('role', 'toolbar');
      controls.setAttribute('aria-label', '圖片縮放');
      var caption = document.createElement('span');
      caption.className = 'media-zoom-label';
      var isImage = target.tagName.toLowerCase() === 'img';
      caption.textContent = isImage ? '圖片縮放' : '圖表縮放';
      var out = button('−', isImage ? '縮小圖片' : '縮小圖表', viewportId);
      var status = document.createElement('span');
      status.className = 'media-zoom-status';
      status.setAttribute('aria-live', 'polite');
      var inn = button('＋', isImage ? '放大圖片' : '放大圖表', viewportId);
      var reset = button('還原', (isImage ? '還原圖片' : '還原圖表') + '到 100%', viewportId);
      controls.appendChild(caption);
      controls.appendChild(out);
      controls.appendChild(status);
      controls.appendChild(inn);
      controls.appendChild(reset);

      var viewport = document.createElement('div');
      viewport.className = 'media-viewport';
      viewport.id = viewportId;
      viewport.tabIndex = 0;
      viewport.setAttribute('aria-label', label + '；可拖曳或用方向鍵捲動');
      var surface = document.createElement('div');
      surface.className = 'media-zoom-surface';
      target.parentNode.insertBefore(viewer, target);
      viewer.appendChild(controls);
      viewer.appendChild(viewport);
      viewport.appendChild(surface);
      surface.appendChild(target);
      target.classList.add('media-zoom-target');
      if (target.tagName.toLowerCase() === 'img') target.setAttribute('draggable', 'false');

      var zoom = 100;
      function setZoom(next){
        next = Math.max(75, Math.min(200, next));
        var oldWidth = viewport.scrollWidth;
        var oldCenter = viewport.scrollLeft + viewport.clientWidth / 2;
        zoom = next;
        surface.style.width = zoom + '%';
        /* HTML 長條圖不像圖片會隨寬度一起放大字體；同步調整它使用的
           字級變數，讓「放大」真的能看清標籤與右側說明。 */
        if (target.classList.contains('needbars')){
          target.style.setProperty('--fs-s', (0.85 * zoom / 100) + 'rem');
          target.style.setProperty('--fs-xs', (0.75 * zoom / 100) + 'rem');
        }
        status.textContent = zoom + '%';
        out.disabled = zoom <= 75;
        inn.disabled = zoom >= 200;
        reset.disabled = zoom === 100;
        if (oldWidth > 0 && viewport.clientWidth > 0){
          var ratio = oldCenter / oldWidth;
          requestAnimationFrame(function(){
            viewport.scrollLeft = ratio * viewport.scrollWidth - viewport.clientWidth / 2;
          });
        }
      }
      out.addEventListener('click', function(){ setZoom(zoom - 25); });
      inn.addEventListener('click', function(){ setZoom(zoom + 25); });
      reset.addEventListener('click', function(){ setZoom(100); });
      setZoom(100);

      /* 檢視區有焦點時：+/−/0 縮放，方向鍵捲圖，
         並擋住投影模式的上一張／下一張捷徑。 */
      viewer.addEventListener('keydown', function(e){
        /* 在投影模式按按鈕的 Space／Enter 只操作按鈕，不要同時翻頁。 */
        if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('.media-zoom-button')) e.stopPropagation();
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); e.stopPropagation(); setZoom(zoom + 25); }
        else if (e.key === '-') { e.preventDefault(); e.stopPropagation(); setZoom(zoom - 25); }
        else if (e.key === '0') { e.preventDefault(); e.stopPropagation(); setZoom(100); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault(); e.stopPropagation();
          viewport.scrollBy({left:e.key === 'ArrowLeft' ? -120 : 120, behavior:'smooth'});
        }
      });

      /* 觸控使用瀏覽器原生捲動；滑鼠另支援在圖上拖曳。 */
      var drag = null;
      viewport.addEventListener('pointerdown', function(e){
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        drag = {x:e.clientX, y:e.clientY, left:viewport.scrollLeft, top:viewport.scrollTop};
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      viewport.addEventListener('pointermove', function(e){
        if (!drag) return;
        viewport.scrollLeft = drag.left - (e.clientX - drag.x);
        viewport.scrollTop = drag.top - (e.clientY - drag.y);
        e.preventDefault();
      });
      function stopDrag(e){
        if (!drag) return;
        drag = null;
        viewport.classList.remove('is-dragging');
        if (e && viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      }
      viewport.addEventListener('pointerup', stopDrag);
      viewport.addEventListener('pointercancel', stopDrag);
    })(all[i]);
  }

  ready(function(){
    markNav(); mediaViewers(); tabs(); projection(); copyButtons(); checklists(); framePlaceholders();
  });
})();
