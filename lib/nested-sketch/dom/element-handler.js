export const HEADER_TAGS = ['h1','h2','h3','h4','h5','h6'];

// [Modified]
/////////////////////////////////////////////////////////////////////
// ⭐️ Convert <h*> headings
/////////////////////////////////////////////////////////////////////

// If heading has class ns-link,
// replace it and following section with just a link!
// (And if it starts with ":x", DELETE ENTIRELY.)
export function hideElements(el=document.body) {

    // Temporary dividers to remove later...
    // let tmpDividers = [];
    
    // [Modified]
    // For each found heading with :colon...
    el.querySelectorAll(':is(h1, h2, h3, h4, h5, h6).ns-link')
    .forEach((heading)=>{
        // [Modified]
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

    el.querySelectorAll(':is(span, div).ns-hidden')
    .forEach((container)=>{
        container.parentNode.removeChild(container);
    });

    // NOW remove all those temporary dividers
    //tmpDividers.forEach((hr)=>{
    //    hr.parentNode.removeChild(hr);
    //});

};
