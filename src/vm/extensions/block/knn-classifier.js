// Dynamically import TensorFlow.js and KNN Classifier
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

/**
 * A K-Nearest Neighbors (KNN) classifier using TensorFlow.js.
 * This class wraps the knnClassifier from @tensorflow-models/knn-classifier
 * and provides methods to add examples, classify inputs, and manage the dataset.
 */
class KNNClassifier {
    constructor () {
        this._classifier = knnClassifier.create();

        /**
         * The last prediction result.
         * @type {Object}
         * @property {number} label - The predicted label.
         * @property {object} confidences - The confidence scores for each class.
         * @property {number} confidences[label] - The confidence score for the label.
         */
        this.lastPrediction = null;
    }

    /**
     * Add an example to the classifier.
     * @param {string|number} label - The class label for the example.
     * @param {Array|TypedArray|Tensor} data - The example data.
     */
    addExample (label, data) {
        if (data.length === 0) {
            return;
        }
        const tensor = tf.tensor(data);
        this._classifier.addExample(tensor, label);
        tensor.dispose();
    }

    /**
     * Get the number of examples for each class.
     * @returns {object} - A dictionary of label -> number of examples.
     */
    getClassExampleCount () {
        return this._classifier.getClassExampleCount();
    }

    /**
     * Get the raw classifier dataset (tensors).
     * @returns {object} - A dictionary of label -> tensor.
     */
    getClassifierDataset () {
        return this._classifier.getClassifierDataset();
    }

    /**
     * Get the classifier dataset.
     * @returns {Array} - An array of tuples, each containing a label,
     *                    data array, and shape.
     */
    getDataset () {
        const dataset = this._classifier.getClassifierDataset();
        return Object.entries(dataset)
            .map(([label, data]) =>
                [label, Array.from(data.dataSync()), data.shape]);
    }


    /**
     * Load the classifier dataset from an array of tuples.
     * Each tuple should contain a label, data array, and shape.
     * @param {Array} datasetObj - An array of tuples to load.
     */
    loadDataset (datasetObj) {
        // Convert the dataset object to a dictionary of tensors
        const dataset = Object.fromEntries(
            datasetObj.map(([label, data, shape]) =>
                [label, tf.tensor(data, shape)]));
        // Load the dataset into the classifier
        this._classifier.dispose();
        this._classifier = knnClassifier.create();
        this._classifier.setClassifierDataset(dataset);
    }

    /**
     * Get the number of classes in the classifier.
     * @returns {number} - The number of classes.
     */
    getNumClasses () {
        return this._classifier.getNumClasses();
    }

    /**
     * Get the size of an example (number of features).
     * Assumes all examples have the same size.
     * @returns {number} - The size of an example, or 0 if no classes exist.
     */
    sizeOfAnExample () {
        if (this._classifier.getNumClasses() > 0) {
            const dataset = this._classifier.getClassifierDataset();
            return Object.values(dataset)[0].shape[1];
        }
        return 0;
    }

    /**
     * Classify an input tensor.
     * @param {Tensor} data - The input tensor to classify.
     * @param {number} k - The number of nearest neighbors to consider.
     * @returns {Promise} - A promise that resolves to the classification result.
     */
    async classify (data, k) {
        const tensor = tf.tensor(data);
        const result = await this._classifier.predictClass(tensor, k);
        this.lastPrediction = result;
        tensor.dispose();
        return result;
    }

    /**
     * Clear all examples for a specific class label.
     * @param {string|number} label - The class label to clear.
     */
    clearClass (label) {
        this._classifier.clearClass(label);
    }

    /**
     * Clear all classes and examples from the classifier.
     */
    clearAll () {
        this._classifier.clearAllClasses();
    }
    
}

export default KNNClassifier;
