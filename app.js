(() => {
'use strict';
const root=document.getElementById('rover-wiring-atlas'),scene=root.querySelector('.scene'),logic=root.querySelector('.logic-svg');
const {records,wires,evidence}=window.RoverData,M=window.RoverIllustration;
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=n=>'var(--'+n+')',names={uno:'Arduino',pi:'树莓派',l298:'L298N',sensor:'AS5600',motor:'转向电机与连杆',left:'左轮控制器',right:'右轮控制器',lwheel:'左后轮',rwheel:'右后轮',r1:'1kΩ 串联电阻',r2:'10kΩ 下拉',cap:'10µF 电容',junction:'油门公共点',relay:'方向继电器',hall:'霍尔面包板',bank:'充电宝',battery:'36V 电池',dc:'DC-DC',ren:'ENB 下拉',ground:'共地分线',source:'霍尔 5V',switch:'总开关'};
const step=(short,title,copy,parts,edges,wireIds=[])=>({short,title,copy,parts,edges,wireIds});
const topics={
 overview:{nav:'整车逻辑',index:'00',title:'一条指令，怎样变成小车的运动？',description:'树莓派传递操作，Arduino 协调转向、行驶和换向；位置与车轮反馈再回到 Arduino。',summary:'Arduino 是各项功能共享的控制核心。转向依靠前轮连杆，驱动依靠两个后轮。',parts:['pi','uno','l298','sensor','motor','left','right','lwheel','rwheel','relay','hall','battery'],note:'左右后轮共用油门与方向指令；车头连杆完成转弯。转向位置闭环与车轮霍尔反馈承担不同任务。',steps:[step('接收操作','树莓派把操作交给 Arduino','手机或电脑的网页操作先到树莓派，再通过 USB 串口发给 Arduino。Arduino 负责执行器的直接控制。',['pi','uno'],['command'],['usb']),step('控制转向','转向走独立的位置闭环','Arduino → L298N → 转向电机 → 连杆与前轮；电机上方的 AS5600 把位置送回 Arduino。',['uno','l298','sensor','motor'],['steering']),step('驱动后轮','共同油门交给左右控制器','D9 的 PWM 经过 RC 滤波，分给两个控制器；两个控制器分别驱动各自的后轮。',['uno','left','right','lwheel','rwheel'],['drive']),step('读取反馈','反馈决定后续怎样控制','AS5600 用于转向到位判断；双轮霍尔用于读取轮子转动、方向，并参与停稳换向与运行保护。',['uno','sensor','hall','lwheel','rwheel'],['feedback'])]},
 steer:{nav:'转向',index:'01',title:'转向：转到哪里，靠反馈来决定',description:'Arduino 下达转向控制，L298N 驱动电机，电机带动连杆；AS5600 持续告诉 Arduino 电机转到了哪里。',summary:'先驱动，再读位置，再决定继续还是停止。这是一条反复工作的转向闭环。',parts:['uno','l298','motor','sensor','ren','dc'],note:'AS5600 装在转向电机上方，读取该处转动位置。连杆松动时，电机位置到位仍可能与车轮实际朝向有偏差。',steps:[step('比较位置','Arduino 比较目标与当前位置','目标来自转向操作，当前位置由 AS5600 经 A0 返回。Arduino 根据两者的差距，决定向哪边驱动、还需不需要继续。',['uno','sensor'],['compare'],['angle']),step('下达驱动','Arduino 控制 L298N，而不是直接给电机供电','D2 / D4 接 IN3 / IN4 决定驱动方向，D3 接 ENB 控制使能与 PWM。L298N 使用独立的转向动力电源。',['uno','l298'],['control'],['d2','d4','d3']),step('机构转动','L298N 让电机带动摇臂与双连杆','OUT3 / OUT4 连接电机两端。电机带动摇臂，左右连杆推动前轮转向；图中把机械动作与电控指令分开标出。',['l298','motor'],['motor','mechanical'],['motor-a','motor-b']),step('返回反馈','AS5600 把新的位置返回 Arduino','传感器检测电机上方配套磁体的位置，OUT 经 A0 回到 Arduino。它提供位置反馈，不负责给电机提供动力。',['motor','sensor','uno'],['feedback'],['angle']),step('到位停驱','未到位继续调节，到位后停止驱动','实际程序会反复比较与修正，接近目标时轻推，到位后停止 L298N 输出，并用等待与滞回减少来回抖动。这里分步演示一轮因果顺序。',['uno','l298','sensor','motor'],['stop'],['d3'])]},
 throttle:{nav:'驱动与油门',index:'02',title:'驱动：同一份油门，分别驱动两个后轮',description:'Arduino 输出 PWM，RC 电路把它平滑为模拟油门，公共节点一分二送到左右无刷控制器。',summary:'油门是控制信号。两个控制器取用电池动力，分别带动本侧后轮。',parts:['uno','r1','r2','cap','junction','left','right','lwheel','rwheel','battery'],note:'当前使用共同油门，油门电平不等于实际速度，两轮速度也不会因此自动完全相同。松油门后车辆仍会自然滑行。',steps:[step('输出 PWM','Arduino 从 D9 输出油门 PWM','PWM 是快速高低切换的控制信号。它先进入 RC 电路，再送给控制器的模拟油门输入。',['uno'],['pwm'],['d9']),step('平滑信号','1kΩ 与电容把脉冲平滑下来','1kΩ 串在 D9 后面；10µF 电容正极接电阻后的公共节点、负极接地。10kΩ 下拉也是这个节点到地的一条独立支路。',['r1','r2','cap','junction'],['filter'],['rc-node','rc-pull','rc-cap']),step('一分为二','同一个油门节点送到左右 THR','左右控制器接收同一份模拟油门。下拉与电容都从这个公共点分支，不串在两个控制器之间。',['junction','left','right'],['throttle'],['thr-left','thr-right']),step('驱动后轮','每个控制器只驱动本侧电机','控制器将电池直流动力变为驱动轮毂电机的三相输出。左控制器配左后轮，右控制器配右后轮。',['left','right','lwheel','rwheel'],['phase'],['phase-left1','phase-right1']),step('撤掉油门','停止请求先撤 PWM，车辆随后减速','PWM 撤掉后，RC 节点还需要放电，轮子仍可能滑行。当前撤油门不代表主动刹车，也不代表车轮已立刻停下。',['uno','cap','lwheel','rwheel'],['release'],['rc-cap-gnd'])]},
 reverse:{nav:'前进与后退',index:'03',title:'换向：先确认停轮，再切方向',description:'Arduino 协调油门、双轮霍尔与方向继电器，按顺序把“前进”切换为“后退”。',summary:'继电器选择方向，控制器驱动车轮。改变方向之前，程序先撤油门并等待双轮停稳条件。',parts:['uno','relay','hall','left','right','lwheel','rwheel'],note:'D7 LOW 时继电器释放、选择前进；HIGH 时吸合、选择后退。霍尔 300ms 无跳变是当前程序的停稳判据，受信号分辨率限制。',steps:[step('请求换向','Arduino 收到新的行驶方向','当请求的方向与当前方向不同时，程序先进入换向等待，不会立即一边给油一边切换触点。',['uno'],['request']),step('撤掉油门','先撤 PWM，让 RC 油门节点放电','当前换向逻辑保留至少 80ms 的 RC 放电时间。此时不主动推动轮子，轮子可能仍在滑行。',['uno','left','right'],['release']),step('等待停稳','用双轮霍尔判断是否满足切换条件','两轮霍尔输入都要合法，且连续 300ms 无跳变。等待过程中松手或停止，会取消换向请求。',['hall','uno','lwheel','rwheel'],['hall'],['hall-out-LHU','hall-out-RHU']),step('切换触点','D7 控制继电器，同时切换两个倒车输入对','NO 和 COM 各分两路，接到左右控制器各自的倒车输入对。模块 DC+ / DC− 是辅助供电，和触点 NO / COM 是两套用途。',['uno','relay','left','right'],['relay'],['d7','no-left','com-left','no-right','com-right']),step('重新给油','方向稳定后，再逐步升高油门','切换后等待 50ms 稳定，再逐步给油；霍尔继续检查两轮实际是否向目标方向起步。',['uno','left','right','lwheel','rwheel'],['drive'])]},
 hall:{nav:'霍尔反馈',index:'04',title:'霍尔：让 Arduino 知道轮子有没有在转',description:'每个后轮内三路霍尔，经接线板外部上拉后送到 Arduino，用于读取轮子运动并参与控制判断。',summary:'电机相线负责驱动，霍尔线负责反馈。每轮三路信号，左右共六路。',parts:['lwheel','rwheel','hall','uno','source'],note:'霍尔反馈已经参与换向和起步保护；当前共同油门并不构成左右轮独立的闭环调速。霍尔保留原有 5V 供电。',steps:[step('车轮转动','轮内霍尔随转动产生状态变化','HU / HV / HW 三路组合随着轮毂转动而变化。两轮分别采集，不把左右信号混为同一路。',['lwheel','rwheel'],['wheel']),step('接线与上拉','接线板提供供电分配与六路外部上拉','3～8 排各放一颗 d—g 跨沟电阻。H 孔接车轮霍尔，I 孔接 Arduino，同排右半边互通；左半边由跳线接到同一 5V。',['hall','source'],['hall-in'],['hall-source','hall-in-LHU','hall-in-RHU']),step('六路输入','左右三路分别进入对应引脚','左 HU / HV / HW → A1 / A2 / A3；右 HU / HV / HW → D10 / D11 / D12。A0 留给转向 AS5600。',['hall','uno'],['hall-out'],['hall-out-LHU','hall-out-LHV','hall-out-LHW','hall-out-RHU','hall-out-RHV','hall-out-RHW']),step('用于判断','Arduino 由变化判断转动、方向和停稳','程序统计合法状态变化，检查起步方向，等待换向停轮，并在运动时缺少有效霍尔变化的情况下停止输出。',['uno','hall'],['judge'])]},
 power:{nav:'供电与共地',index:'05',title:'供电：动力负责出力，控制负责发指令',description:'36V 电池驱动车轮并经 DC-DC 供转向；充电宝独立供树莓派和 Arduino。信号共地提供共同的电压参考。',summary:'先分清能量从哪里来，再看控制信号去哪里。电机的大电流回流不经过 Arduino。',parts:['battery','switch','left','right','dc','l298','bank','pi','uno','sensor','hall','ground','ren'],note:'右控制器附近的 36V 输入同一点分支到 DC-DC；继电器辅助供电是另一条用途不同的支路。分线接头的归组要按实际连接确认。',steps:[step('动力主干','电池正极经总开关分给两个控制器','左右轮控制器的动力输入来自同一电池。负极沿原有功率线回到电池，不让电机电流流过 Uno 地线口。',['battery','switch','left','right'],['battery'],['battery-sw','battery-left','battery-right']),step('转向电源','同点分支经 DC-DC，提供标称 12V','DC-DC 输入在右控制器附近与电池输入同点分线；OUT+ / OUT− 接 L298N 的 12V / GND。',['right','dc','l298'],['steer-power'],['dc-in-p','dc-in-n','dc-out-p','dc-out-n']),step('控制电源','充电宝供树莓派，树莓派经 USB 供 Uno','这条控制供电独立于电机动力。树莓派与 Uno 之间同一根 USB 还承担串口指令与反馈。',['bank','pi','uno'],['logic-power'],['bank','usb']),step('传感供电','小信号传感器按各自电源分配','AS5600 红线 VCC 使用 Uno 3.3V；霍尔保留原有 5V，供小板、两轮霍尔和六路上拉使用，不新增并联电源。',['uno','hall','sensor'],['sensor-power'],['sensor-vcc','hall-source']),step('共同参考','共地让各控制信号有同一参考','多个器件可以通过一分三接头汇合后接一个 GND 口。图里区分“电气上共地”与“具体哪一组分线接头”，不把共地画成新增板卡。',['ground','uno','l298','dc','ren'],['ground'],['uno-gnd','l298-gnd','dc-out-n'])]}
};
const state={topic:'steer',step:0,component:'',wire:'',motion:false,direction:-1};
let sceneLabels=[],labelBounds=[];
const topic=()=>topics[state.topic],current=()=>topic().steps[state.step];
const shortPart=id=>names[id]||records[id]?.name||id;
function text(x,y,value,size=20,color='ink',anchor='middle'){size=Math.max(20,size);return '<text x="'+x+'" y="'+y+'" class="svg-copy" style="--copy-size:'+size+'px" font-size="'+size+'" fill="'+C(color)+'" text-anchor="'+anchor+'">'+E(value)+'</text>';}
function path(ps){return ps.map((p,i)=>(i?'L ':'M ')+p.join(' ')).join(' ');}
function copyWidth(value,size){return [...value].reduce((n,c)=>n+(/^[\x00-\xff]$/.test(c)?.56:1)*size,0);}
function sceneCaption(value,x,y,size=17,color='muted',id=''){
 const w=Math.ceil(copyWidth(value,size))+16,box={id:'label-'+id,x:x-w/2,y:y-size-4,w,h:size+12};
 labelBounds.push(box);sceneLabels.push('<g class="flow-caption"><rect x="'+box.x+'" y="'+box.y+'" width="'+box.w+'" height="'+box.h+'" rx="4" fill="'+C('paper')+'"/>'+text(x,y,value,size,color)+'</g>');
}
function arrow(id,ps,label,lx,ly,color='steer',extra={}){
 const active=current().edges.includes(id),d=path(ps),cls=active?' flow-active':'';
 if(label)sceneCaption(label,lx,ly,21,active?color:'muted',id);
 return '<g data-flow="'+id+'" opacity="'+(state.wire?.13:active?1:.78)+'"><path class="flow" d="'+d+'" stroke="'+C('paper')+'" stroke-width="10"/><path class="flow'+cls+'" d="'+d+'" stroke="'+C(color)+'" stroke-width="'+(active?3.5:2.4)+'" '+(extra.dashed?'stroke-dasharray="5 6"':'')+' marker-end="url(#arrow-'+color+')"/></g>';
}
function labelPart(id,title,x,y,subtitle=''){
 subtitle='';
 const active=current().parts.includes(id)||state.component===id,w=Math.ceil(Math.max(150,copyWidth(title,22),copyWidth(subtitle,16)))+20,h=subtitle?57:34;
 labelBounds.push({id:'label-'+id,x:x-w/2,y:y-24,w,h});
 sceneLabels.push('<g data-component="'+id+'" role="button" tabindex="0" aria-label="'+E(records[id]?.name||title)+'" class="component part-caption"><rect x="'+(x-w/2)+'" y="'+(y-24)+'" width="'+w+'" height="'+h+'" rx="6" fill="'+C('paper')+'"/>'+text(x,y,title,22,active?'accent':'ink')+(subtitle?text(x,y+24,subtitle,16,'muted'):'')+'</g>');
 return '';
}
// Passive components connect at their actual drawn terminals, including both parallel ground branches.
function circuitLead(id,ps,color='throttle',edge='filter'){
 const d=path(ps),on=current().edges.includes(edge),cls=on?' flow-active':'';
 return '<g data-circuit-wire="'+id+'" opacity="'+(state.wire?.13:1)+'"><path class="flow" d="'+d+'" stroke="'+C('paper')+'" stroke-width="7"/><path class="flow'+cls+'" d="'+d+'" stroke="'+C(color)+'" stroke-width="'+(on?3:2.3)+'"/></g>';
}
function part(id,kind,x,y,s=1){return M.part(id,kind,x,y,s);}
function frontWheel(x,y,angle=0){return '<g transform="translate('+x+' '+y+') rotate('+angle+')"><rect x="-21" y="-49" width="42" height="98" rx="8" fill="'+C('black')+'"/><rect x="14" y="-42" width="7" height="84" rx="3" fill="'+C('black-light')+'"/>'+Array.from({length:9},(_,i)=>'<path d="M -18 '+(-39+i*10)+' h 33" stroke="'+C('metal-dark')+'" stroke-width="2"/>').join('')+'<ellipse rx="8" ry="22" fill="'+C('metal-side')+'"/></g>';}
function steeringMechanism(x=590,y=535){
 const start=state.direction===0?-1:0,progress=state.step<2?0:state.step===2?.52:1,t=state.topic==='steer'?start+(state.direction-start)*progress:0,crank=x+t*25;
 return '<g data-component="motor" role="button" tabindex="0" aria-label="摇臂连杆与前轮"><path d="M '+(x-178)+' '+y+' H '+(x+178)+'" stroke="'+C('metal-side')+'" stroke-width="14"/>'+frontWheel(x-182,y,t*-16)+frontWheel(x+182,y,t*-16)+'<path d="M '+x+' '+(y-110)+' L '+crank+' '+(y-35)+' M '+crank+' '+(y-35)+' L '+(x-168)+' '+(y+t*8)+' M '+crank+' '+(y-35)+' L '+(x+168)+' '+(y-t*8)+'" stroke="'+C('black-side')+'" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M '+x+' '+(y-110)+' L '+crank+' '+(y-35)+' M '+crank+' '+(y-35)+' L '+(x-168)+' '+(y+t*8)+' M '+crank+' '+(y-35)+' L '+(x+168)+' '+(y-t*8)+'" stroke="'+C('metal-light')+'" stroke-width="3" fill="none" stroke-linecap="round"/>'+[[crank,y-35],[x-168,y+t*8],[x+168,y-t*8]].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+C('metal-light')+'" stroke="'+C('black-side')+'" stroke-width="2"/>').join('')+'</g>';
}
function steerScene(){
 let art=steeringMechanism();
 art+=part('uno','uno',92,185,.72)+part('l298','l298',525,187,1.08)+part('motor','motor',535,421,1.06);
 // Enlarged for identification; still mounted above the steering motor, rather than beside it.
 art+='<path d="M 590 407 L 590 419" fill="none" stroke="'+C('muted')+'" stroke-width="1.5" stroke-dasharray="3 4"/>'+part('sensor','sensor',550,343,1.35);
 art+=labelPart('uno','① Arduino Uno',200,126,'比较目标与位置反馈')+labelPart('l298','② L298N 驱动器',605,126,'驱动转向电机正反转');
 art+=labelPart('motor','③ 转向电机 → 连杆 → 前轮',590,618);
 art+='<path d="M 551 375 H 517 L 496 390" stroke="'+C('muted')+'" stroke-width="1.5" fill="none"/>'+labelPart('sensor','④ AS5600 传感器',395,390,'电机上方 · 位置反馈');
 art+=arrow('control',[[330,235],[498,235]],'D2 / D4 / D3',414,213,'steer');
 art+=arrow('motor',[[704,250],[735,250],[735,455],[661,455]],'OUT3 / OUT4',820,310,'power');
 const sensorOut=[655,376];
 art+=arrow('feedback',[sensorOut,[910,sensorOut[1]],[910,62],[45,62],[45,235],[78,235]],'位置反馈 OUT → A0',475,43,'hall');
 if(state.component==='ren'||['en-pull','en-ground'].includes(state.wire)){
  art+=part('ren','ren',115,470,1.4)+labelPart('ren','ENB 10kΩ 下拉',174,549,'默认关闭，仍需直接共地');
  for(const id of ['en-pull','en-ground']){const w=wires.find(w=>w.id===id);art+=circuitLead(id,routeLead(M.port(...w.a),M.port(...w.b),w.a[0],w.b[0]),w.color,'control');}
 }
 if(state.component==='dc'||['dc-out-p','dc-out-n'].includes(state.wire))art+=part('dc','dc',115,458,1.0)+labelPart('dc','DC-DC · 标称 12V',187,586,'为 L298N 提供电机动力');
 return art;
}
function driveScene(){
 let art=part('uno','uno',50,220,.66);
 art+='<rect x="300" y="190" width="230" height="304" rx="12" fill="'+C('panel')+'" stroke="'+C('rule')+'" stroke-dasharray="4 5"/>';
 art+=part('r1','r1',330,240,1)+part('r2','r2',330,355,.9)+part('cap','cap',470,355,.92)+part('junction','junction',456,270,.85);
 art+=part('left','controller',574,134,.78)+part('right','controller',574,383,.78)+part('lwheel','wheel',817,140,.92)+part('rwheel','wheel',817,390,.92);
 art+=labelPart('uno','① Arduino',151,400,'D9 输出 PWM')+labelPart('junction','② RC 滤波',415,535,'两条并联到地的支路')+labelPart('left','③ 左控制器',655,276)+labelPart('right','③ 右控制器',655,525)+labelPart('lwheel','④ 左后轮',855,276)+labelPart('rwheel','④ 右后轮',855,525);
 const p=(id,name)=>M.port(id,name),d9=p('uno','D9'),ra=p('r1','A'),rb=p('r1','B'),j=p('junction','J'),r2a=p('r2','A'),r2b=p('r2','B'),cp=p('cap','+'),cn=p('cap','-'),left=p('left','THR'),right=p('right','THR'),g=[454,430];
 M.anchor('ground','G',g);
 art+=circuitLead('d9',[d9,[d9[0],180],[286,180],[286,ra[1]],ra],'throttle','pwm');
 art+=circuitLead('rc-node',[rb,[421,rb[1]],[421,j[1]],j]);
 art+=circuitLead('rc-pull',[j,[316,j[1]],[316,r2a[1]],r2a]);
 art+=circuitLead('rc-cap',[j,[445,j[1]],[445,398],[cp[0],398],cp]);
 art+=circuitLead('rc-pull-gnd',[r2b,[410,r2b[1]],[410,g[1]],g],'ground');
 art+=circuitLead('rc-cap-gnd',[cn,[cn[0],g[1]],g],'ground');
 art+=circuitLead('thr-left',[j,[548,j[1]],[548,240],[left[0],240],left],'throttle','throttle');
 art+=circuitLead('thr-right',[j,[548,j[1]],[548,485],[right[0],485],right],'throttle','throttle');
 art+=[421,445,j[0],548].map(x=>'<circle cx="'+x+'" cy="'+j[1]+'" r="4" fill="'+C('throttle')+'"/>').join('')+'<circle cx="454" cy="430" r="3" fill="'+C('ground')+'"/><path d="M 454 430 v 10 m -12 0 h 24 m -19 6 h 14 m -10 6 h 6" stroke="'+C('ground')+'" stroke-width="1.8" fill="none"/>';
 sceneCaption('PWM',259,158,21,'throttle','pwm');sceneCaption('共同油门 → 两个 THR',548,91,21,'throttle','throttle');sceneCaption('GND',415,479,21,'ground','rc-ground');sceneCaption('10µF',484,327,21,'ink','cap');
 art+=arrow('phase',[[758,190],[804,190]],'',0,0,'power')+arrow('phase',[[758,439],[804,439]],'',0,0,'power');
 return art;
}
function reverseScene(){
 let art=part('uno','uno',66,103,.65)+part('relay','relay',443,181,1.05)+part('left','controller',722,108,.78)+part('right','controller',722,345,.78)+part('hall','hall',380,470,.8)+part('lwheel','wheel',156,482,.78)+part('rwheel','wheel',670,492,.78);
 art+=labelPart('uno','① Arduino',169,289,'安排撤油、等停、切方向')+labelPart('relay','③ 方向继电器',518,355,'NO / COM 同时切两侧')+labelPart('left','左控制器',807,253)+labelPart('right','右控制器',807,490)+labelPart('hall','② 霍尔接线板',443,621,'读取双轮运动反馈');
 art+=arrow('relay',[[291,166],[413,166],[413,205],[434,205]],'D7 → IN',348,145,'reverse');
 art+=arrow('relay',[[602,218],[658,218],[658,160],[705,160]],'倒车输入对',690,84,'reverse')+arrow('relay',[[658,218],[658,399],[705,399]],'',0,0,'reverse');
 art+=arrow('hall',[[390,463],[330,463],[330,350],[45,350],[45,201],[56,201]],'停稳反馈',252,390,'hall');
 art+=arrow('hall',[[211,531],[359,531]],'',0,0,'hall')+arrow('hall',[[676,542],[545,542]],'',0,0,'hall');
 return art;
}
function hallScene(){
 let art=part('lwheel','wheel',85,159,1.25)+part('rwheel','wheel',85,421,1.25)+part('hall','hall',391,266,1.13)+part('uno','uno',667,261,.72);
 art+=labelPart('lwheel','左后轮 · 3 路霍尔',136,335,'HU / HV / HW')+labelPart('rwheel','右后轮 · 3 路霍尔',136,590,'HU / HV / HW')+labelPart('hall','霍尔面包板',485,453,'六路外部上拉')+labelPart('uno','Arduino Uno',781,469,'读取信号，判断运动');
 art+=arrow('hall-in',[[222,230],[327,230],[327,317],[368,317]],'左 HU / HV / HW',328,204,'hall')+arrow('hall-in',[[222,489],[327,489],[327,369],[368,369]],'右 HU / HV / HW',328,538,'hall');
 art+=arrow('hall-out',[[625,327],[650,327]],'',0,0,'hall');
 art+='<rect x="393" y="102" width="218" height="66" rx="9" fill="'+C('panel')+'" stroke="'+C('rule')+'"/>'+text(502,143,'原霍尔 5V',23);
 art+=arrow('hall-in',[[498,180],[498,236]],'5V',631,216,'power');
 art+=text(782,523,'左 → A1 / A2 / A3',21,'hall')+text(782,551,'右 → D10 / D11 / D12',21,'hall');
 M.anchor('source','5V',[502,168]);
 return art;
}
function powerScene(){
 if(state.step===3)return sensorPowerScene();if(state.step===4)return groundScene();
 let art=part('battery','battery',54,123,.84)+part('switch','switch',266,148,.95)+part('left','controller',453,103,.73)+part('right','controller',453,304,.73)+part('dc','dc',717,319,.9)+part('l298','l298',715,115,.84)+part('bank','bank',72,515,.8)+part('pi','pi',330,492,.68)+part('uno','uno',647,485,.65);
 art+=labelPart('battery','36V 动力电池',128,266)+labelPart('switch','总开关',287,231)+labelPart('left','左控制器',528,254)+labelPart('right','右控制器',528,452)+labelPart('dc','DC-DC',778,453)+labelPart('l298','L298N',778,255)+labelPart('bank','充电宝',132,625)+labelPart('pi','树莓派',400,625)+labelPart('uno','Arduino',744,650);
 art+=arrow('battery',[[217,170],[249,170]],'',0,0,'power')+arrow('battery',[[322,170],[423,170]],'动力',373,149,'power')+arrow('battery',[[377,170],[377,371],[424,371]],'',0,0,'power');
 art+=arrow('steer-power',[[625,366],[687,366]],'同点分支',655,414,'power')+arrow('steer-power',[[875,366],[887,366],[887,182],[858,182]],'12V',920,270,'power');
 art+=arrow('logic-power',[[208,545],[306,545]],'USB',256,526,'usb')+arrow('logic-power',[[497,545],[620,545]],'USB / 数据',558,526,'usb');
 art+='<path d="M 45 470 H 917" stroke="'+C('rule')+'" stroke-dasharray="5 6"/>';
 return art;
}
function sensorPowerScene(){
 let art=part('uno','uno',100,208,.87)+part('motor','motor',680,210,1)+part('sensor','sensor',692,130,1.35)+part('hall','hall',675,432,1.03);
 art+=labelPart('uno','Arduino',236,441)+labelPart('sensor','AS5600',752,347)+labelPart('hall','霍尔面包板',757,616);
 art+='<rect x="400" y="460" width="200" height="54" rx="7" fill="'+C('panel')+'" stroke="'+C('rule')+'"/>'+text(500,495,'原霍尔 5V',23);M.anchor('source','5V',[600,487]);
 art+=arrow('sensor-power',[[398,267],[558,267],[558,182],[668,182]],'3.3V → VCC',537,127,'power')+arrow('sensor-power',[[612,487],[658,487]],'',0,0,'power');
 return art;
}
function groundScene(){
 let art=part('uno','uno',65,116,.79)+part('l298','l298',682,129,1.05)+part('dc','dc',670,465,1)+part('ren','ren',175,496,1.2);
 art+=labelPart('uno','Arduino GND',189,350)+labelPart('l298','L298N · 一个 GND 口',762,339)+labelPart('dc','降压器 OUT−',735,624)+labelPart('ren','ENB 下拉电阻的地端',213,584,'10kΩ 的另一端接 ENB');
 const actual=evidence.ground.status==='confirmed',p={uno:M.port('uno','GND'),driver:M.port('l298','GND'),dc:M.port('dc','OUT-'),ren:M.port('ren','B')};
 const join=[480,400];M.anchor('ground','G',join);
 art+=circuitLead('en-pull',routeLead(M.port('l298','ENB'),M.port('ren','A'),'l298','ren'),'steer','ground');
 for(const [id,a]of Object.entries(p)){const route=path(routeLead(a,join,id==='driver'?'l298':id,'ground'));art+='<path d="'+route+'" stroke="'+C('paper')+'" stroke-width="7" fill="none"/><path d="'+route+'" stroke="'+C('ground')+'" stroke-width="2.3" fill="none"/>';}
 if(actual){art+='<g data-component="ground" role="button" tabindex="0" aria-label="L298N GND 一分三接头"><rect x="441" y="374" width="78" height="50" rx="7" fill="'+C('black-light')+'" stroke="'+C('black-side')+'"/><path d="M 454 382 v 34 M 467 382 v 34 M 480 382 v 34 M 493 382 v 34 M 506 382 v 34" stroke="'+C('metal-side')+'" stroke-width="2"/></g>'+text(480,454,'一分三接头',22,'accent');}
 else{art+='<circle cx="480" cy="400" r="9" fill="'+C('ground')+'"/>'+text(480,445,'电气共地',23,'ground');}
 return art;
}
function overviewScene(){return M.car();}

function logicBox(id,x,y,w,h,title,sub,stepIndex){
 const on=current().parts.includes(id);
 return '<g data-step="'+stepIndex+'" class="'+(on?'selected':'')+'" tabindex="0" role="button" aria-label="'+E(title)+'"><rect class="logic-box" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8"/><text class="logic-text" x="'+(x+w/2)+'" y="'+(y+h/2+7)+'" text-anchor="middle">'+E(title)+'</text></g>';
}
function logicArrow(id,ps,label='',x=0,y=0,color='accent'){
 const on=current().edges.includes(id),last=ps[ps.length-1],prev=ps[ps.length-2],angle=Math.atan2(last[1]-prev[1],last[0]-prev[0])*180/Math.PI;
 return '<path class="logic-arrow '+(on?'active':'')+'" d="'+path(ps)+'" style="stroke:'+C(on?color:'rule')+'"/><path d="M -7 -4 L 0 0 L -7 4" transform="translate('+last.join(' ')+') rotate('+angle+')" fill="none" stroke="'+C(on?color:'muted')+'" stroke-width="1.6"/>'+(label?text(x,y,label,19,on?color:'muted'):'');
}
function workflow(){
 let out='';
 if(state.topic==='hall'&&[1,2].includes(state.step)){
  out+=text(30,30,'排',22)+text(180,30,'H 接霍尔',22)+text(395,30,'I 接 Arduino',22);
  evidence.hallBoard.channels.forEach((c,i)=>{const y=72+i*39;out+='<path d="M 10 '+(y+14)+' H 490" stroke="'+C('rule')+'"/>'+text(30,y,String(c.row),22)+text(180,y,c.wheel+' '+c.signal,22)+text(395,y,c.pin,22);});
  logic.innerHTML='<title>面包板 H / I 孔位对应</title>'+out;return;
 }

 if(state.topic==='power'&&state.step===4){
  out+=logicBox('uno',15,20,190,66,'Arduino GND','控制系统参考',4)+logicBox('l298',295,20,190,66,'L298N GND','驱动信号参考',4)+logicBox('sensor',15,215,190,66,'传感器与霍尔地','反馈信号参考',4)+logicBox('cap',295,215,190,66,'油门滤波地','模拟油门参考',4);
  out+='<path d="M 110 92 V 145 H 390 V 92 M 110 207 V 145 M 390 207 V 145" fill="none" stroke="'+C('ground')+'" stroke-width="2"/><circle cx="250" cy="145" r="6" fill="'+C('ground')+'"/>'+text(250,176,'电气上共用同一参考',12,'ground');
  logic.innerHTML='<title>信号公共参考地</title>'+out;return;
 }
 if(state.topic==='power'&&state.step===3){
  out+=logicBox('uno',25,52,180,66,'Arduino','',3)+logicBox('sensor',315,52,175,66,'AS5600','',3)+logicBox('source',25,185,180,66,'原霍尔 5V','',3)+logicBox('hall',315,185,175,66,'霍尔面包板','',3);
  out+=logicArrow('sensor-power',[[215,85],[305,85]],'3.3V',260,65,'power')+logicArrow('sensor-power',[[215,218],[305,218]],'5V',260,198,'power');
  logic.innerHTML='<title>传感器供电分支</title>'+out;return;
 }
 if(state.topic==='throttle'&&state.step===1){
  out+='<path d="M 40 95 H 130 M 205 95 H 380 V 60 H 402 M 380 95 V 130 H 402 M 280 95 V 185 M 345 95 V 185 M 280 225 V 265 H 345 V 195" fill="none" stroke="'+C('throttle')+'" stroke-width="2.2"/>';
  out+='<rect x="130" y="76" width="75" height="38" rx="5" fill="'+C('paper')+'" stroke="'+C('throttle')+'"/>'+text(167,101,'1kΩ',16)+text(55,77,'D9 PWM',12,'muted')+text(280,44,'电阻后同一个公共点',13,'accent');
  out+='<circle cx="280" cy="95" r="5" fill="'+C('throttle')+'"/><circle cx="345" cy="95" r="3" fill="'+C('throttle')+'"/><circle cx="380" cy="95" r="3" fill="'+C('throttle')+'"/>';
  out+='<rect x="247" y="185" width="66" height="40" rx="5" fill="'+C('paper')+'" stroke="'+C('throttle')+'"/>'+text(280,211,'10kΩ',14)+'<path d="M 327 185 H 363 M 327 195 H 363" stroke="'+C('throttle')+'" stroke-width="3"/>'+text(367,176,'+',14,'throttle','start')+text(371,210,'10µF',14,'ink','start');
  out+='<path d="M 312 265 v 7 m -12 0 h 24 m -19 6 h 14 m -10 6 h 6" stroke="'+C('ground')+'" fill="none" stroke-width="1.7"/>';
  out+='<rect x="402" y="42" width="91" height="36" rx="5" fill="'+C('paper')+'" stroke="'+C('rule')+'"/><rect x="402" y="112" width="91" height="36" rx="5" fill="'+C('paper')+'" stroke="'+C('rule')+'"/>'+text(447,65,'左 THR',13)+text(447,135,'右 THR',13);
  logic.innerHTML='<title>油门 RC 滤波与公共节点</title>'+out;return;
 }

 if(state.topic==='steer'){
  out+=logicBox('uno',45,24,176,66,'Arduino','比较目标与当前反馈',0)+logicBox('l298',301,24,176,66,'L298N','按方向与使能驱动',1)+logicBox('motor',301,207,176,66,'电机与连杆','改变前轮朝向',2)+logicBox('sensor',45,207,176,66,'AS5600','读取电机转动位置',3);
  out+=logicArrow('control',[[228,57],[289,57]],'控制',258,43)+logicArrow('motor',[[389,96],[389,194]],'电机动力',435,149,'power')+logicArrow('mechanical',[[291,240],[233,240]],'检测',262,225)+logicArrow('feedback',[[133,198],[133,104]],'OUT → A0',80,153,'hall');
  out+=text(254,148,state.step===4?'到位停驱':'继续调节',20,'accent');
 }else if(state.topic==='power'){
  out+=logicBox('battery',10,14,135,65,'36V 电池','正极经过总开关',0)+logicBox('right',207,14,136,65,'双轮控制器','动力驱动后轮',0)+logicBox('dc',207,117,136,65,'DC-DC','标称 12V 输出',1)+logicBox('l298',388,117,104,65,'L298N','转向动力',1)+logicBox('bank',10,225,135,65,'充电宝','独立控制电源',2)+logicBox('pi',207,225,136,65,'树莓派','供电并发送指令',2)+logicBox('uno',388,225,104,65,'Arduino','控制与读取',2);
  out+=logicArrow('battery',[[151,47],[195,47]])+logicArrow('steer-power',[[175,47],[175,150],[195,150]])+logicArrow('steer-power',[[349,150],[377,150]])+logicArrow('logic-power',[[151,257],[195,257]],'USB',174,242)+logicArrow('logic-power',[[349,257],[377,257]]);
 }else{
  const config={
   overview:[['pi','网页与树莓派','操作变成串口指令',0],['uno','Arduino','协调控制与读取',0],['left','执行器','转向与双后轮驱动',2],['sensor','反馈','位置与轮子运动',3]],
   throttle:[['uno','D9 / PWM','Arduino 输出',0],['cap','RC 滤波','脉冲变平滑信号',1],['left','两个控制器','各接同一油门',2],['lwheel','两个后轮','各由本侧控制器驱动',3]],
   hall:[['lwheel','轮内霍尔','每轮 HU / HV / HW',0],['hall','接线板与上拉','供电与信号接点',1],['uno','Arduino 输入','六路对应各自引脚',2],['uno','运动判断','转动、方向与停稳',3]]
  }[state.topic];
  if(state.topic==='reverse'){
   const rows=[['uno','撤油门','先让 RC 节点放电',1],['hall','等双轮停稳','霍尔合法且连续 300ms 无跳变',2],['relay','切方向继电器','D7 → IN；NO / COM 切两侧',3],['right','稳定后给油','等 50ms，再逐步给油',4]];
   rows.forEach(([id,t,sub,i],j)=>{out+=logicBox(id,65,j*76+3,370,62,t,sub,i);if(j<3)out+=logicArrow(['release','hall','relay'][j],[[250,j*76+67],[250,j*76+75]]);});
  }else{
   const pos=[[20,25],[295,25],[295,207],[20,207]];
   config.forEach(([id,t,sub,i],j)=>{out+=logicBox(id,...pos[j],185,66,t,sub,i);});
   const es=state.topic==='throttle'?['pwm','throttle','phase']:state.topic==='hall'?['hall-in','hall-out','judge']:['command','drive','feedback'];
   const colors=state.topic==='throttle'?['throttle','throttle','power']:state.topic==='hall'?['hall','hall','hall']:['usb','throttle','hall'];out+=logicArrow(es[0],[[213,58],[282,58]],'',0,0,colors[0])+logicArrow(es[1],[[388,99],[388,195]],'',0,0,colors[1])+logicArrow(es[2],[[283,240],[218,240]],'',0,0,colors[2]);
   if(state.topic==='overview')out+=logicArrow('feedback',[[113,197],[113,151],[464,151],[464,100]],'',0,0,'hall');

  }
 }
 logic.innerHTML='<title>'+E(topic().title)+'</title>'+out;
}
function activeWires(){
 if(state.topic==='overview')return wires;
 const ids={steer:['uno-gnd','l298-gnd','dc-out-p','dc-out-n'],throttle:['ref-gnd'],reverse:['hall-out-LHU','hall-out-RHU','d9'],hall:[],power:['usb','sensor-vcc','hall-source','uno-gnd','l298-gnd','ref-gnd']}[state.topic];
 return wires.filter(w=>w.f===({throttle:'throttle',steer:'steer',reverse:'reverse',hall:'hall',power:'power'}[state.topic])||ids.includes(w.id)||(state.topic==='throttle'&&w.id.startsWith('phase-')));
}
function resolvedEndpoint(ep){return ep;}
function leadEndpoint(w,key){const ep=resolvedEndpoint(w[key]);return ep[0]==='hall'&&/^hall-(in|out)-/.test(w.id)?['hall',ep[1]+(w.id.startsWith('hall-in-')?'-in':'-out')]:ep;}
function endpointText(ep){const actual=resolvedEndpoint(ep);return shortPart(actual[0])+' · '+actual[1];}
function wireTitle(w){return w.id==='hall-source'?'原霍尔 5V → a1':w.label;}
function wireCopy(w){if(w.id==='hall-source')return 'a1 接原有霍尔 5V，b1 / c1 分给左右轮；保留同一电源，不额外并入另一处 5V。';const ch=evidence.hallBoard.channels.find(c=>w.id.endsWith('-'+c.channel));return ch&&/^hall-(in|out)-/.test(w.id)?'第 '+ch.row+' 排：电阻 d'+ch.row+'—g'+ch.row+'；h'+ch.row+' 接'+ch.wheel+' '+ch.signal+'，i'+ch.row+' 接 '+ch.pin+'。同排 f～j 内部互通，f 孔留空。':w.copy;}
function externalEndpoint(ep,index){
 const x=index?835:135,y=604;
 if(ep[0]==='ground')return {point:[370,590],art:'<g>'+text(370,619,'公共信号参考',13,'ground')+'<path d="M 370 590 v 12 m -12 0 h 24 m -19 6 h 14 m -10 6 h 6" stroke="'+C('ground')+'" stroke-width="1.5" fill="none"/></g>'};
 if(ep[0]==='source')return {point:[510,150],art:'<rect x="400" y="115" width="220" height="54" rx="6" fill="'+C('panel')+'" stroke="'+C('rule')+'"/>'+text(510,149,'原霍尔 5V',22)};
 return {point:[x,y],art:'<g><rect x="'+(x-112)+'" y="'+(y-28)+'" width="224" height="47" rx="6" fill="'+C('panel')+'" stroke="'+C('rule')+'" stroke-dasharray="4 4"/>'+text(x,y-8,endpointText(ep),13)+text(x,y+11,'本功能图外的连接端',10,'muted')+'</g>'};
}
// A selected lead exits the nearest device edge, then travels outside device silhouettes.
function routeLead(a,b,aid,bid){
 const unit=10,nx=97,ny=66,rects=[...M.getBounds(),...labelBounds],blocked=new Set(),inside=(p,r,pad=8)=>p[0]>r.x-pad&&p[0]<r.x+r.w+pad&&p[1]>r.y-pad&&p[1]<r.y+r.h+pad;
 for(const r of rects)for(let y=Math.max(0,Math.floor((r.y-8)/unit));y<=Math.min(ny-1,Math.ceil((r.y+r.h+8)/unit));y++)for(let x=Math.max(0,Math.floor((r.x-8)/unit));x<=Math.min(nx-1,Math.ceil((r.x+r.w+8)/unit));x++)blocked.add(y*nx+x);
 const snap=p=>[Math.max(1,Math.min(nx-2,Math.round(p[0]/unit))),Math.max(1,Math.min(ny-2,Math.round(p[1]/unit)))];
 function stub(p,id,goal){
  const r=rects.find(r=>r.id===id);if(!r)return snap(p);
  const choices=[{p:[r.x-22,p[1]],dir:[-1,0]},{p:[r.x+r.w+22,p[1]],dir:[1,0]},{p:[p[0],r.y-22],dir:[0,-1]},{p:[p[0],r.y+r.h+22],dir:[0,1]}];
  for(const q of choices){q.cost=Math.abs(q.p[0]-p[0])+Math.abs(q.p[1]-p[1])+.08*(Math.abs(q.p[0]-goal[0])+Math.abs(q.p[1]-goal[1]));q.cell=snap(q.p);let n=0;while(blocked.has(q.cell[1]*nx+q.cell[0])&&n++<18){q.cell=[q.cell[0]+q.dir[0],q.cell[1]+q.dir[1]];}if(q.cell[0]<1||q.cell[0]>nx-2||q.cell[1]<1||q.cell[1]>ny-2)q.cost+=10000;q.cost+=n*12;}
  choices.sort((a,b)=>a.cost-b.cost);return choices[0].cell;
 }
 const start=stub(a,aid,b),end=stub(b,bid,a),sn=start[1]*nx+start[0],gn=end[1]*nx+end[0],heap=[],costs=new Map(),previous=new Map();
 const push=v=>{let i=heap.length;heap.push(v);while(i){const p=(i-1)>>1;if(heap[p][0]<=v[0])break;heap[i]=heap[p];i=p;}heap[i]=v;};
 const pop=()=>{const top=heap[0],v=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=v[0])break;heap[i]=heap[c];i=c;}heap[i]=v;}return top;};
 for(let dir=0;dir<4;dir++){costs.set(sn*4+dir,0);push([0,sn*4+dir,0]);}let found=-1;
 while(heap.length){const [,key,g]=pop();if(costs.get(key)!==g)continue;const n=Math.floor(key/4),dir=key%4,x=n%nx,y=Math.floor(n/nx);if(n===gn){found=key;break;}
 [[1,0],[0,1],[-1,0],[0,-1]].forEach(([dx,dy],d)=>{const xx=x+dx,yy=y+dy,nn=yy*nx+xx;if(xx<1||xx>=nx-1||yy<1||yy>=ny-1||(blocked.has(nn)&&nn!==gn&&nn!==sn))return;const ng=g+1+(dir===d?0:1.5),nk=nn*4+d;if(ng<(costs.get(nk)??Infinity)){costs.set(nk,ng);previous.set(nk,key);push([ng+Math.abs(xx-end[0])+Math.abs(yy-end[1]),nk,ng]);}});
 }
 let ps=[];if(found!==-1){let key=found;while(key!==undefined){const n=Math.floor(key/4);ps.push([n%nx*unit,Math.floor(n/nx)*unit]);key=previous.get(key);}ps.reverse();}else ps=[[start[0]*unit,start[1]*unit],[start[0]*unit,45],[end[0]*unit,45],[end[0]*unit,end[1]*unit]];
 return [a,...ps,b].filter((p,i,all)=>!i||i===all.length-1||(p[0]-all[i-1][0])*(all[i+1][1]-p[1])!==(p[1]-all[i-1][1])*(all[i+1][0]-p[0]));
}
function wireIllustration(){
 const w=wires.find(w=>w.id===state.wire);if(!w)return '';
 let aa=M.port(...leadEndpoint(w,'a')),bb=M.port(...leadEndpoint(w,'b')),out='';if(!aa){const p=externalEndpoint(w.a,0);aa=p.point;out+=p.art;}if(!bb){const p=externalEndpoint(w.b,1);bb=p.point;out+=p.art;}
 const ps=routeLead(aa,bb,resolvedEndpoint(w.a)[0],resolvedEndpoint(w.b)[0]),d=path(ps);
 out+='<path class="wire-detail" d="'+d+'" stroke="'+C('paper')+'" stroke-width="9"/><path class="wire-detail" d="'+d+'" stroke="'+C(w.color)+'" stroke-width="3.6"/>';
 for(const [p,ep]of [[aa,w.a],[bb,w.b]]){
  const title=endpointText(ep),ww=Math.max(120,Math.ceil(copyWidth(title,16))+22),hh=34;
  const candidates=[[p[0]-ww/2,p[1]-50],[p[0]-ww/2,p[1]+18],[p[0]+18,p[1]-hh/2],[p[0]-ww-18,p[1]-hh/2]].map(([x,y])=>({x:Math.max(12,Math.min(948-ww,x)),y:Math.max(10,Math.min(640-hh,y)),w:ww,h:hh}));
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const score=a=>labelBounds.reduce((n,b)=>n+overlap(a,b)*5,0)+M.getBounds().reduce((n,b)=>n+overlap(a,b),0);
  candidates.sort((a,b)=>score(a)-score(b));const box=candidates[0],x=box.x,y=box.y;labelBounds.push({...box,id:'terminal-'+ep.join('-')});
  out+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+C('panel')+'" stroke="'+C(w.color)+'" stroke-width="2"/>';
  sceneLabels.push('<g class="terminal-caption"><rect x="'+x+'" y="'+y+'" width="'+ww+'" height="'+hh+'" rx="5" fill="'+C('panel')+'" stroke="'+C(w.color)+'"/>'+text(x+ww/2,y+23,title,16)+'</g>');
 }
 return out;
}
const partRoles={
 steer:{uno:'比较转向目标与 AS5600 位置反馈，决定 L298N 的方向与使能。',l298:'执行 Arduino 的控制信号，使用转向动力电源驱动电机正反转。',motor:'电机输出摇臂带动左右连杆，连杆推动前轮转向。',sensor:'安装在转向电机上方，检测配套磁体位置，经 OUT → A0 返回位置反馈。',ren:'ENB 的独立 10kΩ 下拉支路，让控制端未主动驱动时使能趋向关闭；不是 Arduino 共地线的替代品。',dc:'把动力电源降为标称 12V，给 L298N 的转向动力回路供电。'},
 throttle:{uno:'从 D9 产生油门 PWM，停止请求时撤掉输出。',junction:'1kΩ 之后同一个节点，同时分给两侧 THR、下拉和滤波电容。',r1:'串联在 D9 后，和电容一起承担平滑 PWM 的作用。',r2:'从油门公共点经 10kΩ 接地，提供下拉。',cap:'正极接公共油门节点，负极接地；滤波和放电都需要时间。'},
 reverse:{uno:'统筹撤油门、读霍尔等停轮、切 D7，再逐步给油的顺序。',relay:'D7 控制模块 IN，NO / COM 各分两路去闭合两侧倒车输入对。',hall:'接收两轮的六路霍尔信号，经 d—g 上拉、H / I 同排连接后，送给 Arduino 判断停轮。'},
 hall:{uno:'读取六路霍尔的合法状态变化，统计运动并参与换向和起步判断。',hall:'3～8 排的电阻跨接 d—g。H 接车轮霍尔，I 接 Arduino；左半边通过六根跳线连到原有 5V。',source:'a1 接原有霍尔 5V，b1 / c1 接左右轮红线，不另并入第二路 5V。'},
 power:{uno:'由 Pi 的 USB 供电，并分配传感器电源、提供控制信号参考。',ground:'表示电气共地，不是一块新增的板卡。真实分线使用一分三接头，接头归组按实物确认。'}
};
function connectorCopy(){return '图中共地表示电气关系；实物一分三接头的归组待确认。';}
function renderTechnical(){
 const list=activeWires(),groups=[['控制与反馈',w=>!['power','ground'].includes(w.color)&&!w.id.startsWith('phase-')],['动力与供电',w=>w.color==='power'||w.id.startsWith('phase-')],['地线与参考',w=>w.color==='ground']];
 root.querySelector('.wire-groups').innerHTML=groups.map(([title,fn])=>{const items=list.filter(fn);return items.length?'<div><p class="wire-group-label">'+title+'</p>'+items.map(w=>'<button type="button" class="wire-item" data-wire="'+w.id+'" aria-pressed="'+(state.wire===w.id)+'">'+E(wireTitle(w))+'</button>').join('')+'</div>':'';}).join('');
 const selected=wires.find(w=>w.id===state.wire);root.querySelector('.wire-description').textContent=selected?wireCopy(selected):'';root.querySelector('.wire-description').hidden=!selected;root.querySelector('.connector-note').innerHTML=connectorCopy();
}
function renderGuide(){
 const t=topic(),s=current(),id=state.component;
 const title=id?shortPart(id):s.title,copy=id?(partRoles[state.topic]?.[id]||records[id]?.role||s.copy):s.copy;
 root.querySelector('.step-explanation').innerHTML='<div class="step-content '+(state.motion?'step-motion':'')+'"><div class="step-heading"><h3>'+E(title)+'</h3>'+(id?'<button type="button" data-action="clear-component" aria-label="返回工作步骤">×</button>':'')+'</div><p>'+E(copy)+'</p></div>';
 workflow();renderTechnical();
}
function renderScene(){
 sceneLabels=[];labelBounds=[];M.configure({active:current().parts,component:state.component});
 const draw={overview:overviewScene,steer:steerScene,throttle:driveScene,reverse:reverseScene,hall:hallScene,power:powerScene};
 let art=(state.topic==='steer'&&['uno-gnd','l298-gnd','dc-out-n','en-ground'].includes(state.wire))?groundScene():draw[state.topic]();
 const defs='<defs>'+['steer','throttle','reverse','hall','power','usb'].map(c=>'<marker id="arrow-'+c+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 Z" fill="'+C(c)+'"/></marker>').join('')+'</defs>';
 const detail=wireIllustration();
 scene.innerHTML='<title>'+E(topic().title)+'</title><desc>固定视角的实体部件示意。手动点选右侧步骤，同步突出对应部件与信号。</desc>'+defs+'<g class="'+(state.motion?'step-motion':'')+'">'+art+detail+'<g class="scene-captions">'+sceneLabels.join('')+'</g></g>';
 const view=state.topic==='overview'&&!state.wire?[116,-18,510,665]:state.topic==='power'&&state.step<3&&!state.wire?[8,60,944,618]:[8,12,944,666];
 scene.setAttribute('viewBox',view.join(' '));

}
function save(){try{localStorage.setItem('rover-learning-topic',state.topic);}catch{}}
function render(){
 const t=topic();root.dataset.topic=state.topic;
 root.querySelector('#topic-title').textContent=t.title;
 root.querySelector('.topics').innerHTML=Object.entries(topics).map(([id,t])=>'<button type="button" data-topic="'+id+'" aria-pressed="'+(id===state.topic)+'">'+E(t.nav)+'</button>').join('');
 root.querySelector('.phase-strip').innerHTML=t.steps.map((s,i)=>'<button type="button" data-step="'+i+'" aria-pressed="'+(i===state.step)+'">'+E(s.short)+'</button>').join('');
 root.querySelector('[data-action="prev"]').disabled=state.step===0;root.querySelector('[data-action="next"]').disabled=state.step===t.steps.length-1;
 root.querySelector('.direction').hidden=state.topic!=='steer';root.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.direction===state.direction)));
 renderScene();renderGuide();state.motion=false;
}
function setStep(index){state.step=Math.max(0,Math.min(topic().steps.length-1,index));state.component='';state.wire='';state.motion=true;render();}
function setTopic(id){if(!topics[id])return;state.topic=id;state.step=0;state.component='';state.wire='';state.motion=false;root.querySelector('.technical').open=false;render();save();}
function pickComponent(id){if(!topic().parts.includes(id)&&!records[id])return;state.component=id;state.wire='';if(state.topic==='steer'){const preferred={uno:0,l298:1,motor:2,sensor:3,ren:1,dc:1};state.step=preferred[id]??state.step;}render();}
root.addEventListener('click',event=>{
 const target=event.target.closest('[data-topic],[data-step],[data-component],[data-action],[data-direction],[data-wire]');if(!target||!root.contains(target))return;
 if(target.dataset.topic){setTopic(target.dataset.topic);return;}
 if(target.dataset.step!==undefined){setStep(+target.dataset.step);return;}
 if(target.dataset.direction!==undefined){state.direction=+target.dataset.direction;state.motion=true;state.step=0;state.wire='';state.component='';render();return;}
 if(target.dataset.component){pickComponent(target.dataset.component);return;}
 if(target.dataset.wire){state.wire=state.wire===target.dataset.wire?'':target.dataset.wire;state.component='';if(state.wire&&!current().wireIds.includes(state.wire)){const idx=topic().steps.findIndex(s=>s.wireIds.includes(state.wire));if(idx>=0)state.step=state.topic==='steer'&&state.wire==='angle'?3:idx;if(state.topic==='throttle'&&state.wire.startsWith('phase-'))state.step=3;}render();root.querySelector('button[data-wire="'+target.dataset.wire+'"]')?.focus({preventScroll:true});return;}
 if(target.dataset.action==='clear-component'){state.component='';render();}else if(target.dataset.action==='next')setStep(state.step+1);else if(target.dataset.action==='prev')setStep(state.step-1);else if(target.dataset.action==='reset')setStep(0);
});
root.addEventListener('keydown',event=>{if(event.target.matches('g[role="button"]')&&['Enter',' '].includes(event.key)){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
root.querySelector('.technical').addEventListener('toggle',event=>{root.querySelector('.technical-title').textContent=event.target.open?'返回工作原理':'查看接线';root.querySelector('.technical-icon').textContent=event.target.open?'×':'＋';if(!event.target.open&&state.wire){state.wire='';renderScene();renderGuide();}});
try{const last=localStorage.getItem('rover-learning-topic');if(topics[last])state.topic=last;}catch{}
render();
})();
