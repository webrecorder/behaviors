(function outLinks() {
  const ignore = [
    'about:',
    'data:',
    'mailto:',
    'javascript:',
    'js:',
    '{',
    '*',
    'ftp:',
    'tel:'
  ];
  const good = {'http:': true, 'https:': true};
  const links = [];
  const linksSeen = new Set();
  const urlParer = new URL('about:blank');

  function shouldIgnore(test) {
    let ignored = false;
    let i = ignore.length;
    while (i--) {
      if (test.startsWith(ignore[i])) {
        ignored = true;
        break
      }
    }
    if (!ignored) {
      let parsed = true;
      try {
        urlParer.href = test;
      } catch (error) {
        parsed = false;
      }
      return !(parsed && good[urlParer.protocol]);
    }
    return ignored;
  }

  const found = document.querySelectorAll(
    'a[href], area[href]'
  );
  let elem;
  let i = found.length;
  while (i--) {
    elem = found[i];
    let href = elem.href.trim();
    if (href.length > 0 && href !== ' ') {
      if (!linksSeen.has(href) && !shouldIgnore(href)) {
        linksSeen.add(href);
        links.push(href);
      }
    }
  }
  return links
})();