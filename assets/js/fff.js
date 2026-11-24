(function(){
var R=[
["Financial accounting","Reading the firm's statements as a lender or investor would",
 "Statements are prepared once a year, mainly for tax.",
 "Monthly statements are produced and the leaders read them.",
 "Timely statements an outsider can rely on, reviewed or audited, and leaders can explain every large variance."],
["Finance","Valuing an investment and choosing how to fund it",
 "Investments are decided by instinct or simple payback.",
 "Cash flows are forecast for major investments before committing.",
 "Leaders know the firm's cost of capital, can value the firm or a project, and can explain its mix of debt and equity."],
["Data and decisions","Forecasting cash and testing what could go wrong",
 "There is no written forecast.",
 "An annual budget is set and compared with results.",
 "A rolling twelve-month cash forecast is kept, with scenarios for a slow year and a lost customer."],
["Economics of the business","Costs, pricing and competition",
 "Prices are set at cost plus a margin.",
 "Margins are known by product, project or customer.",
 "Prices reflect the value delivered, and leaders can state where the firm stands against concrete, steel and rival producers."],
["Marketing","Knowing who the end users are and what they value",
 "The firm sells to whoever calls.",
 "Customer groups are defined and tracked.",
 "There is evidence of what occupants, owners and public bodies value and will pay for, and the offer is built on it."],
["Operations","Capacity, throughput and unit cost",
 "Capacity and utilization are not measured.",
 "Utilization, lead times and unit costs are tracked.",
 "Leaders can show how new capital changes throughput, unit cost and delivery, with the numbers behind it."],
["Strategy","Where the firm competes and why it wins",
 "There is no written plan.",
 "A plan exists and is reviewed from time to time.",
 "The plan states where the firm competes and why it wins, and has been tested against the industry's five forces."],
["Strategy beyond markets","Codes, policy, public funders and the community",
 "The firm reacts to rules and programs as they arrive.",
 "Someone follows code changes, incentives and public programs.",
 "The firm has working relationships with regulators, agencies and public funders, and plans around them."],
["Organization and leadership","Who decides, and how the team performs",
 "The owner decides everything.",
 "A management team shares decisions and meets on a schedule.",
 "Decision rights are written down, a board or advisers test them, and the firm is ready to work with outside governance."],
["Capital strategy","What the firm will give in exchange for capital",
 "Leaders have not considered what they would give up.",
 "Leaders know which of the six channels fits the next need.",
 "Leaders have decided how much cash flow, asset value and governance they will share, with whom, and who will carry the conversation."]
];
var L=["Not yet","Developing","Fit"],box=document.getElementById('rub'),out=document.getElementById('rub-out');if(!box)return;
var sc=R.map(function(){return 0});
R.forEach(function(r,i){var row=document.createElement('div');row.className='rub-row';
 var hd=document.createElement('div');hd.className='rub-head';hd.innerHTML='<b>'+(i+1)+'. '+r[0]+'</b><span>'+r[1]+'</span>';row.appendChild(hd);
 var op=document.createElement('div');op.className='rub-opts';op.setAttribute('role','group');op.setAttribute('aria-label',r[0]);
 [0,1,2].forEach(function(k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed','false');b.innerHTML='<i>'+(k+1)+' · '+L[k]+'</i>'+r[2+k];
  b.addEventListener('click',function(){sc[i]=(sc[i]===k+1)?0:k+1;op.querySelectorAll('button').forEach(function(x,n){x.setAttribute('aria-pressed',String(sc[i]===n+1))});draw()});op.appendChild(b)});
 row.appendChild(op);box.appendChild(row)});
function draw(){var done=sc.filter(function(v){return v>0}).length,tot=sc.reduce(function(a,b){return a+b},0);
 if(!done){out.innerHTML='<b>Your result appears here.</b> Score each of the ten fundamentals to see where the firm is fit and where to start.';return}
 var low=[];sc.forEach(function(v,i){if(v===1)low.push(R[i][0])});var mid=[];sc.forEach(function(v,i){if(v===2)mid.push(R[i][0])});
 var s='<span class="big">'+tot+'</span><b>of '+(done*3)+'</b> across '+done+' of 10 fundamentals scored.';
 if(done===10){s+=' '+(tot>=26?'The firm is close to fit: it can hold a serious conversation in most channels.':tot>=18?'The firm is developing: it can approach familiar lenders, and has work to do before larger or newer pools.':'The firm is at the start: build the basics before approaching new capital.')}
 if(low.length)s+='<ul><li><b>Start here:</b> '+low.join(', ')+'.</li>'+(mid.length?'<li><b>Then strengthen:</b> '+mid.join(', ')+'.</li>':'')+'</ul>';
 else if(mid.length)s+='<ul><li><b>Strengthen:</b> '+mid.join(', ')+'.</li></ul>';
 s+='<br><button type="button" id="rub-reset">Clear</button>';out.innerHTML=s;
 document.getElementById('rub-reset').addEventListener('click',function(){sc=sc.map(function(){return 0});box.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});draw()})}
draw();
})();
