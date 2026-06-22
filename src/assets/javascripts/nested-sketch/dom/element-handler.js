import { HEADER_TAGS } from "../core/state";

// [Modified]
/////////////////////////////////////////////////////////////////////
// ⭐️ Convert <h*> headings
/////////////////////////////////////////////////////////////////////

// If heading has class ns-link,
// replace it and following section with just a link!
export function hideElements(el=document.body) {
    // [Modified]
    // For each found heading with :colon...
    el.querySelectorAll(`:is(${HEADER_TAGS.join(',')}).ns-link:not(.ns-hidden)`)
    .forEach((heading)=>{
        // Put a link before the heading
        let link = document.createElement("a");
        link.href = "#" + heading.id//innerText.replace(/[^A-Za-z0-9]/g,''), // A section ID
        link.innerText = heading.innerText//.trim().slice(1).trim(); // remove first char
        link.classList.add('ns-link');
        heading.innerText = "";
        heading.classList.remove('ns-link');
        heading.insertBefore(link, null);

        removeSection(heading.nextSibling);
    });

    el.querySelectorAll(`:is(${HEADER_TAGS.join(',')}).ns-hidden`)
    .forEach(removeSection)

    el.querySelectorAll(':is(span, div).ns-hidden')
    .forEach((container)=>{
        container.parentNode.removeChild(container);
    });

};


function removeSection(startNode) {
    // Then delete every node following until next heading, hr, or end of post.
    // [Modified]
    let currentNode = startNode;
    let foundEndOfSection = false;

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
}