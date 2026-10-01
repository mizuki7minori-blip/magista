(() => {
  const select = document.getElementById('commander-select');
  if (!select) return;

  const cache = new Map();

  async function getJapaneseName(name) {
    if (cache.has(name)) return cache.get(name);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('not found');
      const card = await res.json();
      const jaRes = await fetch(`https://api.scryfall.com/cards/${card.set}/${card.collector_number}/ja`);
      if (jaRes.ok) {
        const ja = await jaRes.json();
        const jp = ja.printed_name || ja.name || name;
        cache.set(name, jp);
        return jp;
      }
    } catch (e) {}
    cache.set(name, name);
    return name;
  }

  async function localizeOptions() {
    const options = [...select.options];
    for (let i = 0; i < options.length; i += 3) {
      await Promise.all(options.slice(i, i + 3).map(async option => {
        const original = option.value;
        if (!original) return;
        const jp = await getJapaneseName(original);
        option.textContent = jp;
        option.dataset.jpName = jp;
      }));
    }
  }

  async function localizeChips() {
    const chips = [...document.querySelectorAll('.commander-chip')];
    await Promise.all(chips.map(async chip => {
      const original = chip.dataset.name;
      if (!original) return;
      chip.textContent = await getJapaneseName(original);
    }));
  }

  localizeOptions().then(localizeChips);

  const observer = new MutationObserver(() => {
    localizeOptions();
    localizeChips();
  });
  observer.observe(select, { childList: true });

  const chipArea = document.querySelector('.commander-search-results');
  if (chipArea) observer.observe(chipArea, { childList: true, subtree: true });
})();
