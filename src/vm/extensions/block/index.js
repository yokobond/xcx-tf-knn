import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import translations from './translations.json';
import blockIcon from './block-icon.png';
import {readAsNumericArray, getMatrixFromList} from './util.js';
import KNNClassifier from './knn-classifier.js';

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'tfknn';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://yokobond.github.io/xcx-tf-knn/dist/tfknn.mjs';


/**
 * Make a String separated with ',' from a numeric Array
 * @param {Array} array - numeric array to be converted
 * @returns {string} converted string
 */
// const numericArrayToString = array => array.join(', ');

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'tfknn.name',
            default: 'TF KNN',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for TF KNN.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;

            // Ensure formatMessage has a setup method or provide a fallback
            if (typeof formatMessage.setup !== 'function') {
                formatMessage.setup = () => null;
            }
        }

        /**
         * The KNN classifier instance.
         * @type {Map<string, KNNClassifier>}
         */
        this.classifiers = {};

        runtime.on('PROJECT_LOADED', () => {
            // Load the dataset from the list variable
            runtime.targets.forEach(target => {
                this.initializeDatasetFromTarget(target);
            });
        });
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: [
                {
                    opcode: 'addExample',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tfknn.addExample',
                        default: 'add example [DATA] with label [LABEL]',
                        description: 'add example'
                    }),
                    arguments: {
                        DATA: {
                            type: ArgumentType.STRING,
                            defaultValue: '0 0 0'
                        },
                        LABEL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'tfknn.addExample.defaultLabel',
                                default: 'label 1',
                                description: 'default label'
                            })
                        }
                    }
                },
                {
                    opcode: 'clearExamples',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tfknn.clearExamples',
                        default: 'clear examples for [LABEL]',
                        description: 'clear examples'
                    }),
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'tfknn.clearExamples.defaultLabel',
                                default: 'label 1'
                            })
                        }
                    }
                },
                {
                    opcode: 'sizeOfAnExample',
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    text: formatMessage({
                        id: 'tfknn.sizeOfAnExample',
                        default: 'size of an example'
                    })
                },
                {
                    opcode: 'dataFromList',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.dataFromList',
                        default: 'KNN data from [LIST_NAME]'
                    }),
                    arguments: {
                        LIST_NAME: {
                            type: ArgumentType.STRING,
                            menu: 'listMenu'
                        }
                    }
                },
                {
                    opcode: 'loadDatasetFromList',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tfknn.loadDatasetFromList',
                        default: 'load dataset from [LIST_NAME]'
                    }),
                    arguments: {
                        LIST_NAME: {
                            type: ArgumentType.STRING,
                            menu: 'listMenu',
                            defaultValue: this.DATASET_LIST_NAME
                        }
                    }
                },
                '---',
                {
                    opcode: 'predictClass',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'tfknn.predictClass',
                        default: 'predict [DATA] with [K] nearest neighbors'
                    }),
                    arguments: {
                        DATA: {
                            type: ArgumentType.STRING,
                            defaultValue: '0 0 0'
                        },
                        K: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 3
                        }
                    }
                },
                {
                    opcode: 'label',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.label',
                        default: 'label',
                        description: 'label of the predicted data'
                    })
                },
                {
                    opcode: 'confidence',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.confidence',
                        default: 'confidence of [LABEL]',
                        description: 'confidence of the label'
                    }),
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'tfknn.confidence.defaultLabel',
                                default: 'label 1'
                            })
                        }
                    }
                },
                {
                    opcode: 'labelAt',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.labelAt',
                        default: 'label at [INDEX]',
                        description: 'label at the index'
                    }),
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'sizeOfLabels',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.sizeOfLabels',
                        default: 'size of labels'
                    })
                },
                {
                    opcode: 'sizeOfExamples',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'tfknn.sizeOfExamples',
                        default: 'size of example for [LABEL]'
                    }),
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'tfknn.sizeOfExamples.defaultLabel',
                                default: 'label 1'
                            })
                        }
                    }
                }
            ],
            menus: {
                listMenu: {
                    acceptReporters: true,
                    items: 'getListMenu'
                },
                transposeMenu: {
                    acceptReporters: false,
                    items: 'getTransposeMenu'
                }
            }
        };
    }

    /**
     * Get a list of list variables.
     * @param {Target} [targetID] - Optional target to search first, then stage, then other sprites
     * @returns {Array} - the list of list variable names.
     */
    getListMenu (targetID) {
        let lists = [];
        const target = this.runtime.getTargetById(targetID);
        if (target) {
            lists = target.getAllVariableNamesInScopeByType('list');
        }
        if (lists.length === 0) {
            lists = [formatMessage({
                id: 'tfknn.getListMenu.defaultListName',
                default: 'list'
            })];
        }
        return lists;
    }

    /**
     * Get a list of list variables.
     * @param {Target} [target] - Optional target to search first, then stage
     * @returns {Array} - the list of list variables.
     */
    _getAllList (target) {
        if (!target) {
            target = this.runtime.getEditingTarget();
        }
        const list = [];
        if (target) {
            for (const varId in target.variables) {
                const variable = target.variables[varId];
                if (variable.type === 'list') {
                    list.push(variable);
                }
            }
        }
        const stage = this.runtime.getTargetForStage();
        if (stage && (!target || target !== stage)) {
            for (const varId in stage.variables) {
                const variable = stage.variables[varId];
                if (variable.type === 'list') {
                    list.push(variable);
                }
            }
        }
        return list;
    }

    /**
     * Get the menu for the transpose matrix block.
     * @returns {Array} - the menu for the transpose matrix block.
     */
    getTransposeMenu () {
        return [
            {
                text: formatMessage({
                    id: 'tfknn.getTransposeMenu.noTranspose',
                    default: 'no transpose'
                }),
                value: 'noTranspose'
            },
            {
                text: formatMessage({
                    id: 'tfknn.getTransposeMenu.transpose',
                    default: 'transpose'
                }),
                value: 'transpose'
            }
        ];
    }

    /**
     * Add an example to the KNN classifier.
     * @param {object} args - the block arguments.
     * @param {string} args.DATA - the data to add.
     * @param {string} args.LABEL - the label for the data.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {string} - a status message.
     */
    addExample (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const data = readAsNumericArray(args.DATA);
        const label = Cast.toString(args.LABEL);
        try {
            classifier.addExample(label, data);
            this._storeDataset(target);
            return `Added example with label: "${label}"`;
        } catch (error) {
            console.warn('Failed to add example:', error);
            return `Failed to add example: ${error}`;
        }
    }

    /**
     * Clear examples for a specific label.
     * @param {object} args - the block arguments.
     * @param {string} args.LABEL - the label to clear.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {string} - a status message.
     */
    clearExamples (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const label = Cast.toString(args.LABEL);
        try {
            classifier.clearClass(label);
            this._storeDataset(target);
            console.log(`Cleared examples for label: "${label}"`);
            return `Cleared examples for label: "${label}"`;
        } catch (error) {
            console.warn('Failed to clear examples:', error);
            return `Failed to clear examples: ${error}`;
        }
    }

    /**
     * Get the size of the example data.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {number} - the size of the data.
     */
    sizeOfAnExample (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        return classifier.sizeOfAnExample();
    }

    /**
     * Predict the label for the given data.
     * @param {object} args - the block arguments.
     * @param {string} args.DATA - the data to predict.
     * @param {number} args.K - the number of nearest neighbors to use.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {Promise} - a promise that resolves with the predicted label.
     */
    predictClass (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const data = readAsNumericArray(args.DATA);
        const k = Cast.toNumber(args.K);
        if (data.length === 0) {
            return 'Invalid data';
        }
        if (classifier.getNumClasses() === 0) {
            return 'No examples added';
        }
        if (k < 1) {
            return 'Invalid value for k';
        }
        
        if (this._predicting) {
            util.yield();
            return;
        }
        this._predicting = true;
        return classifier.classify(data, k)
            .then(result => `Predicted label: "${result.label}"
                         confidence : ${result.confidences[result.label]}`)
            .catch(error => {
                console.warn('Prediction error:', error);
                return `Prediction error: ${error}`;
            })
            .finally(() => {
                this._predicting = false;
            });
    }

    /**
     * Get the predicted label.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {string} - the label or an empty string if no prediction is available.
     */
    label (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        return classifier.lastPrediction ? classifier.lastPrediction.label : ' ';
    }

    /**
     * Get the confidence for a specific label.
     * @param {object} args - the block arguments.
     * @param {string} args.LABEL - the label.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {number} - the confidence value (0-1) or 0 if the label doesn't exist.
     */
    confidence (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const label = Cast.toString(args.LABEL);
        if (!classifier.lastPrediction) {
            return 0;
        }
        const confidence = classifier.lastPrediction.confidences[label];
        return confidence ? confidence : 0;
    }

    /**
     * Get the label at a specific index.
     * @param {object} args - the block arguments.
     * @param {number} args.INDEX - the index of the label.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {string} - the label at the index or empty string if out of range.
     */
    labelAt (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const index = Cast.toNumber(args.INDEX) - 1;
        const countOfLabels = classifier.getNumClasses();
        const exampleCount = classifier.getClassExampleCount();
        if (index >= 0 && index < countOfLabels) {
            return Object.keys(exampleCount)[index];
        }
        return '';
    }

    /**
     * Get the number of unique labels.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {number} - the number of unique labels.
     */
    sizeOfLabels (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        return classifier.getNumClasses();
    }

    /**
     * Get the number of examples for a specific label.
     * @param {object} args - the block arguments.
     * @param {string} args.LABEL - the label.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {number} - the number of examples for the label.
     */
    sizeOfExamples (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const label = Cast.toString(args.LABEL);
        return classifier.getClassExampleCount()[label] || 0;
    }

    /**
     * Convert the classifier dataset to a JSON-serializable format.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {Array} - The dataset in a format that can be serialized to JSON.
     */
    getDataset (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const dataset = classifier.getClassifierDataset();
        return Object.entries(dataset)
            .map(([label, data]) =>
                [label, Array.from(data.dataSync()), data.shape]);
    }

    get DATASET_LIST_ID () {
        return 'tfknn_dataset';
    }

    get DATASET_LIST_NAME () {
        return 'KNN Dataset';
    }

    /**
     * Get the classifier for the target.
     * @param {Target} target - the target
     * @returns {KNNClassifier} - the classifier for the target.
     */
    _getClassifierFor (target) {
        let classifier = this.classifiers[target.id];
        if (!classifier) {
            classifier = new KNNClassifier();
            this.classifiers[target.id] = classifier;
        }
        return classifier;
    }

    /**
     * Store the dataset in a list variable.
     * @param {!Target} target - the target
     */
    _storeDataset (target) {
        let list = target.lookupVariableByNameAndType(
            this.DATASET_LIST_NAME, 'list');
        if (!list) {
            list = target.lookupOrCreateList(this.DATASET_LIST_ID, this.DATASET_LIST_NAME);
            this.runtime.emitProjectChanged();
        }
        const classifier = this._getClassifierFor(target);
        const dataset = classifier.getDataset();
        list.value = dataset.map(entry => JSON.stringify(entry).replaceAll(/,/g, ' '));
    }

    /**
     * Initialize the dataset from the list of the target.
     * @param {!Target} target - the target
     */
    initializeDatasetFromTarget (target) {
        const list = target.lookupVariableByNameAndType(this.DATASET_LIST_NAME, 'list');
        if (!list) {
            return;
        }
        const dataset = [];
        list.value.forEach(item => {
            try {
                const data = JSON.parse(item.replaceAll(/ /g, ','));
                if (!Array.isArray(data) || data.length !== 3 ||
                    typeof data[0] !== 'string' ||
                    !Array.isArray(data[1]) ||
                    !Array.isArray(data[2]) ||
                    data[2].length !== 2) {
                    // If the dataset is invalid as a KNN dataset, ignore it.
                    return;
                }
                dataset.push(data);
            } catch (error) {
                // Ignore invalid JSON entries
                console.warn('Invalid dataset entry:', item, error);
            }
        });
        if (dataset.length === 0) {
            // If no valid dataset entries, do nothing.
            return;
        }
        this._getClassifierFor(target).loadDataset(dataset);
    }

    /**
     * Get the dataset from a list variable or a string expression of an Array.
     * @param {Target} target - the target
     * @param {string} listNameOrArrayString - the list name or the string expression of an Array.
     * @param {boolean} transpose - whether to transpose the matrix.
     * @return {Array<Array>} - the loaded dataset.
     */
    _getDatasetFromTarget (target, listNameOrArrayString) {
        const list = target.lookupVariableByNameAndType(
            listNameOrArrayString, 'list');
        const dataset = [];
        if (!list) {
            return dataset;
        }
        list.value.forEach(item => {
            const data = JSON.parse(item.replaceAll(/ /g, ','));
            if (!Array.isArray(data) || data.length !== 3 ||
                    typeof data[0] !== 'string' ||
                    !Array.isArray(data[1]) ||
                    !Array.isArray(data[2]) ||
                    data[2].length !== 2) {
                // If the dataset is invalid as a KNN dataset, ignore it.
                return;
            }
            dataset.push(data);
        });
        return dataset;
    }

    /**
     * Load the dataset from a list variable or a string expression of an Array.
     * @param {object} args - the block arguments.
     * @param {string} args.LIST_NAME - the list name or the string expression of an Array.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {string} - a status message.
     */
    loadDatasetFromList (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        const listNameOrArrayString = Cast.toString(args.LIST_NAME);
        const dataset = this._getDatasetFromTarget(target, listNameOrArrayString);
        if (dataset.length === 0) {
            classifier.clearAll();
            return 'No data found';
        }
        try {
            classifier.loadDataset(dataset);
            this._storeDataset(target);
            return `Loaded dataset with ${classifier.getNumClasses()} classes`;
        } catch (error) {
            console.warn('Failed to load dataset:', error);
            return `Failed to load dataset: ${error}`;
        }
    }

    /**
     * Save the dataset to a file.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {Promise} - a promise that resolves with a status
     * @deprecated
     */
    saveDatasetOnFile (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        return new Promise(resolve => {
            try {
                const serializedDataset = JSON.stringify(classifier.getDataset());
                
                // Prompt for filename
                const defaultFilename = 'knn-dataset.json';
                // eslint-disable-next-line no-alert
                const filename = prompt(
                    formatMessage({
                        id: 'tfknn.saveDatasetOnFile.prompt',
                        default: 'Enter a filename to save the dataset as:'
                    }),
                    defaultFilename) ||
                    defaultFilename;

                // Add .json extension if not present
                const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
                
                // Use FileSaver.js or browser download
                const blob = new Blob([serializedDataset], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';
                a.href = url;
                a.download = finalFilename;
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                resolve(`Dataset saved as ${finalFilename}`);
            } catch (error) {
                console.warn('Failed to save dataset:', error);
                resolve(`Failed to save dataset: ${error}`);
            }
        });
    }

    /**
     * Load the dataset from a file.
     * @param {object} args - the block arguments.
     * @param {object} util - the block utility object.
     * @param {Target} util.target - the target
     * @returns {Promise} - a promise that resolves with a status
     * @deprecated
     */
    loadDatasetFromFile (args, util) {
        const target = util.target;
        const classifier = this._getClassifierFor(target);
        return new Promise(resolve => {
            try {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = event => {
                    const file = event.target.files[0];
                    const reader = new FileReader();
                    reader.onload = e => {
                        const datasetObj = JSON.parse(e.target.result);
                        classifier.loadDataset(datasetObj);
                        resolve(`Dataset loaded successfully: ${classifier.getNumClasses()} classes`);
                    };
                    reader.readAsText(file);
                };
                fileInput.click();
            } catch (error) {
                console.warn('Failed to load dataset:', error);
                resolve(`Failed to load dataset: ${error}`);
            }
        });
    }

    /**
     * Make multi-dimensional array from a list for KNN.
     * @param {object} args - the block arguments.
     * @param {string} args.LIST_NAME - the top-level list name.
     * @param {object} util - the block utility
     * @param {Target} util.target - the target
     * @returns {string} - the multi-dimensional JSON string.
     */
    dataFromList (args, util) {
        const target = util.target;
        const listNameOrArrayString = args.LIST_NAME;
        const list = target.lookupVariableByNameAndType(
            listNameOrArrayString, 'list');
        let data;
        if (list) {
            data = getMatrixFromList(listNameOrArrayString, target);
        } else {
            data = readAsNumericArray(listNameOrArrayString);
        }
        if (typeof data === `undefined`) {
            data = [];
        }
        if (typeof data === 'number') {
            data = [data];
        }
        return JSON.stringify(data);
    }
}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
