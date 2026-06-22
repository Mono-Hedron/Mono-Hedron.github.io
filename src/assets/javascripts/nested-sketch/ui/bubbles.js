import { promiseSectionContainer } from "../dom/section-extractor.js";
import { renderKatex } from "../utils/renderer.js";
import state, { ANIM_TIME } from "../core/state.js";
import { updateCloseAllNutshells } from "./close-all.js";





/////////////////////////////////////////////////////////////////////
// ⭐️ Create & return bubble, using an expandable's data
/////////////////////////////////////////////////////////////////////

export function createBubble(expandable, clickX, convertLinksToExpandables) {

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
        convertLinksToExpandables(content, expandable);

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
        }, ANIM_TIME + 1);

        // Count the killed bubbles inside, subtract from state.openShellCount
        state.openShellCount -= bubble.querySelectorAll('.nutshell-bubble').length;
        updateCloseAllNutshells();

    };

    // Finally, return this magnificent created Bubble!
    return bubble;

};
