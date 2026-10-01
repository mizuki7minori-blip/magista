(() => {
  const removeLegacySearch = () => {
    document.querySelectorAll('.commander-search-wrap,.commander-search-results').forEach(el => el.remove());
  };
  removeLegacySearch();
  const observer = new MutationObserver(removeLegacySearch);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(() => observer.disconnect(), 5000);
})();
