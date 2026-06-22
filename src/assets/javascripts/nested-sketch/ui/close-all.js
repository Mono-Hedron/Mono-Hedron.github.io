import state, { ANIM_TIME } from "../core/state.js";
import { getLocalizedText } from "../core/internationalization.js";


/////////////////////////////////////////////////////////////////////
// ⭐️ CLOSE ALL NUTSHELLS
/////////////////////////////////////////////////////////////////////

// Keep count
state.openShellCount = 0;

// MAKE UI: Floating in top right
let _ca = document.createElement('div');
_ca.id = "nutshell-close-all";
_ca.setAttribute('show', 'no');
_ca.onclick = closeAllNutshells;


// When Nutshell starts, populate with text localization
export function addCloseAllButton() {
    _ca.innerText = getLocalizedText('closeAllNutshells');
    document.body.appendChild(_ca);
};


// Close 'em all
function closeAllNutshells() {

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
        state.openShellCount = 0;
        updateCloseAllNutshells();
    }, ANIM_TIME + 100);

};

// If 2 or more, show it, else hide it.
export function updateCloseAllNutshells() {
    if(state.openShellCount >= 2){

        // Show it if hidden
        if(_ca.getAttribute('show')=='no'){
            _ca.style.display = 'block';
            setTimeout(()=>{
                _ca.setAttribute('show', 'yes');
            }, 1);
        }

    }else{

        // Hide it if shown
        if(_ca.getAttribute('show')=='yes'){
            _ca.setAttribute('show', 'no');
            setTimeout(()=>{
                _ca.style.display = 'none';
            }, 1000);
        }

    }
};
