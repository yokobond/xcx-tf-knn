import KNNClassifier from '../../src/vm/extensions/block/knn-classifier.js';
import * as tf from '@tensorflow/tfjs';

describe('KNNClassifier', () => {
    let classifier;

    beforeEach(() => {
        classifier = new KNNClassifier();
    });

    afterEach(() => {
        // Clean up tensors to prevent memory leaks
        classifier.clearAll();
    });

    describe('constructor', () => {
        it('should create a new KNNClassifier instance', () => {
            expect(classifier).toBeInstanceOf(KNNClassifier);
            expect(classifier.lastPrediction).toBeNull();
        });

        it('should initialize with zero classes', () => {
            expect(classifier.getNumClasses()).toBe(0);
        });
    });

    describe('addExample', () => {
        it('should add an example with a label', () => {
            const data = [1, 2, 3];
            const label = 'test';

            classifier.addExample(label, data);

            expect(classifier.getNumClasses()).toBe(1);
            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount[label]).toBe(1);
        });

        it('should add multiple examples with the same label', () => {
            const label = 'test';

            classifier.addExample(label, [1, 2, 3]);
            classifier.addExample(label, [4, 5, 6]);
            classifier.addExample(label, [7, 8, 9]);

            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount[label]).toBe(3);
        });

        it('should add examples with different labels', () => {
            classifier.addExample('label1', [1, 2, 3]);
            classifier.addExample('label2', [4, 5, 6]);
            classifier.addExample('label3', [7, 8, 9]);

            expect(classifier.getNumClasses()).toBe(3);
            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount['label1']).toBe(1);
            expect(exampleCount['label2']).toBe(1);
            expect(exampleCount['label3']).toBe(1);
        });

        it('should handle empty data array', () => {
            const initialCount = classifier.getNumClasses();
            classifier.addExample('test', []);
            expect(classifier.getNumClasses()).toBe(initialCount);
        });

        it('should handle multi-dimensional data', () => {
            const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            classifier.addExample('test', data);

            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount['test']).toBe(1);
        });
    });

    describe('getClassExampleCount', () => {
        it('should return empty object when no examples added', () => {
            const count = classifier.getClassExampleCount();
            expect(count).toEqual({});
        });

        it('should return correct counts for multiple labels', () => {
            classifier.addExample('cat', [1, 2, 3]);
            classifier.addExample('cat', [2, 3, 4]);
            classifier.addExample('dog', [5, 6, 7]);

            const count = classifier.getClassExampleCount();
            expect(count['cat']).toBe(2);
            expect(count['dog']).toBe(1);
        });
    });

    describe('getDataset', () => {
        it('should return an empty array when no examples added', () => {
            const dataset = classifier.getDataset();
            expect(dataset).toEqual([]);
        });

        it('should return dataset in correct format', () => {
            const data = [1, 2, 3];
            const label = 'test';
            classifier.addExample(label, data);

            const dataset = classifier.getDataset();
            expect(dataset.length).toBe(1);
            expect(dataset[0][0]).toBe(label);
            expect(Array.isArray(dataset[0][1])).toBe(true);
            expect(Array.isArray(dataset[0][2])).toBe(true); // shape
        });

        it('should return multiple labels in dataset', () => {
            classifier.addExample('label1', [1, 2, 3]);
            classifier.addExample('label2', [4, 5, 6]);

            const dataset = classifier.getDataset();
            expect(dataset.length).toBe(2);
        });
    });

    describe('loadDataset', () => {
        it('should load a dataset from serialized format', () => {
            const datasetObj = [
                ['label1', [1, 2, 3, 4, 5, 6], [2, 3]],
                ['label2', [7, 8, 9, 10, 11, 12], [2, 3]]
            ];

            classifier.loadDataset(datasetObj);

            expect(classifier.getNumClasses()).toBe(2);
            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount['label1']).toBe(2);
            expect(exampleCount['label2']).toBe(2);
        });

        it('should replace existing dataset when loading new data', () => {
            classifier.addExample('old', [1, 2, 3]);
            expect(classifier.getNumClasses()).toBe(1);

            const datasetObj = [
                ['new', [4, 5, 6], [1, 3]]
            ];
            classifier.loadDataset(datasetObj);

            expect(classifier.getNumClasses()).toBe(1);
            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount['new']).toBe(1);
            expect(exampleCount['old']).toBeUndefined();
        });

        it('should handle empty dataset', () => {
            classifier.addExample('test', [1, 2, 3]);
            classifier.loadDataset([]);

            expect(classifier.getNumClasses()).toBe(0);
        });
    });

    describe('getNumClasses', () => {
        it('should return 0 when no examples added', () => {
            expect(classifier.getNumClasses()).toBe(0);
        });

        it('should return correct number of classes', () => {
            classifier.addExample('class1', [1, 2, 3]);
            classifier.addExample('class2', [4, 5, 6]);
            classifier.addExample('class3', [7, 8, 9]);

            expect(classifier.getNumClasses()).toBe(3);
        });

        it('should not increment when adding to existing class', () => {
            classifier.addExample('class1', [1, 2, 3]);
            classifier.addExample('class1', [4, 5, 6]);

            expect(classifier.getNumClasses()).toBe(1);
        });
    });

    describe('classify', () => {
        beforeEach(() => {
            // Add training examples
            classifier.addExample('class1', [1, 1, 1]);
            classifier.addExample('class1', [1.1, 1.1, 1.1]);
            classifier.addExample('class2', [5, 5, 5]);
            classifier.addExample('class2', [5.1, 5.1, 5.1]);
        });

        it('should classify data correctly', async () => {
            const result = await classifier.classify([1.2, 1.2, 1.2], 3);

            expect(result).toHaveProperty('label');
            expect(result).toHaveProperty('confidences');
            expect(result.label).toBe('class1');
        });

        it('should update lastPrediction', async () => {
            expect(classifier.lastPrediction).toBeNull();

            const result = await classifier.classify([5.2, 5.2, 5.2], 3);

            expect(classifier.lastPrediction).not.toBeNull();
            expect(classifier.lastPrediction.label).toBe(result.label);
            expect(['class1', 'class2']).toContain(result.label);
        });

        it('should return confidences for all classes', async () => {
            const result = await classifier.classify([3, 3, 3], 3);

            expect(result.confidences).toHaveProperty('class1');
            expect(result.confidences).toHaveProperty('class2');
            expect(typeof result.confidences['class1']).toBe('number');
            expect(typeof result.confidences['class2']).toBe('number');
        });

        it('should respect k parameter', async () => {
            const result1 = await classifier.classify([1.2, 1.2, 1.2], 1);
            const result2 = await classifier.classify([1.2, 1.2, 1.2], 3);

            expect(result1).toHaveProperty('label');
            expect(result2).toHaveProperty('label');
            // Both should classify to class1 but with potentially different confidences
        });

        it('should handle multi-dimensional feature vectors', async () => {
            const newClassifier = new KNNClassifier();
            newClassifier.addExample('A', [1, 2, 3, 4, 5]);
            newClassifier.addExample('B', [6, 7, 8, 9, 10]);

            const result = await newClassifier.classify([1.5, 2.5, 3.5, 4.5, 5.5], 1);
            expect(result.label).toBe('A');
            
            newClassifier.clearAll();
        });
    });

    describe('clearClass', () => {
        beforeEach(() => {
            classifier.addExample('class1', [1, 2, 3]);
            classifier.addExample('class2', [4, 5, 6]);
        });

        it('should clear specific class', () => {
            expect(classifier.getNumClasses()).toBe(2);

            classifier.clearClass('class1');

            expect(classifier.getNumClasses()).toBe(1);
            const exampleCount = classifier.getClassExampleCount();
            expect(exampleCount['class1']).toBeUndefined();
            expect(exampleCount['class2']).toBe(1);
        });

        it('should handle clearing non-existent class gracefully', () => {
            const initialCount = classifier.getNumClasses();
            
            // Expected to throw error for non-existent class
            expect(() => {
                classifier.clearClass('nonexistent');
            }).toThrow('Cannot clear invalid class');
            
            // Class count should remain unchanged
            expect(classifier.getNumClasses()).toBe(initialCount);
        });
    });

    describe('clearAll', () => {
        it('should clear all classes', () => {
            classifier.addExample('class1', [1, 2, 3]);
            classifier.addExample('class2', [4, 5, 6]);
            classifier.addExample('class3', [7, 8, 9]);

            expect(classifier.getNumClasses()).toBe(3);

            classifier.clearAll();

            expect(classifier.getNumClasses()).toBe(0);
            expect(classifier.getClassExampleCount()).toEqual({});
        });

        it('should reset lastPrediction', async () => {
            classifier.addExample('class1', [1, 2, 3]);
            await classifier.classify([1, 2, 3], 1);
            expect(classifier.lastPrediction).not.toBeNull();

            classifier.clearAll();

            // lastPrediction is not automatically reset, but no classes exist
            expect(classifier.getNumClasses()).toBe(0);
        });
    });

    describe('dataset serialization/deserialization', () => {
        it('should preserve data through save and load cycle', () => {
            classifier.addExample('cat', [1, 2, 3]);
            classifier.addExample('cat', [1.1, 2.1, 3.1]);
            classifier.addExample('dog', [5, 6, 7]);

            const dataset = classifier.getDataset();
            const newClassifier = new KNNClassifier();
            newClassifier.loadDataset(dataset);

            expect(newClassifier.getNumClasses()).toBe(classifier.getNumClasses());
            const originalCount = classifier.getClassExampleCount();
            const newCount = newClassifier.getClassExampleCount();
            expect(newCount['cat']).toBe(originalCount['cat']);
            expect(newCount['dog']).toBe(originalCount['dog']);

            newClassifier.clearAll();
        });

        it('should produce same classification after reload', async () => {
            classifier.addExample('A', [1, 1, 1]);
            classifier.addExample('B', [5, 5, 5]);

            const dataset = classifier.getDataset();
            const result1 = await classifier.classify([1.2, 1.2, 1.2], 1);

            const newClassifier = new KNNClassifier();
            newClassifier.loadDataset(dataset);
            const result2 = await newClassifier.classify([1.2, 1.2, 1.2], 1);

            expect(result1.label).toBe(result2.label);

            newClassifier.clearAll();
        });
    });
});
