{
  const projects = [
    {t:'Brick Blaster', d:'A full-stack arcade game built with plain JavaScript and HTML5 Canvas, with a PHP/MySQL backend for user accounts and a persistent leaderboard.',
     tech:['JavaScript','HTML5 Canvas','CSS','PHP','MySQL'], gh:'https://github.com/dragonwarrior2005/Brick-Blaster', live:'https://brick-blaster-two.vercel.app'},
    {t:'Data Analysis Projects', d:'Python analyses of real datasets: book prices, the Netflix catalogue and Toronto Bike Share, covering scraping, cleaning and visualisation.',
     tech:['Python','pandas','matplotlib','SQL'], gh:'https://github.com/dragonwarrior2005/data-analysis-projects'}
  ];
  const skills = [
    {h:'Languages', s:['Python','JavaScript','Java','SQL','PHP']},
    {h:'Web', s:['HTML & CSS','React','HTML5 Canvas','Vercel','Netlify']},
    {h:'Data', s:['pandas','matplotlib','Web scraping','MySQL']},
    {h:'Hardware', s:['Verilog','SystemVerilog','Cadence Virtuoso','Yosys']}
  ];
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  document.getElementById('projGrid').innerHTML = projects.map(p => `
    <article class="card rise"><span class="pin"></span>
      <h3>${esc(p.t)}</h3><p>${esc(p.d)}</p>
      <ul class="chips">${p.tech.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="acts">
        ${p.live ? `<a href="${esc(p.live)}" target="_blank" rel="noopener">Live demo ↗</a>` : ''}
        <a href="${esc(p.gh)}" target="_blank" rel="noopener">Code on GitHub ↗</a>
      </div>
    </article>`).join('');

  document.getElementById('skillGrid').innerHTML = skills.map(k => `
    <div class="sk rise"><h3>${esc(k.h)}</h3><ul class="chips">${k.s.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');

  // chip floorplan
  const chip = document.getElementById('chip');
  const C = 'var(--cu)';
  let svg = '';
  // pins on four sides
  for (let i = 0; i < 9; i++) {
    const p = 110 + i * 37.5;
    svg += `<rect x="${p-6}" y="58" width="12" height="34" rx="2" fill="${C}" opacity=".85"/>`;
    svg += `<rect x="${p-6}" y="428" width="12" height="34" rx="2" fill="${C}" opacity=".85"/>`;
    svg += `<rect x="58" y="${p-6}" width="34" height="12" rx="2" fill="${C}" opacity=".85"/>`;
    svg += `<rect x="428" y="${p-6}" width="34" height="12" rx="2" fill="${C}" opacity=".85"/>`;
  }
  // package and die
  svg += `<rect x="86" y="86" width="348" height="348" rx="18" fill="var(--die)"/>`;
  svg += `<rect x="112" y="112" width="296" height="296" rx="8" fill="var(--die2)"/>`;
  // blocks
  const blocks = [
    {x:126,y:126,w:130,h:110,l:'Web',s:'JS · React'},
    {x:264,y:126,w:130,h:110,l:'Data',s:'Python · SQL'},
    {x:126,y:284,w:130,h:110,l:'RTL',s:'SystemVerilog'},
    {x:264,y:284,w:130,h:110,l:'Java',s:'OOP · Spring'}
  ];
  // traces from pins into blocks
  const traces = [
    'M110 92 V108 H150 V126', 'M185 92 V126', 'M335 92 V126', 'M410 92 V108 H370 V126',
    'M92 260 H112 V250 H126', 'M428 260 H408 V270 H394',
    'M185 428 V394', 'M335 428 V394', 'M260 236 V284'
  ];
  traces.forEach(d => { svg += `<path class="trace" d="${d}"/>`; });
  traces.forEach((d, i) => { svg += `<path class="pulse" d="${d}" style="animation-delay:${(i * 0.37).toFixed(2)}s"/>`; });
  blocks.forEach(b => {
    svg += `<g class="blk"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="#30353c" stroke="${C}" stroke-opacity=".6"/>`;
    svg += `<text x="${b.x + 14}" y="${b.y + 32}">${b.l}</text>`;
    svg += `<text x="${b.x + 14}" y="${b.y + b.h - 16}" style="font:500 12px Inter,sans-serif;fill:#a4a7ab">${b.s}</text>`;
    for (let r = 0; r < 3; r++) svg += `<rect x="${b.x + 14}" y="${b.y + 48 + r * 12}" width="${b.w - 28 - r * 22}" height="5" rx="2.5" fill="${C}" opacity="${0.5 - r * 0.12}"/>`;
    svg += `</g>`;
  });
  // centre bus
  svg += `<rect x="248" y="236" width="24" height="48" rx="3" fill="${C}" opacity=".9"/>`;
  svg += `<text x="260" y="487" text-anchor="middle" style="font:600 13px Inter,sans-serif;fill:var(--muted)">TR-2026 · McMaster CS</text>`;
  chip.innerHTML = svg;

  // mobile menu
  const menuBtn = document.querySelector('.menu'), navLinks = document.getElementById('navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false);
  }));

  // reveal on scroll
  const revealer = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); revealer.unobserve(e.target); }
  }), {threshold: .12});
  document.querySelectorAll('.rise').forEach(el => revealer.observe(el));
}
