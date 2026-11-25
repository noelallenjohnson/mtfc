/* NOI assurance mechanism: interactive simulator of a revolving ("flywheel") program.
   All figures are illustrative. Starting values are in DEF below. */
(function () {
  var root = document.getElementById('nam');
  if (!root) return;

  var K = 2000, HQ = 80, LIFE = 16, JMAX = 66, YMAX = 22, INTEREST = 5;

  var DEF = { fund: 10, limit: 0.5, limpct: 10, years: 2, pace: 9, irr: 14, down: 8, up: 8, rho: 30,
              pref: 9, cost: 77, units: 200, yoc: 6, ltc: 55, rate: 6.25, cap: 6, price: 6, lease: 50 };
  var CTL = [
    ['The fund', [
      ['fund', 'Funder’s pledge on deposit', 10, 100, 5, function (v) { return '$' + v + 'M'; }],
      ['limit', 'Top-up limit per project, per year', 0.1, 0.5, 0.05, function (v) { return '$' + Math.round(v * 1000) + 'k'; }],
      ['limpct', '…and no more than this share of forecast NOI', 2, 10, 1, function (v) { return v + '%'; }],
      ['years', 'Years of NOI assured', 1, 2, 1, function (v) { return v === 1 ? 'Stabilized year' : 'Lease-up + stabilized'; }],
      ['pace', 'A new project every', 3, 18, 3, function (v) { return v + ' months'; }]
    ]],
    ['Outcomes', [
      ['irr', 'Median return to investors (leveraged IRR)', 10, 18, 0.5, function (v) { return v.toFixed(1) + '%'; }],
      ['down', 'Spread of bad outcomes (NOI below forecast)', 2, 20, 1, function (v) { return '−' + v + '%'; }],
      ['up', 'Spread of good outcomes (NOI above forecast)', 2, 20, 1, function (v) { return '+' + v + '%'; }],
      ['rho', 'Shared market risk between projects', 0, 90, 5, function (v) { return v + '%'; }]
    ]],
    ['Replenishing the fund', [
      ['pref', 'Preferred return paid to investors first', 9, 11, 0.5, function (v) { return v.toFixed(1) + '%'; }]
    ]]
  ];
  var ADV = [
    ['cost', 'Project cost', 30, 200, 1, function (v) { return '$' + v + 'M'; }],
    ['units', 'Homes per project', 50, 400, 10, function (v) { return v; }],
    ['yoc', 'Year-one yield on cost, unleveraged', 5, 7.5, 0.1, function (v) { return v.toFixed(1) + '%'; }],
    ['ltc', 'Bank loan, share of cost', 40, 70, 1, function (v) { return v + '%'; }],
    ['rate', 'Loan interest rate', 4, 8, 0.25, function (v) { return v.toFixed(2) + '%'; }],
    ['lease', 'Forecast NOI in the lease-up year', 25, 75, 5, function (v) { return v + '% of stabilized'; }],
    ['price', 'Swing in sale prices', 0, 15, 1, function (v) { return '±' + v + '%'; }],
    ['cap', 'Cap rate, for the value of $1 of NOI', 4, 8, 0.25, function (v) { return v.toFixed(2) + '%'; }]
  ];
  var P = {}; for (var k0 in DEF) P[k0] = DEF[k0];

  /* fixed random draws, so results move smoothly as settings change */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20261124);
  function gauss() { var u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }
  function fill(n) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = gauss(); return a; }
  var ZM = fill(K * YMAX), ZV = fill(K * YMAX), E1 = fill(K * JMAX), E2 = fill(K * JMAX), N3 = fill(K * JMAX), N4 = fill(K * JMAX);

  function pct(arr, q) { var a = Array.prototype.slice.call(arr).sort(function (x, y) { return x - y; }); var i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }
  function money(v, d) { var a = Math.abs(v); if (a >= 1000) return (v < 0 ? '−' : '') + '$' + (a / 1000).toFixed(a >= 10000 ? 0 : 1) + ' billion'; return (v < 0 ? '−' : '') + '$' + (a >= 100 ? Math.round(a) : a.toFixed(d === undefined ? 1 : d)) + 'M'; }

  var sample = 11;

  function run() {
    var F = P.fund, rho = P.rho / 100, sd = P.down / 100, su = P.up / 100, sv = P.price / 100, pref = P.pref / 100,
        share = 1, iq = INTEREST / 100 / 4, step = Math.round(P.pace / 3);
    var noi = P.cost * P.yoc / 100, noiL = noi * P.lease / 100, loan = P.cost * P.ltc / 100, eq = P.cost - loan, lr = P.rate / 100;
    var ds = loan * lr / (1 - Math.pow(1 + lr, -30));
    var lim4 = Math.min(P.limit, noi * P.limpct / 100), lim3 = P.years === 2 ? Math.min(P.limit, noiL * P.limpct / 100) : 0;
    var expo = lim3 + lim4;
    var v0 = eq * Math.pow(1 + P.irr / 100, 4) + loan - (noi - ds), hurdle = eq * Math.pow(1 + pref, 4);
    var sr = Math.sqrt(rho), si = Math.sqrt(1 - rho), sn = (sd + su) / 6;

    var NY = HQ / 4, path = [], resv = [], y;
    for (y = 0; y <= NY; y++) { path[y] = new Float32Array(K); resv[y] = new Float32Array(K); }
    var started = new Float32Array(HQ / 4 + 1), deals = 0, drew = 0, below = 0, repaidFull = 0, sumTop = 0, sumRec = 0, sumInt = 0, stopYear = new Float32Array(K), stops = 0;
    var a4 = [], a4t = [], out3 = [], out4 = [], smp = [];

    for (var k = 0; k < K; k++) {
      var bal = F, reserved = 0, act = [], j = 0, stopped = -1;
      path[0][k] = F;
      for (var q = 0; q <= HQ; q++) {
        if (q > 0) { var it = bal * iq; bal += it; sumInt += it; }
        for (var a = act.length - 1; a >= 0; a--) {
          var d = act[a], age = q - d.s;
          if (age === 12 && lim3 > 0) {
            var x3 = noiL * (1 + d.m + sn * N3[k * JMAX + d.j]), t3 = noiL - x3; t3 = t3 < 0 ? 0 : (t3 > lim3 ? lim3 : t3);
            d.top += t3; d.a3 = x3; d.t3 = t3; bal -= t3; reserved -= lim3; sumTop += t3;
          }
          if (age === LIFE) {
            var x4 = noi * (1 + d.m + sn * N4[k * JMAX + d.j]), t4 = noi - x4; t4 = t4 < 0 ? 0 : (t4 > lim4 ? lim4 : t4);
            d.top += t4; bal -= t4; reserved -= lim4; sumTop += t4;
            var term = v0 * (1 + d.m) * (1 + d.v) - loan + (x4 + t4 - ds) + (d.t3 || 0);
            var ex = term - hurdle, rec = ex > 0 ? Math.min(d.top, share * ex) : 0;
            bal += rec; sumRec += rec;
            if (d.top > 0.0005) { drew++; if (rec >= d.top - 0.0005) repaidFull++; }
            if (ex <= 0) below++;
            if (d.j === 0) { a4.push(x4 / ds); a4t.push((x4 + t4) / ds); out3.push(d.a3 === undefined ? noiL * (1 + d.m) : d.a3); out4.push(x4); }
            if (k === sample % K) smp.push({ j: d.j, top: d.top, rec: rec, m: d.m, x3: d.a3, t3: d.t3 || 0, x4: x4, t4: t4, yr: q / 4 });
            act.splice(a, 1);
          }
        }
        if (q % step === 0 && q <= HQ - LIFE && j < JMAX) {
          if (bal - reserved >= expo) {
            var yi = Math.min(YMAX - 1, Math.floor((q + LIFE) / 4));
            var z = sr * ZM[k * YMAX + yi] + si * E1[k * JMAX + j];
            act.push({ s: q, j: j, m: z < 0 ? sd * z : su * z, v: sv * (sr * ZV[k * YMAX + yi] + si * E2[k * JMAX + j]), top: 0 });
            reserved += expo; deals++; j++; started[Math.floor(q / 4)] += 1;
          } else if (stopped < 0) { stopped = q / 4; }
        }
        if (q % 4 === 0) { path[q / 4][k] = bal; resv[q / 4][k] = reserved; }
      }
      stopYear[k] = stopped < 0 ? 99 : stopped; if (stopped >= 0) stops++;
    }
    var nd = deals / K;
    return { F: F, NY: NY, noi: noi, noiL: noiL, lim3: lim3, lim4: lim4, expo: expo, ds: ds, v0: v0, eq: eq,
      deals: nd, top: sumTop / K, rec: sumRec / K, interest: sumInt / K, shareDraw: drew / deals, shareBelow: below / deals,
      shareRepaid: drew ? repaidFull / drew : 1, stopShare: stops / K, stopMed: pct(stopYear, 0.5),
      path: path, resv: resv, dscr0: pct(a4, 0.1), dscr1: pct(a4t, 0.1), out3: out3, out4: out4, smp: smp,
      end10: pct(path[10], 0.5), endN: pct(path[NY], 0.5), started: started, ramp: Math.ceil(LIFE / step), active: Math.min(LIFE / step, F / expo) };
  }

  /* ---------- drawing ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  function chartProject(R) {
    var W = 760, H = 350, l = 64, r = 16, tp = 30, b = 62, lo = 60, hi = 118;
    function Y(v) { v = v < lo ? lo : v; return tp + (H - tp - b) * (1 - (v - lo) / (hi - lo)); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Lease-up and stabilized years of one project: forecast net operating income, the assured top slice, and the range of simulated outcomes, as a percentage of forecast">';
    for (var v = lo; v <= hi; v += 10) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + v + '%</text>';
    s += '<text x="' + l + '" y="14" font-size="12" fill="#6b6b66">Share of forecast NOI. Years 1 and 2 are construction, with no income and no assurance.</text>';
    var d = R.smp.filter(function (x) { return x.j === 0; })[0] || R.smp[0], w = W - l - r, bw = 120;
    [[0.25, 'Year 3 · Lease-up', R.noiL, R.lim3, R.out3], [0.72, 'Year 4 · Stabilized, then sale or refinance', R.noi, R.lim4, R.out4]].forEach(function (c, i) {
      var cx = l + w * c[0], fc = c[2], lim = c[3], o = c[4], lp = lim / fc * 100;
      s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(100 - lp) + '" width="' + bw + '" height="' + (Y(lo) - Y(100 - lp)) + '" fill="#e3e0d8"/>';
      if (lim > 0) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(100) + '" width="' + bw + '" height="' + (Y(100 - lp) - Y(100)) + '" fill="#c99a5c"/><text x="' + cx + '" y="' + (Y(100 - lp / 2) + 4) + '" text-anchor="middle" font-size="12" font-weight="600" fill="#5e4520">Assured: $' + Math.round(lim * 1000) + 'k</text>';
      s += '<line x1="' + (cx - bw / 2 - 8) + '" x2="' + (cx + bw / 2 + 8) + '" y1="' + Y(100) + '" y2="' + Y(100) + '" stroke="#1a1a18" stroke-width="2.5"/><text x="' + (cx - bw / 2 - 12) + '" y="' + (Y(100) + 4) + '" text-anchor="end" font-size="12" font-weight="600" fill="#1a1a18">Forecast</text>';
      if (i === 1) { var dp = R.ds / fc * 100; s += '<line x1="' + (cx - bw / 2 - 8) + '" x2="' + (cx + bw / 2 + 8) + '" y1="' + Y(dp) + '" y2="' + Y(dp) + '" stroke="#b5451b" stroke-width="1.5" stroke-dasharray="6 5"/><text x="' + (cx - bw / 2 - 12) + '" y="' + (Y(dp) + 4) + '" text-anchor="end" font-size="12" fill="#b5451b">Loan payments</text>'; }
      var wx = cx + bw / 2 + 34, p1 = pct(o, 0.1) / fc * 100, p9 = pct(o, 0.9) / fc * 100;
      s += '<line x1="' + wx + '" x2="' + wx + '" y1="' + Y(Math.min(hi, p9)) + '" y2="' + Y(p1) + '" stroke="#8a877f" stroke-width="2"/><line x1="' + (wx - 7) + '" x2="' + (wx + 7) + '" y1="' + Y(Math.min(hi, p9)) + '" y2="' + Y(Math.min(hi, p9)) + '" stroke="#8a877f" stroke-width="2"/><line x1="' + (wx - 7) + '" x2="' + (wx + 7) + '" y1="' + Y(p1) + '" y2="' + Y(p1) + '" stroke="#8a877f" stroke-width="2"/>';
      if (d) {
        var a = i === 0 ? (d.x3 === undefined ? fc * (1 + d.m) : d.x3) : d.x4, t = i === 0 ? d.t3 : d.t4, ap = Math.min(hi, a / fc * 100), tpc = t / fc * 100;
        if (t > 0.001) s += '<rect x="' + (wx - 8) + '" y="' + Y(ap + tpc) + '" width="16" height="' + (Y(ap) - Y(ap + tpc)) + '" fill="#a67c3d"/>';
        s += '<circle cx="' + wx + '" cy="' + Y(ap) + '" r="6" fill="#fff" stroke="#1a1a18" stroke-width="2"/>';
        s += '<text x="' + (wx + 16) + '" y="' + (Y(ap) + 4) + '" font-size="12" font-weight="600" fill="' + (t > 0.001 ? '#8f6a32' : '#55585a') + '">' + (t > 0.001 ? 'Top-up $' + Math.round(t * 1000) + 'k' : 'No top-up') + '</text>';
      }
      s += '<text x="' + cx + '" y="' + (H - 36) + '" text-anchor="middle" font-size="12.5" font-weight="600" fill="#1a1a18">' + c[1] + '</text><text x="' + cx + '" y="' + (H - 18) + '" text-anchor="middle" font-size="12" fill="#6b6b66">Forecast NOI ' + money(fc) + '</text>';
    });
    return s + '</svg>';
  }

  function chartDeals(R) {
    var items = R.smp.slice().sort(function (a, b) { return a.j - b.j; }), n = items.length || 1;
    var W = 760, H = 290, l = 58, r = 16, tp = 24, b = 46;
    var mx = Math.max(0.25, Math.max.apply(null, items.map(function (x) { return Math.max(x.top, x.rec); }).concat([0])));
    function Y(v) { return tp + (H - tp - b) * (mx - v) / (2 * mx); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Top-ups paid to and repayments received from each project, in the order they finish, in one simulated run">';
    var st = mx > 0.6 ? 0.5 : 0.25;
    for (var v = -Math.floor(mx / st) * st; v <= mx + 1e-9; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (Math.abs(v) < 1e-9 ? '#1a1a18' : '#ece9e2') + '"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + (v < -1e-9 ? '−' : v > 1e-9 ? '+' : '') + '$' + Math.round(Math.abs(v) * 1000) + 'k</text>';
    var cw = (W - l - r) / n, bw = Math.min(34, cw * 0.62), every = n > 16 ? 2 : 1;
    items.forEach(function (x, i) {
      var cx = l + cw * (i + 0.5);
      if (x.top > 0.001) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(0) + '" width="' + bw + '" height="' + (Y(-x.top) - Y(0)) + '" fill="#a67c3d" rx="2"/>';
      if (x.rec > 0.001) s += '<rect x="' + (cx - bw / 2) + '" y="' + Y(x.rec) + '" width="' + bw + '" height="' + (Y(0) - Y(x.rec)) + '" fill="#3f7d5a" rx="2"/>';
      if (i % every === 0) s += '<text x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle" font-size="11.5" fill="#6b6b66">' + (x.j + 1) + '</text>';
    });
    s += '<text x="' + (l + (W - l - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12" fill="#6b6b66">Projects, in the order they were assured</text>';
    s += '<text x="' + (l + 6) + '" y="' + (tp - 8) + '" font-size="12" font-weight="600" fill="#3f7d5a">Repaid to the fund after the preferred return</text><text x="' + (W - r - 6) + '" y="' + (tp - 8) + '" text-anchor="end" font-size="12" font-weight="600" fill="#8f6a32">Top-ups paid out (below the line)</text>';
    return s + '</svg>';
  }

  function chartFund(R) {
    var W = 760, H = 290, l = 58, r = 16, tp = 18, b = 40, N = R.NY, y, lo = [], md = [], hi = [], rv = [];
    for (y = 0; y <= N; y++) { lo[y] = pct(R.path[y], 0.1); md[y] = pct(R.path[y], 0.5); hi[y] = pct(R.path[y], 0.9); rv[y] = pct(R.resv[y], 0.5); }
    var ymax = Math.max(R.F, Math.max.apply(null, hi)) * 1.08;
    function X(i) { return l + (W - l - r) * i / N; }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Fund balance over twenty years across simulated outcomes">';
    var st = ymax > 120 ? 50 : ymax > 60 ? 20 : ymax > 25 ? 10 : ymax > 12 ? 5 : 2;
    for (var v = 0; v <= ymax; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">$' + v + 'M</text>';
    var band = ''; for (y = 0; y <= N; y++) band += (y ? 'L' : 'M') + X(y) + ',' + Y(hi[y]); for (y = N; y >= 0; y--) band += 'L' + X(y) + ',' + Y(Math.max(0, lo[y]));
    s += '<path d="' + band + 'Z" fill="#c99a5c" opacity=".3"/>';
    s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(R.F) + '" y2="' + Y(R.F) + '" stroke="#1a1a18" stroke-width="1.2" stroke-dasharray="5 5"/><text x="' + (W - r - 4) + '" y="' + (Y(R.F) - 6) + '" text-anchor="end" font-size="12" fill="#1a1a18">The pledge</text>';
    var d = '', e = ''; for (y = 0; y <= N; y++) { d += (y ? 'L' : 'M') + X(y) + ',' + Y(md[y]); e += (y ? 'L' : 'M') + X(y) + ',' + Y(rv[y]); }
    s += '<path d="' + e + '" fill="none" stroke="#55585a" stroke-width="2" stroke-dasharray="3 4"/><text x="' + (X(N) - 4) + '" y="' + (Y(rv[N - 4]) - 8) + '" text-anchor="end" font-size="12" fill="#55585a">Held against active projects</text>';
    s += '<path d="' + d + '" fill="none" stroke="#8f6a32" stroke-width="3"/>';
    for (y = 0; y <= N; y++) if (y % 5 === 0) s += '<text x="' + X(y) + '" y="' + (H - 14) + '" text-anchor="' + (y === 0 ? 'start' : y === N ? 'end' : 'middle') + '" font-size="12" fill="#6b6b66">' + (y === 0 ? 'Start' : 'Year ' + y) + '</text>';
    return s + '</svg>';
  }

  function chartHomes(R) {
    var W = 760, H = 250, l = 58, r = 16, tp = 18, b = 40, N = R.NY, y, cum = [], c = 0;
    for (y = 0; y <= N; y++) { c += R.started[y] / K * P.units; cum[y] = c; }
    var ymax = Math.max(1, c) * 1.1;
    function X(i) { return l + (W - l - r) * i / N; }
    function Y(v) { return tp + (H - tp - b) * (1 - v / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cumulative homes in assured projects over twenty years">';
    var st = ymax > 8000 ? 2000 : ymax > 4000 ? 1000 : ymax > 1600 ? 500 : ymax > 800 ? 200 : 100;
    for (var v = 0; v <= ymax; v += st) s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#ece9e2"/><text x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#6b6b66">' + v.toLocaleString('en-US') + '</text>';
    var d = 'M' + X(0) + ',' + Y(0); for (y = 0; y <= N; y++) d += 'L' + X(y) + ',' + Y(y ? cum[y - 1] : 0) + 'L' + X(y) + ',' + Y(cum[y]);
    s += '<path d="' + d + 'L' + X(N) + ',' + Y(0) + 'Z" fill="#3f7d5a" opacity=".18"/><path d="' + d + '" fill="none" stroke="#3f7d5a" stroke-width="3"/>';
    for (y = 0; y <= N; y++) if (y % 5 === 0) s += '<text x="' + X(y) + '" y="' + (H - 14) + '" text-anchor="' + (y === 0 ? 'start' : y === N ? 'end' : 'middle') + '" font-size="12" fill="#6b6b66">' + (y === 0 ? 'Start' : 'Year ' + y) + '</text>';
    return s + '</svg>';
  }

  function lead(R) {
    var backed = R.deals * P.cost, homes = R.deals * P.units, net = Math.max(0, R.top - R.rec), perHome = net * 1e6 / homes;
    var costHomes = R.F / (P.cost / P.units), lev = backed / R.F, activeDev = R.active * P.cost;
    var w = Math.max(1.2, costHomes / homes * 100);
    return '<div class="nam-lead-top"><div><b>$' + Math.round(lev) + ' : $1</b><span>Leverage</span><p>Development backed over 20 years for each dollar pledged. About ' + money(activeDev, 0) + ' is under assurance at any one time.</p></div>'
      + '<div><b>' + Math.round(homes).toLocaleString('en-US') + '</b><span>Homes in assured projects</span><p>' + R.deals.toFixed(R.deals < 10 ? 1 : 0) + ' projects and ' + money(backed, 0) + ' of development over 20 years.</p></div>'
      + '<div><b>$' + Math.round(perHome).toLocaleString('en-US') + '</b><span>Expected subsidy per home</span><p>Top-ups not repaid, spread over the homes backed. Interest earned is not counted.</p></div></div>'
      + '<div class="nam-vs"><p>The same ' + money(R.F, 0) + ', two ways</p>'
      + '<div class="nam-vs-row"><span>Spent on cost</span><i><em style="width:' + w.toFixed(1) + '%"></em></i><b>' + Math.round(costHomes) + ' homes</b></div>'
      + '<div class="nam-vs-row is-noi"><span>Placed behind cash flow</span><i><em style="width:100%"></em></i><b>' + Math.round(homes).toLocaleString('en-US') + ' homes</b></div>'
      + '<small>A dollar spent on cost buys a dollar of building: ' + money(R.F, 0) + ' pays for about ' + Math.round(costHomes) + ' homes at $' + Math.round(P.cost / P.units * 1e6 / 1000).toLocaleString('en-US') + ',000 each, once. A dollar placed behind forecast NOI is mostly not spent, is repaid when projects succeed, and is used again.</small></div>';
  }

  function tiles(R) {
    var net = Math.max(0, R.top - R.rec), perDeal = net / R.deals, rate = R.top / R.deals / P.years, need = R.ramp * R.expo;
    var lasts = R.stopShare < 0.5 ? 'Beyond 20 years' : 'About ' + R.stopMed.toFixed(R.stopMed % 1 ? 1 : 0) + ' years';
    var lastsNote = R.stopShare < 0.5
      ? (R.stopShare < 0.01 ? 'In every simulated future the fund can back a new project whenever the next one is due.' : 'In ' + Math.round((1 - R.stopShare) * 100) + '% of simulated futures the fund can always back the next project.')
      : 'In the middle outcome this is when the fund first cannot cover a new project when one is due.';
    var T = [
      ['$' + (100 / P.cap).toFixed(2), 'Value of $1 of yearly NOI', 'At a ' + P.cap.toFixed(2) + '% cap rate. A dollar of cost is worth $1.'],
      ['$' + Math.round(R.expo * 1000) + 'k', 'Most the fund can pay one project', 'The lesser of the dollar limit and ' + P.limpct + '% of forecast NOI, over ' + (P.years === 2 ? 'two years' : 'one year') + '.'],
      ['$' + Math.round(rate * 1000) + 'k', 'Expected top-up per project, per assured year', (rate / R.noi * 100).toFixed(1) + '% of forecast NOI. ' + Math.round(R.shareDraw * 100) + '% of projects draw something.'],
      [(R.top > 0 ? Math.round(R.rec / R.top * 100) : 0) + '¢', 'Repaid per dollar of top-up', Math.round(R.shareBelow * 100) + '% of projects finish below the ' + P.pref + '% preferred return and repay nothing.'],
      ['$' + Math.round(perDeal * 1000) + 'k', 'Expected net cost per project', 'Top-ups paid less top-ups repaid.'],
      [money(need), 'Smallest pledge that launches the flywheel', 'Covers the ' + R.ramp + ' projects committed in the first four years, before any proceeds come back.'],
      [money(R.end10) + ' → ' + money(R.endN), 'Fund at year 10 and year 20', 'Middle outcome, from a ' + money(R.F, 0) + ' pledge, with interest at ' + INTEREST + '%. ' + (R.endN >= R.F ? 'The flywheel holds its size.' : 'The flywheel tapers.')],
      [lasts, 'How long the pledge keeps working', lastsNote]
    ];
    return T.map(function (x) { return '<div class="nam-tile"><b>' + x[0] + '</b><span>' + x[1] + '</span><p>' + x[2] + '</p></div>'; }).join('');
  }

  /* ---------- build ---------- */
  var ctl = root.querySelector('.nam-controls'), out = root.querySelector('.nam-tiles');
  var c1 = root.querySelector('#nam-c1'), c2 = root.querySelector('#nam-c2'), c3 = root.querySelector('#nam-c3'), c4 = root.querySelector('#nam-c4'), ld = root.querySelector('.nam-lead');
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
    var noi = P.cost * P.yoc / 100, e4 = Math.min(P.limit, noi * P.limpct / 100), e3 = P.years === 2 ? Math.min(P.limit, noi * P.lease / 100 * P.limpct / 100) : 0;
    var fmin = Math.max(10, Math.ceil(Math.ceil(LIFE / Math.round(P.pace / 3)) * (e3 + e4)));
    var fs = document.getElementById('nam-fund'); fs.min = fmin; if (P.fund < fmin) P.fund = fmin;
    for (var k in labels) labels[k]();
    var R = run();
    ld.innerHTML = lead(R); out.innerHTML = tiles(R); c1.innerHTML = chartProject(R); c2.innerHTML = chartDeals(R); c3.innerHTML = chartFund(R); c4.innerHTML = chartHomes(R);
    window.NAM_LAST = { deals: R.deals, top: R.top, rec: R.rec, interest: R.interest, end10: R.end10, endN: R.endN, fund: P.fund, ramp: R.ramp, draw: R.shareDraw, below: R.shareBelow, stop: R.stopShare, stopMed: R.stopMed, expo: R.expo, dscr0: R.dscr0, dscr1: R.dscr1 };
  }
  draw();
})();
