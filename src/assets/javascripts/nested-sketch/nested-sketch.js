/*
 * Nested Sketch
 * Copyright 2026. Mono-Hedron. All rights reserved.
 *
 * This project is a customized version of "Nutshell" v1.0.8 originally created by Nicky Case.
 * https://ncase.me/nutshell/
 * The original "Nutshell" is dedicated to the public domain under CC0 1.0.
 *
 * This modification include:
 * - Class-based triggers.
 * - Math formula rendering.
 * - Math-link.
 * - Style adjustment.
 *
 * * Note: While the original work is licensed under CC0,
 *         these specific modifications are "All Rights Reserved".
 *         Unlabeled portions may also contain modifications.
 */

import state from './core/state.js';
import { purifyHTML } from './utils/purifier.js';
import { renderKatex } from './utils/renderer.js';
import { addCloseAllButton } from './ui/close-all.js';
import { hideElements } from './dom/element-handler.js';
import { convertLinksToExpandables } from './dom/link-binder.js';

/////////////////////////////////////////////////////////////////////
// ⭐️ Start Nutshell!
/////////////////////////////////////////////////////////////////////

// By default, start Nutshell on DOMContentLoaded
// (you may want to delay this e.g. if your blog's content is AJAX'd in)
window.addEventListener('DOMContentLoaded', () => {
  if (state.options.startOnLoad) start();
});

// NUTSHELL START
function start(el = document.body) {
  // Restart!
  state.htmlCache = {};
  state.openShellCount = 0;

  // IF TOP PAGE: Convert this page!
  // (By default, the whole document. But you can specify element,
  // i.e. leaving out comments section)
  // IF NOT TOP PAGE:
  // I must have been created for postMessage; give parent my HTML.
  if (window == window.top) {
    // Add self's HTML to my own cached
    state.htmlCache[state.thisPageURL] = purifyHTML(el.innerHTML, state.thisPageURL);

    // KaTeX Rendering
    renderKatex(el);

    // Add styles & convert page
    hideElements(el);
    convertLinksToExpandables(el);

    // Fill out other UI with localized text
    // (only set by user after Nutshell.js file included, hence this)
    addCloseAllButton();
    // Nutshell.fillEmbedModalText();
  } else {
    // Tell my parent (from any origin) my HTML!
    _sendParentMyHTML();
  }
}

/////////////////////////////////////////////////////////////////////
// ⭐️ Get purified HTML, given a source URL.
/////////////////////////////////////////////////////////////////////

// Not very picky about what's in the cache
// Could be just <p>'s, or the entire <body> with nav & comments
state.htmlCache = {};

// Ma, here's my HTML!
let _sendParentMyHTML = () => {
  window.parent.postMessage(
    JSON.stringify({
      url: state.thisPageURL, // the url I'm repping
      html: document.body.innerHTML,
    }),
    '*'
  );
};
