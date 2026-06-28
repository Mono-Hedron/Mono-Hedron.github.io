import DOMPurify from 'dompurify';
import { marked } from 'marked';

import { convertRelativeToAbsoluteLinks } from './helpers.js';

// PURIFY. (& make src's absolute)
export function purifyHTML(rawHTML, baseURL) {
  // [Modified]
  // Hook for class, id
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Leave ns-link class
    const ALLOWED_CLASSES = ['ns-link', 'ns-hidden', 'pc-only', 'mobile-only'];

    if (node.hasAttribute && node.hasAttribute('class')) {
      const filteredClasses = Array.from(node.classList).filter((className) => ALLOWED_CLASSES.includes(className));

      if (filteredClasses.length > 0) {
        node.setAttribute('class', filteredClasses.join(' '));
      } else {
        node.removeAttribute('class');
      }
    }
    // transport 'id' to 'data-item-id' attribute
    if (node.hasAttribute && node.hasAttribute('id')) {
      let originalID = node.getAttribute('id');
      node.setAttribute('data-item-id', originalID);
      node.removeAttribute('id');
    }
  });

  // DOMPurify: no styles, no scripts, iframes allowed (but sandboxed later)
  let cleanHTML = DOMPurify.sanitize(rawHTML, {
    // [Modified]
    // ADD_ATTR: ['flush-left', 'data-declaration'],
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['style'],
    ADD_TAGS: ['iframe', 'audio', 'video'],
  });

  DOMPurify.removeHook('afterSanitizeAttributes');

  // A <span> for further editing the clean HTML.
  let cleanSpan = document.createElement('div');
  cleanSpan.innerHTML = cleanHTML;

  // Sandbox all iframes
  [...cleanSpan.querySelectorAll('iframe')].forEach((iframe) => {
    iframe.setAttribute('sandbox', 'allow-scripts');
  });

  // Image src's + link href's to absolute
  convertRelativeToAbsoluteLinks('iframe', 'src', baseURL, cleanSpan);
  convertRelativeToAbsoluteLinks('img', 'src', baseURL, cleanSpan);
  convertRelativeToAbsoluteLinks('a', 'href', baseURL, cleanSpan);

  // Make all links open in new tab, don't ruin reading flow.
  [...cleanSpan.querySelectorAll('a')].forEach((a) => {
    a.target = '_blank';
  });

  // Gimme
  return cleanSpan.innerHTML;
}

// Decode, Parse, Purify, Italics
export function decodeParsePurifyItalics(whatever) {
  return '<i>' + DOMPurify.sanitize(marked.parse(decodeURIComponent(whatever))) + '</i>';
}
