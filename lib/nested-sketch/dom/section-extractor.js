import { promisePurifiedHTMLFromURL } from "../services/html-fetcher.js";
import state from "../core/state.js";
import { getLocalizedText } from "../core/internationalization.js";
import { forgivingMatchTest, isWikipedia, isYouTube, convertRelativeToAbsoluteLinks } from "../utils/helpers.js";
import { HEADER_TAGS, hideElements } from "./element-handler.js";
import { decodeParsePurifyItalics } from "../utils/purifier.js";
/////////////////////////////////////////////////////////////////////
// ⭐️ Get a Section from purified HTML & put in container
/////////////////////////////////////////////////////////////////////

// Promise!
export function promiseSectionContainer(expandable){

    // A promise...
    return new Promise((resolve, _reject)=>{

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
        promisePurifiedHTMLFromURL(url).then((purifiedHTML)=>{

            if(isWikipedia(url) || isYouTube(url)){
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
                    hideElements(safeEl);
                    // Folded sections need to convert relative links to absolute
                    convertRelativeToAbsoluteLinks("a", "href", url, safeEl);
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
                    } catch(_) {
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
                            // Do forgivingMatchTest, return THE FIRST ONE THAT WORKS, BREAK.
                            if(forgivingMatchTest(heading.innerText, sectionID)){
                                foundNode = heading;
                            }
                            if(foundNode) break;
                        }
                        if(foundNode) break;
                        }
                    }

                    // If after all that, STILL none, tell user the error.
                    if(!foundNode){
                        containerHTML = `<p>${getLocalizedText("sectionIDError").replace('[ID]',sectionID)}</p>`;
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
                            } catch(_) {
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
                            if(forgivingMatchTest(p.innerText, startText)){
                                found = p;
                            }
                            if(found) break;
                        }

                        // If after all that, STILL none, tell user the error.
                        if(!found){
                            containerHTML = `<p>${getLocalizedText("startTextError").replace('[start]',startText)}</p>`;
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
                                        if(forgivingMatchTest(content, endText)){
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
                    containerHTML = decodeParsePurifyItalics(queryKeys.before) + containerHTML;
                }
                if(queryKeys.after){
                    containerHTML = containerHTML + decodeParsePurifyItalics(queryKeys.after);
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



// Add "from" source paragraph, if source is not THIS page
let _addSource = (url)=>{
    if(url == state.thisPageURL){
        return ''; // nah.
    }else{
        let urlSansProtocol = url.split("://")[1];
        // [Modified] Korean word
        return `<p class='nutshell-bubble-from'> 원문: <a target='_blank' href='${url}'>${urlSansProtocol}</a></p>`
    }
}




