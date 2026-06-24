// Do a forgiving match between two strings: src, test
// Capitalization & punctuation insensitive + src at least CONTAINS test
export function forgivingMatchTest(src, test) {
  // Lowercase & strip everything but letters & numbers
  src = src.toLowerCase().replace(/[^a-z0-9]/g, '');
  test = test.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Src at least CONTAINS test?
  let srcContainsTest = src.indexOf(test) >= 0;
  return srcContainsTest;
}

// Convert key-values to key1=value1&key2=value2 etc. Also encode URI
export function objectToURLParams(obj) {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

// Convert all links in a element to absolute links
export function convertRelativeToAbsoluteLinks(tag, attr, baseURL, el) {
  [...el.querySelectorAll(tag)].forEach((el) => {
    let relative = el.getAttribute(attr),
      absolute = new URL(relative, baseURL).href;
    el[attr] = absolute;
  });
}

// Is it Wikipedia?
export function isWikipedia(url) {
  return url.indexOf('wikipedia.org') >= 0;
}

// Is it YouTube?
export function isYouTube(url) {
  if (url.indexOf('youtu.be') >= 0) return true;
  if (url.indexOf('youtube.com') >= 0) return true;
  return false;
}
