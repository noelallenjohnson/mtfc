/* Industry Perceptions: interactive charts from aggregate counts in ip-data.js */
(function () {
  var D = window.IP_DATA, bars = document.getElementById('ip-bars');
  if (!D || !bars) return;
  var T = D.themes, CN = { D: 'Demand', S: 'Supply', P: 'Socio-political' }, ORDER = ['D', 'S', 'P'];
  var st = { year: 'both', seg: 'all', sort: 'rank' };
  var SEGN = { all: 'all respondents', multi: 'respondents with more than one completed project', mkt: 'respondents whose project was market-rate', non: 'respondents whose project was non-market or public' };
  function pc(a, n) { return n ? Math.round(a / n * 100) : 0; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function rows(year, seg) {
    var ys = year === 'both' ? ['2025', '2026'] : [year], out = [], n = 0;
    ys.forEach(function (y) { n += D.years[y].seg[seg].n; });
    T.forEach(function (t, i) {
      var c = [0, 0, 0], m = 0;
      ys.forEach(function (y) { var r = D.years[y].seg[seg].r[i]; if (r) { c[0] += r[0]; c[1] += r[1]; c[2] += r[2]; m += D.years[y].seg[seg].n; } });
      if (m) out.push({ i: i, name: t.name, cls: t.cls, c: c, n: m, only26: i === 20 });
    });
    return { rows: out, n: n, ys: ys };
  }

  /* tooltip */
  var tip = document.createElement('div'); tip.className = 'ip-tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip);
  function showTip(e, html) { tip.innerHTML = html; tip.classList.add('is-on'); moveTip(e); }
  function moveTip(e) {
    var x = e.clientX, y = e.clientY;
    if (x === undefined) { var r = e.target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top; }
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14)) + 'px';
    tip.style.top = (y - h - 12 < 8 ? y + 18 : y - h - 12) + 'px';
  }
  function bindTips(root) {
    root.querySelectorAll('[data-tip]').forEach(function (el) {
      var h = function () { return el.getAttribute('data-tip'); };
      el.addEventListener('mouseenter', function (e) { showTip(e, h()); });
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
      el.addEventListener('focus', function (e) { showTip(e, h()); });
      el.addEventListener('blur', function () { tip.classList.remove('is-on'); });
    });
  }

  function drawRatings() {
    var R = rows(st.year, st.seg), list = R.rows.slice();
    list.sort(function (a, b) { return (b.c[0] / b.n - a.c[0] / a.n) || (b.c[1] / b.n - a.c[1] / a.n); });
    var html = '';
    function row(r) {
      var tipHtml = '<b>' + esc(r.name) + '</b>' + CN[r.cls] + '<br>Highly valued: ' + r.c[0] + ' of ' + r.n + ' (' + pc(r.c[0], r.n) + '%)<br>Of interest: ' + r.c[1] + ' (' + pc(r.c[1], r.n) + '%)<br>Not mentioned: ' + r.c[2] + ' (' + pc(r.c[2], r.n) + '%)';
      return '<div class="ip-row" tabindex="0" data-tip="' + tipHtml.replace(/"/g, '&quot;') + '" aria-label="' + esc(r.name) + ': ' + r.c[0] + ' of ' + r.n + ' rated it highly valued, ' + r.c[1] + ' of interest, ' + r.c[2] + ' not mentioned">'
        + '<div class="ip-label">' + esc(r.name) + (r.only26 ? '<small>asked in the second round only</small>' : '') + '</div>'
        + '<div class="ip-track"><i class="' + r.cls + '" style="width:' + (r.c[0] / r.n * 100) + '%"></i><i class="' + r.cls + 't" style="width:' + (r.c[1] / r.n * 100) + '%"></i></div>'
        + '<div class="ip-val">' + pc(r.c[0], r.n) + '% <small>' + r.c[0] + '/' + r.n + '</small></div></div>';
    }
    if (st.sort === 'cls') ORDER.forEach(function (c) { html += '<div class="ip-group ' + c + '">' + CN[c] + '</div>'; list.forEach(function (r) { if (r.cls === c) html += row(r); }); });
    else list.forEach(function (r) { html += row(r); });
    bars.innerHTML = html; bindTips(bars);
    document.getElementById('ip-ratings-n').textContent = R.n + ' sets of ratings: ' + SEGN[st.seg] + '. The figure at right is the share rating the theme highly valued.';
  }

  function share(vals) { /* round to whole percentages that sum to 100 */
    var s = vals.reduce(function (x, y) { return x + y; }, 0), raw = vals.map(function (v) { return v / s * 100; }), fl = raw.map(Math.floor), left = 100 - fl.reduce(function (x, y) { return x + y; }, 0);
    raw.map(function (v, i) { return [v - fl[i], i]; }).sort(function (x, y) { return y[0] - x[0]; }).slice(0, left).forEach(function (p) { fl[p[1]]++; });
    return fl;
  }
  function drawTax() {
    var tot = { D: 0, S: 0, P: 0 }, R = rows('both', 'all');
    R.rows.forEach(function (r) { tot[r.cls] += r.c[0]; });
    var sh = share(ORDER.map(function (c) { return tot[c]; })), sum = tot.D + tot.S + tot.P;
    var html = '<div class="ip-tax-bar" role="img" aria-label="' + ORDER.map(function (c, i) { return CN[c] + ' ' + sh[i] + '%'; }).join(', ') + '">';
    ORDER.forEach(function (c, i) {
      var th = R.rows.filter(function (r) { return r.cls === c; }), avg = Math.round(th.reduce(function (x, r) { return x + r.c[0] / r.n; }, 0) / th.length * 100);
      var t = '<b>' + CN[c] + '</b>' + tot[c] + ' of ' + sum + ' highly valued ratings<br>' + th.length + ' themes; on average ' + avg + '% of respondents rated each one highly valued';
      html += '<div class="' + c + '" tabindex="0" style="width:' + (tot[c] / sum * 100) + '%" data-tip="' + t.replace(/"/g, '&quot;') + '"><b>' + sh[i] + '%</b>' + CN[c] + ' · ' + th.length + ' themes, avg ' + avg + '%</div>';
    });
    html += '</div><div class="ip-tax-mkt"><div><span style="width:' + ((tot.D + tot.S) / sum * 100) + '%">Market</span><span style="flex:1">Non-market</span></div></div>';
    var el = document.getElementById('ip-tax'); el.innerHTML = html; bindTips(el);
  }

  function drawWho() {
    var el = document.getElementById('ip-who'); if (!el) return;
    var a = D.years['2025'], b = D.years['2026'], nb = a.background + b.background;
    function add(x, y) { return x.map(function (v, i) { return v + y[i]; }); }
    function card(title, labels, v, n, note) {
      var mx = Math.max.apply(null, v), h = '<div class="ip-card"><h3>' + title + '</h3>';
      labels.forEach(function (l, i) { h += '<div class="ip-row"><div class="ip-label">' + esc(l) + '</div><div class="ip-pair"><div class="ip-track"><i style="width:' + (v[i] / mx * 100) + '%"></i></div><b class="ip-val">' + v[i] + '</b></div></div>'; });
      return h + '<p class="ip-caption">' + n + ' answers.' + (note || '') + '</p></div>';
    }
    var prof = a.profession.map(function (p) { return p[0].replace(/ \(.*\)/, '').replace('Const. Mgmt', 'construction management').replace("Owner's Rep.", "owner's rep"); });
    el.innerHTML = card('Mass timber experience', ['More than one completed project', 'One completed or in-progress project', 'None yet'], add(a.experience, b.experience), nb)
      + card('Type of project worked on', ['Market-rate investment', 'Non-market (affordable, university, headquarters)', 'Public (library, airport, school)'], add(a.project, b.project), nb)
      + card('Nature of work', prof, a.profession.map(function (p) { return p[1]; }), a.background, ' Asked in the first round only.');
  }

  document.querySelectorAll('#ip-ratings .ip-seg').forEach(function (g) {
    var key = g.getAttribute('data-ip');
    g.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.classList.contains('is-on'));
      b.addEventListener('click', function () {
        st[key] = b.getAttribute('data-v');
        g.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
        drawRatings();
      });
    });
  });
  drawWho(); drawRatings(); drawTax();
})();
