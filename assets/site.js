(function(){
  'use strict';
  /* mobile menu */
  var mb=document.getElementById('menuBtn'), nav=document.getElementById('primary-nav');
  if(mb&&nav){ mb.addEventListener('click',function(){ var o=nav.classList.toggle('open'); mb.setAttribute('aria-expanded',o?'true':'false'); }); }
  /* applications mega-menu */
  var db=document.querySelector('.drop-btn'), mega=document.getElementById('mega');
  if(db&&mega){
    function setOpen(o){ mega.classList.toggle('open',o); db.setAttribute('aria-expanded',o?'true':'false'); }
    db.addEventListener('click',function(e){ e.stopPropagation(); setOpen(!mega.classList.contains('open')); });
    var hov=window.matchMedia('(hover:hover) and (min-width:901px)');
    var wrap=db.parentElement, tm;
    wrap.addEventListener('mouseenter',function(){ if(hov.matches){ clearTimeout(tm); setOpen(true); } });
    wrap.addEventListener('mouseleave',function(){ if(hov.matches){ tm=setTimeout(function(){ setOpen(false); },160); } });
    document.addEventListener('click',function(e){ if(!wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ setOpen(false); db.focus(); } });
  }
  /* table of contents highlight */
  var toc=document.querySelector('.toc');
  if(toc&&'IntersectionObserver' in window){
    var links=[].slice.call(toc.querySelectorAll('a')), map={};
    links.forEach(function(a){ map[a.getAttribute('href').slice(1)]=a; });
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ links.forEach(function(l){ l.classList.remove('on'); }); var a=map[en.target.id]; if(a) a.classList.add('on'); } }); },{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(map).forEach(function(id){ var h=document.getElementById(id); if(h) io.observe(h); });
  }
  /* reveal on scroll */
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var rv=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); rv.unobserve(en.target); } }); },{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ rv.observe(el); });
  } else { document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); }); }

  /* order estimator */
  (function(){
    var n=document.getElementById('est-n'); if(!n) return;
    var ext=document.getElementById('est-ext'), solid=document.getElementById('est-solid'), rush=document.getElementById('est-rush');
    var total=document.getElementById('est-total'), detail=document.getElementById('est-detail'), cta=document.getElementById('est-cta');
    function money(v){ return '$'+Math.round(v).toLocaleString('en-US'); }
    function calc(){
      var k=Math.max(1,Math.min(500,parseInt(n.value,10)||1));
      var tier=k>=50?79:(k>=10?99:125), tierName=k>=50?'50 + tier':(k>=10?'10–49 tier':'1–9 tier');
      var per=tier+(ext.checked?25:0)+(solid.checked?30:0);
      var sub=per*k; if(rush.checked) sub*=2; var t=Math.max(sub,150);
      var parts=[k+' sample'+(k>1?'s':'')+' × '+money(per)+' ('+tierName+(ext.checked?' + AA-2':'')+(solid.checked?' + PREP-1':'')+')'];
      if(rush.checked) parts.push('48-hour rush +100 %'); if(sub<150) parts.push('minimum order applied');
      total.textContent=money(t); detail.textContent=parts.join(' · ');
      var q=['n='+k]; if(ext.checked) q.push('ext=1'); if(solid.checked) q.push('solid=1'); if(rush.checked) q.push('rush=1');
      if(cta && cta.getAttribute('data-page')) cta.setAttribute('href','/?'+q.join('&')+'#contact');
    }
    [n,ext,solid,rush].forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
    if(cta && !cta.getAttribute('data-page')) cta.addEventListener('click',function(){ fill({n:n.value,ext:ext.checked,solid:solid.checked,rush:rush.checked}); });
    calc();
  })();

  /* quote form prefill (from estimator or ?matrix= links) */
  function fill(o){
    var q=document.getElementById('q-n'), w=document.getElementById('q-what'), notes=document.getElementById('q-notes'), m=document.getElementById('q-matrix');
    if(o.n&&q) q.value=o.n; if(w) w.value=o.ext?'AA-1 + AA-2 Extended panel':(o.md?'MD-1 HPLC method development':'AA-1 Free amino acid profile');
    if(o.matrix&&m&&!m.value) m.value=o.matrix;
    if(notes&&!notes.value){ var extra=[]; if(o.rush) extra.push('48-hour rush requested'); if(o.solid) extra.push('samples are solids/powders (PREP-1)'); if(extra.length) notes.value=extra.join('; ')+'.'; }
  }
  (function(){
    if(!document.getElementById('quoteForm')) return;
    var p=new URLSearchParams(location.search); if(![].slice.call(p.keys()).length) return;
    fill({n:p.get('n'),ext:p.get('ext')==='1',solid:p.get('solid')==='1',rush:p.get('rush')==='1',matrix:p.get('matrix'),md:p.get('service')==='md'});
  })();

  /* quote form */
  (function(){
    var FORM_ENDPOINT=''; /* set to a form-service endpoint to post directly; empty = email hand-off */
    var TO='info@openchemworks.com';
    var f=document.getElementById('quoteForm'); if(!f) return;
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var g=function(id){var el=f.querySelector(id);return el?el.value.trim():'';};
      var name=g('#q-name'), email=g('#q-email');
      if(!name){f.querySelector('#q-name').focus();return;}
      if(!email||email.indexOf('@')<0){f.querySelector('#q-email').focus();return;}
      var lines=['Name: '+name,'Organization: '+g('#q-org'),'Email: '+email,'Number of samples: '+g('#q-n'),'Service: '+g('#q-what'),'Sample type: '+g('#q-matrix'),'','Notes:',g('#q-notes')];
      var body=lines.join('\n');
      var done=function(msg){ var s=document.createElement('div'); s.className='sent'; s.setAttribute('role','status'); s.innerHTML=msg; f.replaceWith(s); };
      if(FORM_ENDPOINT){
        var fd=new FormData(f); fd.append('subject','Quote request — '+(g('#q-org')||name));
        fetch(FORM_ENDPOINT,{method:'POST',body:fd,headers:{'Accept':'application/json'}}).then(function(r){ if(!r.ok) throw new Error('bad'); done('Thank you, '+name+'. Your request has been sent; a reply goes to '+email+'.'); }).catch(function(){ done('Your request could not be sent automatically. Please email <a href="mailto:'+TO+'">'+TO+'</a> with your sample details.'); });
      } else {
        window.location.href='mailto:'+TO+'?subject='+encodeURIComponent('Quote request — '+(g('#q-org')||name))+'&body='+encodeURIComponent(body);
        var ta=document.createElement('textarea'); ta.value='To: '+TO+'\nSubject: Quote request — '+(g('#q-org')||name)+'\n\n'+body; ta.readOnly=true; ta.style.cssText='width:100%;min-height:180px;margin-top:.8rem;font:inherit;font-size:.9rem;padding:.7rem;border:1px solid #C5CEDA;border-radius:4px;background:#fff;color:#1F2933';
        var s=document.createElement('div'); s.className='sent'; s.setAttribute('role','status'); s.innerHTML='Thank you, '+name+'. Your email app should now be open with the request prefilled and addressed to <a href="mailto:'+TO+'">'+TO+'</a>. If it did not open, copy the text below into an email:'; s.appendChild(ta); f.replaceWith(s);
      }
    });
  })();

  /* interactive profile (reading page) */
  (function(){
    var box=document.querySelector('.profile-demo'); if(!box) return;
    function on(k){ box.querySelectorAll('[data-k]').forEach(function(el){ el.classList.toggle('on',el.getAttribute('data-k')===k); }); }
    box.querySelectorAll('[data-k]').forEach(function(el){ var k=el.getAttribute('data-k'); el.addEventListener('mouseenter',function(){ on(k); }); el.addEventListener('focus',function(){ on(k); }); el.addEventListener('click',function(){ on(k); }); });
    box.addEventListener('mouseleave',function(){ on(null); });
  })();
})();
