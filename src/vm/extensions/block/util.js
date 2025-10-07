const parseNumbers = function (str) {
    // Remove any stray brackets first, then split on whitespace or commas.
    const cleaned = str.replace(/[[\]]/g, ' ');
    const tokens = cleaned.split(/[\s,]+/).filter(token => token.length > 0);
    const numbers = tokens
        .map(token => {
            // Remove commas within tokens, then convert to number.
            const tokenClean = token.replace(/,/g, '');
            const num = Number(tokenClean);
            return isNaN(num) ? null : num;
        })
        .filter(n => n !== null);
    return numbers;
};


/**
 * Returns a numeric Array made from the string expression.
 * @param {string} input - string to be converted
 * @returns {Array<number>|number|null} numeric array from the string
 */
export const readAsNumericArray = function (input) {
    // if the input is not a string, simply convert it to a number
    if (typeof input !== 'string') {
        const num = Number(input);
        if (isNaN(num)) {
            return input;
        }
        return num;
    }

    const inputString = input.trim();
    if (inputString === '') return [];

    // First try: if it's valid JSON (e.g. "[1,2,3]" or "[[1,2],[3,4]]"), return that.
    try {
        const parsed = JSON.parse(inputString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (e) {
        // Not valid JSON; proceed with custom parsing.
    }

    // Use regex to see if there are one or more bracket groups.
    const bracketRegex = /\[([^\]]+)\]/g;
    const matches = [...inputString.matchAll(bracketRegex)];
    if (matches.length > 1) {
        // Multiple bracket groups were found, so process each separately.
        return matches.map(m => parseNumbers(m[1]));
    } else if (matches.length === 1) {
        // If the entire string is bracketed, use the content inside;
        // otherwise, fallback to processing the whole string.
        if (inputString.startsWith('[') && inputString.endsWith(']')) {
            return parseNumbers(matches[0][1]);
        }
    }
    // Fallback: split the whole trimmed string.
    return parseNumbers(inputString);
};


/**
     * Get multi-dimensional array from a list.
     * @param {string} listName - the top-level list name.
     * @param {Target} target - the target
     * @returns {Array} - the multi-dimensional array.
     */
export const getMatrixFromList = function (listName, target) {
    const list = target.lookupVariableByNameAndType(listName, 'list');
    if (!list) return [];
    return list.value.map(item => {
        const subList = target.lookupVariableByNameAndType(item, 'list');
        if (subList) {
            return getMatrixFromList(item, target);
        }
        const itemValue = Number(item);
        if (isNaN(itemValue)) {
            return readAsNumericArray(item);
        }
        return itemValue;
    });
};
