/* Industry Structure — map animation and the Learn / Baseline / Test controls. Content lives in icf-data.js. */
(function(){
var D=window.MTU_DATA,stage=document.getElementById('stage'),cv=document.getElementById('canvas'),ctx=cv.getContext('2d'),tip=document.getElementById('tip'),map=document.getElementById('map');
var W=0,H=0,CX=0,CY=0,S=1,DPR=Math.min(window.devicePixelRatio||1,2),TILT=.42,RM=1,mobile=false;
var F={},target={};D.forces.forEach(function(f){F[f.id]=f.level;target[f.id]=f.level});
var SUP=[[],['Forestry','Mills','Fiber / Lumber'],['Adhesives','Tooling / Equip.','R.Estate / Infra','Energy']],DEM=['Investors','Occupants','Political'],objs=[];
var IND=[{label:'CLT Producers',a:205},{label:'Glulam Producers',a:242},{label:'MPP Producers',a:305},{label:'Fabricators',a:88}];IND.forEach(function(o){o.a=o.a*Math.PI/180;o.x=0;o.y=0});
function add(labels,side,baseR,rStep,a0,aStep,cid){labels.forEach(function(l,i){objs.push({label:l,side:side,r:baseR+i*rStep,a:a0+i*aStep,cid:cid})})}
add(SUP[0],-1,175,14,-Math.PI/8,Math.PI/10,'producers');add(SUP[1],-1,320,18,Math.PI/10,Math.PI/7.5,'fiber');add(SUP[2],-1,455,10,Math.PI/6,Math.PI/16,'inputs');add(DEM,1,215,0,-Math.PI/10,Math.PI/5,'demand');
function resize(){var r=stage.getBoundingClientRect();if(!r.width)return;W=r.width;H=r.height;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);mobile=W<620;CX=W/2+(mobile?24:0);CY=H/2;S=Math.min(W/1100,H/690);RM=1;TILT=.42;if(mobile){S=Math.min(W/420,H/560);RM=.46;TILT=.6}}
window.addEventListener('resize',resize,{passive:true});
var parts=[];for(var i=0;i<140;i++)parts.push({t:Math.random(),k:i%5,j:Math.random()});
function pos(a,r,side){return{x:CX+Math.cos(a)*r*S*RM*side,y:CY+Math.sin(a)*r*S*RM*TILT}}
function lvl(v){return v>=70?'High':v>=40?'Medium':'Low'}
function attract(){var s=0;for(var k in F)s+=F[k];return Math.round(100-s/5)}
function anchors(){var ry=mobile?H*.34:250*S,rx=mobile?W*.3:Math.min(W*.4,ry/TILT),ph=tt*0.0002;return{sub:{x:CX+Math.cos(-Math.PI/2+ph)*rx,y:CY+Math.sin(-Math.PI/2+ph)*ry},ent:{x:CX+Math.cos(Math.PI/2+ph)*rx,y:CY+Math.sin(Math.PI/2+ph)*ry},core:{x:CX,y:CY},sup:{x:CX-(mobile?110:420)*S,y:CY-(mobile?20:30)*S},dem:{x:CX+(mobile?120:330)*S,y:CY-10*S}}}
function halo(x,y,r,col,alpha){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col+Math.round(alpha*255).toString(16).padStart(2,'0'));g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function text(t,x,y,size,col,align,base,weight){size=size*(mobile?1.1:1.2);ctx.font=(weight||'500')+' '+size+'px Inter, system-ui, Arial, sans-serif';ctx.textAlign=align||'center';ctx.textBaseline=base||'middle';ctx.fillStyle=col;ctx.fillText(t,x,y)}
var tt=0,hover=null,cols={sub:'#ff9f5a',ent:'#c58cff',sup:'#4cc9ff',dem:'#4cff88'},ids=['sub','ent','sup','dem'];
function frame(){tt+=1;for(var k in F)F[k]+=(target[k]-F[k])*.04;
if(!W){requestAnimationFrame(frame);return}
ctx.clearRect(0,0,W,H);var A=anchors(),at=attract();
var seen={};objs.forEach(function(o){if(seen[o.r])return;seen[o.r]=1;ctx.beginPath();ctx.ellipse(CX,CY,o.r*S*RM,o.r*S*RM*TILT,0,0,Math.PI*2);ctx.strokeStyle='rgba(17,138,178,.18)';ctx.lineWidth=1;ctx.stroke()});
[].forEach(function(p){var id=ids[p.k%4],a=A[id],pw=F[id]/100;p.t+=(0.0025+pw*0.009)*(0.7+p.j*.6);if(p.t>1)p.t-=1;var x=a.x+(CX-a.x)*p.t,y=a.y+(CY-a.y)*p.t,sp=(1-p.t)*8*S;x+=Math.sin(p.j*20+tt*.02)*sp;y+=Math.cos(p.j*17+tt*.02)*sp*.6;if(p.j>pw+.15)return;ctx.globalAlpha=.75*(1-p.t)*(.3+pw);ctx.fillStyle=cols[id];ctx.beginPath();ctx.arc(x,y,1.6*S+1,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1});
var coreR=mobile?(30+at*.35)*S:Math.max(108*S,98);halo(CX,CY,coreR*(mobile?3.2:1.9),'#ffd166',.08+at/400);halo(CX,CY,coreR*(mobile?1.8:1.35),'#ffd166',.18+at/300);ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.fillStyle='#000c1f';ctx.fill();ctx.strokeStyle='rgba(255,209,102,'+(.35+at/200)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.stroke();
if(mobile){text('MASS TIMBER',CX,CY-6*S,Math.max(7.5,9*S),'#ffd166','center','middle','600');text('INDUSTRY',CX,CY+6*S,Math.max(7.5,9*S),'#ffd166','center','middle','600')}
else{var ts=Math.max(9.5,12*S),ls=Math.max(8.5,10.5*S);var u=coreR/108;text('MASS TIMBER',CX,CY-46*u,ts,'#ffd166','center','middle','700');text('INDUSTRY',CX,CY-28*u,ts,'#ffd166','center','middle','700');['Rivalries / Collaborations','Concentrations / Econ. Trends'].forEach(function(l,i){text(l,CX,CY+2*u+i*20*u,ls,'#e6f6ff')});text(lvl(F.core).toUpperCase()+' · rivalry',CX,CY+50*u,Math.max(8,9.5*S),'#ffe9a8','center','middle','600')}
IND.forEach(function(o){var an=o.a+tt*0.0002,cs=Math.cos(an),sn=Math.sin(an);o.x=CX+cs*coreR;o.y=CY+sn*coreR;ctx.beginPath();ctx.arc(o.x,o.y,(hover===o?7:5)*S+1,0,Math.PI*2);ctx.fillStyle='#ffd166';ctx.shadowColor='#ffd166';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;var gap=(mobile?9:13)*S+4;if(!mobile)text(o.label,o.x+cs*gap,o.y+sn*gap,Math.max(9,(mobile?9:12)*S),'#ffe9a8',cs>.35?'left':cs<-.35?'right':'center',sn>.35?'top':sn<-.35?'bottom':'middle')});
[['sub','Substitutes','Traditional means · concrete & steel',-1],['ent','New entrants','Firms able to join the chain',1]].forEach(function(b){var a=A[b[0]],pw=F[b[0]]/100,R=(14+pw*22)*S;halo(a.x,a.y,R*2.6,cols[b[0]],.12+pw*.25);ctx.beginPath();ctx.arc(a.x,a.y,R*.55,0,Math.PI*2);ctx.fillStyle=cols[b[0]];ctx.shadowColor=cols[b[0]];ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;var up=a.y<CY,ty=up?a.y-R*.55-(mobile?28:36)*S:a.y+R*.55+(mobile?20:26)*S,lx=Math.max(mobile?70:150,Math.min(W-(mobile?70:150),a.x));text(b[1].toUpperCase(),lx,ty,Math.max(11,(mobile?15:20)*S),'#fff','center','middle','600');text((mobile?'':b[2]+' · ')+lvl(F[b[0]]).toUpperCase(),lx,ty+(mobile?16:23)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff')});
var byC={producers:[],fiber:[],inputs:[],demand:[]};objs.forEach(function(o){o.a+=0.0002*(o.side===-1?-1:1);var p=pos(o.a,o.r,o.side);o.x=p.x;o.y=p.y;byC[o.cid].push(p)});
function bubble(pts,col,pw){if(!pts.length)return null;var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;pts.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);mxy=Math.max(mxy,p.y)});var cx=(mnx+mxx)/2,cy=(mny+mxy)/2,rx=Math.max((mxx-mnx)/2+26*S,24*S),ry=Math.max((mxy-mny)/2+20*S,18*S);ctx.save();ctx.globalAlpha=.1+pw*.12;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();return{cx:cx,cy:cy,rx:rx,ry:ry}}
var ps=F.sup/100,pd=F.dem/100;bubble(byC.producers,cols.sup,ps);bubble(byC.fiber,cols.sup,ps);bubble(byC.inputs,cols.sup,ps);var bd=bubble(byC.demand,cols.dem,pd);
var supAll=byC.producers.concat(byC.fiber,byC.inputs),mnx=1e9,mxx=-1e9,mny=1e9;supAll.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y)});
A.sup={x:(mnx+mxx)/2,y:(mny+CY)/2};
text('SUPPLY',(mnx+mxx)/2,mny-(mobile?50:64)*S,Math.max(12,(mobile?17:28)*S),'#90D5FF','center','bottom','600');text(lvl(F.sup).toUpperCase()+(mobile?'':' · suppliers\' power'),(mnx+mxx)/2,mny-(mobile?36:42)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff','center','bottom');
if(bd){A.dem={x:bd.cx,y:bd.cy};if(mobile){text('DEMAND',bd.cx,bd.cy-bd.ry-18*S,Math.max(12,17*S),'#88E788','center','bottom','600');text(lvl(F.dem).toUpperCase(),bd.cx,bd.cy-bd.ry-4*S,Math.max(9,10*S),'#cfe6ff','center','bottom')}else{text('DEMAND',bd.cx+bd.rx+16*S,bd.cy-10*S,Math.max(12,28*S),'#88E788','left','middle','600');text(lvl(F.dem).toUpperCase()+' · buyers\' power',bd.cx+bd.rx+16*S,bd.cy+12*S,Math.max(9,12*S),'#cfe6ff','left','middle')}if(mobile)text('All end users',bd.cx,bd.cy+bd.ry+8*S,Math.max(9.5,12.5*S),'#e6f6ff','center','top','600');else text('The constellation of all end users (TAM)',Math.max(bd.cx-bd.rx,CX+coreR+14),bd.cy+bd.ry+10*S,Math.max(9.5,12.5*S),'#e6f6ff','left','top','600')}
objs.forEach(function(o){var c=o.side===1?cols.dem:cols.sup;ctx.beginPath();ctx.arc(o.x,o.y,(hover===o?7:5)*S+1,0,Math.PI*2);ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;text(o.label,o.x,o.y-8*S-4,Math.max(9,(mobile?9:12)*S),'#e6f6ff','center','bottom')});
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function near(x,y){var best=null,bd=18*S+6;objs.concat(IND).forEach(function(o){var d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=o}});return best}
function showTip(o,x,y){if(!o){tip.style.display='none';return}tip.innerHTML='<b>'+o.label+'</b>'+(D.nodes[o.label]||'');tip.style.display='block';var r=stage.getBoundingClientRect(),tx=Math.min(Math.max(x+14,8),r.width-270),ty=Math.min(Math.max(y+14,8),r.height-90);tip.style.left=tx+'px';tip.style.top=ty+'px'}
stage.addEventListener('mousemove',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;hover=near(x,y);stage.style.cursor=hover?'pointer':'default';showTip(hover,x,y)});
stage.addEventListener('mouseleave',function(){hover=null;tip.style.display='none'});
stage.addEventListener('click',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;showTip(near(x,y),x,y)});

/* ---------- parts (A/B/C) ---------- */
var PARTS=['learn','baseline','test'],slots={baseline:document.getElementById('slot-b')};
function show(part){PARTS.forEach(function(p){document.getElementById('part-'+p).classList.toggle('on',p===part)});document.querySelectorAll('.seg button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-part')===part)});
 if(slots[part]){map.hidden=false;slots[part].appendChild(map)}else{map.hidden=true}
 resize();if(part==='test'&&window.MTU_RADAR)window.MTU_RADAR();if(location.hash.replace('#','')!==part){try{history.replaceState(null,'',location.pathname+location.search+'#'+part)}catch(e){}}
 var seg=document.querySelector('.seg');if(seg&&window.scrollY>segTop())window.scrollTo({top:segTop(),behavior:'auto'})}
function segTop(){var seg=document.querySelector('.seg'),nav=document.querySelector('.site-nav');return seg.getBoundingClientRect().top+window.scrollY-(nav?nav.offsetHeight:0)-4}
document.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-part'))})});
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-go'));window.scrollTo({top:segTop(),behavior:'auto'})})});
window.addEventListener('hashchange',function(){var h=location.hash.replace('#','');if(PARTS.indexOf(h)>=0)show(h)});

/* ---------- A: who is in each force ---------- */
(function(){var box=document.getElementById('who-text'),ttl=document.getElementById('who-title');if(!box)return;var by={};D.forces.forEach(function(f){by[f.id]=f});
 var nodes=document.querySelectorAll('.diagram [data-k]');
 function pick(k){var f=by[k];if(!f)return;ttl.textContent=f.full+': who is in it';box.textContent=f.who;nodes.forEach(function(n){n.classList.toggle('on',n.getAttribute('data-k')===k)})}
 nodes.forEach(function(n){var k=n.getAttribute('data-k');n.addEventListener('mouseenter',function(){pick(k)});n.addEventListener('focus',function(){pick(k)});n.addEventListener('click',function(){pick(k)})})})();
/* ---------- B: baseline cards ---------- */
var bForces=document.getElementById('b-forces'),bl=document.getElementById('b-plbl'),bt=document.getElementById('b-ptitle'),bb=document.getElementById('b-pbody'),cards={};
D.forces.forEach(function(f){var b=document.createElement('button');b.className='fcard';b.type='button';b.innerHTML='<small>'+f.sub+'</small><strong>'+f.full+'</strong><div class="bar"><i style="width:'+f.level+'%"></i></div><em>Power: <b>'+lvl(f.level)+'</b> ('+f.level+')</em>';b.onclick=function(){D.forces.forEach(function(x){cards[x.id].classList.toggle('on',x.id===f.id)});bl.textContent=f.sub;bt.textContent=f.full+' — baseline assessment';bb.innerHTML=f.desc};bForces.appendChild(b);cards[f.id]=b});

/* ---------- C: scenarios ----------
   Choosing a scenario applies its proposed shifts; the reader can then tune each shift.
   The radar shows the scenario's shape over the shaded baseline. Part B's map stays at the baseline. */
var groups=document.getElementById('c-groups'),read=document.getElementById('c-read'),slEl=document.getElementById('c-sliders'),presetBtn=document.getElementById('c-preset'),resetBtn=document.getElementById('c-reset'),radarBox=document.getElementById('slot-c'),sliders={},chips=[],sel=[],shift={},now={},goal={};
function attOf(get){var v=D.forces.map(function(f){return get(f.id)}),m=Math.max.apply(null,v),t=v.reduce(function(a,b){return a+b},0);return 100-(m*.5+(t-m)*.125)}
var base=Math.round(attOf(function(id){return D.forces.filter(function(f){return f.id===id})[0].level}));
(function(){var m=document.getElementById('meter');if(m){m.style.width=base+'%';document.getElementById('attr').textContent=base+' · '+(base<30?'Low':base<45?'Moderate–low':base<60?'Moderate':'High')}})();
var COL={dem:'#3f8f5a',sup:'#3a7ca5',sub:'#c9772e',ent:'#8a63b8',core:'#a67c3d'},ORD=['sub','dem','ent','sup','core'],byId={};
D.forces.forEach(function(f){byId[f.id]=f;shift[f.id]=0;now[f.id]=f.level;goal[f.id]=f.level});
function sign(v){return (v>0?'+':v<0?'−':'')+Math.abs(v)}
function tcase(s){return s.charAt(0)+s.slice(1).toLowerCase()}
/* radar */
var NS='http://www.w3.org/2000/svg',rd=null;
function svgEl(p,t,a,txt){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;p.appendChild(e);return e}
function buildRadar(){var w=radarBox.getBoundingClientRect().width;if(!w)return;var small=w<560;if(rd&&rd.small===small)return;radarBox.innerHTML='';
 var VW=small?470:760,VH=small?410:430,cx=VW/2,cy=small?218:226,R=small?104:158,fs=small?15:15,ss=small?12.5:12.5;
 var svg=svgEl(radarBox,'svg',{viewBox:'0 0 '+VW+' '+VH,role:'img','aria-label':'Radar chart: the scenario shape of the five forces over the shaded baseline'});
 function pt(i,v,rr){var a=-Math.PI/2+i*2*Math.PI/5,r=(rr||R)*v/100;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]}
 [25,50,75,100].forEach(function(g){svgEl(svg,'polygon',{points:ORD.map(function(_,i){return pt(i,g).join(',')}).join(' '),fill:'none',stroke:'#e2ded6','stroke-width':g===100?1.5:1})});
 ORD.forEach(function(_,i){var p=pt(i,100);svgEl(svg,'line',{x1:cx,y1:cy,x2:p[0],y2:p[1],stroke:'#e2ded6'})});
 svgEl(svg,'polygon',{points:ORD.map(function(id,i){return pt(i,byId[id].level).join(',')}).join(' '),fill:'#1a1a18','fill-opacity':.10,stroke:'#8a8578','stroke-width':1.2,'stroke-dasharray':'5 4'});
 var poly=svgEl(svg,'polygon',{fill:'#a67c3d','fill-opacity':.2,stroke:'#a67c3d','stroke-width':2.5,'stroke-linejoin':'round'}),o={};
 function cg(get){var x=0,y=0;ORD.forEach(function(id,i){var p=pt(i,get(id));x+=p[0];y+=p[1]});return [x/5,y/5]}
 var df=svgEl(svg,'defs',{}),mk=svgEl(df,'marker',{id:'gar',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:small?5:5.5,markerHeight:small?5:5.5,orient:'auto-start-reverse'});svgEl(mk,'path',{d:'M0 0L10 5L0 10z',fill:'#1a1a18'});var g0=cg(function(id){return byId[id].level}),gline=svgEl(svg,'line',{x1:g0[0],y1:g0[1],x2:g0[0],y2:g0[1],stroke:'#1a1a18','stroke-width':3,'stroke-linecap':'butt'});
 svgEl(svg,'circle',{cx:g0[0],cy:g0[1],r:small?6:7,fill:'#fff',stroke:'#1a1a18','stroke-width':1.5,'stroke-dasharray':'3 2'});
 var gdot=svgEl(svg,'circle',{cx:g0[0],cy:g0[1],r:small?5:6,fill:'#1a1a18',stroke:'#fff','stroke-width':2});
 ORD.forEach(function(id,i){var p=pt(i,100,R+(small?16:22)),anc=Math.abs(p[0]-cx)<8?'middle':p[0]>cx?'start':'end',up=p[1]<cy-R*.5,ly=up?p[1]-18:p[1]+(Math.abs(p[1]-cy)<R*.5?-6:8);
  var nm=byId[id].name;svgEl(svg,'text',{x:p[0],y:ly,'text-anchor':anc,'font-size':fs,'font-weight':600,fill:'#1a1a18'},nm);
  o[id]={dot:svgEl(svg,'circle',{r:small?5:6,fill:COL[id],stroke:'#fff','stroke-width':2}),lab:svgEl(svg,'text',{x:p[0],y:ly+ss+5,'text-anchor':anc,'font-size':ss,'font-weight':600,fill:COL[id]})}});
 svgEl(svg,'text',{x:small?10:16,y:small?18:26,'font-size':small?10:11,'letter-spacing':1.5,'font-weight':600,fill:'#666460'},'ATTRACTIVENESS');
 var an=svgEl(svg,'text',{x:small?10:16,y:small?44:56,'font-size':small?24:28,'font-weight':700,fill:'#1a1a18'}),ad=svgEl(svg,'text',{x:small?10:16,y:small?62:76,'font-size':small?11:12,fill:'#666460'});
 var lf=small?10.5:11.5,lx=VW-(small?222:250),ly=small?16:24;
 svgEl(svg,'rect',{x:lx,y:ly-9,width:14,height:10,fill:'#1a1a18','fill-opacity':.10,stroke:'#8a8578','stroke-dasharray':'3 2'});svgEl(svg,'text',{x:lx+20,y:ly,'font-size':lf,fill:'#666460'},'shaded shape = baseline');
 svgEl(svg,'line',{x1:lx-2,y1:ly+14,x2:lx+14,y2:ly+14,stroke:'#1a1a18','stroke-width':3,'marker-end':'url(#gar)'});svgEl(svg,'text',{x:lx+20,y:ly+18,'font-size':lf,fill:'#666460'},'arrow = net shift in power');
 svgEl(svg,'text',{x:lx+20,y:ly+18+lf+3,'font-size':lf,fill:'#666460'},'(ring = baseline; shift shown ×3)');
 rd={small:small,poly:poly,o:o,pt:pt,an:an,ad:ad,cg:cg,g0:g0,gdot:gdot,gline:gline};drawRadar()}
function drawRadar(){if(!rd)return;var g=rd.cg(function(id){return now[id]});g=[rd.g0[0]+(g[0]-rd.g0[0])*3,rd.g0[1]+(g[1]-rd.g0[1])*3];rd.gdot.setAttribute('cx',g[0]);rd.gdot.setAttribute('cy',g[1]);rd.gline.setAttribute('x2',g[0]);rd.gline.setAttribute('y2',g[1]);var far=Math.hypot(g[0]-rd.g0[0],g[1]-rd.g0[1])>7;rd.gdot.style.display=far?'none':'';if(far)rd.gline.setAttribute('marker-end','url(#gar)');else rd.gline.removeAttribute('marker-end');rd.poly.setAttribute('points',ORD.map(function(id,i){return rd.pt(i,now[id]).join(',')}).join(' '));
 ORD.forEach(function(id,i){var p=rd.pt(i,now[id]),v=Math.round(now[id]),d=Math.round(goal[id])-byId[id].level;rd.o[id].dot.setAttribute('cx',p[0]);rd.o[id].dot.setAttribute('cy',p[1]);rd.o[id].lab.textContent=tcase(lvl(v))+' · '+v+(d?' ('+sign(d)+')':'')});
 var at=Math.round(attOf(function(id){return now[id]})),gd=Math.round(attOf(function(id){return goal[id]}))-base;rd.an.textContent=at;rd.ad.textContent=gd?sign(gd)+' vs. baseline of '+base:'baseline';drawInf()}
/* influence bar: the strongest force is awarded half; the other four share the rest in proportion to their strength */
var infBox=document.getElementById('c-inf');
function drawInf(){if(!infBox)return;var fs=D.forces.map(function(f){return {f:f,v:now[f.id]}}).sort(function(a,b){return b.v-a.v}),top=fs[0],rest=fs.slice(1),rs=rest.reduce(function(t,x){return t+x.v},0)||1;
 var h='<p class="inf-cap"><b>Share of influence on attractiveness.</b> The strongest force, <b>'+top.f.full+'</b>, is awarded half; the other four share the rest in proportion to their strength.</p><div class="inf-bar">';
 [{x:top,w:50}].concat(rest.map(function(x){return {x:x,w:50*x.v/rs}})).forEach(function(s,i){h+='<div class="inf-seg'+(i?'':' top')+'" style="width:'+s.w.toFixed(2)+'%;background:'+COL[s.x.f.id]+'"><span>'+s.x.f.name+'</span><small>'+Math.round(s.w)+'%</small></div>'});
 infBox.innerHTML=h+'</div>'}
var anim=0;function tick(){var moving=false;ORD.forEach(function(id){var d=goal[id]-now[id];if(Math.abs(d)>.3){now[id]+=d*.14;moving=true}else now[id]=goal[id]});drawRadar();anim=moving?requestAnimationFrame(tick):0}
window.MTU_RADAR=buildRadar;window.addEventListener('resize',function(){if(radarBox.offsetParent)buildRadar()},{passive:true});
/* controls */
D.scenarios.forEach(function(s){var c=document.createElement('button');c.type='button';c.className='chip';c.textContent=s.t;c.setAttribute('aria-pressed','false');c.onclick=function(){toggle(s,c)};groups.appendChild(c);chips.push(c)});
D.forces.forEach(function(f){
 var row=document.createElement('div');row.className='sl';row.innerHTML='<label for="s-'+f.id+'">'+f.full+'</label><input id="s-'+f.id+'" type="range" min="-100" max="100" step="5" value="0"><span></span>';slEl.appendChild(row);
 var inp=row.querySelector('input');sliders[f.id]={inp:inp,out:row.querySelector('span')};
 inp.oninput=function(){shift[f.id]=+inp.value;refresh()}});
function combined(){var d={};sel.forEach(function(s){for(var k in s.d)d[k]=(d[k]||0)+s.d[k]});return d}
function refresh(){var tuned=false,pre=combined();
 D.forces.forEach(function(f){goal[f.id]=Math.max(0,Math.min(100,f.level+shift[f.id]));sliders[f.id].inp.value=shift[f.id];sliders[f.id].out.innerHTML='<b>'+sign(shift[f.id])+'</b> → '+goal[f.id];if(sel.length&&shift[f.id]!==(pre[f.id]||0))tuned=true});
 presetBtn.hidden=!(sel.length&&tuned);resetBtn.hidden=!sel.length;if(!anim)anim=requestAnimationFrame(tick)}
function setShifts(d){D.forces.forEach(function(f){shift[f.id]=Math.max(-100,Math.min(100,(d&&d[f.id])||0))})}
function shiftsText(d){return D.forces.filter(function(f){return d[f.id]}).map(function(f){return '<b>'+f.name+'</b> '+sign(d[f.id])}).join(' · ')||'none'}
function render(){if(!sel.length){read.className='read';read.innerHTML='';slEl.hidden=true;return}
 var h='';if(sel.length>1)h+='<p class="lbl">'+sel.length+' scenarios combined</p><p class="delta combined">Combined proposed shifts from baseline: '+shiftsText(combined())+'</p>';
 sel.forEach(function(s){h+='<div class="scn"><p class="lbl">Scenario</p><h4>'+s.t+'</h4><p class="inshort">'+s.s+'</p><p class="delta">Proposed shifts from baseline: '+shiftsText(s.d)+'</p><p>'+s.m+'</p></div>'});
 read.innerHTML=h;read.className='read show';slEl.hidden=false}
function toggle(s,chip){var i=sel.indexOf(s);if(i>=0){sel.splice(i,1);chip.classList.remove('on');chip.setAttribute('aria-pressed','false')}else{sel.push(s);chip.classList.add('on');chip.setAttribute('aria-pressed','true')}
 setShifts(combined());render();refresh()}
presetBtn.onclick=function(){setShifts(combined());refresh()};
resetBtn.onclick=function(){sel=[];setShifts(null);chips.forEach(function(c){c.classList.remove('on');c.setAttribute('aria-pressed','false')});render();refresh()};
refresh();
var h=location.hash.replace('#','');show(PARTS.indexOf(h)>=0?h:'learn');
})();
