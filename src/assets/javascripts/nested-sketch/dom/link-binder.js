import { createBubble } from '../ui/bubbles.js';
import state, { ANIM_TIME } from '../core/state.js';
import { updateCloseAllNutshells } from '../ui/close-all.js';
import { getLocalizedText } from '../core/internationalization.js';

/////////////////////////////////////////////////////////////////////
// ⭐️ Convert links to Expandable buttons
/////////////////////////////////////////////////////////////////////
function bindExpandable(el, strategies = {}) {
  const {
    getClickX, // Click X coordinate custom calculation
    insertBubble, // Custom bubble insertion place
    onOpen,
    onClose,
  } = strategies;

  el.classList.add('nutshell-expandable');
  el.setAttribute('mode', 'closed');

  el.bubble = null;
  el.isOpen = false;

  el.open = (mouseEvent) => {
    // Hi
    el.isOpen = true;

    // Insert a bubble
    let clickX = getClickX ? getClickX(mouseEvent, el) : mouseEvent.clientX - el.parentNode.getBoundingClientRect().x;

    el.bubble = createBubble(el, clickX, convertLinksToExpandables);

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
  let punctuation = document.createElement('span');
  if (ex.nextSibling && ex.nextSibling.nodeValue) {
    let nextChar;
    // get next char, is it punctuation?
    let keepPunctuation = getLocalizedText('keepPunctuation');
    while (keepPunctuation.indexOf((nextChar = ex.nextSibling.nodeValue[0])) >= 0) {
      ex.nextSibling.nodeValue = ex.nextSibling.nodeValue.slice(1); // slice off the rest
      punctuation.innerHTML += nextChar; // slap it on
    }
  }
  ex.parentNode.insertBefore(punctuation, ex.nextSibling); // add right after expandable link

  return punctuation;
}

function createFollowUpHTML(ex, punctuation) {
  // Follow up by repeating last sentence, UNLESS IT'S THE START/END OF PARAGRAPH ALREADY.
  const next = punctuation.nextSibling;
  let hasWordsAfterExpandable =
    (next?.nodeValue?.trim().length > 1 ||
      (next?.nodeValue == ' ' && next.nextElementSibling?.querySelector('.katex') !== null)) ??
    false;
  // (punctuation.nextSibling?.nodeValue?.trim().length > 1 || punctuation.nextSibling?.querySelector('.katex') != null) ?? false;

  let followupSpan = document.createElement('span');
  followupSpan.style.display = 'none';
  followupSpan.className = 'nutshell-followup';
  ex.parentNode.insertBefore(followupSpan, punctuation.nextSibling); // add right after punctuation

  // Short or long followup TEXT?
  let shortFollowupHTML = '...';
  if (hasWordsAfterExpandable) {
    // Get last sentence...
    let htmlBeforeThisLink = ex.parentNode.innerHTML.split(ex.outerHTML)[0]; // everything BEFORE this html
    // Convert to raw text
    let tmpSpan = document.createElement('span');
    tmpSpan.innerHTML = htmlBeforeThisLink;
    // Get immediately previous sentence

    // Follow up with prev sentence, then expandable text in bold, then punctuation
    // longFollowupHTML = lastSentenceHTML + '<b>' + ex.innerHTML + '</b>' + punctuation.innerHTML;
  }
  // Method needs to be publicly accessible, I guess
  ex.updateFollowupText = () => {
    if (!ex.bubble || !hasWordsAfterExpandable) {
      // if closed (or no words after), hide followup span
      followupSpan.style.display = 'none';
    } else {
      // if open, show only if bubble's textContent is above 50 words
      // let longEnough = (ex.bubble.textContent.trim().split(" ").length>=50);
      followupSpan.style.display = 'inline';
      // [Modified] [TASK] long followup latex texts are not rendered.
      // followupSpan.innerHTML = longEnough ? longFollowupHTML : shortFollowupHTML;
      followupSpan.innerHTML = shortFollowupHTML;
    }
  };
}

// [Modified]
export function convertLinksToExpandables(dom, _forThisElement) {
  //1. General expandable link
  dom.querySelectorAll('a.ns-link:not(.katex-html *)').forEach((ex) => {
    const punctuation = extractPunctuation(ex);
    createFollowUpHTML(ex, punctuation);

    bindExpandable(ex, {
      getClickX: (e, el) => e.clientX - el.parentNode.getBoundingClientRect().x,

      insertBubble: (bubble, el) => {
        el.parentNode.insertBefore(bubble, punctuation.nextSibling);
      },

      onOpen: () => ex.updateFollowupText(),
      onClose: () => setTimeout(ex.updateFollowupText, ANIM_TIME),
    });
  });

  //2. katex expandable link
  dom.querySelectorAll('.katex-html a').forEach((mathLink) => {
    // for consistency
    mathLink.classList.add('ns-link');

    bindExpandable(mathLink, {
      getClickX: (e, el) => {
        const mathWrapper = el.closest('.katex') ?? el;
        const container = mathWrapper.parentNode;
        const containerRect = container.getBoundingClientRect();
        return e.clientX - containerRect.left;
      },

      insertBubble: (bubble, el) => {
        const mathWrapper = el.closest('.katex') ?? el;
        mathWrapper.parentNode.insertBefore(bubble, mathWrapper.nextSibling);
      },

      onOpen: null,
      onClose: null,
    });

    // Place prior whitespace in front of the link.
    while (mathLink.firstElementChild?.classList.contains('mspace')) {
      const child = mathLink.firstElementChild;
      mathLink.removeChild(child);
      mathLink.parentElement.insertBefore(child, mathLink);
    }
    // Place post whitespace after the link.
    while (mathLink.lastElementChild?.classList.contains('mspace')) {
      const child = mathLink.lastElementChild;
      mathLink.removeChild(child);
      mathLink.parentElement.insertBefore(child, mathLink.nextSibling);
    }

    // [TEST] aria-hidden removal
    const container = mathLink.closest('.katex-html');
    if (container) {
      container.removeAttribute('aria-hidden');
    }
  });
}
