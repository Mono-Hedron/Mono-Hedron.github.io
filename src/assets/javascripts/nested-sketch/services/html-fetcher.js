import { purifyHTML } from '../utils/purifier.js';
import { getLocalizedText } from '../core/internationalization.js';
import { objectToURLParams, isWikipedia, isYouTube } from '../utils/helpers.js';
import state from '../core/state.js';

const LOAD_WAIT_TIME = 6999; // 7 seconds

// Promise PROCESSED html!
// From a URL, try cache, remote, wikipedia...
// Then DOMPurify it.
export async function promisePurifiedHTMLFromURL(url) {
  // If already in cache, return that.
  if (state.htmlCache[url]) {
    return state.htmlCache[url]; // STOP.
  }

  // If not, what kind of link is it?
  const WIKIPEDIA_TIME_OUT_MSG = `<p>
                                    ${getLocalizedText('wikiError')}
                                    <a target='_blank' href='${url}'>${url}</a>
                                    </p>`;
  const BASE_TIME_OUT_MSG = `<p>
                                ${getLocalizedText('corsError')}
                                <a target='_blank' href='${url}'>${url}</a>
                                </p>`;
  let time_out_message = isWikipedia(url) ? WIKIPEDIA_TIME_OUT_MSG : isYouTube(url) ? '' : BASE_TIME_OUT_MSG;

  async function fetchURL(url) {
    if (isWikipedia(url)) {
      return await fetchWikipedia(url);
    } else if (isYouTube(url)) {
      return await fetchYoutube(url);
    } else {
      return await fetchPage(url, getLocalizedText);
    }
  }

  try {
    const pageHTML = await Promise.race([fetchURL(url), delayTimeout(LOAD_WAIT_TIME, time_out_message)]);
    state.htmlCache[url] = pageHTML;
    return pageHTML;
  } catch (error) {
    throw error.message || error;
  }
}

async function fetchWikipedia(url) {
  // IT'S WIKIPEDIA! USE THAT API.
  let urlObject = new URL(url);
  // The article title is the last bit of the path
  let splitPath = urlObject.pathname.split('/');
  let articleTitle = decodeURIComponent(splitPath[splitPath.length - 1]);
  // Which language wikipedia? (including Simple...)
  let domain = urlObject.host.split('.')[0];
  // get section of article, if any
  let sectionID = urlObject.hash.slice(1);

  // Fetch lede
  let resourceParams = {
    // Request from anywhere, in JSON
    action: 'query',
    origin: '*',
    format: 'json',
    // Extract just the lead paragraph & thumbnail
    prop: 'extracts|pageimages|sections',
    exintro: '',
    pithumbsize: 500,
    // THIS PAGE
    titles: articleTitle,
  };
  // Parse API
  let params = {
    action: 'parse',
    origin: '*',
    format: 'json',
    page: articleTitle,
    prop: 'text|sections',
  };
  let resourceQueryString = objectToURLParams(resourceParams);

  let parseQueryString = objectToURLParams(params);

  let parseURL = `https://${domain}.wikipedia.org/w/api.php?${parseQueryString}`;
  let found = false;

  let response = await fetch(parseURL);
  let data = await response.json();

  const sections = data.parse.sections;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].anchor === sectionID) {
      params.section = sections[i].index;
      found = true;
      break;
    }
  }

  if (found) {
    let res = await fetch(`https://${domain}.wikipedia.org/w/api.php?${objectToURLParams(params)}`);
    let parseData = await res.json();

    let pageHTML = parseData.parse.text['*'];
    // show images
    pageHTML = pageHTML.replaceAll('"//upload.wikimedia.org/', '"https://upload.wikimedia.org/');
    // remove all elements with class editsection
    pageHTML = pageHTML.replace(/<span class="mw-editsection">.*?<\/span>/g, '');
    // remove all links with title that starts with Edit Section
    pageHTML = pageHTML.replace(/<a.*?title="Edit section.*?<\/a>/g, '');
    pageHTML = pageHTML.replace(/<span class="mw-editsection-bracket">.*?<\/span>/g, '');

    // create valid links
    pageHTML = pageHTML.replaceAll(/href="\/wiki/g, `href="https://${domain}.wikipedia.org/wiki`);

    // get all a tags with wiki links and any title and change inner text to have : in front
    // don't touch images
    pageHTML = pageHTML.replace(
      /<a.*?href="https:\/\/.*?\.wikipedia\.org\/wiki\/(.*?)".*?>(.*?)<\/a>/g,
      (match, p1, p2) => {
        // if it's an image, don't touch it
        if (p1.includes('File:')) {
          return match;
        }
        return `<a href="https://${domain}.wikipedia.org/wiki/${p1}" class="ns-link">${p2}</a>`;
      }
    );
    // FULFIL THE PROPHECY
    return pageHTML;
  } else {
    let resourceURL = `https://${domain}.wikipedia.org/w/api.php?${resourceQueryString}`;
    let res = await fetch(resourceURL);
    let resData = await res.json();

    // Get extract
    let pageKey = Object.keys(resData.query.pages)[0],
      pageHTML = resData.query.pages[pageKey].extract;

    // Prepend thumbnail, if any
    if (resData.query.pages[pageKey].thumbnail) {
      pageHTML = `<img width=300 src='${resData.query.pages[pageKey].thumbnail.source}' data-float=right />` + pageHTML;
    }
    // FULFIL THE PROPHECY
    return pageHTML;
  }
}

async function fetchYoutube(url) {
  // Get the video ID - youtube.com or youtu.be
  // and other URL params like time.
  url = new URL(url);
  let videoID, t;
  if (url.host.indexOf('youtube.com') >= 0) {
    videoID = url.searchParams.get('v');
  } else if (url.host.indexOf('youtu.be') >= 0) {
    videoID = url.pathname.slice(1);
  }
  t = parseInt(url.searchParams.get('t') || url.searchParams.get('start') || '0');

  // Gimme, easy peasy.
  // weird css hack to make the iframe scale aspect-ratio.
  return `
        <div style="width:100%;padding-top:56.25%;position:relative;margin:1em 0;">
            <iframe
                style="position:absolute;width:100%;height:100%;top:0;left:0;"
                src="https://www.youtube-nocookie.com/embed/${videoID}?start=${t}&rel=0"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        </div>
    `;
}

async function fetchPage(url, getLocalizedText) {
  // OTHERWISE, the usual: fetch remote
  try {
    // FIRST, get RAW HTML.
    let response = await fetch(url);
    if (!response.ok) throw Error('404');
    // 404's ain't ok
    let data = await response.text();
    // SECOND, make PROCESSED HTML
    return purifyHTML(data, url);
  } catch (error) {
    // If it failed due to 404, tell user
    if (error.message == '404') {
      throw new Error(
        `<p>
                ${getLocalizedText('notFoundError')}
                <a target='_blank' href='${url}'>${url}</a>
                </p>`,
        { cause: error }
      );
    } else {
      // Otherwise, *assume* it failed due to CORS.
      // (browser can't tell me directly for security reasons)
      // Try using iframe & postMessage to get the HTML:

      // Set up safe iframe to speak to...
      return new Promise((resolve, _reject) => {
        let safeIframe = document.createElement('iframe');
        safeIframe.setAttribute('sandbox', 'allow-scripts');
        safeIframe.style.display = 'none';
        safeIframe.src = url;

        // Set up listener...
        let _messageListener = (message) => {
          try {
            let data = JSON.parse(message.data);
            // Only accept this message if it's loading the URL we want:
            // (Otherwise, problems when loading multiple URLs at same time)
            if (data.url == url) {
              _removeIframeAndListener(); // done!
              resolve(purifyHTML(data.html, url));
            }
          } catch (_) {
            // reject(error)
          }
        };

        window.addEventListener('message', _messageListener);

        // Callback to remove both...
        let _alreadyRemoved = false;
        let _removeIframeAndListener = () => {
          if (_alreadyRemoved) return; // once-r
          window.removeEventListener('message', _messageListener);
          document.body.removeChild(safeIframe);
          _alreadyRemoved = true;
        };

        // Go!
        document.body.appendChild(safeIframe);
      });
    }
  }
}

function delayTimeout(ms, errorMessage) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });
}
