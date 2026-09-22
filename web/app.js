(function () {
  'use strict';
  const M = window.Motivic;
  const $ = id => document.getElementById(id);
  let state = M.fromHash(location.hash);
  let selected = null;
  const colors = ['#F3CE77', '#89BDD5', '#ECB58C', '#b9c7a3', '#c4b5d7', '#d7bd9a', '#9ccbc5'];
  const color = level => colors[level] || `hsl(${(level * 47 + 15) % 360} 38% 77%)`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  // KaTeX is vendored in web/vendor; fall back to the raw source if it ever fails to load.
  const tex = (latex, display = false) => window.katex ? window.katex.renderToString(latex, {displayMode: display, throwOnError: false, strict: false}) : escape(latex);
  const groupName = (p, j) => tex(`H^{${p + j}}(${j})`);
  document.querySelectorAll('[data-tex]').forEach(el => {el.innerHTML = tex(el.dataset.tex);});
  document.querySelectorAll('[data-tex-display]').forEach(el => {el.innerHTML = tex(el.dataset.texDisplay, true);});
  const FIGURES = [['vanishing', 'cdh'], ['comparison', 'comparison'], ['motivic', 'mot']];
  const modeOf = id => FIGURES.find(figure => figure[0] === id)[1];
  const SLUG = {vanishing: 'cdh-vanishing', comparison: 'motivic-cdh-comparison', motivic: 'motivic-vanishing'};
  const summary = () => [`n = ${state.d}`, `s = ${state.s}`, `m ≤ ${state.m}`, ...(state.normal ? ['normal'] : []), ...(state.lci ? ['lci'] : [])];

  function describe(mode, p, j) {
    const result = M.cell(mode, p, j, state), k = p + j;
    const shown = M.visible(result, state.m);
    const conclusion = mode === 'comparison' ? 'Comparison is an isomorphism' : 'Vanishing is predicted';
    let detail;
    switch (result.reason) {
      case 'dimension': detail = `Both groups vanish automatically: p = ${p} > n = ${state.d}.`; break;
      case 'weight-zero': detail = 'Weight 0: comparison holds without a singularity assumption.'; break;
      case 'normal': detail = 'Normal + pre-0-Du Bois implies Du Bois. Proposition 3.1 gives comparison in every degree of weight 1.'; break;
      case 'lci-weight': detail = `For an lci variety with m-Du Bois singularities, j ≤ m + 1 gives comparison in every degree. Here j − 1 = ${j - 1}.`; break;
      case 'lci-codimension': detail = `The extra lci range applies: k = ${k} < n − s = ${state.d - state.s}. No additional Du Bois level is needed.`; break;
      case 'comparison': detail = `p = ${p} ≥ s + 2 = ${state.s + 2}, and min{j − 1, n − p} = min{${j - 1}, ${state.d - p}} = ${result.level}.`; break;
      case 'cdh':
      case 'mot': detail = `p = ${p} > j = ${j}, and min{j, n − p} = min{${j}, ${state.d - p}} = ${result.level}.`;
        if (mode === 'mot') detail += j < 2 ? ' Comparison is unrestricted in this low weight.' : ` Also p = ${p} ≥ s + 2 = ${state.s + 2}.`;
        if (result.hatched) detail += j < 2 ? ' Hatched: a proved low-weight case under the relevant level hypothesis.' : ' Hatched in the reference: this boundary case is proved for isolated klt singularities; that extra hypothesis is required.';
        break;
      default:
        detail = mode === 'comparison'
          ? `The general range requires p ≥ s + 2 = ${state.s + 2}; here p = ${p}. No enabled additional comparison range includes this cell.`
          : p <= j ? `The vanishing range requires k > 2j (equivalently p > j). Here k = ${k} and 2j = ${2 * j}.`
          : `For weights j ≥ 2, motivic vanishing also requires p ≥ s + 2 = ${state.s + 2}; here p = ${p}.`;
    }
    let status = result.level === -2 ? 'No assumption needed' : result.level < 0 ? 'No assertion from these ranges' : `Least sufficient m = ${result.level}`;
    if (result.level > state.m) status += ` · beyond displayed m ≤ ${state.m}`;
    const headline = result.level === -2 ? detail : result.level < 0 ? 'No conclusion is asserted for this cell.' : shown ? `${conclusion} at every m ≥ ${result.level}.` : `This cell would be colored at m ≥ ${result.level}.`;
    return {result, shown, detail, status, headline};
  }

  function chart(mode, id) {
    const rows = state.d + 1, columns = rows + Number(state.automatic);
    const unit = 58, left = 39, top = 36, width = left + columns * unit + 22, height = top + rows * unit + 30;
    let cells = '', labels = '', outlines = '';
    const title = mode === 'comparison' ? 'Motivic–cdh comparison' : mode === 'cdh' ? 'cdh vanishing' : 'Motivic vanishing';
    const accessible = `${title}. ${summary().join(', ')}. Columns p = k minus j, rows q = minus j. Arrow keys navigate cells.`;
    for (let j = 0; j < rows; j++) {
      labels += `<text x="${left - 11}" y="${top + (j + .5) * unit + 4}" text-anchor="end">${j === 0 ? 0 : '−' + j}</text>`;
      for (let p = 0; p < columns; p++) {
        const result = M.cell(mode, p, j, state), shown = M.visible(result, state.m);
        const fill = !shown ? '#fffefa' : result.level === -2 ? '#E4E9ED' : color(result.level);
        const x = left + p * unit, y = top + j * unit;
        const details = describe(mode, p, j);
        const current = selected && selected.id === id && selected.p === p && selected.j === j;
        const tabbable = selected && selected.id === id ? current : p === 0 && j === 0;
        const label = `H^${p + j}(${j}), p=${p}, q=${-j}. ${details.status}. ${details.detail}`;
        cells += `<rect x="${x}" y="${y}" width="${unit}" height="${unit}" fill="${fill}" stroke="#c6c9bf" stroke-width=".6"/>`;
        if (shown && result.hatched) cells += `<rect x="${x}" y="${y}" width="${unit}" height="${unit}" fill="url(#hatch-${id})"/>`;
        outlines += `<g class="cell${current ? ' selected' : ''}" role="button" tabindex="${tabbable ? 0 : -1}" data-p="${p}" data-j="${j}" data-chart="${id}" aria-label="${escape(label)}"><title>${escape(label)}</title><rect class="cell-outline" x="${x + 1.5}" y="${y + 1.5}" width="${unit - 3}" height="${unit - 3}" fill="transparent" stroke="transparent" rx="1"/><text x="${x + unit / 2}" y="${y + unit / 2 + 5}" text-anchor="middle" font-size="15" fill="#29342e" pointer-events="none"${p === j ? ` paint-order="stroke" stroke="${fill}" stroke-width="3" stroke-linejoin="round"` : ''}><tspan font-style="italic">H</tspan><tspan baseline-shift="super" font-size="10">${p + j}</tspan><tspan>(${j})</tspan></text></g>`;
      }
    }
    for (let p = 0; p < columns; p++) labels += `<text x="${left + (p + .5) * unit}" y="${top - 11}" text-anchor="middle">${p}</text>`;
    const endX = left + columns * unit, endY = top + rows * unit;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="${escape(accessible)}" font-family="Georgia, 'Times New Roman', serif"><title>${escape(title)}</title><desc>${escape(accessible)}</desc><defs><pattern id="hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M-1,5 L1,7 M0,0 L6,6 M5,-1 L7,1" stroke="#46503d" stroke-width=".65" opacity=".46"/></pattern><marker id="arrow-${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#697666"/></marker></defs>${cells}<path d="M${left},${top} L${left + rows * unit},${endY}" fill="none" stroke="#5a6657" stroke-width="1.2" stroke-dasharray="5 5" pointer-events="none"/><rect x="${left}" y="${top}" width="${columns * unit}" height="${rows * unit}" fill="none" stroke="#7b8576" stroke-width="1"/><path d="M${left},${endY + 11} L${left},${top} L${endX + 12},${top}" fill="none" stroke="#697666" stroke-width="1.1" marker-end="url(#arrow-${id})"/><path d="M${left},${top} L${left},${endY + 12}" stroke="#697666" stroke-width="1.1" marker-end="url(#arrow-${id})"/><g font-size="14" fill="#74806e">${labels}<text x="${endX + 13}" y="${top - 7}" font-style="italic">p</text><text x="${left - 14}" y="${endY + 16}" font-style="italic">q</text></g>${outlines}</svg>`;
  }

  function rules() {
    const hypothesis = `${state.normal ? String.raw`\text{normal, }` : ''}${state.lci ? String.raw`\text{lci, }m\text{-DB}` : String.raw`\text{pre-}m\text{-DB}`}`;
    $('comparison-equation').innerHTML = tex(String.raw`${hypothesis} \;\Longrightarrow\; H^{k}_{\mathrm{mot}}(X,\mathbb{Z}(j)) = H^{k}_{\mathrm{cdh}}(X,\mathbb{Z}(j))`);
  }

  function showDetail(id, p, j, pin = false) {
    const mode = modeOf(id);
    const info = describe(mode, p, j);
    const theory = mode === 'comparison' ? 'Comparison' : mode === 'cdh' ? 'cdh vanishing' : 'Motivic vanishing';
    $(id + '-inspect').innerHTML = `${theory} · ${groupName(p, j)} <span class="detail-coordinates">&nbsp; p = ${p}, q = ${-j}, k = ${p + j}, j = ${j}</span>`;
    $(id + '-detail').innerHTML = `<strong>${info.status}.</strong> ${info.headline} ${info.result.level === -2 ? '' : info.detail}`;
    if (pin) {
      selected = {id, p, j};
      document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
      const container = $(id + '-chart');
      container.querySelectorAll('.cell').forEach(el => el.setAttribute('tabindex', '-1'));
      const target = container.querySelector(`[data-p="${p}"][data-j="${j}"]`);
      target.classList.add('selected');
      target.setAttribute('tabindex', '0');
    }
  }

  function render(updateHash = true) {
    state = M.normalize({...state, mode: 'cdh', automatic: false});
    if (selected && (selected.p > state.d + Number(state.automatic) || selected.j > state.d)) selected = null;
    for (const el of document.querySelectorAll('[data-control]')) {
      const key = el.dataset.control;
      if (el.type === 'checkbox') el.checked = state[key];
      else el.value = state[key];
      if (key === 'd') el.min = state.normal ? 2 : 1;
      if (key === 's') el.max = state.d - (state.normal ? 2 : 1);
      if (key === 'm') el.max = Math.max(6, state.d, state.m);
    }
    document.querySelectorAll('[data-level-value]').forEach(el => {el.innerHTML = tex(`m \\le ${state.m}`);});
    $('dimension-live').innerHTML = tex(`n = \\dim X = ${state.d}`);
    $('comparison-dimension-live').innerHTML = tex(`n = \\dim X = ${state.d}`);
    $('auto-range').innerHTML = tex(`p > ${state.d}`);
    document.querySelectorAll('[data-step]').forEach(button => {
      const [key, delta] = button.dataset.step.split(':');
      const normalized = M.normalize({...state, [key]: state[key] + Number(delta)});
      button.disabled = normalized[key] === state[key];
    });
    rules();
    for (const [id, mode] of FIGURES) {
      $(id + '-chart').innerHTML = chart(mode, id);
      $(id + '-chart').style.minWidth = `${(state.d + 1 + Number(state.automatic)) * 42 + 42}px`;
    }
    let legend = '';
    for (let m = 0; m <= state.m; m++) legend += `<span class="legend-item"><i style="background:${color(m)}"></i>m = ${m}</span>`;
    for (const [id] of FIGURES) {
      $(id + '-legend').innerHTML = legend + '<span class="legend-item"><i style="background:#E4E9ED"></i>no assumption</span><span class="legend-item"><i style="background:#fffefa"></i>no assertion</span>';
    }
    for (const [id] of FIGURES) {
      if (selected && selected.id === id) continue;
      $(id + '-inspect').textContent = 'A closer look';
      $(id + '-detail').textContent = 'Hover, focus, or select a cell to see its degree, weight, and exact condition. Arrow keys move around the grid.';
    }
    if (selected) showDetail(selected.id, selected.p, selected.j);
    if (updateHash) {
      try {history.replaceState(null, '', '#' + M.toHash(state));} catch { /* file:// still works without history support. */ }
    }
    $('status').textContent = `Diagrams updated: ${summary().join(', ')}.`;
  }

  function update(patch) { state = {...state, ...patch}; render(); }
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    const [key, delta] = button.dataset.step.split(':'); update({[key]: state[key] + Number(delta)});
  }));
  document.querySelectorAll('[data-control]').forEach(el => {
    const key = el.dataset.control;
    el.addEventListener(el.type === 'range' ? 'input' : 'change', event => update({
      [key]: el.type === 'checkbox' ? event.target.checked : event.target.value === '' ? state[key] : event.target.value,
    }));
  });
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
    state = {...M.DEFAULTS}; selected = null; render();
  }));
  window.addEventListener('hashchange', () => {state = M.fromHash(location.hash); selected = null; render(false);});

  for (const [id] of FIGURES) {
    const container = $(id + '-chart');
    const interact = (event, pin) => {
      const cell = event.target.closest('.cell');
      if (cell) showDetail(id, Number(cell.dataset.p), Number(cell.dataset.j), pin);
    };
    container.addEventListener('pointerover', event => interact(event, false));
    container.addEventListener('focusin', event => interact(event, true));
    container.addEventListener('click', event => interact(event, true));
    container.addEventListener('pointerleave', () => {if (selected) showDetail(selected.id, selected.p, selected.j);});
    container.addEventListener('keydown', event => {
      const cell = event.target.closest('.cell');
      if (!cell) return;
      let p = Number(cell.dataset.p), j = Number(cell.dataset.j);
      const movement = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
      if (movement[event.key]) {event.preventDefault(); p += movement[event.key][0]; j += movement[event.key][1];}
      else if (event.key === 'Home') {event.preventDefault(); p = 0;}
      else if (event.key === 'End') {event.preventDefault(); p = state.d + Number(state.automatic);}
      else if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); showDetail(id, p, j, true); return;}
      else return;
      p = Math.max(0, Math.min(state.d + Number(state.automatic), p)); j = Math.max(0, Math.min(state.d, j));
      container.querySelector(`[data-p="${p}"][data-j="${j}"]`).focus();
    });
  }

  document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.export, svg = $(id + '-chart').querySelector('svg').cloneNode(true);
    const [,, width, height] = svg.getAttribute('viewBox').split(' ').map(Number);
    const ns = 'http://www.w3.org/2000/svg', wrapper = document.createElementNS(ns, 'svg');
    const extra = 188 + Math.floor(state.m / 7) * 23;
    wrapper.setAttribute('xmlns', ns); wrapper.setAttribute('viewBox', `0 0 ${width} ${height + extra}`);
    wrapper.setAttribute('width', width); wrapper.setAttribute('height', height + extra);
    const background = document.createElementNS(ns, 'rect'); background.setAttribute('width', '100%'); background.setAttribute('height', '100%'); background.setAttribute('fill', '#fffefa'); wrapper.append(background);
    const addText = (text, x, y, size = 12) => {const el = document.createElementNS(ns, 'text'); el.textContent = text; el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('font-family', 'Georgia, serif'); el.setAttribute('font-size', size); el.setAttribute('fill', '#263c34'); wrapper.append(el);};
    addText($(id + '-title').textContent, 20, 28, 21); addText(summary().join(' · '), 20, 51);
    svg.setAttribute('y', '63'); svg.setAttribute('width', width); svg.setAttribute('height', height);
    svg.querySelectorAll('.cell-outline').forEach(el => el.remove()); wrapper.append(svg);
    let x = 22, y = height + 86;
    for (let m = 0; m <= Math.min(state.m, state.d); m++) {
      if (x > width - 80) {x = 22; y += 23;}
      const rect = document.createElementNS(ns, 'rect'); for (const [name, value] of Object.entries({x, y: y - 11, width: 12, height: 12, fill: color(m)})) rect.setAttribute(name, value); wrapper.append(rect); addText(`m = ${m}`, x + 18, y); x += 72;
    }
    addText('Gray: no assumption. White: no assertion at these levels.', 22, y + 23, 10);
    addText('Dashed: k = 2j. Colors show the least sufficient m.', 22, y + 41, 10);
    addText(id === 'comparison' ? `${state.normal ? 'normal, ' : ''}${state.lci ? 'lci, m-DB' : 'pre-m-DB'}` : id === 'motivic' ? 'Normal projective, pre-m-rational · Conjecture 3.10' : 'D_m · Conjecture G(iii); weight-2 hatching: isolated klt only.', 22, y + 59, 10);
    const data = new XMLSerializer().serializeToString(wrapper), url = URL.createObjectURL(new Blob([data], {type: 'image/svg+xml'}));
    const link = document.createElement('a'); link.href = url; link.download = `${SLUG[id]}-n${state.d}-s${state.s}-m${state.m}.svg`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('status').textContent = 'Diagram downloaded as SVG.';
  }));
  render(false);
})();
