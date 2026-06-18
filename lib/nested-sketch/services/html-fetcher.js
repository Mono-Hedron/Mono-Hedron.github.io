import { purifyHTML } from '../utils/purifier.js';
import { isWikipedia, isYouTube } from '../utils/helpers.js';

// Promise PROCESSED html!
// From a URL, try cache, remote, wikipedia...
// Then DOMPurify it.
export function promisePurifiedHTMLFromURL(url, htmlCache){

    // A promise...
    return new Promise(async (resolvePurifiedHTML, rejectPurifiedHTML)=>{

        // If already in cache, return that.
        if(htmlCache[url]){
            resolvePurifiedHTML(htmlCache[url]);
            return; // STOP.
        }

        // If not, what kind of link is it?
        if(isWikipedia(url)){

            // IT'S WIKIPEDIA! USE THAT API.
            let urlObject = new URL(url);
            // The article title is the last bit of the path
            let splitPath = urlObject.pathname.split('/');
                articleTitle = decodeURIComponent( splitPath[splitPath.length-1] );
            // Which language wikipedia? (including Simple...)
            let domain = urlObject.host.split('.')[0];
            // get section of article, if any
            let sectionID = urlObject.hash.slice(1);
            
            // Fetch lede
            let resourceParams = {
                // Request from anywhere, in JSON
                action: "query", origin: "*", format: "json",
                // Extract just the lead paragraph & thumbnail
                prop: "extracts|pageimages|sections", exintro: "", pithumbsize:500,
                // THIS PAGE
                titles: articleTitle
            }
            // Parse API
            let params = {
                action: "parse", origin: "*", format: "json",
                page: articleTitle,
                prop: "text|sections"
            }
            let resourceQueryString = objectToURLParams(resourceParams);
            
            let parseQueryString = objectToURLParams(params);

            let parseURL = `https://${domain}.wikipedia.org/w/api.php?${parseQueryString}`
            let found = false;
            await fetch(parseURL)
                .then(response => response.json())
                .then(data => {
                    const sections = data.parse.sections;
                    for(let i = 0; i < sections.length; i++){
                        if(sections[i].anchor === sectionID){
                            params.section = sections[i].index;
                            found = true;
                            break;
                        }
                    } 
                }
            );

            if(found){
                fetch(`https://${domain}.wikipedia.org/w/api.php?${objectToURLParams(params)}`)
                    .then(response => response.json())
                    .then(data => {
                        let pageHTML = data.parse.text['*'];
                        // show images
                        pageHTML = pageHTML.replaceAll("\"//upload.wikimedia.org/", "\"https://upload.wikimedia.org/");
                        // remove all elements with class editsection
                        pageHTML = pageHTML.replace(/<span class="mw-editsection">.*?<\/span>/g, "");
                        // remove all links with title that starts with Edit Section
                        pageHTML = pageHTML.replace(/<a.*?title="Edit section.*?<\/a>/g, "");
                        pageHTML = pageHTML.replace(/<span class="mw-editsection-bracket">.*?<\/span>/g, "");

                        // create valid links 
                        pageHTML = pageHTML.replaceAll(/href="\/wiki/g, `href="https://${domain}.wikipedia.org/wiki`);
                        
                        // get all a tags with wiki links and any title and change inner text to have : in front 
                        // don't touch images
                        pageHTML = pageHTML.replace(/<a.*?href="https:\/\/.*?\.wikipedia\.org\/wiki\/(.*?)".*?>(.*?)<\/a>/g, (match, p1, p2) => {
                            // if it's an image, don't touch it
                            if(p1.includes("File:")){
                                return match;
                            }
                            return `<a href="https://${domain}.wikipedia.org/wiki/${p1}" class="ns-link">${p2}</a>`;
                        });

                        htmlCache[url] = pageHTML;
                        // FULFIL THE PROPHECY
                        resolvePurifiedHTML( htmlCache[url] );

                    });
            }else{
            let resourceURL = `https://${domain}.wikipedia.org/w/api.php?${resourceQueryString}`;
            fetch(resourceURL)
                .then(response => response.json())
                .then(data => {

                    // Get extract
                    let pageKey = Object.keys(data.query.pages)[0],
                        pageHTML = data.query.pages[pageKey].extract;

                    // Prepend thumbnail, if any
                    if(data.query.pages[pageKey].thumbnail){
                        pageHTML = `<img width=300 src='${data.query.pages[pageKey].thumbnail.source}' data-float=right />`+ pageHTML;
                    }

                    // Cache it
                    htmlCache[url] = pageHTML;

                    // FULFIL THE PROPHECY
                    resolvePurifiedHTML(pageHTML);

                });
            }
            // (Wait some time before giving up, and telling user)
            setTimeout(()=>{
                rejectPurifiedHTML(
                    `<p>
                    ${Nutshell.getLocalizedText("wikiError")}
                    <a target='_blank' href='${url}'>${url}</a>
                    </p>`
                );
            },LOAD_WAIT_TIME);

        }else if(isYouTube(url)){

            // Get the video ID - youtube.com or youtu.be
            // and other URL params like time.
            url = new URL(url);
            let videoID, t;
            if( url.host.indexOf("youtube.com") >= 0 ){
                videoID = url.searchParams.get('v');
            }else if( url.host.indexOf("youtu.be") >= 0 ){
                videoID = url.pathname.slice(1);
            }
            t = parseInt( url.searchParams.get("t") || url.searchParams.get("start") || '0' );

            // Gimme, easy peasy.
            // weird css hack to make the iframe scale aspect-ratio.
            resolvePurifiedHTML(`
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
            `);

        }else{

            // OTHERWISE, the usual: fetch remote

            // FIRST, get RAW HTML.
            let getRawHTMLPromise = new Promise((resolveRawHTML, rejectRawHTML)=>{
                fetch(url)
                    .then(response => {
                        if(!response.ok) throw Error('404'); // 404's ain't ok
                        else return response.text();
                    })
                    .then(data => {
                        // No, I don't know why I can't just do data=>resolveRawHTML
                        resolveRawHTML(data); // anyway, yay it worked.
                    })
                    .catch(err => {

                        // If it failed due to 404, tell user
                        if(err.message=='404'){
                            return rejectPurifiedHTML(
                                `<p>
                                ${Nutshell.getLocalizedText("notFoundError")}
                                <a target='_blank' href='${url}'>${url}</a>
                                </p>`
                            );
                        }else{

                            // Otherwise, *assume* it failed due to CORS.
                            // (browser can't tell me directly for security reasons)
                            // Try using iframe & postMessage to get the HTML:

                            // Set up safe iframe to speak to...
                            let safeIframe = document.createElement('iframe');
                            safeIframe.setAttribute('sandbox','allow-scripts');
                            safeIframe.style.display = 'none';
                            safeIframe.src = url;

                            // Set up listener...
                            let _messageListener = window.addEventListener("message", (message)=>{
                                let data = JSON.parse(message.data);
                                // Only accept this message if it's loading the URL we want:
                                // (Otherwise, problems when loading multiple URLs at same time)
                                if(data.url == url){
                                    _removeIframeAndListener(); // done!
                                    resolveRawHTML(data.html);
                                }
                            });

                            // Callback to remove both...
                            let _alreadyRemoved = false;
                            let _removeIframeAndListener = ()=>{
                                if(_alreadyRemoved) return; // once-r
                                window.removeEventListener("message", _messageListener);
                                document.body.removeChild(safeIframe);
                                _alreadyRemoved = true;
                            };

                            // Go!
                            document.body.appendChild(safeIframe);

                            // (Wait some time before giving up, and telling user)
                            setTimeout(()=>{
                                _removeIframeAndListener();
                                rejectPurifiedHTML(
                                    `<p>
                                    ${Nutshell.getLocalizedText("corsError")}
                                    <a target='_blank' href='${url}'>${url}</a>
                                    </p>`
                                );
                            },LOAD_WAIT_TIME);

                        }
                    });
            });

            // SECOND, make PROCESSED HTML
            getRawHTMLPromise.then((rawHTML)=>{
                // Cache & gimme.
                htmlCache[url] = purifyHTML(rawHTML, url);
                resolvePurifiedHTML( htmlCache[url] );
            });
        }
    });
};








