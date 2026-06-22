export const ANIM_TIME = 300;
export const HEADER_TAGS = ['h1','h2','h3','h4','h5','h6'];


class State {
    constructor() {
        this.thisPageURL = location.protocol + '//' + location.host + location.pathname + location.search;
        this.options = {
            startOnLoad: true, // Start Nutshell on load? (default: true)
            lang: 'ko', // Language 
        };
        this.openShellCount = 0;
        this.htmlCache = {};
    }


    setOptions(newOptions) {
        Object.keys(newOptions).forEach(
            (key)=>{
            this.options[key] = newOptions[key];
            }
        );
    };


}

const state = new State();
export default state