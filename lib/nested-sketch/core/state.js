class State {

    constructor() {
        this.thisPageURL = location.protocol + '//' + location.host + location.pathname + location.search;
        this.options = {
            startOnLoad: true, // Start Nutshell on load? (default: true)
            lang: 'ko', // Language 
        };
        
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