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
      if (lci) {
        candidates.push({level: j - 1, reason: 'lci-weight'});
        // Corollary 6.9: k >= j+n-m, including codimension one.
        candidates.push({level: d - p, reason: 'lci-upper'});
      }
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
  // A singular lci m-Du Bois variety must have n-s >= 2m+1.
  // Keep the formal sufficient level in cell(), but do not color vacuous cases.
  const levelLimit = (mode, state) => mode === 'comparison' && state.lci
    ? Math.min(state.m, Math.floor((state.d - state.s - 1) / 2)) : state.m;
  function boundary(mode, p, j, state) {
    if (mode !== 'comparison' || !state.lci || j < 2 ||
        visible(cell(mode, p, j, state), levelLimit(mode, state))) return '';
    const injective = p + j === state.d - state.s;
    const surjectiveLevel = state.d - p - 1;
    const surjective = surjectiveLevel >= 0 && surjectiveLevel <= levelLimit(mode, state) && j >= surjectiveLevel + 2;
    return injective && surjective ? 'I/S' : injective ? 'I' : surjective ? 'S' : '';
  }
  function preset(page) {
    const variations = {
      1: {}, 2: {}, 3: {normal: true}, 4: {lci: true},
      5: {s: 2}, 6: {mode: 'mot', normal: true}, 7: {mode: 'mot', normal: true, s: 2},
      8: {lci: true, s: 5, m: 0}
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
  const api = {DEFAULTS, normalize, cell, visible, levelLimit, boundary, preset, fromHash, toHash};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motivic = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
