/* Home page: the tagline in several languages, two visible at a time, scrolling upward.
   Edit the phrases here. */
(function () {
  var phrases = [
    "Finance. Consumers. Timber's Future.",
    "금융. 소비자. 목재의 미래.",
    "Finanzen. Verbraucher. Die Zukunft des Holzes.",
    "金融。消費者。木材の未来。",
    "Finance. Consommateurs. L'avenir du bois.",
    "Finanza. Consumatori. Il futuro del legno.",
    "Finans. Forbrukere. Treets fremtid.",
    "Finans. Konsumenter. Träets framtid.",
    "Rahoitus. Kuluttajat. Puun tulevaisuus.",
    "Financiën. Consumenten. De toekomst van hout."
  ];
  var HOLD = 3200;
  var el = document.getElementById('mtfcLangRotator');
  if (!el) return;
  var track = el.querySelector('.lang-track');
  var list = phrases.concat(phrases.slice(0, 2));
  track.innerHTML = '';
  var rows = list.map(function (t) {
    var d = document.createElement('div'); d.className = 'lang-row'; d.textContent = t;
    d.setAttribute('aria-hidden', 'true'); track.appendChild(d); return d;
  });
  el.classList.add('is-live');
  var i = 0;
  function rowH() { return rows[0].getBoundingClientRect().height; }
  function place(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateY(' + (-i * rowH()) + 'px)';
    rows.forEach(function (r, n) { r.classList.toggle('is-top', n === i); });
    if (!animate) { void track.offsetHeight; track.style.transition = ''; }
  }
  place(false);
  window.addEventListener('resize', function () { place(false); });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(function () {
    i += 1; place(true);
    if (i === phrases.length) setTimeout(function () { i = 0; place(false); }, 750);
  }, HOLD);
})();
