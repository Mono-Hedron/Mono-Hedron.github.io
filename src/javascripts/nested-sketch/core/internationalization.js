
import languageDict from './language.nutshell.js'
import state from "./state.js";


export function getLocalizedText(textID) {
        let currentLanguage = state.options.lang,
            dictionary = languageDict[currentLanguage];
        return dictionary[textID];
    }