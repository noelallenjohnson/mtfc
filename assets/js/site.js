/* Home page: rotating tagline. Edit the phrases here. */
(function () {
  var phrases = [
    { text: "Finance. Consumers. Timber's Future.", duration: 6000 },
    { text: "금융. 소비자. 목재의 미래.", duration: 3000 },
    { text: "Finanzen. Verbraucher. Die Zukunft des Holzes.", duration: 3000 },
    { text: "金融。消費者。木材の未来。", duration: 3000 },
    { text: "Finans. Konsumenter. Träets framtid.", duration: 3000 }
  ];
  var el = document.getElementById('mtfcLangRotator');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var index = 0;
  function showNext() {
    el.classList.add('fade-out');
    setTimeout(function () {
      index = (index + 1) % phrases.length;
      el.textContent = phrases[index].text;
      el.classList.remove('fade-out');
      setTimeout(showNext, phrases[index].duration);
    }, 500);
  }
  setTimeout(showNext, phrases[0].duration);
})();
