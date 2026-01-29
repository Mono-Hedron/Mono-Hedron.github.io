/*
 * Nested Sketch
 * Copyright 2026 Mono-Hedron. All rights reserved.
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


import DOMPurify from 'dompurify';
import { marked } from 'marked';
import renderMathInElement from 'auto-render'

import languageDict from './language.nutshell.js'


const NS_LINK = 'ns-link'



const Nutshell = {};
// window.Nutshell = Nutshell;

// What's THIS page's URL? (WITH QUERYSTRING)
Nutshell.thisPageURL = location.protocol + '//' + location.host + location.pathname + location.search;

/////////////////////
// Constants & Options
/////////////////////

const ANIM_TIME = 300; // 0.3 seconds
const LOAD_WAIT_TIME = 6999; // 7 seconds
const HEADER_TAGS = ['h1','h2','h3','h4','h5','h6'];

Nutshell.options = {
    startOnLoad: true, // Start Nutshell on load? (default: true)
    lang: 'ko', // Language 
};

// A semantic sugar function to override options
Nutshell.setOptions = (newOptions)=>{
    Object.keys(newOptions).forEach((key)=>{
        Nutshell.options[key] = newOptions[key];
    });
};

/////////////////////
// Localizeable text
/////////////////////

Nutshell.language = languageDict
Nutshell.getLocalizedText = (textID)=>{
    let currentLanguage = Nutshell.options.lang,
        dictionary = Nutshell.language[currentLanguage];
    return dictionary[textID];
}


/////////////////////////////////////////////////////////////////////
// ⭐️ Start Nutshell!
/////////////////////////////////////////////////////////////////////

// By default, start Nutshell on DOMContentLoaded
// (you may want to delay this e.g. if your blog's content is AJAX'd in)
window.addEventListener('DOMContentLoaded', ()=>{
    if(Nutshell.options.startOnLoad) Nutshell.start();
});

// NUTSHELL START
Nutshell.start = (el=document.body)=>{

    // Restart!
    Nutshell.htmlCache = {};
    Nutshell._nutshellsOpen = 0;

    // IF TOP PAGE: Convert this page!
    // (By default, the whole document. But you can specify element,
    // i.e. leaving out comments section)
    // IF NOT TOP PAGE:
    // I must have been created for postMessage; give parent my HTML.
    if(window == window.top){

        // Add self's HTML to my own cached
        Nutshell.htmlCache[Nutshell.thisPageURL] = _purifyHTML(el.innerHTML, Nutshell.thisPageURL);

        // KaTeX Rendering
        renderKatex(el);

        // Add styles & convert page
        Nutshell.hideHeadings(el);
        Nutshell.convertLinksToExpandables(el);
        

        // Fill out other UI with localized text
        // (only set by user after Nutshell.js file included, hence this)
        Nutshell.fillCloseAllText();
        // Nutshell.fillEmbedModalText();

    }else{

        // Tell my parent (from any origin) my HTML!
        _sendParentMyHTML();

    }
};






/////////////////////////////////////////////////////////////////////
// ⭐️ Convert links to Expandable buttons
/////////////////////////////////////////////////////////////////////
Nutshell.bindExpandable = (el, strategies = {})=>{
    const {
        getClickX,       // Click X coordinate custom calculation
        insertBubble,    // Custom bubble insertion place
        onOpen,          
        onClose,          
    } = strategies;

    el.classList.add('nutshell-expandable');
    el.setAttribute("mode", "closed");

    el.bubble = null;
    el.isOpen = false;

    el.open = (mouseEvent) => {

        // Hi
        el.isOpen = true;

        // Insert a bubble
        let clickX = 0;
        if (getClickX) {
            clickX = getClickX(mouseEvent, el)
        } else {
            clickX = mouseEvent.clientX - el.parentNode.getBoundingClientRect().x;
        }
        
        el.bubble = Nutshell.createBubble(el, clickX);

        if (insertBubble) {
            insertBubble(el.bubble, el);
        } else {
            el.parentNode.insertBefore(el.bubble, punctuation.nextSibling);
        }

        el.setAttribute("mode", "open");
        if (onOpen) onOpen();

        // Update counter
        Nutshell._nutshellsOpen++;
        Nutshell._updateCloseAllNutshells();
    };

    el.close = () => {
        el.isOpen = false;
        
        if (el.bubble) {
            el.bubble.close(); // handles its own UI
            el.bubble = null;
        }

        el.setAttribute("mode", "closed");
        if (onClose) onClose();
        

        // Update counter
        Nutshell._nutshellsOpen--;
        Nutshell._updateCloseAllNutshells();

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
    if(ex.nextSibling && ex.nextSibling.nodeValue){
        let nextChar;
        // get next char, is it punctuation?
        let keepPunctuation = Nutshell.getLocalizedText('keepPunctuation');
        while( keepPunctuation.indexOf(nextChar=ex.nextSibling.nodeValue[0]) >= 0 ){
            ex.nextSibling.nodeValue = ex.nextSibling.nodeValue.slice(1); // slice off the rest
            punctuation.innerHTML += nextChar; // slap it on
        }
    }
    ex.parentNode.insertBefore(punctuation, ex.nextSibling); // add right after expandable link
    
    return punctuation
}


function createFollowUpHTML(ex, punctuation) {
    // Follow up by repeating last sentence, UNLESS IT'S THE START/END OF PARAGRAPH ALREADY.
    const next = punctuation.nextSibling;
    let hasWordsAfterExpandable = (
        (next?.nodeValue?.trim().length > 1)
        || (next?.nodeValue == " " && next.nextElementSibling?.querySelector('.katex') !== null)
    ) ?? false; 
    // (punctuation.nextSibling?.nodeValue?.trim().length > 1 || punctuation.nextSibling?.querySelector('.katex') != null) ?? false;


    let followupSpan = document.createElement('span');
    followupSpan.style.display = 'none';
    followupSpan.className = 'nutshell-followup';
    ex.parentNode.insertBefore(followupSpan, punctuation.nextSibling); // add right after punctuation

    // Short or long followup TEXT?
    let shortFollowupHTML = '...', // just dots
        longFollowupHTML = '';
    if(hasWordsAfterExpandable){
        // Get last sentence...
        let htmlBeforeThisLink = ex.parentNode.innerHTML.split( ex.outerHTML )[0]; // everything BEFORE this html
        // Convert to raw text
        let tmpSpan = document.createElement('span');
            tmpSpan.innerHTML = htmlBeforeThisLink;
        // Get immediately previous sentence
        let textBeforeThinkLink = tmpSpan.innerText,
            sentencesBeforeThisLink = textBeforeThinkLink.split(Nutshell.getLocalizedText('endPunctuation')),
            lastSentenceHTML = sentencesBeforeThisLink[sentencesBeforeThisLink.length-1];

        // Follow up with prev sentence, then expandable text in bold, then punctuation
        longFollowupHTML = lastSentenceHTML + '<b>' + ex.innerHTML + '</b>' + punctuation.innerHTML;

    }
    // Method needs to be publicly accessible, I guess
    ex.updateFollowupText = ()=>{
        if(!ex.bubble || !hasWordsAfterExpandable){
            // if closed (or no words after), hide followup span
            followupSpan.style.display = 'none';
        }else{
            // if open, show only if bubble's textContent is above 50 words
            let longEnough = (ex.bubble.textContent.trim().split(" ").length>=50);
            followupSpan.style.display = 'inline';
            // [Modified] [TASK] long followup latex texts are not rendered. 
            // followupSpan.innerHTML = longEnough ? longFollowupHTML : shortFollowupHTML;
            followupSpan.innerHTML = shortFollowupHTML;
        }
    };
}


// [Modified]
Nutshell.convertLinksToExpandables = (dom, forThisElement)=>{
	
    //1. General expandable link
    dom.querySelectorAll('a.ns-link:not(.katex-html *)').forEach((ex)=>{

        const punctuation = extractPunctuation(ex);
        createFollowUpHTML(ex, punctuation);

        Nutshell.bindExpandable(ex, {
            getClickX: (e, el) => e.clientX - el.parentNode.getBoundingClientRect().x,
            
            insertBubble: (bubble, el) => {
                el.parentNode.insertBefore(bubble, punctuation.nextSibling);
            },

            onOpen: () => ex.updateFollowupText(),
            onClose: () => setTimeout(ex.updateFollowupText, ANIM_TIME)
        });
    });
	
	//2. katex expandable link
    dom.querySelectorAll('.katex-html a').forEach(mathLink => {
		// for consistency
		mathLink.classList.add('ns-link');

        Nutshell.bindExpandable(mathLink, {
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
            onClose: null
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
        const container = mathLink.closest('.katex-html')
        if (container) {
            container.removeAttribute('aria-hidden');
        }
	});
};

/////////////////////////////////////////////////////////////////////
// ⭐️ CLOSE ALL NUTSHELLS
/////////////////////////////////////////////////////////////////////

// Keep count
Nutshell._nutshellsOpen = 0;

// Close 'em all
Nutshell.closeAllNutshells = ()=>{

    // Close only the top level ones...
    let allExpandables = [...document.querySelectorAll('.nutshell-expandable')];
    let nestedExpandables = [...document.querySelectorAll('.nutshell-expandable .nutshell-expandable')];
    let onlyOpenTops = allExpandables.filter( (ex)=>{
            return ex.isOpen && !nestedExpandables.includes(ex);
        });

    // Close all open tops
    onlyOpenTops.forEach((ex)=>{ex.close()});

    // And after some time, reset the "close all nutshells" count & button
    setTimeout(()=>{
        Nutshell._nutshellsOpen = 0;
        Nutshell._updateCloseAllNutshells();
    },ANIM_TIME+100);

};

// MAKE UI: Floating in top right
Nutshell.closeAllButton = document.createElement('div');
let _ca = Nutshell.closeAllButton;
_ca.id = "nutshell-close-all";
_ca.setAttribute('show', 'no');
_ca.onclick = Nutshell.closeAllNutshells;

// When Nutshell starts, populate with text localization
Nutshell.fillCloseAllText = ()=>{
    _ca.innerText = Nutshell.getLocalizedText('closeAllNutshells');
    document.body.appendChild(_ca);
};

// If 2 or more, show it, else hide it.
Nutshell._updateCloseAllNutshells = ()=>{
    if(Nutshell._nutshellsOpen>=2){

        // Show it if hidden
        if(_ca.getAttribute('show')=='no'){
            _ca.style.display = 'block';
            setTimeout(()=>{
                _ca.setAttribute('show', 'yes');
            },1);
        }

    }else{

        // Hide it if shown
        if(_ca.getAttribute('show')=='yes'){
            _ca.setAttribute('show', 'no');
            setTimeout(()=>{
                _ca.style.display = 'none';
            },1000);
        }

    }
};


/////////////////////////////////////////////////////////////////////
// ⭐️ Get purified HTML, given a source URL.
/////////////////////////////////////////////////////////////////////

// Not very picky about what's in the cache
// Could be just <p>'s, or the entire <body> with nav & comments
Nutshell.htmlCache = {};

// Promise PROCESSED html!
// From a URL, try cache, remote, wikipedia...
// Then DOMPurify it.
Nutshell.promisePurifiedHTMLFromURL = (url)=>{

    // A promise...
    return new Promise(async (resolvePurifiedHTML, rejectPurifiedHTML)=>{

        // If already in cache, return that.
        if(Nutshell.htmlCache[url]){
            resolvePurifiedHTML(Nutshell.htmlCache[url]);
            return; // STOP.
        }

        // If not, what kind of link is it?
        if(_isWikipedia(url)){

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
            let resourceQueryString = _objectToURLParams(resourceParams);
            
            let parseQueryString = _objectToURLParams(params);

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
                fetch(`https://${domain}.wikipedia.org/w/api.php?${_objectToURLParams(params)}`)
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

                        Nutshell.htmlCache[url] = pageHTML;
                        // FULFIL THE PROPHECY
                        resolvePurifiedHTML( Nutshell.htmlCache[url] );

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
                    Nutshell.htmlCache[url] = pageHTML;

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

        }else if(_isYouTube(url)){

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
                Nutshell.htmlCache[url] = _purifyHTML(rawHTML, url);
                resolvePurifiedHTML( Nutshell.htmlCache[url] );
            });
        }
    });
};

// PURIFY. (& make src's absolute)
let _purifyHTML = (rawHTML, baseURL)=>{
    // [Modified]
    // Hook for class, id 
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        // Leave ns-link class
        if (node.hasAttribute && node.hasAttribute('class')) {
            if (node.classList.contains('ns-link')) {
                node.setAttribute('class', 'ns-link');
            } 
            else {
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
    let cleanHTML = DOMPurify.sanitize(rawHTML,{
        // [Modified]
        // ADD_ATTR: ['flush-left', 'data-declaration'],
        FORBID_ATTR: ['style'],
        FORBID_TAGS: ['style'],
        ADD_TAGS: ['iframe','audio','video']
    });

    DOMPurify.removeHook('afterSanitizeAttributes');

    // A <span> for further editing the clean HTML.
    let cleanSpan = document.createElement('div');
    cleanSpan.innerHTML = cleanHTML;

    // Sandbox all iframes
    [...cleanSpan.querySelectorAll('iframe')].forEach(iframe=>{
        iframe.setAttribute('sandbox','allow-scripts');
    });

    // Image src's + link href's to absolute
    _convertRelativeToAbsoluteLinks("iframe", "src", baseURL, cleanSpan);
    _convertRelativeToAbsoluteLinks("img", "src", baseURL, cleanSpan);
    _convertRelativeToAbsoluteLinks("a", "href", baseURL, cleanSpan);

    // Make all links open in new tab, don't ruin reading flow.
    [...cleanSpan.querySelectorAll('a')].forEach((a)=>{
        a.target = "_blank";
    });

    // Gimme
    return cleanSpan.innerHTML;

};

// Is it Wikipedia?
let _isWikipedia = (url)=>{
    return url.indexOf('wikipedia.org')>=0;
};

// Is it YouTube?
let _isYouTube = (url)=>{
    if(url.indexOf('youtu.be')>=0) return true;
    if(url.indexOf('youtube.com')>=0) return true;
    return false;
};

// Convert key-values to key1=value1&key2=value2 etc. Also encode URI
let _objectToURLParams = (obj)=>{
    return Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join("&");
};

// Convert all links in a element to absolute links
let _convertRelativeToAbsoluteLinks = (tag, attr, baseURL, el)=>{
    [...el.querySelectorAll(tag)].forEach((el)=>{
        let relative = el.getAttribute(attr),
            absolute = new URL(relative,baseURL).href;
        el[attr] = absolute;
    });
};

// Ma, here's my HTML!
let _sendParentMyHTML = ()=>{
    window.parent.postMessage(
        JSON.stringify({
            url: Nutshell.thisPageURL, // the url I'm repping
            html: document.body.innerHTML
        }),
    '*');
};



/////////////////////////////////////////////////////////////////////
// ⭐️ Get a Section from purified HTML & put in container
/////////////////////////////////////////////////////////////////////

// Promise!
Nutshell.promiseSectionContainer = (expandable)=>{

    // A promise...
    return new Promise((resolve,reject)=>{

        // Get expandable's url & queryString
        let href = expandable.href,
            splitHref = href.split("#"),
            url = expandable.href,
            queryString = splitHref[1];

        // The container for the Section... get it, boiiiiii.
        let container = document.createElement('div'),
            containerHTML = '';

        // After getting the purified HTML, find section,
        // then put it in a container, and resolve with that.
        Nutshell.promisePurifiedHTMLFromURL(url).then((purifiedHTML)=>{

            if(_isWikipedia(url) || _isYouTube(url)){
                // If it's Wikipedia or YouTube, just give it, it's already ready!
                containerHTML = purifiedHTML;
            }else{

                // Otherwise, gotta EXTRACT out the section from the HTML...

                /***
                Ways to get a section:
                * pageURL – Get whole article
                * By heading:
                    #Heading – Find heading whose text matches,
                        get everything up to next heading or break.
                    #Heading&cut=[integer] – Same, but skip last [cut] elements
                * By paragraph text:
                    #start=[text] – Get FIRST paragraph containing that text
                    #start=[text]&length=[integer] – same, w/ followup <p>
                    #start=[text]&end=[text] – same, til <p> that matches end.
                * Add before & after:
                    &before=[markdown]&after=[markdown] – add html like pre-req's, commentary.
                ***/

                // An element to safely search
                let safeEl = document.createElement('div');
                safeEl.innerHTML = purifiedHTML;

                // IF NO SECTION ID, give entire article
                if(!queryString || queryString.trim()==''){
                    // Hidden sections should still be hidden
                    Nutshell.hideHeadings(safeEl);
                    // Folded sections need to convert relative links to absolute
                    _convertRelativeToAbsoluteLinks("a", "href", url, safeEl);
                    // Article is assumed to be the container of the first <p>
                    let assumedArticle = safeEl.querySelector('p').parentNode;
                    resolve(assumedArticle);
                    return;
                }

                // Break up query string...
                let queryStringBroken = queryString.split('&');
                let queryKeys = {};
                queryStringBroken.forEach((term)=>{
                    if(term.indexOf("=")>0){
                        let keyvalue = term.split("="),
                            key = keyvalue[0],
                            value = keyvalue[1];
                        queryKeys[key] = value;
                    }
                });

                // If the first term has no "=", then we're searching by heading.
                // Otherwise, we're searching by text in paragraphs.
                let isSearchingByHeading = (queryStringBroken[0].indexOf("=")<0);

                //////////////////////////
                // SEARCH BY HEADER...
                //////////////////////////

                if(isSearchingByHeading){

                    let sectionID = queryStringBroken[0];

                    let foundNode = null;
                    
                    //1. Searching by ID
                    try {
                        let selector = `[data-item-id="${CSS.escape(sectionID)}"]`;
                        foundNode = safeEl.querySelector(selector);
                    } catch(e) {
                        console.warn("Selector error:", sectionID);
                    }



                    //2. Forgiving-search the <headings> for #Heading
                    if (!foundNode){
                        for(let i=0; i<HEADER_TAGS.length; i++){
                        let tag = HEADER_TAGS[i],
                            headings = [...safeEl.querySelectorAll(tag)];
                        // ...and for each heading of that <h*> tag...
                        for(let j=0; j<headings.length; j++){
                            let heading = headings[j];
                            // Do _forgivingMatchTest, return THE FIRST ONE THAT WORKS, BREAK.
                            if(_forgivingMatchTest(heading.innerText, sectionID)){
                                foundNode = heading;
                            }
                            if(foundNode) break;
                        }
                        if(foundNode) break;
                        }
                    }

                    // If after all that, STILL none, tell user the error.
                    if(!foundNode){
                        containerHTML = `<p>${Nutshell.getLocalizedText("sectionIDError").replace('[ID]',sectionID)}</p>`;
                    }else{

                        let tagName = foundNode.tagName.toLowerCase();
                        // If the node is a header, get following section.
                        if(HEADER_TAGS.indexOf(tagName) >= 0) {
                            // Now get everything from the start of the section (right after heading)
                            // to end of section (next heading, <hr>, or end-of-post)

                            // HTMLs to add (making an array so can cut in retrospect)
                            let htmlsToAdd = [];

                            // Iterate node by node...
                            let currentNode = foundNode,
                                foundEndOfSection = false;
                            while(!foundEndOfSection){
                                // Do I even have a next sibling?
                                currentNode = currentNode.nextSibling; // not .nextElementSibling in case writer forgot to put stuff in <p>???
                                if(currentNode){

                                    // If yes, what's its tag?
                                    if(currentNode.tagName){
                                        // If it's a heading or <hr>, FOUND END.
                                        let currentTag = currentNode.tagName.toLowerCase();
                                        if(HEADER_TAGS.indexOf(currentTag)>=0 || currentTag=='hr'){
                                            foundEndOfSection = true;
                                        }else{
                                            // If not, add it & move on.
                                            htmlsToAdd.push(currentNode.outerHTML);
                                        }
                                    }else{
                                        let content = currentNode.textContent.trim();
                                        if(content.length>0){ // convert to <p> then add
                                            htmlsToAdd.push("<p>"+content+"</p>");
                                        }
                                    }
                                }else{
                                    // ...If no next sibling, FOUND END.
                                    foundEndOfSection = true;
                                }
                            }

                            // Add 'em all!
                            let cut = queryKeys.cut ? parseInt(queryKeys.cut) : 0;
                            for(let i=0; i<htmlsToAdd.length - cut; i++){
                                containerHTML += htmlsToAdd[i];
                            }

                        }
                        else{
                            // [Modified]
                            // If the node is a container, show inner contents
                            // e.g. div, span, etc.
                            if (tagName == 'span') {
                                containerHTML = "<p>" + foundNode.innerHTML + "</p>";
                            } else {
                                containerHTML = foundNode.innerHTML;
                            }
                            
                        }
                    
                        // [Modified]
                        // Add declaration
                        if (foundNode.hasAttribute('data-declaration')) {
                            let declarationID = foundNode.getAttribute('data-declaration');
                            let declaration = null;
                            //Searching by ID
                            try {
                                let selector = `[data-item-id="${CSS.escape(declarationID)}"]`;
                                declaration = safeEl.querySelector(selector);
                            } catch(e) {
                                console.warn("Selector error:", declarationID);
                            }
                            if (declaration) {
                                if (declaration.tagName.toLowerCase() == 'span') {
                                    containerHTML = "<p>" + declaration.innerHTML + "</p>" + containerHTML;
                                } else {
                                    containerHTML = declaration.innerHTML + containerHTML;
                                }
                                
                            }
                        }
                    

                    }
                }else{

                    /////////////////////////////////
                    // OTHERWISE, SEARCH BY TEXT...
                    /////////////////////////////////

                    // START?
                    if(queryKeys.start){

                        let startText = decodeURIComponent(queryKeys.start);

                        // Forgiving-search the <p> for "start"
                        let found = null;
                        let paragraphs = [...safeEl.querySelectorAll('p')];
                        for(let i=0; i<paragraphs.length; i++){
                            let p = paragraphs[i];
                            if(_forgivingMatchTest(p.innerText, startText)){
                                found = p;
                            }
                            if(found) break;
                        }

                        // If after all that, STILL none, tell user the error.
                        if(!found){
                            containerHTML = `<p>${Nutshell.getLocalizedText("startTextError").replace('[start]',startText)}</p>`;
                        }else{

                            // Add the found paragraph.
                            containerHTML += found.outerHTML;

                            // If there's a "length" key, add that many extra siblings
                            // (or until end of section
                            if(queryKeys.length || queryKeys.end){

                                // Countdown and/or END TEXT
                                let elementsLeft = queryKeys.length ? parseInt(queryKeys.length)-1 : Infinity;
                                let endText = decodeURIComponent(queryKeys.end);

                                // Find the end of section, or countdown, or ending paragraph.
                                let currentNode = found,
                                    foundEndOfSection = false;
                                while(!foundEndOfSection && elementsLeft>0){

                                    // Next
                                    currentNode = currentNode.nextSibling; // not .nextElementSibling in case writer forgot to put stuff in <p>???

                                    // Do I even have a next sibling?
                                    if(currentNode){

                                        // Convert to a paragraph if it was accidentally not in <p>
                                        let content;
                                        if(!currentNode.tagName){
                                            content = currentNode.textContent;
                                            if(content.trim().length==0){
                                                continue; // nevermind
                                            }else{
                                                content = "<p>"+content+"</p>";
                                            }
                                        }else{
                                            content = currentNode.outerHTML;
                                        }

                                        // If this paragraph matches, it's THE END!
                                        if(_forgivingMatchTest(content, endText)){
                                            foundEndOfSection = true;
                                        }

                                        // Add it to the container & move on.
                                        containerHTML += currentNode.outerHTML;
                                        elementsLeft--;

                                    }else{
                                        // ...If no next sibling, FOUND END.
                                        foundEndOfSection = true;
                                    }

                                }
                            }

                        }

                    }

                }

                // ADD BEFORE & AFTER
                if(queryKeys.before){
                    containerHTML = _decodeParsePurifyItalics(queryKeys.before) + containerHTML;
                }
                if(queryKeys.after){
                    containerHTML = containerHTML + _decodeParsePurifyItalics(queryKeys.after);
                }


            }

            // Now deliver the promised container, containing the section!
            container.innerHTML = _addSource(url) + containerHTML;
            resolve(container);

        }).catch((message)=>{

            // IF SOMETHING ALONG THIS ENTIRE PROCESS WENT WRONG, TELL USER.
            container.innerHTML = message;
            resolve(container);

        });

    });

};

// Decode, Parse, Purify, Italics
let _decodeParsePurifyItalics = (whatever)=>{
    return "<i>"+DOMPurify.sanitize(marked.parse(decodeURIComponent(whatever)))+"</i>";
}

// Add "from" source paragraph, if source is not THIS page
let _addSource = (url)=>{
    if(url == Nutshell.thisPageURL){
        return ''; // nah.
    }else{
        let urlSansProtocol = url.split("://")[1];
        // [Modified] Korean word
        return `<p class='nutshell-bubble-from'> 원문: <a target='_blank' href='${url}'>${urlSansProtocol}</a></p>`
    }
}

// Do a forgiving match between two strings: src, test
// Capitalization & punctuation insensitive + src at least CONTAINS test
let _forgivingMatchTest = (src, test)=>{

    // Lowercase & strip everything but letters & numbers
    src = src.toLowerCase().replace(/[^a-z0-9]/g,'');
    test = test.toLowerCase().replace(/[^a-z0-9]/g,'');

    // Src at least CONTAINS test?
    let srcContainsTest = (src.indexOf(test)>=0);
    return srcContainsTest;

};



/////////////////////////////////////////////////////////////////////
// ⭐️ Create & return bubble, using an expandable's data
/////////////////////////////////////////////////////////////////////

Nutshell.createBubble = (expandable, clickX)=>{

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

    // Make a bubble container!
    let bubble = document.createElement('div');
    bubble.className = 'nutshell-bubble';
    // Subtly move down
    bubble.style.top = '-5px';
    setTimeout(()=>{ bubble.style.top = '0px'; },1);
    // RESET FONT STYLE to that of first parent node. Or document.body.
    let p = expandable.parentNode ?? document.body;
    // let p = document.body;
    // [TEST 1.10]
    let parentNodeStyle = window.getComputedStyle(document.body);
    bubble.style.color = parentNodeStyle.color;
    bubble.style.fontSize = parentNodeStyle.fontSize;
    bubble.style.fontStyle = parentNodeStyle.fontStyle;
    bubble.style.fontWeight = parentNodeStyle.fontWeight;
    bubble.style.lineHeight = parentNodeStyle.lineHeight;
    bubble.style.textDecoration = parentNodeStyle.textDecoration;

    bubble.style.textAlign = 'left';

    // A speech-bubble arrow, positioned at X of *where you clicked*???
    let arrow = document.createElement("div");
    arrow.className = "nutshell-bubble-arrow";
    bubble.appendChild(arrow);

    // ARROW & BUBBLE COLOR. Background is background, Border is font color...
    bubble.style.borderColor = parentNodeStyle.color;
    arrow.style.borderBottomColor = parentNodeStyle.color;
    // HACK... keep bubbling up until you get a parent with a non-transparent BG color
    let bgColor = parentNodeStyle.backgroundColor;
    let tryThisElementNext = p.parentNode;
    let failsafe = 10;
    while(bgColor=='rgba(0, 0, 0, 0)' && tryThisElementNext && tryThisElementNext.tagName && failsafe-->0){
        bgColor = window.getComputedStyle(tryThisElementNext).backgroundColor;
        tryThisElementNext = tryThisElementNext.parentNode;
    }
    if(bgColor=='rgba(0, 0, 0, 0)'){
        bgColor = '#fff'; // worst case, default to white.
    }
    arrow.style.setProperty('--arrow-background', bgColor);
    bubble.style.background = bgColor;

    // Position the arrow, starting at 20px left of the click...
    // SO HACKY.
    {
        // (since 22px is half the arrow's width, plus border)
        let arrowX = clickX - 20;

        // What's width of the paragraph the expandable is in?
        let p = expandable.closest('p, .katex-display');
        p ??= document.body; // oh whatever, by default.
        let paragraphWidth = p.getBoundingClientRect().width;

        // What's the width of the container the expandable is in?
        let cont = p.closest('.nutshell-bubble-overflow-section');
        if(cont){
            let sectionWidth = cont.getBoundingClientRect().width,
                padding = (sectionWidth-paragraphWidth)/2;
            // console.log(paragraphWidth, sectionWidth);
            arrowX += padding-3; // iunno, border & padding
        }

        // Don't let the arrow go past bubble's rounded corners (20px)
        if(arrowX < 20) arrowX = 20; // left
        // [Modified] Consider arrow width 40 -> 20+40=60
        if(arrowX > paragraphWidth-60) arrowX = paragraphWidth-60; // right

        // Finally, place that arrow.
        arrow.style.left = arrowX+"px";
    }

    // The Overflow container
    let overflow = document.createElement('div');
    overflow.className = 'nutshell-bubble-overflow';
    overflow.setAttribute("mode","opening");
    overflow.style.height = "0px"; // start closed
    bubble.appendChild(overflow);


    // Section
    let section = document.createElement('div');
    section.className = "nutshell-bubble-overflow-section";
    overflow.appendChild(section);

    // Close Button
    let close = document.createElement('button');
    close.className = 'nutshell-bubble-overflow-close';
    close.innerHTML = '&times;';
    close.ariaLabel = "Close";
    close.onclick = ()=>{

        // Close my parent, which'll also close me
        expandable.close();

        // Then scroll to that parent expandable *if it's offscreen*
        let parentTop = expandable.getBoundingClientRect().top;
        if(parentTop<0){
            window.scrollTo({
                top: parentTop + window.pageYOffset,
                behavior: 'smooth'
            });
        }

    };
    overflow.appendChild(close);

    /////////////////////////
    // OPENING //////////////
    /////////////////////////

    // For "..." loading anim
    let _isSectionLoadedYet = false;

    // Get the section (using expandable's data),
    // and put it in bubble's Section Container when it loads!
    Nutshell.promiseSectionContainer(expandable).then((content)=>{

        // Apply KaTeX Rendering
        renderKatex(content);

        // Links to Nutshell Expandables (yay recursion!)
        Nutshell.convertLinksToExpandables(content, expandable);

        // Put in section's content
        section.innerHTML = '';
        section.appendChild(content);

        // And animate expand for new content! Go to full height, then auto.
        // console.log(section.getBoundingClientRect().height, )
        overflow.style.height = (section.getBoundingClientRect().height+close.getBoundingClientRect().height)+"px";
        setTimeout(()=>{ overflow.style.height="auto"; }, ANIM_TIME);

        // Update followup text if needed
        if(typeof expandable.updateFollowupText === 'function') {
            expandable.updateFollowupText();
        }

        // Yes.
        _isSectionLoadedYet = true;

    });

    // While waiting to load, show "..." anim
    setTimeout(()=>{
        if(!_isSectionLoadedYet){

            // Dots: add a dot per second...
            let dots = document.createElement("p");
            dots.innerHTML = '...'; // start with 3.
            // Doing recursive setTimeout instead of "setInterval"
            // so I don't deal with figuring out how to clear an interval
            // from the above Promise with a totally different scope:
            let _addDot = ()=>{
                if(!_isSectionLoadedYet){
                    dots.innerHTML += '.';
                    setTimeout(_addDot,1000);
                }
            };
            _addDot();

            // Animate to height of the dots
            section.innerHTML = '';
            section.appendChild(dots);
            overflow.style.height = section.getBoundingClientRect().height+"px";

        }
    },10);

    /////////////////////////
    // CLOSING //////////////
    /////////////////////////

    // Close Animation
    bubble.close = ()=>{

        // Subtly move up
        bubble.style.top = '-5px';

        // Can't start an animation from "auto", so set height to current height
        overflow.style.height = overflow.getBoundingClientRect().height + "px";

        // NOW close it.
        setTimeout(()=>{
            overflow.setAttribute("mode","closing");
            overflow.style.height = "0px";
        },1);

        // Afterwards, delete node.
        setTimeout(()=>{
            bubble.parentNode.removeChild(bubble);
            expandable.setAttribute("mode", "closed"); // and tell Expandable to show it, too
        }, ANIM_TIME+1);

        // Count the killed bubbles inside, subtract from Nutshell._nutshellsOpen
        Nutshell._nutshellsOpen -= bubble.querySelectorAll('.nutshell-bubble').length;
        Nutshell._updateCloseAllNutshells();

    };

    // Finally, return this magnificent created Bubble!
    return bubble;

};

// [Modified]
/////////////////////////////////////////////////////////////////////
// ⭐️ Convert <h*> headings
/////////////////////////////////////////////////////////////////////

// If heading has class ns-link,
// replace it and following section with just a link!
// (And if it starts with ":x", DELETE ENTIRELY.)
Nutshell.hideHeadings = (el=document.body)=>{

    // Temporary dividers to remove later...
    let tmpDividers = [];
    
    // [Modified]
    // For each found heading with :colon...
    el.querySelectorAll(':is(h1, h2, h3, h4, h5, h6).ns-link')
    .forEach((heading)=>{
        // [Modified]
        // Unless it's ":x", in which case DO NOT ADD LINK.
        if(!heading.classList.contains("ns-hidden")){
            
            // Put a link before the heading
            let link = document.createElement("a");
            link.href = "#" + heading.id//innerText.replace(/[^A-Za-z0-9]/g,''), // A section ID
            link.innerText = ":" + heading.innerText//.trim().slice(1).trim(); // remove first char
            link.classList.add('ns-link');
            heading.innerText = "";
            heading.classList.remove('ns-link');
            heading.insertBefore(link, null);

            // And insert a <br> after the link
            // let br = document.createElement("br");
            // link.parentNode.insertBefore(br, link.nextSibling);

        }

        // [I'M NOT SURE WHY I PUT THIS CODE HERE, IT SEEMS TO DO NOTHING]
        // [LEAVING IT COMMENTED OUT IN CASE IT'S IMPORTANT]
        // Put a <hr> before the link,
        // so it won't be confused with a previous section.
        //let hr = document.createElement("hr");
        //link.parentNode.insertBefore(hr, link);
        //tmpDividers.push(hr);

        // Then delete every node following until next heading, hr, or end of post.
        // [Modified]
        let currentNode = heading.classList.contains("ns-hidden") ? heading : heading.nextSibling,
            foundEndOfSection = false;
        while(!foundEndOfSection){

            // Move on to next, then destroy this one.
            // ("then", coz can't get next sibling in DOM if already dead
            let nextNode = currentNode.nextSibling;
            currentNode.parentNode.removeChild(currentNode);
            currentNode = nextNode;

            // Is there a next node at all?
            if(!nextNode){
                // If not, FOUND END.
                foundEndOfSection = true;
            }else{
                // If yes, what's its tag? (if any?)
                if(nextNode.tagName){
                    // If it's a heading or <hr>, FOUND END.
                    let currentTag = nextNode.tagName.toLowerCase();
                    if(HEADER_TAGS.indexOf(currentTag)>=0 || currentTag=='hr'){
                        foundEndOfSection = true;
                    }
                }
            }

        }

    });

    // NOW remove all those temporary dividers
    //tmpDividers.forEach((hr)=>{
    //    hr.parentNode.removeChild(hr);
    //});

};


function renderKatex(content) {
    renderMathInElement(content, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
            ],
            // Activate links in formula
            trust: (context) => context.command === String.raw`\href`,
        });
}


export default Nutshell;