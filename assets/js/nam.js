/* NOI assurance mechanism: interactive simulator.
   All figures are illustrative. Defaults are set in DEF below. */
(function () {
  var root = document.getElementById('nam');
  if (!root) return;

  var K = 3000, PMAX = 20, TMAX = 7, BUILD = 2, SALE_COST = 0.02;

  var DEF = { fund: 10, limit: 0.5, years: 5, n: 8, sd: 8, bias: 0, rho: 30, share: 15, capx: 1, intr: 4,
              cap: 6, cost: 77, yoc: 6.4, growth: 3, ltc: 55, rate: 6.25, pref: 9 };
  var CTL = [
    ['The fund', [
      ['fund', 'Fund on deposit', 2, 30, 1, function (v) { return '$' + v + 'M'; }],
      ['limit', 'Top-up limit per project, per year', 0.1, 1.5, 0.05, function (v) { return '$' + Math.round(v * 1000) + 'k'; }],
      ['years', 'Years assured', 3, 7, 1, function (v) { return v + ' years'; }],
      ['n', 'Projects assured', 1, 20, 1, function (v) { return v; }]
    ]],
    ['Outcomes', [
      ['sd', 'Typical miss against forecast NOI', 2, 20, 1, function (v) { return '±' + v + '%'; }],
      ['bias', 'Average result against forecast', -10, 5, 1, function (v) { return (v > 0 ? '+' : '') + v + '%'; }],
      ['rho', 'Shared market risk between projects', 0, 90, 5, function (v) { return v + '%'; }],
      ['cap', 'Cap rate', 4, 8, 0.25, function (v) { return v.toFixed(2) + '%'; }]
    ]],
    ['Paying the fund back', [
      ['share', 'Share of profit above the preferred return', 0, 50, 1, function (v) { return v + '%'; }],
      ['capx', 'Most a project pays back, as a multiple of its assurance', 0.5, 3, 0.25, function (v) { return v.toFixed(2) + '×'; }],
      ['intr', 'Interest earned on the deposit', 0, 6, 0.5, function (v) { return v.toFixed(1) + '%'; }]
    ]]
  ];
  var ADV = [
    ['cost', 'Project cost', 30, 200, 1, function (v) { return '$' + v + 'M'; }],
    ['yoc', 'Forecast yield on cost', 5, 8, 0.1, function (v) { return v.toFixed(1) + '%'; }],
    ['growth', 'Forecast NOI growth', 0, 5, 0.5, function (v) { return v.toFixed(1) + '%'; }],
    ['ltc', 'Bank loan, share of cost', 40, 70, 1, function (v) { return v + '%'; }],
    ['rate', 'Loan interest rate', 4, 8, 0.25, function (v) { return v.toFixed(2) + '%'; }],
    ['pref', 'Preferred return', 6, 12, 0.5, function (v) { return v.toFixed(1) + '%'; }]
  ];
  var P = {}; for (var k in DEF) P[k] = DEF[k];

  /* fixed random draws, so results move smoothly as settings change */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20261124);
  function gauss() { var u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }
  var Z = new Float32Array(K), EP = new Float32Array(K * PMAX), ET = new Float32Array(K * PMAX * (TMAX + 1));
  (function () { var i; for (i = 0; i < K; i++) Z[i] = gauss(); for (i = 0; i < EP.length; i++) EP[i] = gauss(); for (i = 0; i < ET.length; i++) ET[i] = gauss(); })();

  function pct(arr, q) { var a = Array.prototype.slice.call(arr).sort(function (x, y) { return x - y; }); var i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
  function money(v, d) { var a = Math.abs(v); return (v < 0 ? '−' : '') + '$' + (a >= 100 ? Math.round(a) : a.toFixed(d === undefined ? 1 : d)) + 'M'; }

  function run() {
    var T = P.years, n = P.n, F = P.fund, L = P.limit, sd = P.sd / 100, mu = P.bias / 100, rho = P.rho / 100,
        g = P.growth / 100, c = P.cap / 100, pref = P.pref / 100, ir = P.intr / 100, rs = P.share / 100;
    var noi1 = P.cost * P.yoc / 100, loan = P.cost * P.ltc / 100, eq = P.cost - loan, lr = P.rate / 100;
    var ds = loan * lr / (1 - Math.pow(1 + lr, -30));
    var balT = loan * Math.pow(1 + lr, T) - ds * (Math.pow(1 + lr, T) - 1) / lr;
    var capAmt = P.capx * L * T, uw = [], t, p, k;
    for (t = 0; t <= TMAX + 1; t++) uw[t] = noi1 * Math.pow(1 + g, t);
    var hurdle = eq * Math.pow(1 + pref, T + BUILD);
    var sr = Math.sqrt(rho), si = Math.sqrt(1 - rho), sn = sd / 3;

    var path = []; for (t = 0; t <= T + 1; t++) path[t] = new Float32Array(K);
    var Xp = new Float32Array(K * n), drawP = new Float32Array(K * n), missP = new Float32Array(K * n);
    var preExit = new Float32Array(K), dry = 0, sumDraw = 0, sumInt = 0, anyDraw = 0, anyPay = 0;
    var a1 = new Float32Array(K), a1t = new Float32Array(K);
    var proj = []; for (t = 0; t < T + 2; t++) proj[t] = new Float32Array(K);
    var act = new Float32Array(n * (T + 1)), top = new Float32Array(n * T);

    for (k = 0; k < K; k++) {
      var bal = F, exhausted = false, m = [];
      path[0][k] = F;
      for (p = 0; p < n; p++) { m[p] = mu + sd * (sr * Z[k] + si * EP[k * PMAX + p]); missP[k * n + p] = 0; drawP[k * n + p] = 0; }
      for (t = 0; t < T; t++) {
        var intY = bal * ir; bal += intY; sumInt += intY;
        var need = 0;
        for (p = 0; p < n; p++) {
          var a = uw[t] * (1 + m[p] + sn * ET[(k * PMAX + p) * (TMAX + 1) + t]);
          act[p * (T + 1) + t] = a; missP[k * n + p] += (a / uw[t] - 1) / T;
          var q = uw[t] - a; q = q < 0 ? 0 : (q > L ? L : q);
          top[p * T + t] = q; need += q;
        }
        var scale = 1;
        if (need > bal) { scale = bal > 0 ? bal / need : 0; exhausted = true; }
        for (p = 0; p < n; p++) { top[p * T + t] *= scale; drawP[k * n + p] += top[p * T + t]; }
        bal -= need * scale; sumDraw += need * scale;
        path[t + 1][k] = bal;
      }
      if (exhausted) dry++;
      preExit[k] = bal;
      var rec = 0;
      for (p = 0; p < n; p++) {
        var fv = 0;
        for (t = 0; t < T; t++) fv += (act[p * (T + 1) + t] + top[p * T + t] - ds) * Math.pow(1 + pref, T - 1 - t);
        var exitNoi = uw[T] * (1 + m[p]);
        var x = fv + exitNoi / c * (1 - SALE_COST) - balT - hurdle;
        x = x > 0 ? x : 0; Xp[k * n + p] = x;
        var pay = Math.min(capAmt, rs * x); rec += pay;
        if (drawP[k * n + p] > 0.0005) anyDraw++;
        if (pay > 0.0005) anyPay++;
      }
      path[T + 1][k] = bal + rec;
      a1[k] = act[0]; a1t[k] = act[0] + top[0];
      for (t = 0; t < T + 2; t++) proj[t][k] = uw[t] * (1 + m[0] + sn * ET[(k * PMAX) * (TMAX + 1) + (t % (TMAX + 1))]);
    }

    function endMean(r) { var s = 0, i, j; for (i = 0; i < K; i++) { var e = preExit[i]; for (j = 0; j < n; j++) e += Math.min(capAmt, r * Xp[i * n + j]); s += e; } return s / K; }
    var end = endMean(rs), be = null;
    if (endMean(0) >= F) be = 0;
    else if (endMean(1) >= F) { var lo = 0, hi = 1; for (var it = 0; it < 22; it++) { var mid = (lo + hi) / 2; if (endMean(mid) >= F) hi = mid; else lo = mid; } be = hi; }

    return { T: T, n: n, F: F, L: L, uw: uw, ds: ds, c: c, noi1: noi1, eq: eq, capAmt: capAmt,
      draws: sumDraw / K, interest: sumInt / K, rec: end - (function () { var s = 0; for (var i = 0; i < K; i++) s += preExit[i]; return s / K; })(),
      end: end, dry: dry / K, be: be, shareDraw: anyDraw / (K * n), sharePay: anyPay / (K * n),
      path: path, proj: proj, Xp: Xp, drawP: drawP, missP: missP,
      dscr0: pct(a1, 0.1) / ds, dscr1: pct(a1t, 0.1) / ds, maxClaims: n * L * T };
  }

  /* ---------- drawing ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  var sample = 7;

  function chartProject(R) {
    var W = 760, H = 340, l = 58, r = 16, tp = 18, b = 40, N = R.T + 2, t;
    var lo = [], md = [], hi = [];
    for (t = 0; t < N; t++) { lo[t] = pct(R.proj[t], 0.1); md[t] = pct(R.proj[t], 0.5); hi[t] = pct(R.proj[t], 0.9); }
    var ymin = Math.min(R.ds * 0.92, Math.min.apply(null, lo) * 0.97), ymax = Math.max.apply(null, hi) * 1.03;
    function X(i) { return l + (W - l - r) * (i + 0.5) / N; }
    function Y(v) { return tp + (H - tp - b) * (1 - (v - ymin) / (ymax - ymin)); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Forecast net operating income for one project, the assured slice, and the range of simulated outcomes">';
    var step = (ymax - ymin) > 3 ? 1 : 0.5;
    for (var v = Math.ceil(ymin / step) * step; v <= ymax; v += step) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">$' + v.toFixed(1) + 'M</text>';
    var band = ''; for (t = 0; t < N; t++) band += (t ? 'L' : 'M') + X(t) + ',' + Y(hi[t]); for (t = N - 1; t >= 0; t--) band += 'L' + X(t) + ',' + Y(lo[t]);
    s += '<path d="' + band + 'Z" fill="#b9b6ae" opacity=".35"/>';
    var sl = ''; for (t = 0; t < R.T; t++) sl += (t ? 'L' : 'M') + X(t) + ',' + Y(R.uw[t]); for (t = R.T - 1; t >= 0; t--) sl += 'L' + X(t) + ',' + Y(R.uw[t] - R.L);
    s += '<path d="' + sl + 'Z" fill="#c99a5c" opacity=".45"/>';
    s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(R.ds) + '" y2="' + Y(R.ds) + '" stroke="#b5451b" stroke-width="1.5" stroke-dasharray="6 5"/><text x="' + (W - r - 4) + '" y="' + (Y(R.ds) - 6) + '" text-anchor="end" font-size="12" fill="#b5451b">Loan payments</text>';
    var d = ''; for (t = 0; t < N; t++) d += (t ? 'L' : 'M') + X(t) + ',' + Y(R.uw[t]);
    s += '<path d="' + d + '" fill="none" stroke="#1a1a18" stroke-width="2.5"/>';
    var k = sample % K, bw = 16;
    for (t = 0; t < N; t++) {
      var a = R.proj[t][k];
      if (t < R.T && a < R.uw[t]) { var q = Math.min(R.L, R.uw[t] - a); s += '<rect x="' + (X(t) - bw / 2) + '" y="' + Y(a + q) + '" width="' + bw + '" height="' + (Y(a) - Y(a + q)) + '" fill="#a67c3d"/>'; }
      s += '<circle cx="' + X(t) + '" cy="' + Y(a) + '" r="5" fill="#fff" stroke="#1a1a18" stroke-width="2"/>';
      s += '<text x="' + X(t) + '" y="' + (H - 16) + '" text-anchor="middle" font-size="12" fill="#6b6b66">Year ' + (t + 1) + '</text>';
    }
    s += '<text x="' + X(0) + '" y="' + (Y(R.uw[0]) - 10) + '" font-size="12" font-weight="600" fill="#1a1a18">Forecast NOI</text>';
    s += '<text x="' + (X(R.T - 1) + 12) + '" y="' + (Y(R.uw[R.T - 1] - R.L / 2) + 4) + '" font-size="12" font-weight="600" fill="#8f6a32">Assured slice ends</text>';
    return s + '</svg>';
  }

  function chartPortfolio(R) {
    var k = sample % K, n = R.n, rs = P.share / 100, i, items = [];
    for (i = 0; i < n; i++) items.push({ m: R.missP[k * n + i], d: R.drawP[k * n + i], p: Math.min(R.capAmt, rs * R.Xp[k * n + i]) });
    items.sort(function (a, b) { return a.m - b.m; });
    var W = 760, H = 300, l = 58, r = 16, tp = 22, b = 44;
    var up = Math.max(0.5, Math.max.apply(null, items.map(function (x) { return x.p; }))), dn = Math.max(0.5, Math.max.apply(null, items.map(function (x) { return x.d; })));
    function Y(v) { return tp + (H - tp - b) * (up - v) / (up + dn); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Top-ups paid to and profit shares received from each project in one simulated set">';
    var step = (up + dn) > 6 ? 2 : (up + dn) > 3 ? 1 : 0.5;
    for (var v = -Math.floor(dn / step) * step; v <= up; v += step) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (Math.abs(v) < 1e-9 ? '#1a1a18' : '#ece9e2') + '"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + (v < 0 ? '−' : v > 0 ? '+' : '') + '$' + Math.abs(v).toFixed(1) + 'M</text>';
    var cw = (W - l - r) / n, bw = Math.min(46, cw * 0.6);
    items.forEach(function (x, j) {
      var cx = l + cw * (j + 0.5);
      if (x.d > 0.001) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(0) + '" width="' + bw + '" height="' + (Y(-x.d) - Y(0)) + '" fill="#a67c3d" rx="2"/>';
      if (x.p > 0.001) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(x.p) + '" width="' + bw + '" height="' + (Y(0) - Y(x.p)) + '" fill="#3f7d5a" rx="2"/>';
      s += '<text x="' + cx + '" y="' + (H - 24) + '" text-anchor="middle" font-size="11.5" fill="#6b6b66">' + (x.m >= 0 ? '+' : '−') + Math.abs(x.m * 100).toFixed(0) + '%</text>';
    });
    s += '<text x="' + (l + (W - l - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12" fill="#6b6b66">Each project’s average NOI against forecast over the assured years, weakest to strongest</text>';
    s += '<text x="' + (l + 6) + '" y="' + (tp - 6) + '" font-size="12" font-weight="600" fill="#3f7d5a">Paid into the fund</text><text x="' + (W - r - 6) + '" y="' + (H - b - 6) + '" text-anchor="end" font-size="12" font-weight="600" fill="#8f6a32">Paid out of the fund</text>';
    return s + '</svg>';
  }

  function chartFund(R) {
    var W = 760, H = 280, l = 58, r = 16, tp = 18, b = 40, N = R.T + 2, t, lo = [], md = [], hi = [];
    for (t = 0; t < N; t++) { lo[t] = pct(R.path[t], 0.1); md[t] = pct(R.path[t], 0.5); hi[t] = pct(R.path[t], 0.9); }
    var ymax = Math.max(R.F, Math.max.apply(null, hi)) * 1.08;
    function X(i) { return l + (W - l - r) * i / (N - 1); }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Fund balance over time across simulated outcomes">';
    var step = ymax > 40 ? 10 : ymax > 16 ? 5 : ymax > 8 ? 2 : 1;
    for (var v = 0; v <= ymax; v += step) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">$' + v + 'M</text>';
    var band = ''; for (t = 0; t < N; t++) band += (t ? 'L' : 'M') + X(t) + ',' + Y(hi[t]); for (t = N - 1; t >= 0; t--) band += 'L' + X(t) + ',' + Y(Math.max(0, lo[t]));
    s += '<path d="' + band + 'Z" fill="#c99a5c" opacity=".3"/>';
    s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(R.F) + '" y2="' + Y(R.F) + '" stroke="#1a1a18" stroke-width="1.2" stroke-dasharray="5 5"/><text x="' + (l + 6) + '" y="' + (Y(R.F) - 6) + '" font-size="12" fill="#1a1a18">Starting deposit</text>';
    var d = ''; for (t = 0; t < N; t++) d += (t ? 'L' : 'M') + X(t) + ',' + Y(md[t]);
    s += '<path d="' + d + '" fill="none" stroke="#8f6a32" stroke-width="3"/>';
    for (t = 0; t < N; t++) { s += '<circle cx="' + X(t) + '" cy="' + Y(md[t]) + '" r="4" fill="#8f6a32"/>'; s += '<text x="' + X(t) + '" y="' + (H - 14) + '" text-anchor="' + (t === 0 ? 'start' : t === N - 1 ? 'end' : 'middle') + '" font-size="12" fill="#6b6b66">' + (t === 0 ? 'Start' : t === N - 1 ? 'After payback' : 'Year ' + t) + '</text>'; }
    return s + '</svg>';
  }

  function tiles(R) {
    var net = R.end - R.F, mult = 1 / R.c, backed = R.n * P.cost;
    var be = R.be === null ? 'Not reachable' : R.be === 0 ? 'Already' : Math.ceil(R.be * 100) + '%';
    var beNote = R.be === null ? 'With these settings no profit share returns the fund to its starting size. Try a smaller top-up, fewer years, or a higher payback limit.'
      : R.be === 0 ? 'Interest alone covers the expected top-ups.' : 'The share of profit above the preferred return at which the fund is expected to end where it began.';
    var T = [
      ['$' + mult.toFixed(2), 'Value of $1 of yearly NOI', 'At a ' + P.cap.toFixed(2) + '% cap rate. A dollar of cost is worth $1.'],
      [money(backed, 0), 'Development backed', 'About $' + Math.round(backed / R.F) + ' of development for each $1 on deposit.'],
      [money(R.draws), 'Expected top-ups paid', Math.round(R.shareDraw * 100) + '% of projects draw at least once over ' + R.T + ' years.'],
      [money(R.rec), 'Expected paid back', Math.round(R.sharePay * 100) + '% of projects clear the ' + P.pref + '% preferred return and share profit.'],
      [money(R.end), 'Expected fund at the end', (net >= 0 ? 'A surplus of ' + money(net) : 'An expected cost of ' + money(-net)) + ', after ' + money(R.interest) + ' of interest.'],
      [(R.dry * 100 < 1 && R.dry > 0 ? '<1' : Math.round(R.dry * 100)) + '%', 'Chance the fund runs dry', R.maxClaims <= R.F ? 'Fully covered: the most that could be claimed is ' + money(R.maxClaims) + '.' : 'The most that could be claimed is ' + money(R.maxClaims) + ', so the fund relies on projects not all falling short together.'],
      [be, 'Profit share to be self-sustaining', beNote],
      [R.dscr0.toFixed(2) + '× → ' + R.dscr1.toFixed(2) + '×', 'Lender’s coverage in a weak year', 'NOI over loan payments in year one, at the one-in-ten weak outcome, without and with the assurance.']
    ];
    return T.map(function (x) { return '<div class="nam-tile"><b>' + x[0] + '</b><span>' + x[1] + '</span><p>' + x[2] + '</p></div>'; }).join('');
  }

  /* ---------- build ---------- */
  var ctl = root.querySelector('.nam-controls'), out = root.querySelector('.nam-tiles');
  var c1 = root.querySelector('#nam-c1'), c2 = root.querySelector('#nam-c2'), c3 = root.querySelector('#nam-c3');
  var labels = {};
  function slider(def) {
    var w = el('label', 'nam-s'), id = 'nam-' + def[0];
    w.innerHTML = '<span class="nam-sl">' + def[1] + '</span><output id="' + id + '-o"></output><input type="range" id="' + id + '" min="' + def[2] + '" max="' + def[3] + '" step="' + def[4] + '" value="' + P[def[0]] + '">';
    var inp = w.querySelector('input'), o = w.querySelector('output');
    labels[def[0]] = function () { o.textContent = def[5](P[def[0]]); inp.value = P[def[0]]; };
    inp.addEventListener('input', function () { P[def[0]] = parseFloat(inp.value); labels[def[0]](); schedule(); });
    return w;
  }
  CTL.forEach(function (g) { var box = el('fieldset', 'nam-g'); box.appendChild(el('legend', '', g[0])); g[1].forEach(function (d) { box.appendChild(slider(d)); }); ctl.appendChild(box); });
  var adv = el('details', 'nam-adv'); adv.appendChild(el('summary', '', 'Project baseline'));
  var ab = el('div', 'nam-g nam-advg'); ADV.forEach(function (d) { ab.appendChild(slider(d)); }); adv.appendChild(ab); ctl.appendChild(adv);
  var reset = el('button', 'nam-reset', 'Reset to starting values'); reset.type = 'button';
  reset.addEventListener('click', function () { for (var k in DEF) P[k] = DEF[k]; draw(); }); ctl.appendChild(reset);
  root.querySelectorAll('[data-nam-sample]').forEach(function (b) { b.addEventListener('click', function () { sample = (sample * 31 + 17) % K; draw(); }); });

  var timer = null;
  function schedule() { if (timer) cancelAnimationFrame(timer); timer = requestAnimationFrame(draw); }
  function draw() {
    for (var k in labels) labels[k]();
    var R = run();
    out.innerHTML = tiles(R); c1.innerHTML = chartProject(R); c2.innerHTML = chartPortfolio(R); c3.innerHTML = chartFund(R);
    window.NAM_LAST = { end: R.end, draws: R.draws, rec: R.rec, dry: R.dry, be: R.be, dscr0: R.dscr0, dscr1: R.dscr1 };
  }
  draw();
})();
