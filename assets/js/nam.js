/* Mass Timber Cashflow Assurance Mechanism: interactive simulator of a revolving program.
   All figures are illustrative. Starting values are in DEF below. */
(function () {
  var root = document.getElementById('nam');
  if (!root) return;

  var K = 2000, COMMIT_Q = 80, BUILD = 2, JMAX = 82, YMAX = 30, NMAX = 5, INTEREST = 5, GROWTH = 0.03, AMORT = 20;

  var DEF = { fund: 10, limit: 0.5, limpct: 10, years: 3, pace: 9, irr: 14, down: 20, up: 20, rho: 30,
              pref: 9, cost: 77, units: 200, yoc: 6, ltc: 55, rate: 6.25, price: 6, lease: 50 };
  var CTL = [
    ['The mechanism', [
      ['fund', 'Funder’s pledge on deposit', 10, 100, 1, function (v) { return '$' + v + 'M'; }],
      ['limit', 'Top-up limit per project, per year', 0.1, 0.5, 0.05, function (v) { return '$' + Math.round(v * 1000) + 'k'; }],
      ['limpct', '…and no more than this share of forecast NOI', 2, 10, 1, function (v) { return v + '%'; }],
      ['years', 'Years of NOI assured after delivery', 3, 5, 1, function (v) { return v + ' years'; }],
      ['pace', 'A new project every', 3, 18, 3, function (v) { return v + ' months'; }]
    ]],
    ['Outcomes', [
      ['irr', 'Median return to capital (leveraged IRR)', 10, 18, 0.5, function (v) { return v.toFixed(1) + '%'; }],
      ['down', 'Spread of bad outcomes (NOI below forecast)', 10, 60, 5, function (v) { return '−' + v + '%'; }],
      ['up', 'Spread of good outcomes (NOI above forecast)', 10, 30, 5, function (v) { return '+' + v + '%'; }],
      ['rho', 'Shared market risk between projects', 0, 90, 5, function (v) { return v + '%'; }],
      ['pref', 'Preferred return paid first', 9, 11, 0.5, function (v) { return v.toFixed(1) + '%'; }]
    ]]
  ];
  var ADV = [
    ['cost', 'Project cost', 30, 200, 1, function (v) { return '$' + v + 'M'; }],
    ['units', 'Homes per project', 50, 400, 10, function (v) { return v; }],
    ['yoc', 'Year-one yield on cost, unleveraged', 5, 7.5, 0.1, function (v) { return v.toFixed(1) + '%'; }],
    ['ltc', 'Bank loan, share of cost', 40, 70, 1, function (v) { return v + '%'; }],
    ['rate', 'Loan interest rate', 4, 8, 0.25, function (v) { return v.toFixed(2) + '%'; }],
    ['lease', 'Forecast NOI in the lease-up year', 25, 75, 5, function (v) { return v + '% of stabilized'; }],
    ['price', 'Swing in sale prices', 0, 15, 1, function (v) { return '±' + v + '%'; }]
  ];
  var P = {}; for (var k0 in DEF) P[k0] = DEF[k0];

  /* fixed random draws, so results move smoothly as settings change */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20261124);
  function gauss() { var u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }
  function fill(n) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = gauss(); return a; }
  var ZM = fill(K * YMAX), ZV = fill(K * YMAX), E1 = fill(K * JMAX), E2 = fill(K * JMAX), NS = fill(K * JMAX * NMAX);

  function pct(arr, q) { var a = Array.prototype.slice.call(arr).sort(function (x, y) { return x - y; }); var i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
  function money(v, d) { var a = Math.abs(v); if (a >= 1000) return (v < 0 ? '−' : '') + '$' + (a / 1000).toFixed(a >= 10000 ? 0 : 1) + ' billion'; return (v < 0 ? '−' : '') + '$' + (a >= 100 ? Math.round(a) : a.toFixed(d === undefined ? 1 : d)) + 'M'; }
  function num(v) { return Math.round(v).toLocaleString('en-US'); }

  var sample = 11;

  function terms() {
    var N = P.years, noi = P.cost * P.yoc / 100, fc = [], lim = [], i, expo = 0;
    for (i = 0; i < N; i++) { fc[i] = i === 0 ? noi * P.lease / 100 : noi * Math.pow(1 + GROWTH, i - 1); lim[i] = Math.min(P.limit, fc[i] * P.limpct / 100); expo += lim[i]; }
    var life = (BUILD + N) * 4, step = Math.round(P.pace / 3), ramp = Math.ceil(life / step);
    return { N: N, noi: noi, fc: fc, lim: lim, expo: expo, life: life, step: step, ramp: ramp, need: ramp * expo };
  }

  function run(dn) {
    var T = terms(), N = T.N, fc = T.fc, lim = T.lim, expo = T.expo, LIFE = T.life, step = T.step, L = BUILD + N;
    var F = P.fund, rho = P.rho / 100, sd = (dn === undefined ? P.down : dn) / 100, su = P.up / 100, sv = P.price / 100, pref = P.pref / 100, irr = P.irr / 100, iq = INTEREST / 100 / 4;
    var loan = P.cost * P.ltc / 100, eq = P.cost - loan, lr = P.rate / 100, ds = loan * lr / (1 - Math.pow(1 + lr, -AMORT));
    var np = N - 1, balExit = loan * Math.pow(1 + lr, np) - ds * (Math.pow(1 + lr, np) - 1) / lr, i, pv = 0;
    for (i = 1; i < N; i++) pv += (fc[i] - ds) * Math.pow(1 + irr, -(BUILD + 1 + i));
    var v0 = balExit + (eq - pv) * Math.pow(1 + irr, L), hurdle = eq * Math.pow(1 + pref, L);
    var sr = Math.sqrt(rho), si = Math.sqrt(1 - rho), sn = (sd + su) / 8;
    var QT = COMMIT_Q + LIFE, NY = QT / 4, y;

    var path = [], resv = []; for (y = 0; y <= NY; y++) { path[y] = new Float32Array(K); resv[y] = new Float32Array(K); }
    var outY = new Float64Array(NY + 2), inY = new Float64Array(NY + 2), retY = new Float64Array(NY + 2), started = new Float64Array(NY + 2);
    var deals = 0, drew = 0, below = 0, sumTop = 0, sumRec = 0, sumInt = 0, sumRet = 0, stops = 0, stopYear = new Float32Array(K), retK = new Float32Array(K), extras = 0, sumOver = 0, fullRet = 0;
    var proj = []; for (i = 0; i < N; i++) proj[i] = [];
    var smp = null, HB = 32, hist = [0, 1, 2, 3].map(function () { return new Float64Array(HB); }), catN = [0, 0, 0, 0], catLoss = [0, 0, 0, 0], sumFc = 0;
    for (i = 0; i < N; i++) sumFc += fc[i];

    for (var k = 0; k < K; k++) {
      var bal = F, reserved = 0, act = [], j = 0, stopped = -1, lossK = 0, expoK = 0;
      for (var q = 0; q <= QT; q++) {
        var yr = Math.max(1, Math.ceil(q / 4));
        if (q > 0) { var it = bal * iq; bal += it; sumInt += it; }
        for (var a = act.length - 1; a >= 0; a--) {
          var d = act[a], age = q - d.s, idx = age / 4 - (BUILD + 1);
          if (age % 4 === 0 && idx >= 0 && idx < N) {
            var x = fc[idx] * (1 + d.m + sn * NS[(k * JMAX + d.j) * NMAX + idx]), t = fc[idx] - x; t = t < 0 ? 0 : (t > lim[idx] ? lim[idx] : t);
            d.sx += x; d.top += t; bal -= t; reserved -= lim[idx]; sumTop += t; outY[yr] += t;
            d.fv += ((idx > 0 ? x - ds : 0) + t) * Math.pow(1 + pref, N - 1 - idx);
            if (d.j === 0) { proj[idx].push(x / fc[idx]); if (k === sample % K) { d.xs.push(x); d.ts.push(t); } }
            if (idx === N - 1) {
              var ex = d.fv + v0 * (1 + d.m) * (1 + d.v) - balExit - hurdle, rec = ex > 0 ? Math.min(d.top, ex) : 0;
              bal += rec; sumRec += rec; inY[yr] += rec;
              if (d.top > 0.0005) drew++;
              var cat = d.top <= 0.0005 ? 0 : (rec >= d.top - 1e-6 ? 1 : (rec > 0 ? 2 : 3)), hb = Math.floor(d.sx / sumFc * 20); hb = hb < 0 ? 0 : (hb >= HB ? HB - 1 : hb);
              hist[cat][hb]++; catN[cat]++; catLoss[cat] += d.top - rec; lossK += d.top - rec; expoK += expo;
              if (ex <= 0) below++;
              if (d.j === 0 && k === sample % K) smp = { xs: d.xs, ts: d.ts };
              act.splice(a, 1);
            }
          }
        }
        if (q % step === 0 && q < COMMIT_Q && j < JMAX) {
          if (bal - reserved >= expo) {
            var yi = Math.min(YMAX - 1, Math.floor((q + LIFE) / 4));
            var z = sr * ZM[k * YMAX + yi] + si * E1[k * JMAX + j];
            act.push({ s: q, j: j, m: z < 0 ? sd * z : su * z, v: sv * (sr * ZV[k * YMAX + yi] + si * E2[k * JMAX + j]), top: 0, fv: 0, sx: 0, xs: [], ts: [] });
            reserved += expo; deals++; started[Math.floor(q / 4) + 1] += 1; j++;
          } else if (stopped < 0) { stopped = q / 4; }
        }
        /* managed so the funder is not returned more than its pledge: surplus beyond the pledge, after holding back for active projects at the loss rate incurred so far, is committed to an additional project */
        if (q > 0 && q < COMMIT_Q && j < JMAX && q % step !== 0 && bal - reserved >= 2 * expo && bal - F - reserved * (lossK + 2 * expo) / (expoK + 4 * expo) >= expo) {
          var yi2 = Math.min(YMAX - 1, Math.floor((q + LIFE) / 4)), z2 = sr * ZM[k * YMAX + yi2] + si * E1[k * JMAX + j];
          act.push({ s: q, j: j, m: z2 < 0 ? sd * z2 : su * z2, v: sv * (sr * ZV[k * YMAX + yi2] + si * E2[k * JMAX + j]), top: 0, fv: 0, sx: 0, xs: [], ts: [] });
          reserved += expo; deals++; extras++; started[Math.floor(q / 4) + 1] += 1; j++;
        }
        if (q >= COMMIT_Q) { var free = bal - reserved; if (free > 0) { bal -= free; var give = Math.min(free, F - retK[k]); if (give < 0) give = 0; sumRet += give; sumOver += free - give; retK[k] += give; retY[yr] += give; } }
        if (q % 4 === 0) { path[q / 4][k] = bal; resv[q / 4][k] = reserved; }
      }
      stopYear[k] = stopped < 0 ? 99 : stopped; if (stopped >= 0) stops++; if (retK[k] >= F - 0.005) fullRet++;
    }
    for (y = 0; y <= NY + 1; y++) { outY[y] /= K; inY[y] /= K; retY[y] /= K; started[y] /= K; }
    return { T: T, F: F, NY: NY, ds: ds, deals: deals / K, top: sumTop / K, rec: sumRec / K, interest: sumInt / K, returned: sumRet / K, retK: retK, extras: extras / K, over: sumOver / K, fullShare: fullRet / K,
      shareDraw: drew / deals, shareBelow: below / deals, stopShare: stops / K, stopMed: pct(stopYear, 0.5),
      hist: hist, catN: catN, catLoss: catLoss, nDeals: deals, path: path, resv: resv, outY: outY, inY: inY, retY: retY, started: started, proj: proj, smp: smp };
  }

  /* ---------- drawing ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function yearAxis(N, X, H) { var s = ''; for (var y = 0; y <= N; y++) if (y % 5 === 0) s += '<text x="' + X(y) + '" y="' + (H - 14) + '" text-anchor="' + (y === 0 ? 'start' : y === N ? 'end' : 'middle') + '" font-size="12" fill="#6b6b66">' + (y === 0 ? 'Start' : 'Year ' + y) + '</text>'; return s; }
  function endMark(X, tp, H, b, label) { var x = X(COMMIT_Q / 4); return '<line x1="' + x + '" x2="' + x + '" y1="' + tp + '" y2="' + (H - b) + '" stroke="#1a1a18" stroke-width="1" stroke-dasharray="2 4"/><text x="' + (x + 6) + '" y="' + (tp + 10) + '" font-size="11.5" fill="#55585a">' + label.split('|').map(function (t, i) { return '<tspan x="' + (x + 6) + '" dy="' + (i ? 14 : 0) + '">' + t + '</tspan>'; }).join('') + '</text>'; }

  function chartProject(R) {
    var T = R.T, N = T.N, W = 760, H = 350, l = 64, r = 16, tp = 30, b = 62, lo = P.down > 30 ? 20 : 50, hi = 130;
    function Y(v) { v = v < lo ? lo : (v > hi ? hi : v); return tp + (H - tp - b) * (1 - (v - lo) / (hi - lo)); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The assured years of one project: forecast net operating income, the assured top slice, and the range of simulated outcomes, as a percentage of forecast">';
    for (var v = lo; v <= hi; v += 10) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + v + '%</text>';
    s += '<text x="' + l + '" y="14" font-size="12" fill="#6b6b66">Share of each year’s forecast NOI. Years 1 and 2 are construction, with no income and no assurance.</text>';
    var cw = (W - l - r) / N, bw = Math.min(110, cw * 0.44), names = ['Lease-up', 'Stabilized', 'Operations', 'Operations', 'Operations'];
    for (var i = 0; i < N; i++) {
      var cx = l + cw * (i + 0.42), fc = T.fc[i], lp = T.lim[i] / fc * 100, o = R.proj[i];
      s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(100 - lp) + '" width="' + bw + '" height="' + (Y(lo) - Y(100 - lp)) + '" fill="#e3e0d8"/>';
      s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(100) + '" width="' + bw + '" height="' + (Y(100 - lp) - Y(100)) + '" fill="#c99a5c"/><text x="' + cx + '" y="' + (Y(100 - lp / 2) + 4) + '" text-anchor="middle" font-size="11.5" font-weight="600" fill="#5e4520">$' + Math.round(T.lim[i] * 1000) + 'k</text>';
      s += '<line x1="' + (cx - bw / 2 - 6) + '" x2="' + (cx + bw / 2 + 6) + '" y1="' + Y(100) + '" y2="' + Y(100) + '" stroke="#1a1a18" stroke-width="2.5"/>';
      if (i > 0) { var dp = R.ds / fc * 100; s += '<line x1="' + (cx - bw / 2 - 6) + '" x2="' + (cx + bw / 2 + 6) + '" y1="' + Y(dp) + '" y2="' + Y(dp) + '" stroke="#b5451b" stroke-width="1.5" stroke-dasharray="6 5"/>'; if (i === 1) s += '<text x="' + cx + '" y="' + (Y(dp) + 16) + '" text-anchor="middle" font-size="11.5" fill="#b5451b">Loan payments</text>'; }
      var wx = cx + bw / 2 + 22, p1 = pct(o, 0.1) * 100, p9 = pct(o, 0.9) * 100;
      s += '<line x1="' + wx + '" x2="' + wx + '" y1="' + Y(p9) + '" y2="' + Y(p1) + '" stroke="#8a877f" stroke-width="2"/><line x1="' + (wx - 6) + '" x2="' + (wx + 6) + '" y1="' + Y(p9) + '" y2="' + Y(p9) + '" stroke="#8a877f" stroke-width="2"/><line x1="' + (wx - 6) + '" x2="' + (wx + 6) + '" y1="' + Y(p1) + '" y2="' + Y(p1) + '" stroke="#8a877f" stroke-width="2"/>';
      if (R.smp && R.smp.xs.length > i) {
        var ap = R.smp.xs[i] / fc * 100, tq = R.smp.ts[i], tpc = tq / fc * 100;
        if (tq > 0.001) s += '<rect x="' + (wx - 7) + '" y="' + Y(ap + tpc) + '" width="14" height="' + (Y(ap) - Y(ap + tpc)) + '" fill="#a67c3d"/>';
        s += '<circle cx="' + wx + '" cy="' + Y(ap) + '" r="5.5" fill="#fff" stroke="#1a1a18" stroke-width="2"/>';
        if (tq > 0.001) s += '<text x="' + (wx + 12) + '" y="' + (Y(ap + tpc / 2) + 4) + '" font-size="11.5" font-weight="600" fill="#8f6a32">+$' + Math.round(tq * 1000) + 'k</text>';
      }
      s += '<text x="' + cx + '" y="' + (H - 36) + '" text-anchor="middle" font-size="12.5" font-weight="600" fill="#1a1a18">Year ' + (BUILD + 1 + i) + '</text><text x="' + cx + '" y="' + (H - 18) + '" text-anchor="middle" font-size="11.5" fill="#6b6b66">' + names[i] + ' · ' + money(fc) + '</text>';
    }
    s += '<text x="' + (l + cw * 0.42 - bw / 2 - 10) + '" y="' + (Y(100) - 8) + '" font-size="12" font-weight="600" fill="#1a1a18">Forecast</text>';
    return s + '</svg>';
  }

  var CATS = [['No top-up needed', '#c9c6bd'], ['Topped up, repaid in full', '#3f7d5a'], ['Topped up, repaid in part', '#9cc3ac'], ['Topped up, not repaid', '#a67c3d']];
  function chartDeals(R) {
    var W = 760, H = 310, l = 58, r = 16, tp = 44, b = 46, HB = R.hist[0].length, i, c, mx = 0;
    for (i = 0; i < HB; i++) { var t = 0; for (c = 0; c < 4; c++) t += R.hist[c][i]; mx = Math.max(mx, t / R.nDeals * 100); }
    var st = mx > 24 ? 10 : mx > 12 ? 5 : 2, ymax = Math.ceil(mx / st) * st;
    function X(v) { return l + (W - l - r) * v / (HB * 5); }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Distribution of assured projects by net operating income achieved over the assured years, as a share of forecast, coloured by what the mechanism paid and recovered">';
    for (var v = 0; v <= ymax + 1e-9; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + v + '%</text>';
    var lx = l; CATS.forEach(function (k) { s += '<rect x="' + lx + '" y="8" width="12" height="12" rx="2" fill="' + k[1] + '"/><text x="' + (lx + 17) + '" y="18.5" font-size="12" fill="#333">' + k[0] + '</text>'; lx += 30 + k[0].length * 6.3; });
    var bw = (W - l - r) / HB;
    for (i = 0; i < HB; i++) { var y0 = 0; [3, 2, 1, 0].forEach(function (c) { var h = R.hist[c][i] / R.nDeals * 100; if (h > 0.01) { s += '<rect x="' + (X(i * 5) + 1) + '" y="' + Y(y0 + h) + '" width="' + (bw - 2) + '" height="' + (Y(y0) - Y(y0 + h)) + '" fill="' + CATS[c][1] + '"/>'; y0 += h; } }); }
    s += '<line x1="' + X(100) + '" x2="' + X(100) + '" y1="' + (tp - 8) + '" y2="' + (H - b) + '" stroke="#1a1a18" stroke-width="2"/><text x="' + (X(100) + 6) + '" y="' + (tp - 0) + '" font-size="12" font-weight="600" fill="#1a1a18">Forecast</text>';
    for (i = 0; i <= HB * 5; i += 20) s += '<text x="' + X(i) + '" y="' + (H - b + 17) + '" text-anchor="middle" font-size="12" fill="#6b6b66">' + (i === 0 ? '≤' : '') + i + '%' + (i === HB * 5 ? '+' : '') + '</text>';
    s += '<text x="' + ((l + W - r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="12" fill="#6b6b66">Project NOI over the assured years, as a share of forecast</text>';
    return s + '</svg>';
  }
  function noteDeals(R) {
    var n = R.nDeals, p = R.catN.map(function (v) { return Math.round(v / n * 100); }), net = Math.max(0, R.top - R.rec) / R.deals;
    return 'Of every 100 assured projects, <b>' + p[0] + '</b> need no top-up, <b>' + p[1] + '</b> are topped up and repay in full, <b>' + p[2] + '</b> repay in part and <b>' + p[3] + '</b> repay nothing. Those that repay nothing cost the mechanism <b>' + money(R.catN[3] ? R.catLoss[3] / R.catN[3] : 0, 2) + '</b> each on average, against <b>$' + Math.round(net * 1000) + 'k</b> across all projects.';
  }

  function chartFlows(R) {
    var W = 760, H = 300, l = 58, r = 16, tp = 26, b = 40, N = R.NY, y, mx = 0.05;
    for (y = 1; y <= N; y++) mx = Math.max(mx, R.outY[y], R.inY[y]);
    function X(i) { return l + (W - l - r) * i / N; }
    function Y(v) { return tp + (H - tp - b) * (mx - v) / (2 * mx); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Expected money out to projects and back in, year by year">';
    var st = mx > 4 ? 2 : mx > 2 ? 1 : mx > 1 ? 0.5 : mx > 0.4 ? 0.2 : 0.1;
    for (var v = -Math.floor(mx / st) * st; v <= mx + 1e-9; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (Math.abs(v) < 1e-9 ? '#1a1a18' : '#ece9e2') + '"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + (v < -1e-9 ? '−' : v > 1e-9 ? '+' : '') + '$' + (st < 1 ? Math.round(Math.abs(v) * 1000) + 'k' : Math.abs(v) + 'M') + '</text>';
    s += endMark(X, tp, H, b, 'New commitments end');
    var bw = (W - l - r) / N * 0.62;
    for (y = 1; y <= N; y++) {
      var cx = X(y - 0.5);
      if (R.outY[y] > 0.0005) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(0) + '" width="' + bw + '" height="' + (Y(-R.outY[y]) - Y(0)) + '" fill="#a67c3d" rx="1.5"/>';
      if (R.inY[y] > 0.0005) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(R.inY[y]) + '" width="' + bw + '" height="' + (Y(0) - Y(R.inY[y])) + '" fill="#3f7d5a" rx="1.5"/>';
    }
    s += '<text x="' + (l + 6) + '" y="' + (tp - 10) + '" font-size="12" font-weight="600" fill="#3f7d5a">Repaid, and recycled into new projects</text><text x="' + (l + 6) + '" y="' + (H - b - 6) + '" font-size="12" font-weight="600" fill="#8f6a32">Top-ups paid out</text>';
    return s + yearAxis(N, X, H) + '</svg>';
  }

  function chartFund(R) {
    var W = 760, H = 290, l = 58, r = 16, tp = 22, b = 40, N = R.NY, y, lo = [], md = [], hi = [], rv = [];
    for (y = 0; y <= N; y++) { lo[y] = pct(R.path[y], 0.1); md[y] = pct(R.path[y], 0.5); hi[y] = pct(R.path[y], 0.9); rv[y] = pct(R.resv[y], 0.5); }
    var ymax = Math.max(R.F, Math.max.apply(null, hi)) * 1.08;
    function X(i) { return l + (W - l - r) * i / N; }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Balance of the pledge over time across simulated outcomes">';
    var st = ymax > 240 ? 100 : ymax > 120 ? 50 : ymax > 60 ? 20 : ymax > 25 ? 10 : ymax > 12 ? 5 : 2;
    for (var v = 0; v <= ymax; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">$' + v + 'M</text>';
    var band = ''; for (y = 0; y <= N; y++) band += (y ? 'L' : 'M') + X(y) + ',' + Y(hi[y]); for (y = N; y >= 0; y--) band += 'L' + X(y) + ',' + Y(Math.max(0, lo[y]));
    s += '<path d="' + band + 'Z" fill="#c99a5c" opacity=".3"/>';
    s += '<line x1="' + l + '" x2="' + X(COMMIT_Q / 4) + '" y1="' + Y(R.F) + '" y2="' + Y(R.F) + '" stroke="#1a1a18" stroke-width="1.2" stroke-dasharray="5 5"/><text x="' + (l + 6) + '" y="' + (Y(R.F) + 16) + '" font-size="12" fill="#1a1a18">The pledge</text>';
    var d = '', e = ''; for (y = 0; y <= N; y++) { d += (y ? 'L' : 'M') + X(y) + ',' + Y(md[y]); e += (y ? 'L' : 'M') + X(y) + ',' + Y(rv[y]); }
    s += '<path d="' + e + '" fill="none" stroke="#55585a" stroke-width="2" stroke-dasharray="3 4"/><text x="' + X(10) + '" y="' + (Y(rv[10]) - 8) + '" text-anchor="middle" font-size="12" fill="#55585a">Held against active projects</text>';
    s += '<path d="' + d + '" fill="none" stroke="#8f6a32" stroke-width="3"/>';
    s += endMark(X, tp, H, b, 'Returned to funders|as projects finish');
    return s + yearAxis(N, X, H) + '</svg>';
  }

  function chartHomes(R) {
    var W = 760, H = 250, l = 58, r = 16, tp = 22, b = 40, N = R.NY, y, cum = [0], c = 0;
    for (y = 1; y <= N; y++) { c += R.started[y] * P.units; cum[y] = c; }
    var ymax = Math.max(1, c) * 1.12;
    function X(i) { return l + (W - l - r) * i / N; }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cumulative homes in assured projects">';
    var st = ymax > 16000 ? 5000 : ymax > 8000 ? 2000 : ymax > 4000 ? 1000 : ymax > 1600 ? 500 : ymax > 800 ? 200 : 100;
    for (var v = 0; v <= ymax; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + num(v) + '</text>';
    var d = ''; for (y = 0; y <= N; y++) d += (y ? 'L' : 'M') + X(y) + ',' + Y(cum[y]);
    s += '<path d="' + d + 'L' + X(N) + ',' + Y(0) + 'L' + X(0) + ',' + Y(0) + 'Z" fill="#3f7d5a" opacity=".18"/><path d="' + d + '" fill="none" stroke="#3f7d5a" stroke-width="3"/>';
    s += endMark(X, tp, H, b, 'New commitments end');
    return s + yearAxis(N, X, H) + '</svg>';
  }

  function lead(R) {
    var backed = R.deals * P.cost, homes = R.deals * P.units, net = Math.max(0, R.top - R.rec), perHome = net * 1e6 / homes;
    var costPerHome = P.cost * 1e6 / P.units, share = net / backed * 100, lev = backed / R.F;
    return '<div class="nam-lead-top">'
      + '<div><span>1 · Charitable leverage</span><b>$' + Math.round(lev) + ' : $1</b><p>' + 'A ' + money(R.F, 0) + ' pledge stands behind ' + money(backed, 0) + ' of privately funded development over a 20-year commitment.</p></div>'
      + '<div><span>2 · Efficient, non-distortive</span><b>' + share.toFixed(2) + '%</b><p>The implied subsidy as a share of project cost: about $' + num(net / R.deals * 1000) + 'k on a ' + money(P.cost, 0) + ' project, or $' + num(perHome) + ' on a $' + num(costPerHome) + ' home.</p></div>'
      + '<div><span>3 · Visible impact</span><b>' + num(homes) + ' homes</b><p>' + R.deals.toFixed(R.deals < 10 ? 1 : 0) + ' assured projects over 20 years' + (R.extras >= 0.5 ? ', ' + R.extras.toFixed(0) + ' of them funded from surplus' : '') + '. Expected back to the funder: ' + money(R.returned) + ' of its ' + money(R.F, 0) + ' pledge, and never more.</p></div></div>'
      + '<div class="nam-vs"><small>The implied subsidy is what the mechanism is expected to pay out and not recover, back-calculated across every assured project. The buildings themselves are paid for by private capital. These figures move with the settings below.</small></div>';
  }

  function notes(R) {
    var T = R.T, rate = R.top / R.deals / T.N, net = Math.max(0, R.top - R.rec);
    var lasts = R.stopShare < 0.5 ? (R.stopShare < 0.01 ? 'In every simulated future the pledge can back each new project when it is due.' : 'In ' + Math.round((1 - R.stopShare) * 100) + '% of simulated futures the pledge can back every new project when it is due.')
      : 'In the middle outcome the pledge first cannot cover a new project after about ' + R.stopMed.toFixed(R.stopMed % 1 ? 1 : 0) + ' years.';
    return [
      'Most the mechanism can pay one project: <b>' + money(T.expo, 2) + '</b> over ' + T.N + ' years. Expected use: <b>$' + Math.round(rate * 1000) + 'k per project, per assured year</b>, which is ' + (rate / T.noi * 100).toFixed(1) + '% of stabilized NOI. ' + Math.round(R.shareDraw * 100) + '% of projects draw something.',
      '<b>' + (R.top > 0 ? Math.round(R.rec / R.top * 100) : 0) + ' cents</b> of each top-up dollar is expected back. ' + Math.round(R.shareBelow * 100) + '% of projects finish below the ' + P.pref + '% preferred return and repay nothing. Expected net cost: <b>$' + Math.round(net / R.deals * 1000) + 'k a project</b>.',
      'Smallest pledge that launches the flywheel: <b>' + money(T.need) + '</b>, enough for the ' + T.ramp + ' projects committed before the first one repays. ' + lasts + ' Surplus beyond the pledge is recycled: it funds <b>' + R.extras.toFixed(R.extras < 10 ? 1 : 0) + ' additional projects</b> on average. Expected back to the funder as the program winds down: <b>' + money(R.returned) + '</b> of a ' + money(R.F, 0) + ' pledge. The pledge comes back in full in ' + Math.round(R.fullShare * 100) + '% of simulated futures, and never more than the pledge is returned.',
      '<b>' + R.deals.toFixed(R.deals < 10 ? 1 : 0) + ' projects</b>, <b>' + num(R.deals * P.units) + ' homes</b> and <b>' + money(R.deals * P.cost, 0) + '</b> of development over 20 years of commitments.'
    ];
  }

  /* ---------- build ---------- */
  var ctl = root.querySelector('.nam-controls'), ld = document.querySelector('.nam-lead');
  var cs = [1, 2, 3, 4].map(function (i) { return root.querySelector('#nam-c' + i); }), ns = [1, 2, 3, 4].map(function (i) { return root.querySelector('#nam-n' + i); });
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
    var fmin = Math.min(100, Math.max(10, Math.ceil(terms().need))), fs = document.getElementById('nam-fund');
    fs.min = fmin; if (P.fund < fmin) P.fund = fmin;
    for (var k in labels) labels[k]();
    var R = run(), n = notes(R);
    if (ld) ld.innerHTML = lead(R);
    cs[0].innerHTML = chartProject(R); cs[1].innerHTML = chartFlows(R); cs[2].innerHTML = chartFund(R); cs[3].innerHTML = chartHomes(R);
    var c5 = root.querySelector('#nam-c5'), n5 = root.querySelector('#nam-n5'); if (c5) c5.innerHTML = chartDeals(R); if (n5) n5.innerHTML = noteDeals(R);
    ns.forEach(function (e, i) { if (e) e.innerHTML = n[i]; });
    window.NAM_LAST = { fund: P.fund, deals: R.deals, top: R.top, rec: R.rec, interest: R.interest, returned: R.returned, extras: R.extras, over: R.over, full: R.fullShare, draw: R.shareDraw, below: R.shareBelow, stop: R.stopShare, need: R.T.need, expo: R.T.expo };
  }
  /* the spread of bad outcomes at which the funder gets its pledge back and no more */
  window.NAM_RUN = run;
  draw();
})();
