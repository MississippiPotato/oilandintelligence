// Pure teaching transport model. Pump-volume inversion remains the existing M2Core implementation.
export const CONFIG = Object.freeze({
  sourceTime_s: 120, effectiveVolume_m3: 12, flow_m3_s: .025, dt_s: 10,
  pauseStart_s: 300, pauseEnd_s: 480, sourceDepthOriginMD_m: 1200, drillingSpeed_m_s: .006,
  sieveDuration_s: 45, observationDuration_s: 90, recordDuration_s: 60
});

export const PHASES = Object.freeze([
  { id: 'bottom', name: '井底破岩', camera: 'overview', lead: '钻头破碎岩石，先记下这份教学观察的来源时刻。', detail: '来源时刻固定为120 s。钻柱内的绿色路线向下送入钻井液，外侧环空把井底信息带回地面。' },
  { id: 'annulus', name: '环空上返', camera: 'return', lead: '地面的时钟在走，这份观察还在返出途中。', detail: '位置由实际累计泵量决定。教学停泵段Q＝0，累计量形成平台，样品标记停住；恢复泵送后才继续。' },
  { id: 'sieve', name: '筛分取样', camera: 'surface', lead: '返出泥浆到达地面，岩屑在振动筛处分出。', detail: '这里的“到达”由12 m³有效运移体积计算。实际岩屑还会滑移、混合；示意位置不能当成精确的地层定位。' },
  { id: 'observe', name: '地面检测', camera: 'surface', lead: '材料分开观察，时间与身份仍要对得上。', detail: '岩屑接受白光与UV观察；返出气体走独立脱气和检测支路。钻速、钻压等工况直接记录，不等待岩屑上返。' },
  { id: 'record', name: '整理记录', camera: 'interpret', lead: '把观察写成带来源的记录，再进入五个案例。', detail: '岩屑保留在观察台。此阶段移动的方块代表资料流转，记录仍关联120 s的井底来源及较晚的地面到达时刻。' }
]);

export const OBJECTS = Object.freeze([
  { id: 'm1', short: '岩屑', place: '振动筛与样品盘', camera: 'surface', question: '怎样把一盘岩屑说清楚？', copy: '从检出轮廓回到颜色、纹理与相似样品，并区分颗粒数和可见面积。', color: '#B08A4A' },
  { id: 'm2', short: '气测', place: '脱气与组分分析', camera: 'surface', question: '地面的气峰来自更早的哪一刻？', copy: '先按累计泵量归位，再把组分、来源工况和相似事件放在一起解释。', color: '#55768B' },
  { id: 'm3', short: '荧光', place: '白光与UV观察台', camera: 'surface', question: '发光位置怎样量成面积？', copy: '把同一样品的两种照明对齐，核对曝光，在固定可见范围内统计显示像素。', color: '#806482' },
  { id: 'm4', short: '钻时', place: '钻进参数记录台', camera: 'return', question: '钻得变快，是操作还是响应改变？', copy: '钻时和工况直接记录；沿共同深度比较钻速、钻压、转速与候选分段。', color: '#467969' },
  { id: 'm5', short: '综合记录', place: '解释与报告工作台', camera: 'interpret', question: '怎样把观察交成可回查的井段记录？', copy: '保留原文、单位、井段和来源，把岩屑、气测、荧光与钻时汇入待核查的报告。', color: '#B8242A' }
]);

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number(x)));

export function createTransport(core, mode = 'normal') {
  if (!core || !['cumulative', 'at', 'sourceAt', 'arrivalAt'].every(key => typeof core[key] === 'function')) {
    throw new Error('Existing M2Core transport functions are required');
  }
  const scenario = mode === 'pause' ? 'pause' : 'normal';
  let depth = CONFIG.sourceDepthOriginMD_m;
  const rows = Array.from({ length: 121 }, (_, i) => {
    const time_s = i * CONFIG.dt_s;
    const flow = scenario === 'pause' && time_s >= CONFIG.pauseStart_s && time_s < CONFIG.pauseEnd_s ? 0 : CONFIG.flow_m3_s;
    if (i) {
      const previousTime = time_s - CONFIG.dt_s;
      const active = !(scenario === 'pause' && previousTime >= CONFIG.pauseStart_s && previousTime < CONFIG.pauseEnd_s);
      if (active) depth += CONFIG.drillingSpeed_m_s * CONFIG.dt_s;
    }
    return { time_s, flow, depthMD_m: depth };
  });
  const volumes = core.cumulative(rows), volumeRows = rows.map((r, i) => ({ time_s: r.time_s, v: volumes[i] }));
  const sourceVolume = core.at(volumeRows, CONFIG.sourceTime_s, 'v');
  const arrivalTime_s = core.arrivalAt(rows, CONFIG.sourceTime_s, CONFIG.effectiveVolume_m3);
  const sourceReplay_s = core.sourceAt(rows, arrivalTime_s, CONFIG.effectiveVolume_m3);
  const sourceDepthMD_m = core.at(rows, CONFIG.sourceTime_s, 'depthMD_m');
  const observeStart_s = arrivalTime_s + CONFIG.sieveDuration_s;
  const recordStart_s = observeStart_s + CONFIG.observationDuration_s;
  const endTime_s = recordStart_s + CONFIG.recordDuration_s;
  return {
    mode: scenario, rows, volumes, sourceVolume_m3: sourceVolume, sourceDepthMD_m, arrivalTime_s, sourceReplay_s,
    observeStart_s, recordStart_s, endTime_s,
    at(time_s) {
      const time = clamp(time_s, 0, endTime_s), cumulative = core.at(volumeRows, time, 'v');
      // Q is piecewise constant on the left interval, matching M2Core.cumulative, rather than interpolated near pump stops.
      const rowIndex = Math.min(rows.length - 1, Math.floor(time / CONFIG.dt_s));
      const flow = rows[rowIndex].flow, moved = clamp(cumulative - sourceVolume, 0, CONFIG.effectiveVolume_m3);
      const progress = time < CONFIG.sourceTime_s ? 0 : moved / CONFIG.effectiveVolume_m3;
      const phaseIndex = time < CONFIG.sourceTime_s ? 0 : time < arrivalTime_s ? 1 : time < observeStart_s ? 2 : time < recordStart_s ? 3 : 4;
      const phaseStart = [0, CONFIG.sourceTime_s, arrivalTime_s, observeStart_s, recordStart_s][phaseIndex];
      const phaseEnd = [CONFIG.sourceTime_s, arrivalTime_s, observeStart_s, recordStart_s, endTime_s][phaseIndex];
      return {
        mode: scenario, time_s: time, sourceTime_s: CONFIG.sourceTime_s, sourceDepthMD_m, arrivalTime_s, sourceReplay_s,
        lag_s: arrivalTime_s - CONFIG.sourceTime_s, flow_m3_s: flow, cumulativeVolume_m3: cumulative,
        transportedVolume_m3: moved, effectiveVolume_m3: CONFIG.effectiveVolume_m3, transportProgress: progress,
        remainingVolume_m3: CONFIG.effectiveVolume_m3 - moved, remainingTransportTime_s: Math.max(0, arrivalTime_s - time),
        sourceAge_s: Math.max(0, time - CONFIG.sourceTime_s), phaseIndex, phase: PHASES[phaseIndex].id,
        phaseProgress: clamp((time - phaseStart) / (phaseEnd - phaseStart || 1), 0, 1),
        currentDepthMD_m: core.at(rows, time, 'depthMD_m'), pumpStopped: flow === 0,
        materialStopped: phaseIndex === 1 && flow === 0, atSurface: time >= arrivalTime_s,
        complete: time >= endTime_s, endTime_s, sampleId: 'TEACHING-T17', dataNature: 'controlled_teaching_transport'
      };
    },
    phaseTime(index) {
      return [90, CONFIG.sourceTime_s + (arrivalTime_s - CONFIG.sourceTime_s) * .45,
        arrivalTime_s + 20, observeStart_s + 35, recordStart_s + 30][clamp(index, 0, 4)];
    }
  };
}

export function sampleRoute(state) {
  if (state.phaseIndex === 0) return { kind: 'material', segment: 'bottom', fraction: 0 };
  if (state.phaseIndex === 1) return { kind: 'material', segment: 'return', fraction: state.transportProgress };
  if (state.phaseIndex === 2) return { kind: 'material', segment: 'sieve', fraction: state.phaseProgress };
  if (state.phaseIndex === 3) return { kind: 'material', segment: 'observe', fraction: state.phaseProgress };
  return { kind: 'record', segment: 'record', fraction: state.phaseProgress };
}
