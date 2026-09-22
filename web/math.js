/* Cell rules transcribed from motivic-diagrams-tikz.tex, modes 0, 1 and 2.
 * -2 = automatic, -1 = no assertion, >=0 = least sufficient level m.
 * The visibility cutoff is separate: a result at m=3 must not become
 * mathematically indistinguishable from a cell with no assertion.
 */
(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({d: 6, s: 0, m: 2, normal: false, lci: false, mode: 'cdh', automatic: false});
  const clampInt = (value, min, max, fallback) => {
    if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(Number(value))));
  };
  function normalize(input = {}) {
    const state = {...DEFAULTS, ...input};
    state.mode = state.mode === 'mot' ? 'mot' : 'cdh';
    state.normal = state.mode === 'mot' || state.normal === true;
    state.lci = state.lci === true;
    state.automatic = state.automatic === true;
    state.d = clampInt(state.d, state.normal ? 2 : 1, 24, 6);
    state.s = clampInt(state.s, 0, state.d - (state.normal ? 2 : 1), 0);
    state.m = clampInt(state.m, 0, 24, 2);
    return state;
  }
  function cell(mode, p, j, state) {
    const {d, s, normal, lci} = state;
    let level = -1, hatched = false, reason = 'outside';
    if (p > d) return {level: -2, hatched, reason: 'dimension'};
    if (mode === 'comparison') {
      if (j === 0) return {level: -2, hatched, reason: 'weight-zero'};
      const candidates = [];
      if (lci) candidates.push({level: j - 1, reason: 'lci-weight'});
      if (p >= s + 2) candidates.push({level: Math.min(j - 1, d - p), reason: 'comparison'});
      if (normal && j === 1) candidates.push({level: 0, reason: 'normal'});
      if (lci && p + j < d - s) candidates.unshift({level: 0, reason: 'lci-codimension'});
      candidates.sort((a, b) => a.level - b.level);
      return {...(candidates[0] || {level, reason}), hatched};
    }
    if (p > j && (mode === 'cdh' || j < 2 || p >= s + 2)) {
      level = Math.min(j, d - p);
      hatched = j < 2 || (mode === 'cdh' && j === 2 && p === d);
      reason = mode === 'cdh' ? 'cdh' : 'mot';
    }
    return {level, hatched, reason};
  }
  const visible = (result, m) => result.level === -2 || (result.level >= 0 && result.level <= m);
  function preset(page) {
    const variations = {
      1: {}, 2: {}, 3: {normal: true}, 4: {lci: true},
      5: {s: 2}, 6: {mode: 'mot', normal: true}, 7: {mode: 'mot', normal: true, s: 2}
    };
    return normalize({...DEFAULTS, ...variations[page]});
  }
  function fromHash(hash) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const state = {...DEFAULTS};
    for (const key of ['d', 's', 'm']) if (params.has(key)) state[key] = params.get(key);
    for (const key of ['normal', 'lci', 'automatic']) if (params.has(key)) state[key] = params.get(key) === '1';
    if (params.has('mode')) state.mode = params.get('mode');
    return normalize(state);
  }
  function toHash(state) {
    return new URLSearchParams(Object.entries(state).map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value])).toString();
  }
  const api = {DEFAULTS, normalize, cell, visible, preset, fromHash, toHash};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motivic = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
