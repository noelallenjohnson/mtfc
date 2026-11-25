/* Mass Timber Economic Taxonomy: isometric figure of end user by attribute class, by project type */
(function () {
  var D = window.TX_DATA, fig = document.getElementById('tx-fig');
  if (!D || !fig) return;
  var CL = ['S', 'E', 'C'], US = ['O', 'I', 'P'], cname = {}, uname = {};
  D.classes.forEach(function (c) { cname[c.key] = c.name.trim(); });
  D.users.forEach(function (u) { uname[u.key] = u.name.trim(); });
  var COL = { S: ['#a67c3d', '#7d5c2b', '#94702f'], E: ['#3f7d5a', '#2c5a40', '#37704f'], C: ['#4a6fa5', '#334f79', '#40618f'] };
  var st = { p: D.projects[0].key, u: 'O', c: 'S' };
  function proj() { return D.projects.filter(function (p) { return p.key === st.p; })[0]; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function attrs(u, c) { return D.attributes.filter(function (a) { return a.cls === c && a.users.indexOf(u) >= 0; }); }

  /* isometric helpers: r = row (end user), c = column (class), z = height */
  var TW = 92, TH = 46, OX = 300, OY = 138, UNIT = 38;
  function pt(r, c, z) { return [OX + (c - r) * TW, OY + (c + r) * TH - z]; }
  function poly(ps, fill, extra) { return '<polygon points="' + ps.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="' + fill + '"' + (extra || '') + '/>'; }

  function drawFig() {
    var P = proj(), s = '<svg viewBox="0 0 720 450" role="img" aria-label="Three-dimensional chart: emphasis for each end user and attribute class on a ' + esc(P.name.trim()) + ' project">';
    /* floor */
    s += poly([pt(0, 0, 0), pt(0, 3, 0), pt(3, 3, 0), pt(3, 0, 0)], '#f4f2ec', ' stroke="#e3e0d8"');
    var order = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) order.push([r, c]);
    order.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
    var g = 0.09;
    order.forEach(function (rc) {
      var r = rc[0], c = rc[1], u = US[r], k = CL[c], lv = P.emphasis[u][c], z = lv ? 10 + lv * UNIT : 4, col = lv ? COL[k] : ['#e6e3db', '#cfcbc0', '#dad6cc'];
      var a = pt(r + g, c + g, z), b = pt(r + g, c + 1 - g, z), d = pt(r + 1 - g, c + 1 - g, z), e = pt(r + 1 - g, c + g, z);
      var e0 = pt(r + 1 - g, c + g, 0), d0 = pt(r + 1 - g, c + 1 - g, 0), b0 = pt(r + g, c + 1 - g, 0);
      var on = st.u === u && st.c === k, n = attrs(u, k).length, cx = (a[0] + d[0]) / 2, cy = (a[1] + d[1]) / 2;
      s += '<g class="blk' + (on ? ' is-on' : '') + '" data-u="' + u + '" data-c="' + k + '" tabindex="0" role="button" aria-label="' + uname[u] + ', ' + cname[k] + ': ' + D.tool.levels[lv] + ', ' + n + ' attributes">'
        + poly([e, d, d0, e0], col[1], ' stroke="#fff" stroke-width="1"') + poly([d, b, b0, d0], col[2], ' stroke="#fff" stroke-width="1"') + poly([a, b, d, e], col[0], on ? ' stroke="#1a1a18" stroke-width="3"' : ' stroke="#fff" stroke-width="1"')
        + '<text x="' + cx + '" y="' + (cy + 1) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + (lv ? '#fff' : '#8a877f') + '">' + D.tool.levels[lv] + '</text>'
        + '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="10.5" fill="' + (lv ? 'rgba(255,255,255,.85)' : '#a3a096') + '">' + n + (n === 1 ? ' attribute' : ' attributes') + '</text></g>';
    });
    /* axis labels */
    CL.forEach(function (k, c) { var p = pt(3, c + 0.5, 0); s += '<text x="' + (p[0] - 12) + '" y="' + (p[1] + 22) + '" text-anchor="end" font-size="14" font-weight="700" fill="' + COL[k][1] + '">' + cname[k] + '</text>'; });
    US.forEach(function (u, r) { var p = pt(r + 0.5, 3, 0); s += '<text x="' + (p[0] + 14) + '" y="' + (p[1] + 14) + '" text-anchor="start" font-size="14" font-weight="700" fill="#1a1a18">' + uname[u] + '</text>'; });
    fig.innerHTML = s + '</svg>';
    fig.querySelectorAll('.blk').forEach(function (b) {
      function pick() { st.u = b.getAttribute('data-u'); st.c = b.getAttribute('data-c'); draw(); }
      b.addEventListener('click', pick);
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); var n = fig.querySelector('.blk[data-u="' + st.u + '"][data-c="' + st.c + '"]'); if (n) n.focus(); } });
    });
  }

  function drawGrid() {
    var P = proj(), el = document.getElementById('tx-grid'), h = '<span></span>';
    CL.forEach(function (k) { h += '<span class="h">' + cname[k] + '</span>'; });
    US.forEach(function (u) {
      h += '<span class="r">' + uname[u] + '</span>';
      CL.forEach(function (k, c) { var lv = P.emphasis[u][c]; h += '<button type="button" class="' + k + ' l' + lv + (st.u === u && st.c === k ? ' is-on' : '') + '" data-u="' + u + '" data-c="' + k + '" aria-pressed="' + (st.u === u && st.c === k) + '">' + D.tool.levels[lv] + '<small>' + attrs(u, k).length + ' attr.</small></button>'; });
    });
    el.innerHTML = h;
    el.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { st.u = b.getAttribute('data-u'); st.c = b.getAttribute('data-c'); draw(); var n = el.querySelector('button.is-on'); if (n) n.focus(); }); });
  }

  function drawCell() {
    var P = proj(), lv = P.emphasis[st.u][CL.indexOf(st.c)], list = attrs(st.u, st.c);
    var h = '<h3>' + uname[st.u] + ' × ' + cname[st.c] + '</h3><p class="lvl">Emphasis on this project: ' + D.tool.levels[lv] + '</p>';
    if (!list.length) h += '<p class="none">None of the three studies identified an attribute here.</p>';
    else h += '<ul>' + list.map(function (a) { return '<li><b>' + esc(a.name) + '</b><span class="tx-chips">' + a.src.map(function (x) { return '<i>' + esc(D.sources[x].trim()) + '</i>'; }).join('') + '</span>' + esc(a.note) + '</li>'; }).join('') + '</ul>';
    document.getElementById('tx-cell').innerHTML = h;
  }

  function drawAdvice() {
    var P = proj(), L = D.tool.labels;
    document.getElementById('tx-eg').textContent = P.eg.trim();
    document.getElementById('tx-advice').innerHTML = '<div class="lead"><b>' + esc(L.lead) + '</b>' + esc(P.lead) + '</div><div class="shows"><b>' + esc(L.shows) + '</b>' + esc(P.shows) + '</div><div><b>' + esc(L.who) + '</b>' + esc(P.who) + '</div><div class="shows"><b>' + esc(L.prove) + '</b>' + esc(P.prove) + '</div><div class="shows"><b>' + esc(L.demote) + '</b>' + esc(P.demote) + '</div>';
  }

  function strongest() { /* open on the tallest block for the chosen project */
    var P = proj(), best = -1;
    US.forEach(function (u) { CL.forEach(function (k, c) { var v = P.emphasis[u][c] * 10 + attrs(u, k).length; if (v > best) { best = v; st.u = u; st.c = k; } }); });
  }
  function draw() { drawFig(); drawGrid(); drawCell(); drawAdvice(); }
  document.querySelectorAll('#tx .tx-seg button').forEach(function (b) {
    b.setAttribute('aria-pressed', b.classList.contains('is-on'));
    b.addEventListener('click', function () {
      st.p = b.getAttribute('data-p'); strongest();
      document.querySelectorAll('#tx .tx-seg button').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      draw();
    });
  });
  strongest(); draw();
})();
