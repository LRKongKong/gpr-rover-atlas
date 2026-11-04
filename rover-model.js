window.RoverIllustration = (() => {
const records=window.RoverData.records;
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=n=>'var(--'+n+')';
let state={view:'car',pitch:.84,component:'',turn:0},bp=[1,.04,-.08,.9],scaleForText=1,portMap={},centres={},bounds={},active=[];
const fmt=n=>Number(n).toFixed(2);
const xy=(x,y,z=0)=>[x*bp[0]+y*bp[2],x*bp[1]+y*bp[3]-z*(state.view==='car'?Math.sqrt(1-state.pitch*state.pitch):1)];
const points=arr=>arr.map(p=>p.map(fmt).join(',')).join(' ');
function polygon(p,fill,stroke='black-side',opacity=1){return '<polygon points="'+points(p)+'" fill="'+C(fill)+'" stroke="'+C(stroke)+'" stroke-width=".8" opacity="'+opacity+'"/>';}
function box(x,y,z,w,d,h,top='metal',side='metal-side',front='metal-dark'){
 const p=(a,b,c)=>xy(a,b,c);
 return polygon([p(x,y+d,z),p(x+w,y+d,z),p(x+w,y+d,z+h),p(x,y+d,z+h)],front)+polygon([p(x+w,y,z),p(x+w,y+d,z),p(x+w,y+d,z+h),p(x+w,y,z+h)],side)+polygon([p(x,y,z+h),p(x+w,y,z+h),p(x+w,y+d,z+h),p(x,y+d,z+h)],top);
}
function line(a,b,color='metal-dark',width=2){return '<path d="M '+a.join(' ')+' L '+b.join(' ')+'" fill="none" stroke="'+C(color)+'" stroke-width="'+width+'" stroke-linecap="round"/>';}
function ellipse(x,y,z,r,fill,stroke='black-side'){
 const a=Array.from({length:33},(_,i)=>xy(x+Math.cos(i*Math.PI/16)*r,y+Math.sin(i*Math.PI/16)*r,z));return polygon(a,fill,stroke);
}
function cylinder(x,y,z,r,h,top='metal-light',side='metal-side'){
 const a=Array.from({length:33},(_,i)=>xy(x+Math.cos(i*Math.PI/16)*r,y+Math.sin(i*Math.PI/16)*r,z+h));
 const b=Array.from({length:17},(_,i)=>xy(x+Math.cos(i*Math.PI/16)*r,y+Math.sin(i*Math.PI/16)*r,z));
 const t=Array.from({length:17},(_,i)=>xy(x+Math.cos((16-i)*Math.PI/16)*r,y+Math.sin((16-i)*Math.PI/16)*r,z+h));
 return polygon(b.concat(t),side)+polygon(a,top);
}
function planeText(x,y,z,text,size=12,color='silk'){
 if(['BCM','ATMEGA328P','POWER','ANALOG IN','B','3.3VDC','36V / MOTOR CTRL','Li-ion','36–72V → 12V','HALL × 6'].includes(text))return '';
 const p=xy(x,y,z);return '<text transform="matrix('+bp[0]+' '+bp[1]+' '+bp[2]+' '+bp[3]+' '+p[0]+' '+p[1]+')" font-size="'+size+'" fill="'+C(color)+'" font-weight="500">'+E(text)+'</text>';
}
function screw(x,y,z,r=4){const p=xy(x,y,z);return ellipse(x,y,z,r,'gold')+'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r*.44+'" fill="'+C('black')+'"/>';}
function resistor(x,y,z,w=38){let s=line(xy(x-9,y,z+4),xy(x+w+9,y,z+4),'metal-side',2);s+=box(x,y-3,z,w,7,7,'gold','gold','gold');for(const [i,c]of [[.18,'throttle'],[.34,'black'],[.51,'redpcb'],[.82,'metal-light']])s+=box(x+w*i,y-3,z+6,w*.06,7,1,c,c,c);return s;}
function model(id,kind,x,y,s=1){
 let content='',ports={},w=140,d=95;
 const P=(n,a,b,z=12,label=true)=>{
  ports[n]=xy(a,b,z);content+=cylinder(a,b,z-2,2.6,2,'gold','metal-dark');
  if(label&&(state.view==='pins'&&id==='uno'))content+=planeText(a-3,b+12,z,n,8/s/scaleForText,'silk');
 };
 const header=(names,px,py,pitch=12)=>{content+=box(px-5,py-5,3,names.length*pitch+2,10,9,'black','black-side','black-light');names.forEach((n,i)=>P(n,px+i*pitch,py,12));};
 const term=(name,tx,ty,fill='bluebox')=>{content+=box(tx-5,ty-7,3,12,14,12,fill,'blue-side','blue-side');content+=screw(tx,ty,16,2.8);P(name,tx,ty,17,false);};
 const board=(bw,bd,color='pcb',side='pcb-side')=>{w=bw;d=bd;content+=box(0,0,0,w,d,3,color,side,side);for(const [a,b]of [[7,7],[w-7,7],[7,d-7],[w-7,d-7]])content+=screw(a,b,3,3.7);};
 if(kind==='uno'){
  board(320,205);
  header(['SCL','SDA','AREF','GND-T','D13','D12','D11','D10','D9','D8'],64,11,12);
  header(['D7','D6','D5','D4','D3','D2','D1','D0'],193,11,12);
  header(['NC','IOREF','RESET','3.3V','5V','GND','GND-2','VIN'],65,192,12);
  header(['A0','A1','A2','A3','A4','A5'],199,192,12);
  content+=box(-12,29,3,49,50,31,'metal-light','metal-side','metal');
  content+=box(-13,35,9,4,36,17,'black-side','black-side','black');
  content+=box(2,139,3,37,31,28,'black','black-side','black-light');
  content+=cylinder(23,174,5,9,13,'black-light','black');
  content+=cylinder(48,160,4,8,16,'metal-light','black');
  content+=cylinder(70,161,4,8,16,'metal-light','black');
  content+=box(154,122,4,127,31,13,'black-light','black','black-side');
  for(let i=0;i<14;i++){content+=box(158+i*8.4,117,4,3.5,5,5,'metal-light','metal-side','metal-dark');content+=box(158+i*8.4,154,4,3.5,5,5,'metal-light','metal-side','metal-dark');}
  content+=planeText(170,143,18,'ATMEGA328P',10,'silk');
  content+=box(58,47,4,27,25,7,'black','black-side','black-side');
  content+=box(92,91,4,40,12,6,'metal-light','metal-side','metal-dark');
  content+=box(42,15,4,10,10,6,'redpcb','redpcb-side','redpcb-side');
  for(let i=0;i<20;i++)content+=box(85+(i%7)*9,39+Math.floor(i/7)*12,3,4,5,2,i%3?'metal-light':'black','metal-side','black-side');
  for(let i=0;i<6;i++)content+=box(288+(i%2)*8,72+Math.floor(i/2)*9,3,4,4,10,'gold','black','black-side');
  content+=planeText(160,91,4,'ARDUINO',19,'silk')+planeText(221,111,4,'UNO',19,'silk')+planeText(146,185,4,'POWER',8,'silk')+planeText(198,178,4,'ANALOG IN',8,'silk');
  P('USB',-12,52,25,false);
 }else if(kind==='pi'){
  board(218,145,'pi','pi-side');
  content+=box(78,45,3,43,43,8,'black','black-side','black-light')+planeText(84,70,12,'BCM',10,'silk');
  for(let j=0;j<2;j++){content+=box(171,9+j*43,3,51,36,34,'metal-light','metal-side','metal');content+=box(214,13+j*43,8,8,27,9,'black','black-side','black');content+=box(214,13+j*43,23,8,27,9,'black','black-side','black');}
  content+=box(169,99,3,54,42,36,'metal-light','metal-side','metal')+box(217,107,8,7,25,22,'black','black-side','black');
  content+=box(8,8,3,137,12,8,'black','black-side','black');
  for(let i=0;i<20;i++)for(let j=0;j<2;j++)content+=box(12+i*6.5,10+j*5,10,2.5,2.5,8,'gold','metal-side','black');
  content+=box(35,125,3,36,21,11,'metal-light','metal-side','metal');
  content+=box(-4,108,3,19,15,7,'metal-light','metal-side','metal');
  for(let i=0;i<16;i++)content+=box(17+(i%6)*19,37+Math.floor(i/6)*19,3,7,6,2,i%2?'metal-light':'black','metal-side','black');
  content+=planeText(62,117,4,'Raspberry Pi 3B',16,'silk');P('USB',220,27,23,false);P('PWR',-3,114,9,false);
 }else if(kind==='l298'){
  board(155,120,'redpcb','redpcb-side');
  content+=box(49,15,3,71,48,44,'black-light','black','black-side');
  for(let i=0;i<8;i++)content+=box(51+i*9,15,47,3,48,6,'black-light','black-side','black');
  content+=cylinder(26,47,3,9,19,'metal-light','black');
  header(['ENA','IN1','IN2','IN3','IN4','ENB'],72,108,12);
  term('12V',13,85);term('GND',28,85);term('5V',43,85);
  term('OUT1',14,13);term('OUT2',29,13);term('OUT3',129,14);term('OUT4',144,14);
  content+=planeText(71,91,4,'L298N',13,'silk')+planeText(52,14,4,'B',9,'silk');
 }else if(kind==='sensor'){
  board(61,53,'pi','pi-side');content+=box(21,14,3,17,17,7,'black','black-side','black-side')+ellipse(29,23,20,9,'metal-light')+planeText(6,35,4,'AS5600',14,'silk');header(['VCC','OUT','GND'],12,48,17);
 }else if(kind==='relay'){
  board(145,78,'redpcb','redpcb-side');content+=box(46,13,3,63,53,40,'blue-top','bluebox','blue-side')+planeText(50,38,44,'RELAY',14,'silk')+planeText(50,53,44,'3.3VDC',8,'silk');header(['DC+','DC-','IN'],9,16,13);term('NO',125,12);term('COM',125,34);term('NC',125,57);content+=cylinder(30,56,3,3,3,'throttle','throttle');
 }else if(kind==='controller'){
  w=216;d=113;content+=box(0,0,0,w,d,38,'metal','metal-side','metal-dark');
  for(let i=0;i<12;i++)content+=box(8+i*17,1,38,4,111,4,'metal-light','metal-side','metal-dark');
  content+=box(56,27,42,112,45,1,'panel','metal-side','metal-dark')+planeText(64,45,44,id==='left'?'BLDC · LEFT':'BLDC · RIGHT',14,'ink')+planeText(64,62,44,'36V / MOTOR CTRL',8,'muted');
  ['P+','P-','THR','REV1','REV2','AUX+','AUX-'].forEach((n,i)=>P(n,13+i*27,113,20,false));
  for(let i=1;i<=3;i++)P('P'+i,215,18+i*21,20,false);
  for(let i=0;i<4;i++){const a=xy(15+i*21,0,9),b=xy(15+i*21,-20,7);content+=line(a,b,'ground',1.6)+box(10+i*21,-29,6,10,10,5,'metal-light','metal-side','metal-dark');}
 }else if(kind==='battery'){
  w=183;d=111;content+=box(0,0,0,w,d,67,'battery-top','battery','battery-side');
  for(let i=1;i<6;i++)content+=line(xy(i*30,0,67),xy(i*30,111,67),'battery',.7);
  content+=box(55,-1,67,17,113,2,'blue-side','blue-side','blue-side')+planeText(83,49,69,'36V',25,'silk')+planeText(82,70,69,'Li-ion',12,'silk');P('+',15,7,68,false);P('-',37,7,68,false);
 }else if(kind==='dc'){
  w=145;d=88;content+=box(0,0,0,w,d,32,'metal','metal-side','metal-dark');for(let i=0;i<8;i++)content+=box(4+i*18,0,32,3,87,4,'metal-light','metal-side','metal-dark');content+=box(32,18,36,84,45,1,'panel','metal-side','metal-dark')+planeText(38,35,38,'DC-DC',13,'ink')+planeText(38,52,38,'36–72V → 12V',9,'muted');P('VIN+',0,21,17,false);P('VIN-',0,60,17,false);P('OUT+',145,23,17,false);P('OUT-',145,62,17,false);
 }else if(kind==='bank'){
  w=152;d=76;content+=box(0,0,0,w,d,25,'metal-light','metal','metal-side')+planeText(28,38,26,'USB POWER',13,'muted');content+=box(143,13,7,10,27,10,'black','black','black-side');P('USB',151,26,13,false);
 }else if(kind==='hall'){
  // 170 holes: rows run along x; a–e and f–j are separate connected strips in each row.
  w=190;d=132;content+=box(0,0,0,w,d,12,'metal-light','metal','metal-side');
  const boardPlan=window.RoverData.evidence.hallBoard;
  const hole=name=>{const col='abcdefghij'.indexOf(name[0]),row=+name.slice(1);return [14+(row-1)*10,14+col*10+(col>=5?14:0)];};
  for(let row=1;row<=17;row++)for(const col of 'abcdefghij'){const p=xy(...hole(col+row),13);content+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.65" fill="'+C('metal-dark')+'"/>';}
  content+=box(7,60,12,176,9,1,'metal','metal-side','metal-side');
  // Jumpers stay on a–e; there is no fictional full-width 5V rail across the board.
  for(const [a,b]of boardPlan.jumpers){const aa=hole(a),bb=hole(b);content+=line(xy(...aa,17),xy(...bb,17),'power',2.2);}
  for(const c of boardPlan.channels){
   const aa=hole('d'+c.row),bb=hole('g'+c.row),xx=aa[0];
   content+=line(xy(...aa,17),xy(...bb,17),'metal-side',1.8)+box(xx-2.5,61,15,5,17,5,'gold','gold','gold');
   for(let j=0;j<3;j++)content+=box(xx-2.5,64+j*5,20,5,1.5,1,j===1?'black':'redpcb','black','black');
   const h=hole('h'+c.row),i=hole('i'+c.row);P(c.channel+'-in',...h,15,false);P(c.channel+'-out',...i,15,false);ports[c.channel]=xy(...i,15);
  }
  P('5V',...hole('a1'),15,false);P('GND',...hole('f1'),15,false);
  for(const name of ['b1','c1','g1','h1']){const p=xy(...hole(name),15);content+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.4" fill="'+C(name[0]<'f'?'power':'ground')+'"/>';}
 }else if(kind==='motor'){
  w=100;d=100;content+=box(3,5,0,95,88,21,'metal','metal-side','metal-dark')+cylinder(52,47,21,27,68,'metal-light','metal-side')+cylinder(52,47,89,13,10,'metal','black-light')+box(33,40,99,38,14,5,'black','black-side','black-side')+screw(52,47,105,5);P('M1',35,48,88,false);P('M2',70,48,88,false);
 }else if(kind==='wheel'){
  w=85;d=90;content+=cylinder(43,47,0,43,27,'black-light','black-side')+cylinder(43,47,27,28,2,'black','black-side')+cylinder(43,47,29,10,7,'metal','metal-dark');
  for(let i=0;i<16;i++){const a=i*Math.PI/8;content+=line(xy(43+Math.cos(a)*35,47+Math.sin(a)*35,29),xy(43+Math.cos(a+.04)*42,47+Math.sin(a+.04)*42,28),'metal-dark',2);}
  ['P1','P2','P3','VCC','GND','HU','HV','HW'].forEach((n,i)=>P(n,12+i*9,91,13,false));
 }else if(kind==='r1'||kind==='r2'||kind==='ren'){
  w=65;d=12;content+=resistor(12,7,0,39);P('A',0,7,4,false);P('B',65,7,4,false);content+=planeText(14,-4,5,kind==='r1'?'1kΩ':'10kΩ',18/scaleForText/s,'ink');
 }else if(kind==='cap'){
  w=35;d=36;content+=cylinder(17,17,7,16,38,'metal-light','black')+planeText(5,17,46,'10µF',8,'ink');P('+',6,31,3,false);P('-',28,31,3,false);content+=planeText(0,51,2,'+     −',16/scaleForText/s,'ink');
 }else if(kind==='switch'){
  w=48;d=32;content+=box(0,0,0,w,d,19,'black','black-side','black-side')+box(5,3,19,38,23,3,'redpcb','redpcb-side','redpcb-side');P('IN',0,16,8,false);P('OUT',48,16,8,false);
 }else{
  w=30;d=20;content+=cylinder(15,10,0,5,8,kind==='ground'?'ground':'gold','metal-side');P(kind==='junction'?'J':kind==='source'?'5V':'G',15,10,8,false);
 }
 const heights={uno:35,pi:42,l298:60,sensor:24,relay:48,controller:46,battery:72,dc:40,bank:29,hall:24,motor:108,wheel:40,r1:13,r2:13,ren:13,cap:52,switch:24};
 const hh=heights[kind]||14,corners=[xy(-16,-31,hh),xy(w+12,-31,hh),xy(w+12,d+15,0),xy(-16,d+15,0)];
 const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);bounds[id]={id,x:x+Math.min(...xs)*s,y:y+Math.min(...ys)*s,w:(Math.max(...xs)-Math.min(...xs))*s,h:(Math.max(...ys)-Math.min(...ys))*s};
 const end=xy(w/2,d+13,0);centres[id]=[x+xy(w/2,d/2,15)[0]*s,y+xy(w/2,d/2,15)[1]*s];
 for(const [n,p]of Object.entries(ports))portMap[id+':'+n]=[x+p[0]*s,y+p[1]*s];
 const ring=state.component===id?'<path d="M '+points([xy(-7,-7,0),xy(w+7,-7,0),xy(w+7,d+7,0),xy(-7,d+7,0)])+' Z" fill="none" stroke="'+C('accent')+'" stroke-width="'+2/s+'" stroke-dasharray="4 3"/>':'';
 return '<g class="component '+(active.includes(id)?'is-active ':'')+(state.component===id?'is-selected':'')+'" data-component="'+id+'" tabindex="0" role="button" aria-label="'+E(records[id].name)+'" transform="translate('+x+' '+y+') scale('+s+')">'+ring+content+'</g>';
}

function configure(options={}){portMap={};centres={};bounds={};active=options.active||[];state.component=options.component||'';bp=[1,.035,-.07,.91];scaleForText=1;}
function port(id,name){return portMap[id+':'+name];}
function center(id){return centres[id];}

function carGeometry(){
 let out='';const project=(x,y,z=0)=>{const p=xy(x,y,z);return [562+p[0],420+p[1]];};
 const poly=(p,c,opacity=1)=>polygon(p.map(v=>project(...v)),c,'metal-dark',opacity);
 const block=(x,y,z,w,d,h,c='metal')=>poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],'metal-dark')+poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],'metal-side')+poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],c);
 const rod=(a,b,width=5)=>line(project(...a),project(...b),'black-side',width)+line(project(...a),project(...b),'metal-light',Math.max(1,width-3));
 const wheel=(cx,cy,front)=>{
  const t=front?state.turn*.32:0,depth=42,r=84,z=88;
  const V=(ax,ay,az)=>project(cx+ax*Math.cos(t)-ay*Math.sin(t),cy+ax*Math.sin(t)+ay*Math.cos(t),az);
  const ring=(x,rr)=>Array.from({length:41},(_,i)=>V(x,Math.cos(i*Math.PI/20)*rr,z+Math.sin(i*Math.PI/20)*rr));
  let a=ring(-depth/2,r),b=ring(depth/2,r),res=polygon(a,'black');
  res+=polygon(a.slice(0,21).concat(b.slice(0,21).reverse()),'black-side')+polygon(b,'black-light')+polygon(ring(depth/2+1,54),'black')+polygon(ring(depth/2+2,34),'metal-dark')+polygon(ring(depth/2+3,26),front?'metal-light':'black-side')+polygon(ring(depth/2+4,10),'metal');
  for(let i=0;i<24;i++){const angle=i*Math.PI/12;res+=line(V(-depth/2,Math.cos(angle)*r,z+Math.sin(angle)*r),V(depth/2,Math.cos(angle+.06)*r,z+Math.sin(angle+.06)*r),'metal-dark',2);}
  return '<g class="cursor-interaction" data-component="'+(front?'motor':cx<0?'lwheel':'rwheel')+'">'+res+'</g>';
 };
 out+=poly([[-285,-500,0],[285,-500,0],[285,630,0],[-285,630,0]],'paper',.8);
 out+=wheel(-290,-380,true)+wheel(-290,540,false);
 out+=block(-243,-372,35,16,987,19)+block(227,-372,35,16,987,19)+block(-243,-372,35,486,16,19)+block(-243,599,35,486,16,19);
 for(const cy of [-380,540]){
  out+=rod([-270,cy,63],[270,cy,63],11);
  for(const cx of [-250,250]){out+=rod([cx,cy-25,65],[cx,cy-15,146],8);for(let j=0;j<9;j++){const aa=project(cx,cy-20,75+j*7);out+='<ellipse cx="'+aa[0]+'" cy="'+aa[1]+'" rx="11" ry="4.5" fill="none" stroke="'+C('black-side')+'" stroke-width="3"/>';}}
 }
 out+=block(-224,-220,56,448,814,8,'metal-light');
 const add=(id,kind,x,y,z,s)=>{const p=project(x,y,z);return model(id,kind,p[0],p[1],s);};
 // An explanatory arrangement: boards share one exposed deck instead of overlapping.
 out+=add('hall','hall',-210,-180,72,.92)+add('l298','l298',58,-180,72,.91);
 out+=add('pi','pi',-208,-25,72,.79)+add('uno','uno',4,-20,72,.66);
 out+=add('bank','bank',-205,130,72,.93)+add('relay','relay',55,151,72,.94);
 out+=add('battery','battery',-205,255,72,.86)+add('dc','dc',54,271,72,1.0);
 out+=add('left','controller',-208,445,72,.85)+add('right','controller',30,445,72,.85);
 out+=add('r1','r1',-20,122,74,.65)+add('r2','r2',-20,171,74,.65)+add('cap','cap',-14,212,72,.65);
 out+=add('ren','ren',75,-223,72,.65)+add('ground','ground',190,243,72,.75)+add('junction','junction',-25,150,72,.65)+add('source','source',-213,-215,72,.75)+add('switch','switch',-221,390,72,.8);
 out+=block(-61,-306,56,122,82,10,'black')+add('motor','motor',-42,-300,68,.84);

 const crank=state.turn*19;
 out+=rod([crank-22,-326,126],[-260,-354+state.turn*15,90],5)+rod([crank+22,-326,126],[260,-354-state.turn*15,90],5);
 out+=rod([0,-263,154],[crank,-326,126],11);
 for(const a of [[-260,-354+state.turn*15,90],[260,-354-state.turn*15,90],[crank,-326,126]]){const p=project(...a);out+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+C('metal-light')+'" stroke="'+C('black-side')+'" stroke-width="2"/>';}
 out+=add('sensor','sensor',-30,-293,167,1.2);
 out+=wheel(290,-380,true)+wheel(290,540,false);
 const wheelPorts=(id,x,y)=>{const p=project(x,y,90);for(let i=0;i<8;i++)portMap[id+':'+['P1','P2','P3','VCC','GND','HU','HV','HW'][i]]=[p[0],p[1]+i*2];centres[id]=p;};wheelPorts('lwheel',-270,540);wheelPorts('rwheel',270,540);
 return out;
}

function car(){
 const out=carGeometry(),k=.59,tx=30,ty=9;
 for(const key of Object.keys(portMap))portMap[key]=[portMap[key][0]*k+tx,portMap[key][1]*k+ty];
 for(const id of Object.keys(bounds)){const b=bounds[id];bounds[id]={...b,x:b.x*k+tx,y:b.y*k+ty,w:b.w*k,h:b.h*k};}
 for(const key of Object.keys(centres))centres[key]=[centres[key][0]*k+tx,centres[key][1]*k+ty];
 return '<g transform="translate('+tx+' '+ty+') scale('+k+')">'+out+'</g>';
}

function anchor(id,name,p){portMap[id+':'+name]=p;}
return {configure,part:model,car,port,center,anchor,getBounds:()=>Object.values(bounds),xy,box,line,ellipse,cylinder,polygon};
})();
