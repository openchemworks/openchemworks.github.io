(function(){
  'use strict';
  var PRICES={"AA-1": {"label": "Free amino acid profile (AA-1)", "base": 150, "tier25": 125}, "AA-T": {"label": "Total amino acids, incl. hydrolysis (AA-T + PREP-H)", "base": 230, "tier25": 230}, "CR-1": {"label": "Creatine quantitation (CR-1)", "base": 120, "tier25": 120}, "PILOT": {"label": "5-sample pilot, new customers", "base": 250, "tier25": 250}, "min": 150, "prep1": 30, "prep2": 200, "prep2_waive": 20};
  /* mobile menu */
  var mb=document.getElementById('menuBtn'), nav=document.getElementById('primary-nav');
  if(mb&&nav){ mb.addEventListener('click',function(){ var o=nav.classList.toggle('open'); mb.setAttribute('aria-expanded',o?'true':'false'); }); }

  /* dropdown menus: Services, Applications, Resources */
  var btns=[].slice.call(document.querySelectorAll('.drop-btn'));
  var hov=window.matchMedia('(hover:hover) and (min-width:901px)');
  function panel(b){ return document.getElementById(b.getAttribute('aria-controls')); }
  function setOpen(b,o){ var p=panel(b); if(!p) return; p.classList.toggle('open',o); b.setAttribute('aria-expanded',o?'true':'false'); }
  function closeAll(except){ btns.forEach(function(b){ if(b!==except) setOpen(b,false); }); }
  btns.forEach(function(b){
    var wrap=b.parentElement, tm;
    b.addEventListener('click',function(e){ e.stopPropagation(); var o=b.getAttribute('aria-expanded')!=='true'; closeAll(b); setOpen(b,o); });
    wrap.addEventListener('mouseenter',function(){ if(hov.matches){ clearTimeout(tm); closeAll(b); setOpen(b,true); } });
    wrap.addEventListener('mouseleave',function(){ if(hov.matches){ tm=setTimeout(function(){ setOpen(b,false); },160); } });
  });
  document.addEventListener('click',function(e){ btns.forEach(function(b){ if(!b.parentElement.contains(e.target)) setOpen(b,false); }); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var open=btns.filter(function(b){return b.getAttribute('aria-expanded')==='true';})[0]; closeAll(); if(open) open.focus(); } });

  /* section menu: highlight the section in view; close the phone menu after a jump */
  var toc=document.querySelector('.toc2');
  if(toc&&'IntersectionObserver' in window){
    var links=[].slice.call(toc.querySelectorAll('a')), map={};
    links.forEach(function(a){ map[a.getAttribute('href').slice(1)]=a; });
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ links.forEach(function(l){ l.classList.remove('on'); }); var a=map[en.target.id]; if(a){ a.classList.add('on'); } } }); },{rootMargin:'-15% 0px -70% 0px'});
    Object.keys(map).forEach(function(id){ var h=document.getElementById(id); if(h) io.observe(h); });
  }
  document.querySelectorAll('.mtoc a').forEach(function(a){ a.addEventListener('click',function(){ var d=a.closest('details'); if(d) d.removeAttribute('open'); }); });

  /* reveal on scroll */
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var rv=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); rv.unobserve(en.target); } }); },{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ rv.observe(el); });
  } else { document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); }); }

  function money(v){ return '$'+Math.round(v).toLocaleString('en-US'); }

  /* order estimator (one price list for every page) */
  (function(){
    var n=document.getElementById('est-n'); if(!n) return;
    var svc=document.getElementById('est-svc'), month=document.getElementById('est-month'), solid=document.getElementById('est-solid'), nw=document.getElementById('est-new');
    var total=document.getElementById('est-total'), detail=document.getElementById('est-detail'), cta=document.getElementById('est-cta');
    function calc(){
      var s=svc?svc.value:'AA-1', P=PRICES[s];
      var k=Math.max(1,Math.min(500,parseInt(n.value,10)||1));
      if(s==='PILOT'){ k=5; n.value=5; }
      var per, parts=[];
      if(s==='PILOT'){ per=P.base/5; parts.push('5-sample pilot, $250 total'); }
      else { per=(s==='AA-1'&&(month.checked||k>=25))?P.tier25:P.base; parts.push(k+' sample'+(k>1?'s':'')+' × '+money(per)+(s==='AA-1'&&per===P.tier25?' (25+/mo tier)':'')); }
      var sub=(s==='PILOT')?P.base:per*k;
      if(solid.checked&&s!=='PILOT'){ sub+=PRICES.prep1*k; parts.push('PREP-1 '+money(PRICES.prep1)+' × '+k); }
      if(nw.checked&&s!=='PILOT'){ if(k>=PRICES.prep2_waive){ parts.push('PREP-2 waived at 20+'); } else { sub+=PRICES.prep2; parts.push('PREP-2 '+money(PRICES.prep2)); } }
      var t=Math.max(sub,PRICES.min); if(sub<PRICES.min) parts.push('minimum order applied');
      total.textContent=money(t); detail.textContent=parts.join(' · ');
      var q=['n='+k,'service='+encodeURIComponent(s)]; if(solid.checked) q.push('solid=1');
      if(cta) cta.setAttribute('href','/?'+q.join('&')+'#contact');
    }
    [n,svc,month,solid,nw].forEach(function(el){ if(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); } });
    calc();
  })();

  /* YAN calculator */
  (function(){
    var a=document.getElementById('yan-nh3'), b=document.getElementById('yan-aan'); if(!a||!b) return;
    var out=document.getElementById('yan-out'), note=document.getElementById('yan-note');
    function calc(){
      var nh3=parseFloat(a.value)||0, aan=parseFloat(b.value)||0, y=0.8225*nh3+aan;
      out.textContent=Math.round(y)+' mg N/L';
      note.textContent=y<100?'Below the suggested minimum for reds (about 100) and whites (about 150).':(y<150?'Below about 150 mg N/L, the suggested minimum for whites.':'At or above the suggested minimums.');
    }
    a.addEventListener('input',calc); b.addEventListener('input',calc); calc();
  })();

  /* quote form prefill (from estimator or ?service= links) */
  var NAMES={'AA-1':'AA-1 Free amino acid profile','AA-T':'AA-T Total amino acids (acid hydrolysis)','CR-1':'CR-1 Creatine quantitation','PILOT':'PILOT 5-sample pilot ($250 total)','pilot':'PILOT 5-sample pilot ($250 total)','run':'RUN-1 Bioreactor run package','plan':'PLAN-1 Monthly standing order','md':'MD-1 HPLC method development'};
  (function(){
    if(!document.getElementById('quoteForm')) return;
    if(!location.search||location.search.length<2) return; var p=new URLSearchParams(location.search);
    var q=document.getElementById('q-n'), w=document.getElementById('q-what'), notes=document.getElementById('q-notes'), m=document.getElementById('q-matrix');
    var s=p.get('service'); if(s&&NAMES[s]&&w) w.value=NAMES[s];
    if(p.get('n')&&q) q.value=p.get('n'); if((s==='pilot'||s==='PILOT')&&q&&!q.value) q.value='5';
    if(p.get('matrix')&&m&&!m.value) m.value=p.get('matrix');
    if(p.get('solid')==='1'&&notes&&!notes.value) notes.value='Samples are solids/powders (PREP-1).';
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

  /* email capture forms — POST to Google Forms backend, mailto fallback */
  (function(){
    var TO='info@openchemworks.com';
    var FORM_URL='https://docs.google.com/forms/d/e/1FAIpQLSf6R9wOZyCOOscorQU9HlMEWR88DSvN7MR9f1kzUFdb5_J8cA/formResponse';
    var E={name:'entry.1403052073',email:'entry.412558084',products:'entry.1173069997',page:'entry.820294829',segment:'entry.1499992690'};
    document.querySelectorAll('form.capture-form').forEach(function(f){
      f.addEventListener('submit',function(e){
        e.preventDefault();
        var g=function(s){var el=f.querySelector(s);return el?el.value.trim():'';};
        var done=function(msg){ var s=document.createElement('div'); s.className='sent'; s.setAttribute('role','status'); s.innerHTML=msg; f.replaceWith(s); };
        if(g('input[name="website"]')){ done('Thank you! You are on the list.'); return; } /* honeypot */
        var name=g('input[name="name"]'), email=g('input[name="email"]'), products=g('[name="products"]');
        if(!email||email.indexOf('@')<0){f.querySelector('input[name="email"]').focus();return;}
        var segment=f.getAttribute('data-segment')||'subscribe';
        var subject=f.getAttribute('data-subject')||'Subscribe — OpenChemWorks guides';
        var fd=new FormData();
        fd.append(E.name,name); fd.append(E.email,email); fd.append(E.products,products);
        fd.append(E.page,location.href); fd.append(E.segment,segment);
        fetch(FORM_URL,{method:'POST',mode:'no-cors',body:new URLSearchParams(fd)})
          .then(function(){ done('Thank you'+(name?', '+name:'')+'. You are on the list &mdash; watch '+email+' for the next post.'); })
          .catch(function(){
            var body='Name: '+name+'\nEmail: '+email+'\nProducts of interest: '+products+'\nSegment: '+segment+'\n\nSource page: '+location.href;
            window.location.href='mailto:'+TO+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
            done('Thank you'+(name?', '+name:'')+'. Your email app should now be open with the signup prefilled and addressed to '+TO+'. If it did not open, just email <a href="mailto:'+TO+'">'+TO+'</a> with the subject &ldquo;'+subject+'&rdquo;.');
          });
      });
    });
  })();
})();
