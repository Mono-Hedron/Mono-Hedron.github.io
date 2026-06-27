import { promisePurifiedHTMLFromURL } from '../services/html-fetcher.js';
import { HEADER_TAGS } from '../core/state.js';
import { getLocalizedText } from '../core/internationalization.js';
import { forgivingMatchTest, isWikipedia, isYouTube, convertRelativeToAbsoluteLinks } from '../utils/helpers.js';
import { hideElements } from './element-handler.js';
import { decodeParsePurifyItalics } from '../utils/purifier.js';

/////////////////////////////////////////////////////////////////////
// ⭐️ Get a Section from purified HTML & put in container
/////////////////////////////////////////////////////////////////////

export async function promiseSectionContainer(expandable) {
  // Get expandable's url & queryString
  const url = expandable.href;
  const splitHref = url.split('#');
  const queryString = splitHref[1];

  // The container for the Section... get it, boiiiiii.
  const container = document.createElement('div');

  // After getting the purified HTML, find section,
  // then put it in a container, and resolve with that.
  try {
    let addingURL = true;
    let containerHTML = '';
    let purifiedHTML = await promisePurifiedHTMLFromURL(url);
    if (isWikipedia(url) || isYouTube(url)) {
      // If it's Wikipedia or YouTube, just give it, it's already ready!
      containerHTML = purifiedHTML;
    } else {
      // An element to safely search
      const safeEl = document.createElement('div');
      safeEl.innerHTML = purifiedHTML;

      // console.log(safeEl);

      // IF NO SECTION ID, give entire article
      if (!queryString || queryString.trim() == '') {
        // Hidden sections should still be hidden
        hideElements(safeEl);
        // Folded sections need to convert relative links to absolute
        convertRelativeToAbsoluteLinks('a', 'href', url, safeEl);
        // Article is assumed to be the container of the first <p>
        const assumedArticle = safeEl.querySelector('p').parentNode;
        return assumedArticle;
      }

      // Break up query string...
      const queryStringBroken = queryString.split('&');
      const queryKeys = parseQueryString(queryString);
      // If the first term has no "=", then we're searching by heading.
      // Otherwise, we're searching by text in paragraphs.
      const isSearchingByHeading = !queryStringBroken[0].includes('=');

      if (isSearchingByHeading) {
        const sectionID = queryStringBroken[0];
        let foundNode;
        [containerHTML, foundNode] = searchByHeading(queryKeys, safeEl, sectionID);
        addingURL = !(foundNode && foundNode.classList.contains('ns-hidden'));
      } else {
        containerHTML = searchByText(queryKeys, safeEl);
      }

      // ADD BEFORE & AFTER
      if (queryKeys.before) {
        containerHTML = decodeParsePurifyItalics(queryKeys.before) + containerHTML;
      }
      if (queryKeys.after) {
        containerHTML = containerHTML + decodeParsePurifyItalics(queryKeys.after);
      }
    }

    // Now deliver the promised container, containing the section!
    container.innerHTML = containerHTML;
    if (addingURL) {
      container.prepend(addSource(url));
    }
    hideElements(container);
  } catch (message) {
    container.innerHTML = message;
  }

  return container;
}

function searchByHeading(queryKeys, safeEl, sectionID) {
  //////////////////////////
  // SEARCH BY HEADER...
  //////////////////////////
  let containerHTML = '';
  //1. Searching by ID
  let foundNode = selectByDataItemID(safeEl, sectionID);

  //2. Forgiving-search the <headings> for #Heading
  if (!foundNode) {
    for (const tag of HEADER_TAGS) {
      const headings = safeEl.querySelectorAll(tag);
      foundNode = Array.from(headings).find((heading) => forgivingMatchTest(heading.innerText, sectionID));
      if (foundNode) break;
    }
  }

  // If after all that, STILL none, tell user the error.
  if (!foundNode) {
    return [`<p>${getLocalizedText('sectionIDError').replace('[ID]', sectionID)}</p>`, foundNode];
  }

  const tagName = foundNode.tagName.toLowerCase();

  // If the node is a header, get following section.
  if (HEADER_TAGS.includes(tagName)) {
    // Now get everything from the start of the section (right after heading)
    // to end of section (next heading, <hr>, or end-of-post)

    // HTMLs to add (making an array so can cut in retrospect)
    const htmlsToAdd = [];

    // Iterate node by node...
    let currentNode = foundNode;
    while (true) {
      // Do I even have a next sibling?
      currentNode = currentNode.nextSibling; // not .nextElementSibling in case writer forgot to put stuff in <p>???
      if (!currentNode) break;

      // If yes, what's its tag?
      if (currentNode.tagName) {
        // If it's a heading or <hr>, FOUND END.
        const currentTag = currentNode.tagName.toLowerCase();
        if (HEADER_TAGS.includes(currentTag) || currentTag === 'hr') {
          break;
        } else {
          // If not, add it & move on.
          htmlsToAdd.push(currentNode.outerHTML);
        }
      } else {
        const content = currentNode.textContent.trim();
        if (content.length > 0) {
          // convert to <p> then add
          htmlsToAdd.push(`<p>${content}</p>`);
        }
      }
    }

    // Add 'em all!
    const cut = queryKeys.cut ? parseInt(queryKeys.cut, 10) : 0;
    const limit = Math.max(0, htmlsToAdd.length - cut);
    for (let i = 0; i < limit; i++) {
      containerHTML += htmlsToAdd[i];
    }
  } else {
    containerHTML = getInnerContent(foundNode);
  }

  // [Modified]
  // Add declaration
  if (foundNode.hasAttribute('data-declaration')) {
    const declarationID = foundNode.getAttribute('data-declaration');
    let declaration = selectByDataItemID(safeEl, declarationID);

    if (declaration) {
      containerHTML = getInnerContent(declaration) + containerHTML;
    }
  }
  return [containerHTML, foundNode];
}

function searchByText(queryKeys, safeEl) {
  let containerHTML = '';

  if (!queryKeys.start) return containerHTML;

  const startText = decodeURIComponent(queryKeys.start);
  const paragraphs = safeEl.querySelectorAll('p');
  // Forgiving-search the <p> for "start"
  const found = Array.from(paragraphs).find((p) => forgivingMatchTest(p.innerText, startText));

  // If after all that, STILL none, tell user the error.
  if (!found) {
    return `<p>${getLocalizedText('startTextError').replace('[start]', startText)}</p>`;
  }

  // Add the found paragraph.
  containerHTML += found.outerHTML;

  // If there's a "length" key, add that many extra siblings
  // (or until end of section
  if (queryKeys.length || queryKeys.end) {
    // Countdown and/or END TEXT
    let elementsLeft = queryKeys.length ? parseInt(queryKeys.length, 10) - 1 : Infinity;
    const endText = decodeURIComponent(queryKeys.end);

    // Find the end of section, or countdown, or ending paragraph.
    let currentNode = found;
    while (elementsLeft > 0) {
      // Next
      currentNode = currentNode.nextSibling; // not .nextElementSibling in case writer forgot to put stuff in <p>???

      // Do I even have a next sibling?
      if (!currentNode) break;

      // Convert to a paragraph if it was accidentally not in <p>
      let content;
      const isTextNode = !currentNode.tagName;
      if (isTextNode) {
        const trimmed = currentNode.textContent.trim();
        if (trimmed.length === 0) continue;
        content = `<p>${currentNode.textContent}</p>`;
      } else {
        content = currentNode.outerHTML;
      }

      // Add it to the container & move on.
      containerHTML += content;
      elementsLeft--;
      // If this paragraph matches, it's THE END!
      if (forgivingMatchTest(content, endText)) {
        break;
      }
    }
  }

  return containerHTML;
}

/////////////////////////////////////////////////////////////////////
// ⭐️ Helpers
/////////////////////////////////////////////////////////////////////
function getInnerContent(node) {
  const tagName = node.tagName.toLowerCase();
  return tagName === 'span' || tagName === 'p' ? `<p>${node.innerHTML}</p>` : node.innerHTML;
}

function parseQueryString(queryString) {
  if (!queryString) return {};
  const queryKeys = {};
  queryString.split('&').forEach((term) => {
    const eqIndex = term.indexOf('=');
    if (eqIndex > 0) {
      const key = term.substring(0, eqIndex);
      const value = term.substring(eqIndex + 1);
      queryKeys[key] = value;
    }
  });
  return queryKeys;
}

function selectByDataItemID(element, id) {
  try {
    const selector = `[data-item-id="${CSS.escape(id)}"]`;
    return element.querySelector(selector);
  } catch (_) {
    console.warn('Selector error:', id);
    return null;
  }
}

// Add "from" source paragraph, if source is not THIS page
function addSource(url) {
  try {
    const targetURL = new URL(url);
    const targetWithoutProtocal = targetURL.href.replace(targetURL.protocol + '//', '');
    const thisPageURL = location.host + location.pathname;

    // Remove current page url.
    const samePage = targetWithoutProtocal.includes(thisPageURL);
    const shortenedURL = samePage
      ? targetWithoutProtocal.replace(thisPageURL, '')
      : targetURL.host === location.host
        ? targetWithoutProtocal.split('/').at(-1)
        : targetWithoutProtocal;

    // Create a document element.
    const p = document.createElement('p');
    p.className = 'nutshell-bubble-from';
    p.innerHTML = `원문: `;

    const a = document.createElement('a');
    a.target = '_blank';
    a.href = url;
    a.textContent = shortenedURL;

    const hashID = targetURL.hash.replace('#', '');

    if (samePage && hashID) {
      a.addEventListener('click', function (e) {
        const targetElement =
          document.querySelector(`#${hashID}`) ?? document.querySelector(`[data-item-id="${hashID}"]`);

        if (!targetElement) return;

        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        targetElement.classList.remove('highlight');
        // Reflow
        void targetElement.offsetWidth;
        targetElement.classList.add('highlight');
      });
    }

    p.appendChild(a);

    return p;
  } catch (_) {
    return '';
  }
}
