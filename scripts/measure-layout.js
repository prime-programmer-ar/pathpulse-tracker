(() => {
  const root = document.getElementById('tracked-site');
  const rootRect = root.getBoundingClientRect();
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left - rootRect.left + r.width / 2),
      y: Math.round(r.top - rootRect.top + r.height / 2),
    };
  };
  const findBtn = (text) => {
    const btns = [...document.querySelectorAll('#tracked-site button')];
    const b = btns.find((x) => x.textContent.trim() === text);
    return b ? rel(b) : null;
  };
  const SECTIONS = ["hero", "features", "shop", "pricing", "reviews", "faq", "contact"];
  const sections = {};
  for (const s of SECTIONS) {
    const el = document.querySelector('[data-section="' + s + '"]');
    const top = Math.round(el.getBoundingClientRect().top - rootRect.top);
    sections[s] = [top, top + Math.round(el.getBoundingClientRect().height)];
  }
  const reserveBtns = [...document.querySelectorAll('#demo-shop button')]
    .filter((b) => b.textContent.trim() === 'Reserve spot')
    .map((b) => rel(b));
  const planBtns = ['Explorer', 'Voyager', 'Luminary'].map((n) => findBtn('Choose ' + n));
  const nav = document.querySelector('#tracked-site nav');
  const faqRow = document.querySelector('#demo-faq button');
  const form = ['#contact-name', '#contact-email', '#contact-message'].map((sel) => {
    const el = document.querySelector(sel);
    const field = sel === '#contact-name' ? 'name' : sel === '#contact-email' ? 'email' : 'message';
    return el ? Object.assign(rel(el), { field }) : null;
  });
  return JSON.stringify({
    sh: root.scrollHeight,
    sections,
    heroCta: findBtn('Reserve your seat'),
    addCart: reserveBtns,
    plans: planBtns,
    nav: nav ? rel(nav) : null,
    faqRow: faqRow ? rel(faqRow) : null,
    form,
    formSubmit: findBtn('Send message'),
  });
})()
