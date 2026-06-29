import { promiseSectionContainer } from '../dom/section-extractor.js';
import { renderKatex } from '../utils/renderer.js';
import state, { ANIM_TIME } from '../core/state.js';
import { updateCloseAllNutshells } from './close-all.js';

// constants
const OFFSET_Y = '-5px';
const DEFAULT_BG_COLOR = '#fff';
const TRANSPARENT_RGBA = 'rgba(0, 0, 0, 0)';
const ARROW_HALF_WIDTH = 20;
const BUBBLE_RADIUS = 20;
const LOADING_DOTS_START = 10;
const LOADING_DOTS_INTERVAL = 1000;
const FAILSAFE_MAX = 10;

/////////////////////////////////////////////////////////////////////
// ⭐️ Create & return bubble, using an expandable's data
/////////////////////////////////////////////////////////////////////

export function createBubble(bubbleParent, expandable, clickX, convertLinksToExpandables) {
  /**************************

    BUBBLE ELEMENT & ANIMATION STRUCTURE

    Bubble:
    - Arrow (sticks out of bubble)
    - Overflow container
        - Embed button, reveal on hover
        - Section (left & right padded)
        - "from URL..."
        - Recursive bubbles (sticks out of padding)
        - Close button

    Animation:
        Opening:
        - calculate Section height
        - animate Overflow's height from 0px to (section height + head/foot)px
        - then make Overflow's height auto again (so can stretch when recursive bubbles appear)
        Closing:
        - animate Overflow's height going to 0
        - then delete bubble element

    **************************/
  const parentNodeStyle = window.getComputedStyle(document.body);
  const bgColor = getInheritedBackgroundColor(expandable, parentNodeStyle);

  // Make a bubble container!
  let bubble = document.createElement('div');
  bubble.className = 'nutshell-bubble';

  Object.assign(bubble.style, {
    top: '0px',
    color: parentNodeStyle.color,
    fontSize: parentNodeStyle.fontSize,
    fontStyle: parentNodeStyle.fontStyle,
    fontWeight: parentNodeStyle.fontWeight,
    lineHeight: parentNodeStyle.lineHeight,
    textDecoration: parentNodeStyle.textDecoration,
    textAlign: 'left',
    borderColor: parentNodeStyle.color,
    background: bgColor,
  });

  const result = calculateBubblePosition(bubbleParent, expandable);

  bubble.style.setProperty('--bubble-dynamic-offset', `-${result.leftIndent}px`);
  bubble.style.setProperty('--bubble-dynamic-width', `${result.bubbleWidth}px`);

  const arrow = document.createElement('div');
  arrow.className = 'nutshell-bubble-arrow';
  arrow.style.borderBottomColor = parentNodeStyle.color;
  arrow.style.setProperty('--arrow-background', bgColor);
  arrow.style.left = `${calculateArrowLeft(clickX, result.bubbleLeft, result.bubbleWidth)}px`;
  bubble.appendChild(arrow);

  // The Overflow container
  const overflow = document.createElement('div');
  overflow.className = 'nutshell-bubble-overflow';
  overflow.setAttribute('mode', 'opening');
  overflow.style.height = '0px'; // start closed
  bubble.appendChild(overflow);

  // Section
  const section = document.createElement('div');
  section.className = 'nutshell-bubble-overflow-section';
  overflow.appendChild(section);

  // Close Button
  const close = document.createElement('button');
  close.className = 'nutshell-bubble-overflow-close';
  close.innerHTML = '&times;';
  close.ariaLabel = 'Close';
  close.onclick = () => {
    // Close my parent, which'll also close me
    expandable.close();

    // Then scroll to that parent expandable *if it's offscreen*
    const parentTop = expandable.getBoundingClientRect().top;
    if (parentTop < 0) {
      window.scrollTo({
        top: parentTop + window.pageYOffset,
        behavior: 'smooth',
      });
    }
  };
  overflow.appendChild(close);

  /////////////////////////
  // OPENING //////////////
  /////////////////////////

  // For "..." loading anim
  let isSectionLoaded = false;

  // Get the section (using expandable's data),
  // and put it in bubble's Section Container when it loads!
  promiseSectionContainer(expandable).then((content) => {
    // Apply KaTeX Rendering
    renderKatex(content);

    // Links to Nutshell Expandables (yay recursion!)
    convertLinksToExpandables(content, expandable);

    // Put in section's content
    section.innerHTML = '';
    section.appendChild(content);

    // And animate expand for new content! Go to full height, then auto.
    // console.log(section.getBoundingClientRect().height, )
    const targetHeight = section.getBoundingClientRect().height + close.getBoundingClientRect().height;
    overflow.style.height = `${targetHeight}px`;
    setTimeout(() => {
      overflow.style.height = 'auto';
    }, ANIM_TIME);

    // Update followup text if needed
    if (typeof expandable.updateFollowupText === 'function') {
      expandable.updateFollowupText();
    }

    // Yes.
    isSectionLoaded = true;
  });

  // While waiting to load, show "..." anim
  setTimeout(() => {
    if (isSectionLoaded) return;
    // Dots: add a dot per second...
    const dots = document.createElement('p');
    dots.innerHTML = '...'; // start with 3.
    // Doing recursive setTimeout instead of "setInterval"
    // so I don't deal with figuring out how to clear an interval
    // from the above Promise with a totally different scope:
    const addDot = () => {
      if (isSectionLoaded) return;
      dots.innerHTML += '.';
      setTimeout(addDot, LOADING_DOTS_INTERVAL);
    };
    addDot();

    // Animate to height of the dots
    section.innerHTML = '';
    section.appendChild(dots);
    overflow.style.height = `${section.getBoundingClientRect().height}px`;
  }, LOADING_DOTS_START);

  /////////////////////////
  // CLOSING //////////////
  /////////////////////////

  // Close Animation
  bubble.close = () => {
    // Subtly move up
    bubble.style.top = OFFSET_Y;

    // Can't start an animation from "auto", so set height to current height
    overflow.style.height = `${overflow.getBoundingClientRect().height}px`;

    // NOW close it.
    setTimeout(() => {
      overflow.setAttribute('mode', 'closing');
      overflow.style.height = '0px';
    }, 1);

    // Afterwards, delete node.
    setTimeout(() => {
      bubble.parentNode?.removeChild(bubble);
      expandable.setAttribute('mode', 'closed'); // and tell Expandable to show it, too
    }, ANIM_TIME + 1);

    // Count the killed bubbles inside, subtract from state.openShellCount
    state.openShellCount -= bubble.querySelectorAll('.nutshell-bubble').length;
    updateCloseAllNutshells();
  };

  // Finally, return this magnificent created Bubble!
  return bubble;
}

/**
 *
 * @param {Element} bubbleParent
 * @param {Element} expandable
 * @returns
 */
function calculateBubblePosition(bubbleParent, expandable) {
  // Container
  const container = expandable.closest('.nutshell-bubble-overflow') || document.body;

  const containerStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;

  const containerRect = container.getBoundingClientRect();

  const containerLeft = containerRect.left + paddingLeft;
  const containerWidth = containerRect.width - paddingLeft - paddingRight;

  // Parent offset
  const parentRect = bubbleParent.getBoundingClientRect();
  const offsetLeft = parentRect.left - containerLeft;

  // Bubble Gap
  const nestedBubbleGap = parseFloat(containerStyle.getPropertyValue('--nested-bubble-gap')) || 0;
  const bubbleGap = container === document.body ? 0 : nestedBubbleGap;

  return {
    bubbleLeft: containerLeft,
    leftIndent: offsetLeft - bubbleGap,
    bubbleWidth: containerWidth - bubbleGap * 2,
  };
}

function getInheritedBackgroundColor(startElement, parentStyle) {
  let bgColor = parentStyle.backgroundColor;
  let currentElem = startElement.parentNode;
  let failsafe = FAILSAFE_MAX;

  while (bgColor === TRANSPARENT_RGBA && currentElem && currentElem.tagName && failsafe-- > 0) {
    bgColor = window.getComputedStyle(currentElem).backgroundColor;
    currentElem = currentElem.parentNode;
  }

  return bgColor === TRANSPARENT_RGBA ? DEFAULT_BG_COLOR : bgColor;
}

function calculateArrowLeft(clickX, bubbleLeft, bubbleWidth) {
  let arrowCenter = clickX - bubbleLeft;

  const ARROW_MIN_PADDING = BUBBLE_RADIUS + ARROW_HALF_WIDTH;
  const ARROW_MAX_PADDING = bubbleWidth - ARROW_MIN_PADDING;

  if (arrowCenter < ARROW_MIN_PADDING) arrowCenter = ARROW_MIN_PADDING;
  if (arrowCenter > ARROW_MAX_PADDING) arrowCenter = ARROW_MAX_PADDING;

  return arrowCenter - ARROW_HALF_WIDTH;
}
