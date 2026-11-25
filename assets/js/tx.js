/* Mass Timber Economic Taxonomy: isometric figure of end user by attribute class, by project type */
(function () {
  var D = window.TX_DATA, fig = document.getElementById('tx-fig');
  if (!D || !fig) return;
  var CL = ['S', 'E', 'C'], US = ['O', 'I', 'P'], cname = {}, uname = {};
  D.classes.forEach(function (c) { cname[c.key] = c.name.trim(); });
  D.users.forEach(function (u) { uname[u.key] = u.name.trim(); });
  var COL = { S: ['#a67c3d', '#7d5c2b', '#94702f'], E: ['#3f7d5a', '#2c5a40', '#37704f'], C: ['#4a6fa5', '#334f79', '#40618f'] };
  var PALE = { S: ['#ecdfc6', '#d6c5a3', '#e1d2b5'], E: ['#d3e5da', '#b5cfc0', '#c4dacd'], C: ['#d5dfef', '#b7c6de', '#c6d2e7'] };
  var FLAT = ['#ebe9e3', '#d5d1c7', '#dfdcd3'];
  var LV = D.tool.levels, NA = (D.tool.na || 'Not applicable').trim(), st = { p: D.projects[0].key, u: 'O' };
  function proj() { return D.projects.filter(function (p) { return p.key === st.p; })[0]; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function attrs(u, c) { return D.attributes.filter(function (a) { return a.cls === c && a.users.indexOf(u) >= 0; }); }

  /* isometric helpers: r = row position (end user), c = column (class), z = height */
  var TW = 104, TH = 52, OX = 468, OY = 132, UNIT = 36, GAP = 1.3;
  function pt(r, c, z) { return [OX + (c - r) * TW, OY + (c + r) * TH - z]; }
  function poly(ps, fill, extra) { return '<polygon points="' + ps.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="' + fill + '"' + (extra || '') + '/>'; }

  function drawFig() {
    var P = proj(), s = '<svg viewBox="0 0 940 520" role="img" aria-label="Three-dimensional chart of emphasis for each end user and attribute class on a ' + esc(P.name.trim()) + ' project. ' + uname[st.u] + ' are selected.">';
    US.forEach(function (u, ri) {
      var r = ri * GAP, on = st.u === u;
      s += poly([pt(r, 0, 0), pt(r, 3, 0), pt(r + 1, 3, 0), pt(r + 1, 0, 0)], on ? '#f1eee6' : '#f7f6f3', ' stroke="' + (on ? '#1a1a18' : '#e6e3db') + '" stroke-width="' + (on ? 2 : 1) + '"');
      var g = 0.08;
      CL.forEach(function (k, c) {
        var raw = P.emphasis[u][c], na = raw === 'na', lv = na ? 0 : raw, z = lv ? 8 + lv * UNIT : 5, col = !lv ? FLAT : (on ? COL[k] : PALE[k]);
        var a = pt(r + g, c + g, z), b = pt(r + g, c + 1 - g, z), d = pt(r + 1 - g, c + 1 - g, z), e = pt(r + 1 - g, c + g, z);
        var e0 = pt(r + 1 - g, c + g, 0), d0 = pt(r + 1 - g, c + 1 - g, 0), b0 = pt(r + g, c + 1 - g, 0), cx = (a[0] + d[0]) / 2, cy = (a[1] + d[1]) / 2;
        s += '<g class="blk" data-u="' + u + '" tabindex="0" role="button" aria-label="' + uname[u] + ', ' + cname[k] + ': ' + (na ? NA : LV[lv]) + '">'
          + poly([e, d, d0, e0], col[1], ' stroke="#fff"') + poly([d, b, b0, d0], col[2], ' stroke="#fff"') + poly([a, b, d, e], col[0], ' stroke="#fff"')
          + (on ? '<text x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="17" font-weight="700" fill="' + (lv ? '#fff' : '#8a877f') + '">' + (na ? 'n/a' : lv ? LV[lv] : '–') + '</text>' : '') + '</g>';
      });
      var p = pt(r + 0.5, 3, 0);
      s += '<text x="' + (p[0] + 16) + '" y="' + (p[1] + 12) + '" font-size="18" font-weight="' + (on ? 700 : 500) + '" fill="' + (on ? '#1a1a18' : '#8a877f') + '">' + uname[u] + '</text>';
    });
    CL.forEach(function (k, c) { var p = pt(2 * GAP + 1, c + 0.5, 0); s += '<text x="' + (p[0] - 14) + '" y="' + (p[1] + 26) + '" text-anchor="end" font-size="18" font-weight="700" fill="' + COL[k][1] + '">' + cname[k] + '</text>'; });
    fig.innerHTML = s + '</svg>';
    fig.querySelectorAll('.blk').forEach(function (b) {
      function pick() { setUser(b.getAttribute('data-u')); }
      b.addEventListener('click', pick);
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  function drawResult() {
    var P = proj(), h = '';
    CL.forEach(function (k, c) {
      var raw = P.emphasis[st.u][c], na = raw === 'na', lv = na ? 0 : raw, list = na ? [] : attrs(st.u, k);
      h += '<div class="tx-res ' + k + ' l' + lv + '"><header><b>' + cname[k] + '</b><span>' + (na ? NA : LV[lv]) + '</span></header><div class="meter" aria-hidden="true">' + [1, 2, 3].map(function (i) { return '<i' + (i <= lv ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'
        + (list.length ? '<ul>' + list.map(function (a) { return '<li title="' + esc(a.note).replace(/"/g, '&quot;') + '">' + esc(a.name) + '</li>'; }).join('') + '</ul>' : '<p class="none">' + (na ? esc((P.na_note || D.tool.na_text || '').trim()) : 'No attribute identified here.') + '</p>') + '</div>';
    });
    document.getElementById('tx-result').innerHTML = h;
    document.getElementById('tx-who').textContent = uname[st.u] + ', ' + P.name.trim().toLowerCase();
  }

  function drawAdvice() {
    var P = proj(), L = D.tool.labels;
    document.getElementById('tx-eg').innerHTML = esc(P.eg.trim()) + '. <b>' + esc(L.who.trim()) + ':</b> ' + esc(P.who.trim());
    document.getElementById('tx-advice').innerHTML = '<div class="lead"><b>' + esc(L.lead) + '</b>' + esc(P.lead) + '</div><div><b>' + esc(L.shows) + '</b>' + esc(P.shows) + '</div><div><b>' + esc(L.prove) + '</b>' + esc(P.prove) + '</div><div><b>' + esc(L.demote) + '</b>' + esc(P.demote) + '</div>';
  }

  function sync() {
    document.querySelectorAll('#tx [data-p]').forEach(function (x) { var on = x.getAttribute('data-p') === st.p; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    document.querySelectorAll('#tx .tx-seg [data-u]').forEach(function (x) { var on = x.getAttribute('data-u') === st.u; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
  }
  function draw() { sync(); drawFig(); drawResult(); drawAdvice(); }
  function setUser(u) { st.u = u; draw(); }
  document.querySelectorAll('#tx [data-p]').forEach(function (b) { b.addEventListener('click', function () { st.p = b.getAttribute('data-p'); draw(); }); });
  document.querySelectorAll('#tx .tx-seg [data-u]').forEach(function (b) { b.addEventListener('click', function () { setUser(b.getAttribute('data-u')); }); });
  draw();
})();
