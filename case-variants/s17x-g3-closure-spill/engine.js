(function (g) {
  'use strict';
  const W = 49, H = 41, CELL = 50, EPS = 1e-8;
  const defaults = Object.freeze({ scenario: 'side', saddle: 34, tilt: 0, noise: .8, sampleStep: 1, axis: 'ew', fill: .65, seed: 2026, candidateX: 24, candidateY: 20 });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const boundary = (i, w, h) => i % w === 0 || i % w === w - 1 || Math.floor(i / w) === 0 || Math.floor(i / w) === h - 1;
  function neighbors(i, w, h) {
    const x = i % w, y = Math.floor(i / w), out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h) out.push((y + dy) * w + x + dx);
    return out;
  }
  function noiseAt(x, y, seed) {
    let n = (Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ (seed >>> 0)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296 * 2 - 1;
  }
  function cleanDepth(x, y, p) {
    const u = (x - 24) / 24, v = (y - 20) / 20;
    if (p.scenario === 'open') return 1060 + 45 * v + (8 + p.tilt) * u;
    const dome = 1000 + 76 * (1 - Math.exp(-4 * (u * u + 1.2 * v * v)));
    let d = dome;
    if (p.scenario === 'side' && v <= 0) {
      const r = -v, shape = r <= .55 ? r / .55 : 1 - (r - .55) / .45 * .4;
      const channel = 1000 + p.saddle * shape + 220 * (u / .18) ** 2;
      d = Math.min(dome, channel);
    }
    return d + p.tilt * u;
  }
  function generate(options = {}) {
    const p = { ...defaults, ...options }, step = [1, 2, 4].includes(+p.sampleStep) ? +p.sampleStep : 1;
    const reference = Array.from({ length: W * H }, (_, i) => cleanDepth(i % W, Math.floor(i / W), p)), samples = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) samples.push({ x, y, depth_m: reference[y * W + x] + p.noise * noiseAt(x, y, p.seed) });
    return {
      observations: { w: W, h: H, cellSize_m: CELL, sampleStep: step, samples, depthConvention: 'positive_down', boundary: 'open_outer_cells', dataNature: 'synthetic_teaching', datasetId: 'closure-spill-synthetic-v1' },
      evaluationTruth: { w: W, h: H, cellSize_m: CELL, depths: reference, dataNature: 'synthetic_clean_reference', datasetId: 'closure-spill-synthetic-v1' }
    };
  }
  function reconstruct(observations) {
    const { w, h, cellSize_m } = observations, step = observations.sampleStep, sampleMap = new Map(observations.samples.map(s => [s.y * w + s.x, s.depth_m]));
    const depths = Array.from({ length: w * h }, (_, i) => {
      const x = i % w, y = Math.floor(i / w), x0 = Math.floor(x / step) * step, y0 = Math.floor(y / step) * step, x1 = Math.min(w - 1, x0 + step), y1 = Math.min(h - 1, y0 + step);
      const tx = x1 === x0 ? 0 : (x - x0) / (x1 - x0), ty = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      const corners = [sampleMap.get(y0 * w + x0), sampleMap.get(y0 * w + x1), sampleMap.get(y1 * w + x0), sampleMap.get(y1 * w + x1)];
      if (corners.some(v => !Number.isFinite(v))) throw Error('采样点不足以完成当前网格的双线性插值。');
      return (1 - ty) * ((1 - tx) * corners[0] + tx * corners[1]) + ty * ((1 - tx) * corners[2] + tx * corners[3]);
    });
    return { w, h, cellSize_m, depths };
  }
  function localApex(grid, candidate) {
    let current = clamp(Math.round(candidate.y), 0, grid.h - 1) * grid.w + clamp(Math.round(candidate.x), 0, grid.w - 1);
    const path = [current];
    while (!boundary(current, grid.w, grid.h)) {
      let best = current;
      for (const j of neighbors(current, grid.w, grid.h)) if (grid.depths[j] < grid.depths[best] - EPS || (Math.abs(grid.depths[j] - grid.depths[best]) < EPS && j < best && grid.depths[j] < grid.depths[current] - EPS)) best = j;
      if (best === current) break; current = best; path.push(current);
    }
    return { index: current, x: current % grid.w, y: Math.floor(current / grid.w), depth_m: grid.depths[current], path, onBoundary: boundary(current, grid.w, grid.h) };
  }
  class Heap {
    constructor() { this.a = []; }
    less(a, b) { return a.cost < b.cost || (a.cost === b.cost && a.index < b.index); }
    push(q) { const a = this.a; a.push(q); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (!this.less(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
    pop() { const a = this.a, q = a[0], end = a.pop(); if (a.length) { a[0] = end; let i = 0; while (true) { const l = i * 2 + 1, r = l + 1; let s = i; if (l < a.length && this.less(a[l], a[s])) s = l; if (r < a.length && this.less(a[r], a[s])) s = r; if (s === i) break; [a[i], a[s]] = [a[s], a[i]]; i = s; } } return q; }
  }
  function minimax(grid, apex) {
    const n = grid.w * grid.h, costs = new Float64Array(n).fill(Infinity), parent = new Int32Array(n).fill(-1), settled = new Uint8Array(n), heap = new Heap(), visited = [];
    costs[apex.index] = grid.depths[apex.index]; heap.push({ index: apex.index, cost: costs[apex.index] }); let exit = apex.index;
    while (heap.a.length) {
      const q = heap.pop(), i = q.index; if (settled[i]) continue; settled[i] = 1; visited.push(i);
      if (boundary(i, grid.w, grid.h)) { exit = i; break; }
      for (const j of neighbors(i, grid.w, grid.h)) { const cost = Math.max(q.cost, grid.depths[j]); if (cost < costs[j]) { costs[j] = cost; parent[j] = i; heap.push({ index: j, cost }); } }
    }
    const path = []; for (let i = exit; i >= 0; i = parent[i]) path.push(i); path.reverse();
    let spillIndex = path[0]; for (const i of path) if (grid.depths[i] > grid.depths[spillIndex] + EPS) spillIndex = i;
    return { spillDepth_m: costs[exit], spillIndex, exitIndex: exit, path, visited, method: '8-neighbor minimax path' };
  }
  function componentAt(grid, start, level, inclusive = false) {
    const mask = Array(grid.w * grid.h).fill(0), eligible = i => inclusive ? grid.depths[i] <= level + EPS : grid.depths[i] < level - EPS;
    if (!eligible(start)) return { mask, count: 0, touchesBoundary: false, volume_m3: 0, area_m2: 0 };
    const queue = [start]; mask[start] = 1; let volume = 0, touches = false;
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k]; volume += Math.max(0, level - grid.depths[i]) * grid.cellSize_m ** 2; if (boundary(i, grid.w, grid.h)) touches = true;
      for (const j of neighbors(i, grid.w, grid.h)) if (!mask[j] && eligible(j)) { mask[j] = 1; queue.push(j); }
    }
    return { mask, count: queue.length, touchesBoundary: touches, volume_m3: volume, area_m2: queue.length * grid.cellSize_m ** 2 };
  }
  function summarize(grid, apex, outlet) {
    const region = componentAt(grid, apex.index, outlet.spillDepth_m), closureHeight_m = Math.max(0, outlet.spillDepth_m - apex.depth_m);
    return { apex, ...outlet, ...region, closureHeight_m, closed: closureHeight_m > EPS && !region.touchesBoundary, totalCells: grid.w * grid.h };
  }
  function sectionBaseline(grid, apex, axis = 'ew') {
    const paths = [-1, 1].map(sign => { const a = [apex.index]; let x = apex.x, y = apex.y; while (!boundary(a[a.length - 1], grid.w, grid.h)) { if (axis === 'ns') y += sign; else x += sign; a.push(y * grid.w + x); } return a; });
    const depth = paths.map(path => Math.max(...path.map(i => grid.depths[i]))), k = depth[0] <= depth[1] ? 0 : 1, path = paths[k];
    let spillIndex = path[0]; for (const i of path) if (grid.depths[i] > grid.depths[spillIndex] + EPS) spillIndex = i;
    return summarize(grid, apex, { spillDepth_m: depth[k], spillIndex, exitIndex: path[path.length - 1], path, visited: path, method: axis === 'ns' ? 'north-south section only' : 'east-west section only', axis });
  }
  function analyzeGrid(grid, config = {}) {
    const candidate = { x: config.candidateX ?? 24, y: config.candidateY ?? 20 }, apex = localApex(grid, candidate);
    return { grid, candidate, prediction: summarize(grid, apex, minimax(grid, apex)), baseline: sectionBaseline(grid, apex, config.axis || 'ew') };
  }
  function infer(observations, config = {}) { return analyzeGrid(reconstruct(observations), config); }
  function fillAt(grid, prediction, fraction) {
    const input = prediction.volume_m3 * fraction, retained = Math.min(input, prediction.volume_m3); let lo = prediction.apex.depth_m, hi = prediction.spillDepth_m;
    if (prediction.volume_m3 > EPS && retained < prediction.volume_m3) for (let k = 0; k < 35; k++) { const mid = (lo + hi) / 2, v = componentAt(grid, prediction.apex.index, mid).volume_m3; if (v < retained) lo = mid; else hi = mid; }
    const depth = retained >= prediction.volume_m3 ? prediction.spillDepth_m : (lo + hi) / 2;
    return { fraction, input_m3: input, retained_m3: retained, excess_m3: Math.max(0, input - retained), contactDepth_m: depth, ...componentAt(grid, prediction.apex.index, depth) };
  }
  function evaluate(inference, truth, config = {}) {
    if (truth.w !== inference.grid.w || truth.h !== inference.grid.h || truth.cellSize_m !== inference.grid.cellSize_m) throw Error('评价与预测的网格或比例尺不同。');
    const reference = analyzeGrid({ w: truth.w, h: truth.h, cellSize_m: truth.cellSize_m, depths: truth.depths.slice() }, config).prediction;
    const one = predicted => { let intersection = 0, union = 0; for (let i = 0; i < reference.mask.length; i++) { if (predicted.mask[i] && reference.mask[i]) intersection++; if (predicted.mask[i] || reference.mask[i]) union++; } return { spillAbsoluteError_m: Math.abs(predicted.spillDepth_m - reference.spillDepth_m), maskIoU: union ? intersection / union : 1, volumeAbsoluteError_m3: Math.abs(predicted.volume_m3 - reference.volume_m3), volumeRelativeError: reference.volume_m3 > EPS ? Math.abs(predicted.volume_m3 - reference.volume_m3) / reference.volume_m3 : null, referenceEmpty: reference.count === 0, evaluatedCells: reference.mask.length }; };
    return { model: one(inference.prediction), baseline: one(inference.baseline), reference, protocol: 'Same 49×41 grid and candidate input; complete noiseless synthetic surface; reference used only after inference.' };
  }
  function run(options = {}) {
    const params = { ...defaults, ...options }, generated = generate(params), inference = infer(generated.observations, params), evaluation = evaluate(inference, generated.evaluationTruth, params);
    return { params, observations: generated.observations, ...inference, evaluationTruth: generated.evaluationTruth, evaluation, fill: fillAt(inference.grid, inference.prediction, params.fill), dataSource: '确定性教学顶面；有噪声规则采样，双线性重建；完整无噪声顶面在预测后评价。' };
  }
  g.VariantEngine = { defaults, W, H, CELL, generate, reconstruct, localApex, minimax, componentAt, summarize, sectionBaseline, analyzeGrid, infer, fillAt, evaluate, run };
})(globalThis);
