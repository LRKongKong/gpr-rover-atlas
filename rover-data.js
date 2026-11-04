window.RoverData = (() => {
const records={
 uno:{name:'Arduino Uno',role:'下位机。通过 USB 接收树莓派指令，读取位置与霍尔反馈，分别输出转向、油门和方向控制。',model:'Arduino Uno / ATmega328P',note:'D2、D3、D4 控制转向；D9 产生油门 PWM；D7 选择前后方向。A0 是转向反馈，A1～A3 与 D10～D12 是双轮霍尔输入。',spec:'USB 既通信又供电。D0 / D1 留给串口；D5、D6、D8、D13、A4、A5 在本图中不接执行线。',link:['原厂引脚图','https://content.arduino.cc/assets/Pinout-UNOrev3_latest.pdf']},
 pi:{name:'树莓派 3B',role:'上位机。接收手机或电脑的网页操作，通过 USB 发送指令，并接收 Arduino 返回的运动信息。',model:'Raspberry Pi 3 Model B',note:'树莓派负责网页与数据，Arduino 负责直接控制执行器。',spec:'充电宝 → Micro-USB 供电；USB → Uno。其他 USB 可连接 IMU、激光雷达、摄像头。',link:['树莓派原厂资料','https://www.raspberrypi.com/products/raspberry-pi-3-model-b/']},
 l298:{name:'L298N 转向驱动',role:'把 Arduino 的方向与使能信号变成转向电机的正反向动力输出。',model:'L298N 双 H 桥驱动板，使用 B 路',note:'D2 → IN3；D4 → IN4；D3 → ENB。OUT3 / OUT4 接转向电机。',spec:'动力端：降压输出 → 12V / GND；ENB 旁接 10kΩ 下拉。ENB 跳帽拔除；板载 5V 稳压跳帽与 ENB 跳帽是两处不同位置。5V 端在本图不带旧负载。',link:['L298 芯片资料','https://www.st.com/resource/en/datasheet/l298.pdf']},
 sensor:{name:'AS5600 磁角度传感器',role:'读取转向输出轴附近磁体的位置，经模拟 OUT 送回 Arduino，形成转向闭环。',model:'AS5600 模块 / 模拟反馈',note:'本车线序：红 VCC → Uno 3.3V；白 OUT → A0；绿 GND → 公共地。',spec:'安装在转向机构输出位置附近。它测量该处位置；连杆间隙会影响实际车轮朝向。'},
 motor:{name:'转向电机与左右连杆',role:'电机在前轮轴线后方、两轮之间，通过输出摇臂连接左右连杆，推动前轮转向。',model:'直流减速电机 + 摇臂 + 双连杆',note:'转向电机 → 摇臂 → 两根连杆 → 左右转向节。前轮负责转向，后轮负责驱动。',spec:'OUT3 / OUT4 只接电机两端。电机支架、摇臂固定与连杆间隙都会影响回正精度。'},
 relay:{name:'前后方向继电器',role:'Arduino D7 控制线圈；NO 与 COM 接通时，同时闭合左右控制器的倒车输入对。',model:'单路继电器模块，线圈标 3.3VDC',note:'控制侧：DC+ / DC− / IN；触点侧：NO / COM / NC。两侧用途不同，不能只按线色混接。',spec:'DC+ / DC− 来自右控制器辅助供电分支；IN 接 D7。NO、COM 各一分二到两控制器。NC 空置。辅助支路电压不由线圈标字推定。'},
 left:{name:'左轮无刷控制器',role:'接收公共模拟油门与倒车输入，使用电池动力驱动左后轮。',model:'无刷轮毂电机控制器',note:'P+ / P− 接动力电池；THR 接油门节点；REV 对接继电器触点；三根粗相线接本侧电机。',spec:'刹车、三速、自学习、巡航等接口作为闲置支线收纳，不画成正在工作的链路。相线按原对应关系连接，本图不定义色线相序。'},
 right:{name:'右轮无刷控制器',role:'驱动右后轮。其动力输入同一节点另分支到 DC-DC 降压模块，辅助电源支路供方向继电器。',model:'无刷轮毂电机控制器',note:'动力输入分支 → DC-DC；辅助正负支路 → 继电器 DC+ / DC−。这两种电源支路要分开理解。',spec:'油门与左控制器共用一个信号节点；每个控制器驱动各自的后轮。相同油门不等于实际转速完全相同。'},
 dc:{name:'DC-DC 降压转换器',role:'从右控制器处的同一动力电源节点取电，降压后供 L298N 的转向动力支路。',model:'标牌：36～72V 输入 / 12V 输出',note:'VIN+ / VIN− 接动力电源分支；OUT+ / OUT− 接 L298N 12V / GND。',spec:'这是电池分线，并非右控制器内部生成的另一组 36V 输出。输出为标称 12V。'},
 battery:{name:'36V 动力电池',role:'给左右无刷控制器与转向降压支路提供动力。',model:'36V 锂电池组',note:'正极经总开关分到左右控制器；负极汇合回电池。右侧同一节点分支供降压模块。',spec:'本图保留已明确的电源主干，不添加没有依据的保险位置。树莓派使用独立充电宝供电。'},
 bank:{name:'充电宝',role:'独立给树莓派供电，树莓派再通过 USB 给 Arduino 供电。',model:'USB 移动电源',note:'充电宝 → 树莓派 Micro-USB → 树莓派 USB → Arduino。',spec:'这一支是控制系统供电，36V 电池支路负责电机动力。'},
 hall:{name:'双轮霍尔接线板',role:'分配霍尔的唯一 5V 电源与公共地，六路信号各接外部上拉，再送到 Uno。',model:'170 孔小面包板 / 六路外部上拉',note:'左 HU / HV / HW → A1 / A2 / A3；右 HU / HV / HW → D10 / D11 / D12。',spec:'六路上拉到同一霍尔 5V。原霍尔供电源的具体端头没有在资料中统一命名，因此图中保留为“原霍尔 5V”，不另画 Uno 5V 并联。'},
 lwheel:{name:'左后轮',role:'轮毂内的无刷电机驱动车轮，霍尔输出转动方向与计数信息。',model:'约 8 寸无刷轮毂电机 / 轮径约 20cm',note:'三根粗线是电机相线；红黑及 HU / HV / HW 是霍尔线束。',spec:'霍尔信息送到 Arduino，用于计数、方向反馈及换向时的停稳判断。'},
 rwheel:{name:'右后轮',role:'由右控制器驱动，并将三路霍尔信号送回 Arduino。',model:'约 8 寸无刷轮毂电机 / 轮径约 20cm',note:'左、右控制器和车轮分别配对，不能在图中交叉对应。',spec:'后轮负责驱动；前轮通过电机和连杆转向。'},
 r1:{name:'油门串联电阻',role:'D9 输出先经过这颗 1kΩ 电阻，再进入两轮共用的油门节点。',model:'1kΩ 电阻',note:'它和 10µF 电容共同平滑 PWM。电阻画在线路上，直接显示输入和输出位置。',spec:'电容和 10kΩ 下拉均接在 1kΩ 之后的公共油门节点。'},
 r2:{name:'油门下拉电阻',role:'把公共油门节点经 10kΩ 接地，让信号在未主动驱动时趋向零位。',model:'10kΩ 电阻',note:'这是并联到地的支路，不串在两个控制器之间。',spec:'公共油门节点仍同时分到左右控制器和滤波电容正极。'},
 cap:{name:'油门滤波电容',role:'与串联 1kΩ 形成 RC 滤波，把 PWM 脉冲平滑为模拟油门电压。',model:'10µF / 25V 电解电容',note:'正极接油门公共节点，负极接公共地。撤油门后需要放电时间。',spec:'10kΩ 下拉与电容是两条分别到地的并联支路。'},
 ren:{name:'ENB 使能下拉',role:'把 ENB 节点经 10kΩ 拉到驱动板 GND，Arduino 没有主动驱动时使转向默认关闭。',model:'10kΩ 电阻',note:'Uno D3 直接接 ENB，同时从该节点分出这颗下拉电阻。',spec:'下拉电阻不是公共地线，不能替代 Uno 与驱动板之间直接的信号参考地。'},
 ground:{name:'信号公共地',role:'给 Uno、传感器、滤波和驱动控制提供相同的信号电压参考。',model:'逻辑汇接点',note:'图中把应共地的线路整理到同一参考点，便于读图。',spec:'电机的大电流负极仍沿动力线返回电池，不经过 Uno。此点表示电气关系，不指定新增端子排的实物位置。'},
 junction:{name:'油门公共节点',role:'1kΩ 后的公共接点，一分二送到左右控制器，另分到下拉和滤波支路。',model:'同一个电气节点',note:'D9 → 1kΩ → 此节点 → 左右 THR；同时接 10kΩ 与 10µF 到地。',spec:'这是同一点的多路分支，不是另一块独立的控制板。'},
 switch:{name:'动力总开关',role:'位于已明确的电池正极动力主干上，接通或切断后续动力分支。',model:'原车开关',note:'电池正极 → 开关 → 左右控制器正极分支。',spec:'控制系统另由充电宝供电。'},
 source:{name:'原霍尔 5V 供电',role:'保留原有单一的霍尔电源，给接线板和左右轮霍尔供电。',model:'霍尔唯一 5V 电源',note:'5V → 接线板 → 两轮传感器与六路上拉。',spec:'不在资料未统一命名端头的情况下，假定它来自 Uno 或新增第二路 5V。'},
 imu:{name:'IMU 扩展',role:'经 USB 接入树莓派，观察姿态和航向变化。',model:'亚博九轴 IMU',note:'安装后可补入车体模型。',spec:'本图不把扩展设备画成已经固定在车上的部件。'},
 lidar:{name:'C1 激光雷达扩展',role:'经 USB 转接盒接入树莓派，扫描周围环境，用于后续避障、建图与定位。',model:'RPLIDAR C1 / CP2102N 转接盒',note:'激光雷达看周围环境；探地雷达承担地下探测。',spec:'位置与支架可在安装后补入整车模型。'},
 camera:{name:'摄像头扩展',role:'经 USB 接入树莓派，采集远程观察画面。',model:'Logitech C270',note:'作为外接扩展入口保留。',spec:'安装位置可继续补充。'},
 gpr:{name:'探地雷达载荷',role:'面向地下目标探测的任务载荷。',model:'雷达型号与采集方案待补充',note:'预留安装和采集链路入口。',spec:'尚未安装，接口按选定的雷达补充。'}
};
const palette={steer:'steer',throttle:'throttle',reverse:'reverse',hall:'hall',power:'power',ground:'ground',usb:'usb'};
const wires=[];
function wire(id,f,a,b,label,copy,color){wires.push({id,f,a,b,label,copy,color:color||palette[f]||'ink'});}
wire('usb','usb',['pi','USB'],['uno','USB'],'Pi USB → Uno USB','同一根 USB 线传递串口指令与反馈，同时由树莓派给 Uno 供电。');
wire('bank','power',['bank','USB'],['pi','PWR'],'充电宝 → Pi 供电','充电宝通过 Micro-USB 给树莓派供电。');
wire('d2','steer',['uno','D2'],['l298','IN3'],'D2 → IN3','转向方向控制的一路。Arduino 配合 IN4 和 ENB 控制转向电机。');
wire('d4','steer',['uno','D4'],['l298','IN4'],'D4 → IN4','转向方向控制的另一路。IN3 / IN4 的组合决定转向电机两端的极性。');
wire('d3','steer',['uno','D3'],['l298','ENB'],'D3 → ENB','D3 直接接 ENB，控制使能 / PWM；同一节点另分出 10kΩ 下拉。');
wire('en-pull','steer',['l298','ENB'],['ren','A'],'ENB → 10kΩ','ENB 的下拉支路，从 D3 / ENB 的公共节点分出。');
wire('en-ground','steer',['ren','B'],['l298','GND'],'10kΩ → L298N GND','下拉电阻的另一端接驱动板 GND，使未主动驱动的 ENB 趋向低电平。','ground');
wire('motor-a','steer',['l298','OUT3'],['motor','M1'],'OUT3 → 电机端 1','这两根是转向电机动力线，不是 Arduino 控制输入。');
wire('motor-b','steer',['l298','OUT4'],['motor','M2'],'OUT4 → 电机端 2','由 L298N 改变电机两端电压极性，带动摇臂与左右连杆。');
wire('angle','steer',['sensor','OUT'],['uno','A0'],'AS5600 OUT → A0','本车白线为模拟 OUT。Arduino 比较位置反馈与转向目标，到位后停止转向驱动。');
wire('sensor-vcc','steer',['uno','3.3V'],['sensor','VCC'],'3.3V → AS5600 VCC','本车传感器红线 VCC 接 Uno 3.3V。','power');
wire('sensor-gnd','steer',['sensor','GND'],['ground','G'],'AS5600 GND → 公共地','本车绿色传感器线是 GND，和控制器绿色油门线是不同线组。','ground');
wire('d9','throttle',['uno','D9'],['r1','A'],'D9 → 串联 1kΩ','Arduino 输出 PWM；先串联 1kΩ，再接到油门公共节点。');
wire('rc-node','throttle',['r1','B'],['junction','J'],'1kΩ → 油门公共点','电阻后是同一个节点，分到左右轮控制器、10kΩ 下拉与滤波电容。');
wire('thr-left','throttle',['junction','J'],['left','THR'],'公共点 → 左 THR','油门节点分出一根信号线给左控制器的模拟油门输入。');
wire('thr-right','throttle',['junction','J'],['right','THR'],'公共点 → 右 THR','同一油门节点分到右控制器。两个控制器各自驱动本侧车轮。');
wire('rc-pull','throttle',['junction','J'],['r2','A'],'公共点 → 10kΩ','下拉支路，与滤波电容支路并联。');
wire('rc-pull-gnd','throttle',['r2','B'],['ground','G'],'10kΩ → GND','下拉电阻的末端回到公共地，不能用普通导线代替电阻把油门节点短接到地。','ground');
wire('rc-cap','throttle',['junction','J'],['cap','+'],'公共点 → 电容正极','10µF 电容的正极位于 1kΩ 之后，与两个 THR 输入相连。');
wire('rc-cap-gnd','throttle',['cap','-'],['ground','G'],'电容负极 → GND','电解电容负极接公共地。RC 对 PWM 进行平滑，形成模拟油门电压。','ground');
wire('d7','reverse',['uno','D7'],['relay','IN'],'D7 → 继电器 IN','高电平选择后退，低电平释放恢复前进；程序先撤油门并等双轮满足停稳条件，再切换方向。');
wire('relay-vcc','reverse',['right','AUX+'],['relay','DC+'],'右辅助正极 → DC+','右控制器辅助正极支路给继电器模块供电；它不是控制器的 36V 动力正极。','power');
wire('relay-gnd','reverse',['right','AUX-'],['relay','DC-'],'右辅助负极 → DC−','模块供电负极。与触点侧的 COM 是两种用途，不能因线色相同直接混接。','ground');
for(const side of ['left','right']){
 const n=side==='left'?'左':'右';
 wire('no-'+side,'reverse',['relay','NO'],[side,'REV1'],'NO → '+n+'倒车端 1','NO 触点一分二，分别接到左右控制器各自倒车输入对的一端。');
 wire('com-'+side,'reverse',['relay','COM'],[side,'REV2'],'COM → '+n+'倒车端 2','COM 触点一分二。NO / COM 闭合时同时闭合两个控制器的倒车输入对。');
 const wh=side==='left'?'lwheel':'rwheel';
 for(let i=1;i<=3;i++)wire('phase-'+side+i,'power',[side,'P'+i],[wh,'P'+i],n+'控制器 → 相线 '+i,'三根粗相线驱动本侧轮毂无刷电机。图中只表达三相线组，不指定实际色线相序。');
 wire('hall-v-'+side,'hall',['hall','5V'],[wh,'VCC'],'霍尔 5V → '+n+'轮 VCC','左右轮霍尔由同一个保留的 5V 电源分配供电。','power');
 wire('hall-g-'+side,'hall',['hall','GND'],[wh,'GND'],'霍尔 GND → '+n+'轮 GND','霍尔供电地与读取参考地相连。','ground');
 for(let i=0;i<3;i++){
  const h=['HU','HV','HW'][i],ch=(side==='left'?'L':'R')+h;
  wire('hall-in-'+ch,'hall',[wh,h],['hall',ch],n+' '+h+' → 接线板','轮内霍尔信号先进入接线板，对应通道接外部上拉。');
  wire('hall-out-'+ch,'hall',['hall',ch],['uno',side==='left'?'A'+(i+1):'D'+(i+10)],ch+' → '+(side==='left'?'A'+(i+1):'D'+(i+10)),'接线板同一行的信号送入 Uno。左轮 A1 / A2 / A3，右轮 D10 / D11 / D12。');
 }
}
wire('battery-sw','power',['battery','+'],['switch','IN'],'电池 + → 总开关','36V 动力正极先经过总开关。');
for(const side of ['left','right']){
 wire('battery-'+side,'power',['switch','OUT'],[side,'P+'],'开关后 + → '+(side==='left'?'左':'右')+'控制器','开关后的正极分到两个轮控制器。');
 wire('negative-'+side,'power',['battery','-'],[side,'P-'],'电池 − ↔ '+(side==='left'?'左':'右')+'控制器','两个控制器动力负极汇合返回电池，功率回流不经过 Uno。','ground');
}
wire('dc-in-p','power',['right','P+'],['dc','VIN+'],'右侧正极同点 → VIN+','从右控制器处同一动力正极节点分线给降压模块，不是从控制器辅助输出取 36V。');
wire('dc-in-n','power',['right','P-'],['dc','VIN-'],'右侧负极同点 → VIN−','输入负极与右控制器动力负极处同点分线，最终返回电池负极。','ground');
wire('dc-out-p','power',['dc','OUT+'],['l298','12V'],'DC OUT+ → L298N 12V','降压模块标称 12V 输出，作为转向电机驱动支路的动力来源。');
wire('dc-out-n','power',['dc','OUT-'],['l298','GND'],'DC OUT− → L298N GND','转向动力回路的负极回到降压输出负极。','ground');
wire('uno-gnd','ground',['uno','GND'],['ground','G'],'Uno GND → 信号公共地','建立 Uno 与各控制、反馈支路共同的信号参考。');
wire('l298-gnd','ground',['ground','G'],['l298','GND'],'公共地 → L298N GND','直接共地线不能由 ENB 的 10kΩ 下拉电阻代替。');
wire('ref-gnd','ground',['ground','G'],['right','P-'],'公共地 → 控制器参考负极','表达控制信号应共参考地的关系；电机电流仍走原有动力负极线。');
wire('hall-gnd','hall',['hall','GND'],['ground','G'],'霍尔地 → 信号公共地','霍尔信号读取与 Uno 使用相同参考地。','ground');
wire('hall-source','hall',['source','5V'],['hall','5V'],'原霍尔 5V → 分配板','保留单一原霍尔 5V 来源，同时给两轮传感器和六路上拉供电。','power');

const evidence={
 hallBoard:{rows:17,columns:'abcdefghij',supply:{input:'a1',left:'b1',right:'c1'},ground:{input:'f1',left:'g1',right:'h1'},jumpers:[['e1','e3'],['a3','a4'],['b4','b5'],['a5','a6'],['b6','b7'],['a7','a8']],channels:[
  {row:3,channel:'LHU',wheel:'左轮',signal:'HU',pin:'A1'}, {row:4,channel:'LHV',wheel:'左轮',signal:'HV',pin:'A2'}, {row:5,channel:'LHW',wheel:'左轮',signal:'HW',pin:'A3'},
  {row:6,channel:'RHU',wheel:'右轮',signal:'HU',pin:'D10'}, {row:7,channel:'RHV',wheel:'右轮',signal:'HV',pin:'D11'}, {row:8,channel:'RHW',wheel:'右轮',signal:'HW',pin:'D12'}]},

 sensorMount:'原作者介绍：AS5600 当前位于转向电机上方，用于检测电机转动位置。',
 hallSupply:'用户提供的 170 孔板方案：a1 接原霍尔 5V；保留原有来源，不额外并入另一处 5V。',
 ground:{status:'pending',l298Branches:[],sensorBranch:''}
};
return {records,wires,evidence};
})();
