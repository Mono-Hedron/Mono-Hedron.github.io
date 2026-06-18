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
import { getLocalizedText } from './core/internationalization.js';
// import { forgivingMatchTest, convertRelativeToAbsoluteLinks, isWikipedia, isYouTube } from './utils/helpers.js';
import { purifyHTML, decodeParsePurifyItalics } from './utils/purifier.js';
// import { promisePurifiedHTMLFromURL } from './services/html-fetcher.js';
import { renderKatex } from './utils/renderer.js';
import { addCloseAllButton, updateCloseAllNutshells } from './ui/close-all.js';
import { hideElements } from './dom/element-handler.js';
import { promiseSectionContainer } from './dom/section-extractor.js';
// const NS_LINK = 'ns-link'


const Nutshell = {};
// window.Nutshell = Nutshell;

/////////////////////
// Constants & Options
/////////////////////

const ANIM_TIME = 300; // 0.3 seconds




/////////////////////////////////////////////////////////////////////
// ⭐️ Start Nutshell!
/////////////////////////////////////////////////////////////////////

// By default, start Nutshell on DOMContentLoaded
// (you may want to delay this e.g. if your blog's content is AJAX'd in)
window.addEventListener('DOMContentLoaded', ()=>{
    if(state.options.startOnLoad) Nutshell.start();
});

// NUTSHELL START
Nutshell.start = (el=document.body)=>{

    // Restart!
    Nutshell.htmlCache = {};
    state.openShellCount = 0;

    // IF TOP PAGE: Convert this page!
    // (By default, the whole document. But you can specify element,
    // i.e. leaving out comments section)
    // IF NOT TOP PAGE:
    // I must have been created for postMessage; give parent my HTML.
    if(window == window.top){

        // Add self's HTML to my own cached
        Nutshell.htmlCache[state.thisPageURL] = purifyHTML(el.innerHTML, state.thisPageURL);

        // KaTeX Rendering
        renderKatex(el);

        // Add styles & convert page
        hideElements(el);
        Nutshell.convertLinksToExpandables(el);
        

        // Fill out other UI with localized text
        // (only set by user after Nutshell.js file included, hence this)
        addCloseAllButton();
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
        let clickX = getClickX ? getClickX(mouseEvent, el)
                    : mouseEvent.clientX - el.parentNode.getBoundingClientRect().x;

        
        el.bubble = Nutshell.createBubble(el, clickX);

        if (insertBubble) {
            insertBubble(el.bubble, el);
        } else {
            el.parentNode.insertBefore(el.bubble, extractPunctuation(el).nextSibling);
        }

        el.setAttribute("mode", "open");
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

        el.setAttribute("mode", "closed");
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
    if(ex.nextSibling && ex.nextSibling.nodeValue){
        let nextChar;
        // get next char, is it punctuation?
        let keepPunctuation = getLocalizedText('keepPunctuation');
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
    let shortFollowupHTML = '...';
    if(hasWordsAfterExpandable){
        // Get last sentence...
        let htmlBeforeThisLink = ex.parentNode.innerHTML.split( ex.outerHTML )[0]; // everything BEFORE this html
        // Convert to raw text
        let tmpSpan = document.createElement('span');
            tmpSpan.innerHTML = htmlBeforeThisLink;
        // Get immediately previous sentence

        // Follow up with prev sentence, then expandable text in bold, then punctuation
        // longFollowupHTML = lastSentenceHTML + '<b>' + ex.innerHTML + '</b>' + punctuation.innerHTML;

    }
    // Method needs to be publicly accessible, I guess
    ex.updateFollowupText = ()=>{
        if(!ex.bubble || !hasWordsAfterExpandable){
            // if closed (or no words after), hide followup span
            followupSpan.style.display = 'none';
        }else{
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
Nutshell.convertLinksToExpandables = (dom, _forThisElement)=>{
	
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
// ⭐️ Get purified HTML, given a source URL.
/////////////////////////////////////////////////////////////////////

// Not very picky about what's in the cache
// Could be just <p>'s, or the entire <body> with nav & comments
Nutshell.htmlCache = {};


// Ma, here's my HTML!
let _sendParentMyHTML = ()=>{
    window.parent.postMessage(
        JSON.stringify({
            url: state.thisPageURL, // the url I'm repping
            html: document.body.innerHTML
        }),
    '*');
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
    promiseSectionContainer(expandable).then((content)=>{

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

        // Count the killed bubbles inside, subtract from state.openShellCount
        state.openShellCount -= bubble.querySelectorAll('.nutshell-bubble').length;
        updateCloseAllNutshells();

    };

    // Finally, return this magnificent created Bubble!
    return bubble;

};






export default Nutshell;