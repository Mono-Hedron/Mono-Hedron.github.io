import { createBubble } from '../ui/bubbles.js';
import state, { ANIM_TIME } from '../core/state.js';
import { updateCloseAllNutshells } from '../ui/close-all.js';
import { getLocalizedText } from '../core/internationalization.js';

/////////////////////////////////////////////////////////////////////
// ⭐️ Convert links to Expandable buttons
/////////////////////////////////////////////////////////////////////
function bindExpandable(el, strategies = {}) {
  const {
    insertBubble, // Custom bubble insertion place
    onOpen,
    onClose,
    bubbleParent,
  } = strategies;

  el.classList.add('nutshell-expandable');
  el.setAttribute('mode', 'closed');

  el.bubble = null;
  el.isOpen = false;

  el.open = (mouseEvent) => {
    // Hi
    el.isOpen = true;

    // Insert a bubble

    el.bubble = createBubble(bubbleParent, el, mouseEvent.clientX, convertLinksToExpandables);

    if (insertBubble) {
      insertBubble(el.bubble, el);
    } else {
      el.parentNode.insertBefore(el.bubble, extractPunctuation(el).nextSibling);
    }

    el.setAttribute('mode', 'open');
    if (onOpen) onOpen();

    // Update counter
    state.openShellCount++;
    updateCloseAllNutshells();
  };

  el.close = () => {
    el.isOpen = false;

    if (el.bubble) {
      el.bubble.close(); // handles its own UI
      el.bubble = null;
    }

    el.setAttribute('mode', 'closed');
    if (onClose) onClose();

    // Update counter
    state.openShellCount--;
    updateCloseAllNutshells();
  };

  // ON CLICK: toggle open/closed
  el.addEventListener('click', (e) => {
    // Don't actually go to that link.
    e.preventDefault();
    // Toggle create/close
    if (el.isOpen) {
      el.close(e); // Is open, make CLOSED
    } else {
      el.open(e); // Is closed, make OPEN
    }
  });
}

function extractPunctuation(ex) {
  // Save the punctuation!
  // Extremely inefficient: plop each character one-by-one into the span
  const punctuation = document.createElement('span');
  if (ex.nextSibling && ex.nextSibling.nodeValue) {
    const keepPunctuation = getLocalizedText('keepPunctuation');
    let nodeText = ex.nextSibling.nodeValue;
    let extracted = '';

    while (nodeText.length > 0 && keepPunctuation.includes(nodeText[0])) {
      extracted += nodeText[0];
      nodeText = nodeText.slice(1);
    }

    if (extracted) {
      ex.nextSibling.nodeValue = nodeText;
      punctuation.textContent = extracted;
    }
  }

  ex.parentNode.insertBefore(punctuation, ex.nextSibling); // add right after expandable link
  return punctuation;
}

function createFollowUpHTML(ex, punctuation) {
  // Follow up by repeating last sentence, UNLESS IT'S THE START/END OF PARAGRAPH ALREADY.
  const next = punctuation.nextSibling;
  if (!next) return null;

  const hasValidText = next.nodeValue && next.nodeValue.trim().length > 1;
  const hasNextKatex = next.nextElementSibling?.querySelector('.katex') != null;
  const hasWordsAfterExpandable = hasValidText || hasNextKatex;

  if (!hasWordsAfterExpandable) return null;

  const followupSpan = document.createElement('span');
  followupSpan.classList.add('nutshell-followup', 'is-hidden');
  followupSpan.textContent = '...';
  ex.parentNode.insertBefore(followupSpan, punctuation.nextSibling); // add right after punctuation

  ex.updateFollowupText = () => {
    if (!ex.bubble) {
      followupSpan.classList.add('is-hidden');
    } else {
      followupSpan.classList.remove('is-hidden');
    }
  };

  return followupSpan;
}

// [Modified]
export function convertLinksToExpandables(dom, _forThisElement) {
  //1. General expandable link
  dom.querySelectorAll('a.ns-link:not(.katex-html *)').forEach((ex) => {
    const punctuation = extractPunctuation(ex);
    const followupSpan = createFollowUpHTML(ex, punctuation);

    bindExpandable(ex, {
      insertBubble: (bubble, el) => {
        el.parentNode.insertBefore(bubble, punctuation.nextSibling);
      },

      onOpen: followupSpan ? () => ex.updateFollowupText() : null,
      onClose: followupSpan ? () => setTimeout(ex.updateFollowupText, ANIM_TIME) : null,

      bubbleParent: ex.parentNode,
    });
  });

  //2. katex expandable link
  dom.querySelectorAll('.katex-html a').forEach((mathLink) => {
    // for consistency
    mathLink.classList.add('ns-link');

    bindExpandable(mathLink, {
      insertBubble: (bubble, el) => {
        const mathWrapper = el.closest('.katex') ?? el;
        mathWrapper.parentNode.insertBefore(bubble, mathWrapper.nextSibling);
      },

      onOpen: null,
      onClose: null,

      bubbleParent: (mathLink.closest('.katex') ?? mathLink).parentNode,
    });

    // Place prior whitespace in front of the link.
    moveMspaceSiblings(mathLink, 'firstElementChild', (child) => mathLink.parentElement.insertBefore(child, mathLink));
    moveMspaceSiblings(mathLink, 'lastElementChild', (child) =>
      mathLink.parentElement.insertBefore(child, mathLink.nextSibling)
    );
    // while (mathLink.firstElementChild?.classList.contains('mspace')) {
    //   const child = mathLink.firstElementChild;
    //   mathLink.removeChild(child);
    //   mathLink.parentElement.insertBefore(child, mathLink);
    // }
    // // Place post whitespace after the link.
    // while (mathLink.lastElementChild?.classList.contains('mspace')) {
    //   const child = mathLink.lastElementChild;
    //   mathLink.removeChild(child);
    //   mathLink.parentElement.insertBefore(child, mathLink.nextSibling);
    // }

    // [TEST] aria-hidden removal
    const container = mathLink.closest('.katex-html');
    if (container) {
      container.removeAttribute('aria-hidden');
    }
  });
}

function moveMspaceSiblings(mathLink, childProp, insertFunc) {
  while (mathLink[childProp]?.classList.contains('mspace')) {
    const child = mathLink[childProp];
    mathLink.removeChild(child);
    if (typeof insertFunc === 'function') {
      insertFunc(child);
    }
  }
}
