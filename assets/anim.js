/* OpenChemWorks signature animations. Canvas 2D, no libraries.
   Every trace is ILLUSTRATIVE: peak positions follow the example report's AQC elution order;
   heights come from illustrative concentrations chosen to show the chemistry each page describes. */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- analytes: retention time (min, from the example report; extended panel placed illustratively) ---------- */
  var RT = {Hyp:3.22,Asp:3.41,Ser:3.62,Tau:3.80,Glu:3.98,Gly:4.20,His:4.41,Gln:4.61,Asn:4.92,GABA:5.10,NH3:5.30,Arg:5.63,Cit:5.78,Thr:5.91,Ala:6.32,Pro:7.08,Tyr:7.61,Lys:8.12,Orn:8.35,Met:8.58,Val:8.91,Ile:9.52,Leu:9.87,Phe:10.41,Trp:10.93,AMQ:2.62};
  var K = Object.keys(RT), RT0 = 2.45, RT1 = 11.35, SIG = 0.0072;
  var LABEL = {NH3:'NH₃',Gln:'Gln',Ala:'Ala',Asn:'Asn',Tau:'Taurine',Pro:'Pro',Arg:'Arg',AMQ:'AMQ'};
  function U(k){ return (RT[k]-RT0)/(RT1-RT0); }
  function vec(p, pow){ var v=new Float32Array(K.length); for(var i=0;i<K.length;i++){ var c=p[K[i]]||0; v[i]=c>0?Math.pow(c,pow||0.6):0; } return v; }
  function norm(list){ var m=0; list.forEach(function(v){ for(var i=0;i<v.length;i++) if(v[i]>m) m=v[i]; }); list.forEach(function(v){ for(var i=0;i<v.length;i++) v[i]=v[i]/m*0.96; }); return list; }
  function mix(a,b,t){ var v=new Float32Array(a.length); for(var i=0;i<a.length;i++) v[i]=a[i]+(b[i]-a[i])*t; return v; }
  function ease(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
  function clamp(x,a,b){ return x<a?a:(x>b?b:x); }
  function seg(t,a,b){ return clamp((t-a)/(b-a),0,1); }

  /* example-report profile (µM) */
  var EX = {Asp:142,Ser:318,Glu:613,Gly:455,His:96,Gln:1842,Asn:224,NH3:2260,Arg:388,Thr:265,Ala:1120,Pro:540,Tyr:88,Lys:291,Met:71,Val:402,Ile:214,Leu:377,Phe:133,Trp:24};

  /* ---------- controller ---------- */
  var items = [];
  function Anim(cv, spec){
    this.cv=cv; this.ctx=cv.getContext('2d'); this.spec=spec; this.el=0; this.visible=false; this.paused=false;
    this.mini=cv.hasAttribute('data-mini'); this.hoverOnly=cv.hasAttribute('data-hover'); this.hover=false;
    this.st={}; this.drawnStatic=false; this.size();
  }
  Anim.prototype.size=function(){
    var dpr=Math.min(window.devicePixelRatio||1,2), W=this.cv.clientWidth, H=this.cv.clientHeight;
    if(!W||!H){ this.W=0; return; }
    this.W=W; this.H=H; this.cv.width=Math.round(W*dpr); this.cv.height=Math.round(H*dpr); this.ctx.setTransform(dpr,0,0,dpr,0,0);
    var rr=this.spec.reserve?(this.mini?this.spec.reserve*0.45:this.spec.reserve):0, g;
    if(this.mini){ g={x0:8,x1:W-8-rr,y0:H*0.86,A:H*0.66}; }
    else {
      var inner=this.cv.parentElement&&this.cv.parentElement.querySelector('.inner'), ir=0;
      if(inner){ ir=inner.getBoundingClientRect().right-this.cv.getBoundingClientRect().left+48; }
      var x0w=Math.max(W*0.5,ir), wide=W>980 && (W-rr-30-x0w)>=360;
      g={x0:wide?x0w:14,x1:W-rr-(wide?30:14),y0:wide?H*0.82:H-52,A:wide?H*0.52:Math.min(96,H*0.2)}; this.compact=!wide;
    }
    this.g=g; var n=Math.max(2,Math.floor((g.x1-g.x0)/2)+1); this.n=n;
    this.basis=[]; for(var k=0;k<K.length;k++){ var b=new Float32Array(n), u=U(K[k]); for(var i=0;i<n;i++){ var d=i/(n-1)-u; b[i]=Math.exp(-(d*d)/(2*SIG*SIG)); } this.basis.push(b); }
    this.pool=[new Float32Array(n),new Float32Array(n),new Float32Array(n),new Float32Array(n)];
    this.drawnStatic=false;
  };
  Anim.prototype.running=function(){ return !RM && !this.paused && this.visible && !document.hidden && (!this.hoverOnly || this.hover) && this.W>0; };
  Anim.prototype.render=function(t){ if(!this.W) return; this.ctx.clearRect(0,0,this.W,this.H); this.spec.draw(this,t); };
  Anim.prototype.still=function(){ if(!this.W) return; this.render(this.spec.still!=null?this.spec.still:0); this.drawnStatic=true; };

  /* compute y-array for a height vector */
  function Y(a,h,slot){ var o=a.pool[slot||0]; o.fill(0); for(var k=0;k<h.length;k++){ var hv=h[k]; if(!hv) continue; var b=a.basis[k]; for(var i=0;i<a.n;i++) o[i]+=hv*b[i]; } return o; }
  function px(a,i){ return a.g.x0+(a.g.x1-a.g.x0)*i/(a.n-1); }
  function grad(a,alpha){ var c=a.ctx,g=c.createLinearGradient(a.g.x0,0,a.g.x1,0); g.addColorStop(0,'rgba(255,255,255,'+(.85*alpha)+')'); g.addColorStop(.55,'rgba(246,178,122,'+alpha+')'); g.addColorStop(1,'rgba(232,121,43,'+alpha+')'); return g; }
  /* draw a trace: o = {prog, stroke, lw, glow, fill, dx, dy, sy, alpha} */
  function line(a,y,o){
    o=o||{}; var c=a.ctx, g=a.g, m=Math.max(2,Math.floor(a.n*(o.prog==null?1:o.prog))), dx=o.dx||0, dy=o.dy||0, sy=o.sy==null?1:o.sy, A=g.A*sy, y0=g.y0+dy;
    if(o.prog===0) return;
    c.save(); c.globalAlpha=o.alpha==null?1:o.alpha;
    c.beginPath(); for(var i=0;i<m;i++){ var X=px(a,i)+dx, Yv=y0-A*y[i]; if(i===0) c.moveTo(X,Yv); else c.lineTo(X,Yv); }
    if(o.glow){ c.shadowColor='rgba(232,121,43,.5)'; c.shadowBlur=a.mini?6:14; }
    c.strokeStyle=o.stroke||grad(a,1); c.lineWidth=o.lw||(a.mini?1.6:2.4); c.lineJoin='round'; c.lineCap='round'; c.stroke();
    if(o.fill){ c.shadowBlur=0; var ex=px(a,m-1)+dx; c.lineTo(ex,y0); c.lineTo(g.x0+dx,y0); c.closePath(); var fg=c.createLinearGradient(0,y0-A,0,y0); fg.addColorStop(0,o.fill); fg.addColorStop(1,'rgba(232,121,43,0)'); c.fillStyle=fg; c.fill(); }
    if(o.pen && m<a.n){ var PX=px(a,m-1)+dx, PY=y0-A*y[m-1]; c.shadowBlur=0; c.beginPath(); c.arc(PX,PY,a.mini?2:3.2,0,Math.PI*2); c.fillStyle='#fff'; c.fill(); }
    c.restore();
  }
  function baseline(a,dx,dy,alpha){ var c=a.ctx,g=a.g; c.save(); c.strokeStyle='rgba(255,255,255,'+(alpha==null?.12:alpha)+')'; c.lineWidth=1; c.beginPath(); c.moveTo(g.x0+(dx||0),g.y0+(dy||0)+.5); c.lineTo(g.x1+(dx||0),g.y0+(dy||0)+.5); c.stroke(); c.restore(); }
  function apex(a,y,key,dx,dy,sy){ var i=Math.round(U(key)*(a.n-1)); return {x:px(a,i)+(dx||0), y:a.g.y0+(dy||0)-a.g.A*(sy==null?1:sy)*y[i]}; }
  function tag(a,y,key,text,alpha,color){ if(a.mini||a.compact) return; var p=apex(a,y,key), c=a.ctx; c.save(); c.globalAlpha=alpha==null?1:alpha; c.font='600 11px Poppins, "Segoe UI", sans-serif'; c.textAlign='center'; c.fillStyle=color||'rgba(255,255,255,.85)'; c.fillText(text||LABEL[key]||key,p.x,p.y-10); c.restore(); }
  function text(a,s,x,y,o){ if(a.mini||a.compact) return; o=o||{}; var c=a.ctx; c.save(); c.globalAlpha=o.alpha==null?1:o.alpha; c.font=(o.weight||600)+' '+(o.size||12)+'px Poppins, "Segoe UI", sans-serif'; c.textAlign=o.align||'left'; c.fillStyle=o.color||'rgba(255,255,255,.8)'; c.fillText(s,x,y); c.restore(); }

  /* ---------- specs ---------- */
  var S = {};

  /* home — the original self-tracing separation (kept) */
  S.home = (function(){
    var P=[[.05,.30,.010],[.10,.52,.009],[.145,.26,.008],[.20,.66,.010],[.255,.40,.009],[.31,.92,.011],[.36,.28,.008],[.42,.58,.010],[.48,.47,.009],[.54,.78,.010],[.60,.34,.008],[.66,.62,.010],[.72,.44,.009],[.78,.70,.010],[.84,.31,.008],[.90,.52,.009],[.95,.22,.008]];
    function f(x){ var y=0; for(var i=0;i<P.length;i++){ var p=P[i],d=x-p[0]; y+=p[1]*Math.exp(-(d*d)/(2*p[2]*p[2])); } return y*(0.35+0.65*x); }
    var DUR=11000,HOLD=2600,FADE=900;
    return {still:DUR, draw:function(a,t){
      var c=a.ctx,W=a.W,H=a.H,wide=W>820,y0=wide?H*0.84:H-52,A=wide?H*0.50:Math.min(100,H*0.2),x0=wide?W*0.40:0,span=W-x0;
      var e=t%(DUR+HOLD+FADE),prog,alpha=1;
      if(e<DUR){ prog=1-Math.pow(1-e/DUR,1.6); } else if(e<DUR+HOLD){ prog=1; } else { prog=1; alpha=1-(e-DUR-HOLD)/FADE; }
      if(t===DUR){ prog=1; alpha=1; }
      c.strokeStyle='rgba(255,255,255,.10)'; c.lineWidth=1; c.beginPath(); c.moveTo(x0,y0+.5); c.lineTo(W,y0+.5); c.stroke();
      c.beginPath(); for(var i=0;i<=span;i+=2){ var yy=y0-A*f(i/span); if(i===0) c.moveTo(x0+i,yy); else c.lineTo(x0+i,yy);} c.strokeStyle='rgba(255,255,255,.10)'; c.lineWidth=1.2; c.stroke();
      var n=Math.floor(span*prog); if(n<2) return;
      var g=c.createLinearGradient(x0,0,W,0); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(.55,'#F6B27A'); g.addColorStop(1,'#E8792B');
      c.save(); c.globalAlpha=alpha; c.shadowColor='rgba(232,121,43,.55)'; c.shadowBlur=14; c.strokeStyle=g; c.lineWidth=2.4; c.lineJoin='round'; c.lineCap='round';
      c.beginPath(); for(var j=0;j<=n;j+=2){ var y2=y0-A*f(j/span); if(j===0) c.moveTo(x0+j,y2); else c.lineTo(x0+j,y2);} c.stroke();
      c.shadowBlur=0; c.lineTo(x0+n,y0); c.lineTo(x0,y0); c.closePath(); var fg=c.createLinearGradient(0,y0-A,0,y0); fg.addColorStop(0,'rgba(232,121,43,.22)'); fg.addColorStop(1,'rgba(232,121,43,0)'); c.fillStyle=fg; c.fill();
      if(prog<1){ var px2=x0+n,py=y0-A*f(n/span); c.beginPath(); c.arc(px2,py,3.2,0,Math.PI*2); c.fillStyle='#fff'; c.fill(); }
      c.restore();
    }};
  })();

  /* quiet — one pass of the example profile, then still (no loop) */
  S.quiet = (function(){ var h=norm([vec(EX)])[0]; return {still:2800, once:true, draw:function(a,t){
    var p=ease(seg(t,0,2600)), y=Y(a,h); baseline(a,0,0,.10); line(a,y,{stroke:'rgba(255,255,255,.10)',lw:1.2}); line(a,y,{prog:p,glow:true,fill:'rgba(232,121,43,.18)',pen:true,alpha:.9}); }}; })();

  /* cell culture — glutamine falls, ammonia and alanine rise, day 0 to day 7 */
  S.cellculture = (function(){
    var d0={Asp:600,Ser:1500,Glu:400,Gly:300,His:250,Gln:4000,Asn:2200,NH3:250,Arg:800,Thr:900,Ala:150,Pro:600,Tyr:450,Lys:1000,Met:350,Val:900,Ile:800,Leu:1100,Phe:400,Trp:120};
    var d7={Asp:150,Ser:350,Glu:900,Gly:700,His:150,Gln:150,Asn:250,NH3:5000,Arg:450,Thr:500,Ala:2400,Pro:550,Tyr:250,Lys:600,Met:180,Val:550,Ile:400,Leu:550,Phe:250,Trp:70};
    var v=norm([vec(d0),vec(d7)]), DRAW=2600, MORPH=8000, HOLD=2400, FADE=800, CYC=DRAW+MORPH+HOLD+FADE;
    return {still:DRAW+MORPH, draw:function(a,t){
      var e=t%CYC, pd=ease(seg(e,0,DRAW)), pm=ease(seg(e,DRAW,DRAW+MORPH)), al=1-seg(e,DRAW+MORPH+HOLD,CYC);
      if(t===DRAW+MORPH){ pd=1; pm=1; al=1; }
      var h=mix(v[0],v[1],pm), y0=Y(a,v[0],1), y=Y(a,h,0);
      baseline(a); line(a,y0,{stroke:'rgba(255,255,255,.13)',lw:1.2,alpha:al});
      line(a,y,{prog:pd,glow:true,fill:'rgba(232,121,43,.2)',pen:true,alpha:al});
      if(pd>=1){ ['Gln','NH3','Ala','Asn'].forEach(function(k){ tag(a,y,k,null,al); });
        var day=Math.round(pm*7); text(a,'Day '+day,a.g.x0,a.g.y0-a.g.A-8,{size:13,alpha:al*.9}); text(a,'culture time course · illustrative',a.g.x0+58,a.g.y0-a.g.A-8,{size:10,weight:500,alpha:al*.45}); }
    }};
  })();

  /* cultivated meat — fresh vs spent, then the top-up refills what dropped */
  S.cultivated = (function(){
    var fresh={Asp:500,Ser:900,Glu:600,Gly:400,His:300,Gln:3000,Asn:500,NH3:200,Arg:900,Thr:700,Ala:350,Pro:450,Tyr:500,Lys:900,Met:300,Val:800,Ile:750,Leu:900,Phe:350,Trp:90};
    var spent={Asp:250,Ser:250,Glu:700,Gly:500,His:200,Gln:250,Asn:150,NH3:2600,Arg:500,Thr:450,Ala:1500,Pro:420,Tyr:300,Lys:550,Met:120,Val:420,Ile:300,Leu:380,Phe:230,Trp:60};
    var v=norm([vec(fresh),vec(spent)]), T1=2600, T2=5200, T3=8800, HOLD=2400, FADE=800, CYC=T3+HOLD+FADE;
    return {still:T3, draw:function(a,t){
      var e=t%CYC; if(t===T3) e=T3; var al=1-seg(e,T3+HOLD,CYC);
      var pf=ease(seg(e,0,T1)), ps=ease(seg(e,T1,T2)), pu=ease(seg(e,T2+300,T3));
      /* the top-up raises only the analytes that dropped; NH3 and secreted ones stay as spent */
      var up=new Float32Array(v[0].length); for(var i=0;i<up.length;i++){ up[i]=v[1][i]<v[0][i]?v[1][i]+(v[0][i]-v[1][i])*pu:v[1][i]; }
      var yf=Y(a,v[0],1), ysp=Y(a,v[1],2), yu=Y(a,up,0);
      baseline(a);
      line(a,yf,{prog:pf,stroke:'rgba(255,255,255,.55)',lw:a.mini?1.2:1.6,alpha:al});
      if(ps>0) line(a,pu>0?yu:ysp,{prog:ps,glow:true,pen:true,alpha:al,fill:pu>0?'rgba(232,121,43,.30)':'rgba(232,121,43,.14)'});
      if(!a.mini && !a.compact){ var x=a.g.x0, yT=Math.max(18,a.g.y0-a.g.A-36), c=a.ctx; c.save(); c.globalAlpha=al;
        c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=2; c.beginPath(); c.moveTo(x,yT-4); c.lineTo(x+18,yT-4); c.stroke(); text(a,'fresh medium',x+24,yT,{size:11});
        if(ps>0){ c.strokeStyle='#E8792B'; c.beginPath(); c.moveTo(x+118,yT-4); c.lineTo(x+136,yT-4); c.stroke(); text(a,pu>0?'spent + top-up':'spent medium',x+142,yT,{size:11}); }
        text(a,'illustrative',x+262,yT,{size:10,weight:500,alpha:.45}); c.restore();
        if(pu>.2){ tag(a,yu,'Gln','Gln topped up',al); tag(a,yu,'NH3',null,al); } }
    }};
  })();

  /* fermentation — a waterfall of time points receding into the page */
  S.fermentation = (function(){
    var c0={Asp:900,Ser:800,Glu:1500,Gly:400,His:200,Gln:1200,Asn:700,NH3:5000,Arg:600,Thr:500,Ala:500,Pro:700,Tyr:200,Lys:600,Met:250,Val:500,Ile:400,Leu:700,Phe:300,Trp:80};
    var fast={Gln:.6,Asn:.55,Ser:.5,Asp:.45,Glu:.4,Arg:.35,NH3:.35}, slow={Thr:.2,Lys:.2,Leu:.22,Ile:.2,Val:.2,Met:.22,Phe:.15,Tyr:.15,His:.18,Trp:.12};
    var N=7, V=[]; for(var s=0;s<N;s++){ var p={}; for(var k in c0){ var r=fast[k]!=null?fast[k]:(slow[k]!=null?slow[k]:0); p[k]=c0[k]*Math.exp(-r*s); } p.Ala=c0.Ala*(1+0.35*s); p.Gly=c0.Gly*(1+0.12*s); V.push(vec(p)); }
    V=norm(V); var STEP=2300, CYC=STEP*N+2600+800;
    return {still:STEP*N, draw:function(a,t){
      var e=t%CYC; if(t===STEP*N) e=STEP*N; var al=1-seg(e,STEP*N+2600,CYC);
      var k=Math.min(N-1,Math.floor(e/STEP)), f=e>=STEP*N?1:seg(e-k*STEP,0,STEP*0.82);
      var ox=a.mini?9:(a.W>820?26:14), oy=a.mini?7:(a.W>820?20:11), sy=.9;
      /* older traces: slot j = k - i, moved back by (k-i) slots, the newest being drawn at the front */
      for(var i=0;i<=k;i++){ var back=k-i; var slide=(i<k)?(back-1+ease(f)):0; if(i===k) slide=0;
        var dx=slide*ox, dy=-slide*oy, fade=Math.max(.12,1-slide*.14), y=Y(a,V[i],1);
        if(i<k){ baseline(a,dx,dy,.07*fade*al); line(a,y,{dx:dx,dy:dy,sy:sy,stroke:'rgba(255,255,255,'+(.42*fade)+')',lw:a.mini?1:1.3,alpha:al}); }
        else { baseline(a,0,0,.12*al); line(a,Y(a,V[i],0),{prog:ease(f),sy:sy,glow:true,pen:true,fill:'rgba(232,121,43,.18)',alpha:al}); }
        if(!a.mini && (i===k ? f>.95 : true)){ text(a,(i*6)+' h',a.g.x1+dx+8,a.g.y0+dy-2,{size:10,weight:500,alpha:al*(i===k?.85:.45*fade)}); }
      }
      if(!a.mini) text(a,'fermentation time course · illustrative',a.g.x0,a.g.y0+22>a.H-46?a.g.y0-a.g.A-12:a.g.y0+22,{size:10,weight:500,alpha:.45*al});
    }, reserve:40};
  })();

  /* hydrolysates — a peptide chain breaks; freed residues fall into their peaks */
  S.hydrolysate = (function(){
    var W8={Leu:9,Lys:8,Val:7,Glu:9,Pro:8,Phe:5,Tyr:5,Met:3,Ile:5,Ala:4,Ser:5,Thr:4,Arg:4,His:3,Asp:6,Gly:3,Trp:1};
    var seq=[]; for(var k in W8) for(var j=0;j<W8[k];j++) seq.push(k);
    var r=7; for(var i=seq.length-1;i>0;i--){ r=(r*9301+49297)%233280; var q=Math.floor(r/233280*(i+1)); var tmp=seq[i]; seq[i]=seq[q]; seq[q]=tmp; }
    var cnt={}; seq.forEach(function(k){ cnt[k]=(cnt[k]||0)+1; }); var mx=Math.max.apply(null,Object.keys(cnt).map(function(k){return cnt[k];}));
    var order=[]; for(var b=0;b<seq.length-1;b++) order.push(b); r=11; for(i=order.length-1;i>0;i--){ r=(r*9301+49297)%233280; q=Math.floor(r/233280*(i+1)); tmp=order[i]; order[i]=order[q]; order[q]=tmp; }
    var BREAK=110, FALL=900, NB=order.length, END=NB*BREAK+FALL+200, HOLD=2600, FADE=800, CYC=END+HOLD+FADE;
    return {still:END, draw:function(a,t){
      var e=t%CYC; if(t===END) e=END; var al=1-seg(e,END+HOLD,CYC), g=a.g, c=a.ctx, n=seq.length;
      var mini=a.mini, chainY=g.y0-g.A*1.08, cx0=g.x0+(g.x1-g.x0)*0.04, cx1=g.x1-(g.x1-g.x0)*0.04, rad=mini?1.8:3.4;
      /* bond break time */
      var bt={}; for(var m=0;m<NB;m++) bt[order[m]]=m*BREAK;
      /* free time of residue i = when both neighbouring bonds are broken */
      var heights=new Float32Array(K.length), landed=0;
      c.save(); c.globalAlpha=al;
      for(i=0;i<n;i++){ var left=i>0?bt[i-1]:-1, right=i<n-1?bt[i]:-1, tf=Math.max(left,right);
        var ux=cx0+(cx1-cx0)*i/(n-1), uy=chainY+Math.sin(i*0.55)*(mini?2:7), key=seq[i], tx=g.x0+(g.x1-g.x0)*U(key);
        var s=seg(e,tf,tf+FALL), X=ux+(tx-ux)*ease(s), Yb=uy+(g.y0-uy)*(s*s);
        if(s>=1){ landed++; heights[K.indexOf(key)]+=0.96/mx; continue; }
        /* bonds to the right */
        if(i<n-1 && e<bt[i]){ var nx=cx0+(cx1-cx0)*(i+1)/(n-1), ny=chainY+Math.sin((i+1)*0.55)*(mini?2:7); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=mini?.8:1.4; c.beginPath(); c.moveTo(ux,uy); c.lineTo(nx,ny); c.stroke(); }
        c.beginPath(); c.arc(X,Yb,rad,0,Math.PI*2); c.fillStyle=s>0?'#F6B27A':'rgba(255,255,255,.9)'; c.fill();
      }
      c.restore();
      baseline(a,0,0,.12*al); var y=Y(a,heights,0); line(a,y,{glow:true,fill:'rgba(232,121,43,.2)',alpha:al});
      if(!mini){ text(a,landed<n?'hydrolysis → free amino acids':'free amino acid profile',g.x0,g.y0+22>a.H-46?chainY-18:g.y0+22,{size:11,alpha:.7*al}); text(a,'illustrative',g.x0,chainY-18,{size:10,weight:500,alpha:.45*al}); }
    }};
  })();

  /* label claims — one peak isolated and measured against a claim line */
  S.labelclaim = (function(){
    var p={Tau:6000,GABA:900,Gly:700,Ala:500,Arg:800,Leu:1200,Ile:600,Val:650,Gln:900,Lys:400,Ser:300,Thr:250,Glu:350,Pro:300,Phe:150,Tyr:120,His:100,Asp:150,Met:90,NH3:300};
    var v=norm([vec(p)])[0], ti=K.indexOf('Tau'), T1=3000, T2=4200, T3=7200, HOLD=2600, FADE=800, CYC=T3+HOLD+FADE;
    var only=new Float32Array(v.length); only[ti]=v[ti]; var rest=new Float32Array(v); rest[ti]=0;
    return {still:T3, draw:function(a,t){
      var e=t%CYC; if(t===T3) e=T3; var al=1-seg(e,T3+HOLD,CYC), g=a.g, c=a.ctx;
      var pd=ease(seg(e,0,T1)), dim=seg(e,T1,T2), fillp=ease(seg(e,T2,T3));
      var yall=Y(a,v,0), yT=Y(a,only,1);
      baseline(a);
      line(a,yall,{prog:pd,glow:dim<1,pen:true,alpha:al*(1-dim*0.75),fill:dim<.5?'rgba(232,121,43,.16)':null});
      if(dim>0){ line(a,yT,{stroke:'#E8792B',glow:true,alpha:al*dim,lw:a.mini?1.8:2.6});
        var pk=apex(a,yT,'Tau'), claimY=pk.y; /* claim line at the apex */
        c.save(); c.globalAlpha=al*dim; c.setLineDash([6,5]); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.3; c.beginPath(); c.moveTo(g.x0,claimY); c.lineTo(g.x1,claimY); c.stroke(); c.restore();
        /* fill the peak area up to the rising level */
        var lvl=g.y0-(g.y0-claimY)*fillp; c.save(); c.globalAlpha=al; c.beginPath(); c.rect(g.x0,lvl,g.x1-g.x0,g.y0-lvl); c.clip();
        c.beginPath(); for(var i=0;i<a.n;i++){ var X=px(a,i), Yv=g.y0-g.A*yT[i]; if(i===0) c.moveTo(X,Yv); else c.lineTo(X,Yv);} c.lineTo(g.x1,g.y0); c.lineTo(g.x0,g.y0); c.closePath(); c.fillStyle='rgba(232,121,43,.55)'; c.fill(); c.restore();
        text(a,'label claim',g.x1,claimY-6,{align:'right',size:11,alpha:al*dim});
        tag(a,yT,'Tau','Taurine',al*dim,'#F6B27A');
        if(fillp>=1) text(a,'measured ✓',pk.x+14,g.y0-(g.y0-claimY)/2,{size:11,alpha:al});
      }
      if(!a.mini) text(a,'single-analyte quantitation · illustrative',g.x0,g.y0+22>a.H-46?g.y0-g.A-10:g.y0+22,{size:10,weight:500,alpha:.45*al});
    }};
  })();

  /* wine — peaks drain into a YAN bar; proline stays behind */
  S.wine = (function(){
    var p={Arg:3500,Pro:4500,Gln:900,Ala:800,Ser:450,Thr:400,Glu:350,Asp:200,Gly:80,His:150,Val:150,Leu:120,Ile:90,Phe:80,Tyr:60,Lys:70,Met:40,Asn:60,Trp:50,NH3:5500};
    var v=norm([vec(p)])[0], keys=K.filter(function(k){ return p[k]; }).sort(function(x,y){ return RT[x]-RT[y]; });
    var totN=0; keys.forEach(function(k){ if(k!=='Pro') totN+=p[k]; });
    var T1=3000, EACH=260, T2=T1+keys.length*EACH+400, HOLD=2800, FADE=800, CYC=T2+HOLD+FADE;
    return {reserve:84, still:T2, draw:function(a,t){
      var e=t%CYC; if(t===T2) e=T2; var al=1-seg(e,T2+HOLD,CYC), g=a.g, c=a.ctx, mini=a.mini;
      var pd=ease(seg(e,0,T1)), h=new Float32Array(v), nh=0, am=0;
      keys.forEach(function(k,j){ var s=ease(seg(e,T1+j*EACH,T1+j*EACH+EACH*1.6)); var ki=K.indexOf(k); if(k==='Pro') return; h[ki]=v[ki]*(1-s); if(k==='NH3') nh+=p[k]*s; else am+=p[k]*s; });
      var y=Y(a,h,0); baseline(a); line(a,y,{prog:pd,glow:true,pen:true,fill:'rgba(232,121,43,.16)',alpha:al});
      /* proline turns grey once draining starts */
      if(e>T1){ var pi=K.indexOf('Pro'), only=new Float32Array(v.length); only[pi]=v[pi]; var yp=Y(a,only,1); line(a,yp,{stroke:'rgba(200,210,222,.9)',lw:mini?1.6:2.4,alpha:al*seg(e,T1,T1+500)}); tag(a,yp,'Pro','Pro — not in YAN',al*seg(e,T1,T1+500),'rgba(210,218,228,.9)'); }
      if(e<T1+300 && pd>=1){ tag(a,y,'Arg',null,al); tag(a,y,'NH3',null,al); }
      /* the bar */
      var bw=mini?10:24, bx=a.W-(mini?16:(a.W>820?58:40)), top=g.y0-g.A*1.02, full=g.y0-top;
      var hN=full*nh/totN, hA=full*am/totN;
      c.save(); c.globalAlpha=al; c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1; c.strokeRect(bx-.5,top-.5,bw+1,full+1);
      c.fillStyle='#E8792B'; c.fillRect(bx,g.y0-hN,bw,hN); c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(bx,g.y0-hN-hA,bw,hA); c.restore();
      if(!mini){ text(a,'YAN',bx+bw/2,top-10,{align:'center',size:12,alpha:al}); if(hN>14) text(a,'NH₃',bx-6,g.y0-hN/2+4,{align:'right',size:10,alpha:.8*al}); if(hA>14) text(a,'amino N',bx-6,g.y0-hN-hA/2+4,{align:'right',size:10,alpha:.8*al});
        text(a,'juice → yeast assimilable nitrogen · illustrative',g.x0,g.y0+22>a.H-46?g.y0-g.A-12:g.y0+22,{size:10,weight:500,alpha:.45*al}); }
    }};
  })();

  /* AQC — tagging makes amino acids visible at 260 nm; spare reagent becomes AMQ */
  S.aqc = (function(){
    var keys=['Asp','Ser','Glu','Gly','His','Gln','Asn','Arg','Thr','Ala','Pro','Tyr','Lys','Met','Val','Ile','Leu','Phe','Trp'];
    var nA=keys.length, nT=nA+6, r=5, P=[]; function rnd(){ r=(r*9301+49297)%233280; return r/233280; }
    for(var i=0;i<nA;i++) P.push({k:keys[i],x:rnd(),y:rnd(),ph:rnd()*6.28});
    var T=[]; for(i=0;i<nT;i++) T.push({tgt:i<nA?i:-1,ty:rnd(),d:i*260});
    var FLY=1300, DROP=1100, END=nT*260+FLY+DROP+300, HOLD=2600, FADE=800, CYC=END+HOLD+FADE;
    var hv=norm([vec(EX)])[0];
    return {still:END, draw:function(a,t){
      var e=t%CYC; if(t===END) e=END; var al=1-seg(e,END+HOLD,CYC), g=a.g, c=a.ctx, mini=a.mini;
      var fx0=g.x0, fx1=g.x1, fy0=g.y0-g.A*1.05, fy1=g.y0-g.A*0.35, heights=new Float32Array(K.length), amq=0;
      c.save(); c.globalAlpha=al;
      for(var j=0;j<nT;j++){ var tg=T[j], s=seg(e,tg.d,tg.d+FLY);
        if(tg.tgt>=0){ var q=P[tg.tgt], qx=fx0+(fx1-fx0)*(0.08+0.84*q.x), qy=fy0+(fy1-fy0)*q.y+Math.sin(e/900+q.ph)*(mini?1:4);
          var ds=seg(e,tg.d+FLY,tg.d+FLY+DROP), tx=g.x0+(g.x1-g.x0)*U(q.k);
          if(ds>=1){ var ki=K.indexOf(q.k); heights[ki]=hv[ki]; continue; }
          var X=qx+(tx-qx)*ease(ds), Yv=qy+(g.y0-qy)*ds*ds;
          if(s<1){ /* untagged: nearly invisible at 260 nm */ c.beginPath(); c.arc(qx,qy,mini?1.6:3,0,6.283); c.fillStyle='rgba(255,255,255,.18)'; c.fill();
            var sx=g.x0-20+(qx-g.x0+20)*ease(s), sy=fy0+(fy1-fy0)*tg.ty+(qy-fy0-(fy1-fy0)*tg.ty)*ease(s); c.save(); c.translate(sx,sy); c.rotate(.785); c.fillStyle='#E8792B'; var z=mini?1.8:3.6; c.fillRect(-z,-z,2*z,2*z); c.restore(); }
          else { c.beginPath(); c.arc(X,Yv,mini?2.2:4,0,6.283); c.fillStyle='#fff'; c.shadowColor='rgba(232,121,43,.8)'; c.shadowBlur=mini?4:12; c.fill(); c.shadowBlur=0; }
        } else { /* spare reagent hydrolyses to AMQ and runs early */
          var hs=seg(e,tg.d,tg.d+FLY+DROP), ax=g.x0+(g.x1-g.x0)*U('AMQ'), sx2=g.x0-20+(ax-g.x0+20)*ease(hs), sy2=fy0+(fy1-fy0)*tg.ty+(g.y0-fy0-(fy1-fy0)*tg.ty)*hs*hs;
          if(hs>=1){ amq+=1; continue; } c.save(); c.translate(sx2,sy2); c.rotate(.785); c.fillStyle='rgba(232,121,43,.6)'; var z2=mini?1.6:3.2; c.fillRect(-z2,-z2,2*z2,2*z2); c.restore(); }
      }
      c.restore();
      heights[K.indexOf('AMQ')]=0.55*amq/(nT-nA);
      baseline(a,0,0,.12*al); var y=Y(a,heights,0); line(a,y,{glow:true,fill:'rgba(232,121,43,.18)',alpha:al});
      if(!mini){ if(amq) tag(a,y,'AMQ','AMQ (spare reagent)',al*.8); text(a,'untagged amino acids barely absorb at 260 nm; AQC-tagged ones do · illustrative',g.x0,g.y0+22>a.H-46?fy0-16:g.y0+22,{size:10,weight:500,alpha:.5*al}); }
    }};
  })();

  S.cellculture.key='cellculture';
  var MAP={home:S.home,quiet:S.quiet,cellculture:S.cellculture,cultivated:S.cultivated,fermentation:S.fermentation,hydrolysate:S.hydrolysate,labelclaim:S.labelclaim,wine:S.wine,aqc:S.aqc};

  /* ---------- wiring ---------- */
  function init(){
    var cvs=document.querySelectorAll('canvas[data-anim]');
    var io='IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(en){ var it=en.target.__anim; if(it){ it.visible=en.isIntersecting; } }); },{rootMargin:'60px'}) : null;
    Array.prototype.forEach.call(cvs,function(cv){ var sp=MAP[cv.getAttribute('data-anim')]; if(!sp) return; var it=new Anim(cv,sp); cv.__anim=it; items.push(it); if(io) io.observe(cv); else it.visible=true;
      if(it.hoverOnly){ var host=cv.closest('a,.tile')||cv; host.addEventListener('mouseenter',function(){ it.hover=true; it.el=0; }); host.addEventListener('mouseleave',function(){ it.hover=false; it.still(); }); host.addEventListener('focusin',function(){ it.hover=true; it.el=0; }); host.addEventListener('focusout',function(){ it.hover=false; it.still(); }); }
      it.still(); });
    document.querySelectorAll('[data-pause]').forEach(function(b){ b.addEventListener('click',function(){ var cv=document.getElementById(b.getAttribute('data-pause')); var it=cv&&cv.__anim; if(!it) return; it.paused=!it.paused; b.textContent=it.paused?'Play':'Pause'; b.setAttribute('aria-pressed',it.paused?'true':'false'); if(it.paused) it.drawnStatic=true; }); if(RM){ b.hidden=true; } });
    var rt; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ items.forEach(function(it){ it.size(); it.still(); }); },120); });
    if(RM) return;
    var last=0; function loop(ts){ var dt=last?Math.min(64,ts-last):16; last=ts;
      for(var i=0;i<items.length;i++){ var it=items[i]; if(it.running()){ it.el+=dt; if(it.spec.once && it.el>it.spec.still){ if(!it.drawnStatic) it.still(); continue; } it.render(it.el); it.drawnStatic=false; } else if(!it.drawnStatic && !it.running()){ it.still(); } }
      requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.OCWAnim={init:init};
})();
