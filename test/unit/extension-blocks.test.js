import { blockClass as ExtensionBlocks } from '../../src/vm/extensions/block/index.js';
import BlockType from '../../src/vm/extension-support/block-type';
import ArgumentType from '../../src/vm/extension-support/argument-type';

describe('ExtensionBlocks', () => {
    let runtime;
    let extension;
    let mockTarget;

    beforeEach(() => {
        // Mock runtime
        runtime = {
            formatMessage: jest.fn(msg => msg.default),
            on: jest.fn(),
            targets: [],
            getTargetById: jest.fn(),
            getEditingTarget: jest.fn(),
            getTargetForStage: jest.fn(),
            emitProjectChanged: jest.fn()
        };

        // Mock target with variables
        mockTarget = {
            id: 'target-123',
            variables: {},
            getAllVariableNamesInScopeByType: jest.fn(() => []),
            lookupVariableByNameAndType: jest.fn(() => null),
            lookupOrCreateList: jest.fn(() => ({
                id: 'list-id',
                name: 'KNN Dataset',
                type: 'list',
                value: []
            }))
        };

        runtime.getTargetById.mockReturnValue(mockTarget);
        runtime.getEditingTarget.mockReturnValue(mockTarget);

        extension = new ExtensionBlocks(runtime);
    });

    describe('constructor', () => {
        it('should create an instance of ExtensionBlocks', () => {
            expect(extension).toBeInstanceOf(ExtensionBlocks);
        });

        it('should initialize classifiers map', () => {
            expect(extension.classifiers).toBeDefined();
            expect(typeof extension.classifiers).toBe('object');
        });

        it('should register PROJECT_LOADED event listener', () => {
            expect(runtime.on).toHaveBeenCalledWith('PROJECT_LOADED', expect.any(Function));
        });

        it('should set up formatMessage', () => {
            expect(runtime.formatMessage).toBeDefined();
        });
    });

    describe('static properties', () => {
        it('should have EXTENSION_NAME', () => {
            expect(ExtensionBlocks.EXTENSION_NAME).toBeDefined();
            expect(typeof ExtensionBlocks.EXTENSION_NAME).toBe('string');
        });

        it('should have EXTENSION_ID', () => {
            expect(ExtensionBlocks.EXTENSION_ID).toBe('tfknn');
        });

        it('should have extensionURL', () => {
            expect(ExtensionBlocks.extensionURL).toBeDefined();
            expect(typeof ExtensionBlocks.extensionURL).toBe('string');
        });

        it('should allow setting extensionURL', () => {
            const newUrl = 'https://example.com/extension.mjs';
            ExtensionBlocks.extensionURL = newUrl;
            expect(ExtensionBlocks.extensionURL).toBe(newUrl);
        });

        it('should allow setting formatMessage', () => {
            const mockFormatter = jest.fn(msg => msg.default);
            mockFormatter.setup = jest.fn(() => ({ locale: 'en', translations: {} }));
            
            // Test that setting formatMessage doesn't throw
            expect(() => {
                ExtensionBlocks.formatMessage = mockFormatter;
            }).not.toThrow();
        });
    });

    describe('getInfo', () => {
        let info;

        beforeEach(() => {
            info = extension.getInfo();
        });

        it('should return extension metadata', () => {
            expect(info).toHaveProperty('id');
            expect(info).toHaveProperty('name');
            expect(info).toHaveProperty('blocks');
            expect(info).toHaveProperty('menus');
        });

        it('should have correct extension ID', () => {
            expect(info.id).toBe('tfknn');
        });

        it('should have blocks array', () => {
            expect(Array.isArray(info.blocks)).toBe(true);
            expect(info.blocks.length).toBeGreaterThan(0);
        });

        it('should include addExample block', () => {
            const addExampleBlock = info.blocks.find(b => b.opcode === 'addExample');
            expect(addExampleBlock).toBeDefined();
            expect(addExampleBlock.blockType).toBe(BlockType.COMMAND);
            expect(addExampleBlock.arguments).toHaveProperty('DATA');
            expect(addExampleBlock.arguments).toHaveProperty('LABEL');
        });

        it('should include clearExamples block', () => {
            const clearBlock = info.blocks.find(b => b.opcode === 'clearExamples');
            expect(clearBlock).toBeDefined();
            expect(clearBlock.blockType).toBe(BlockType.COMMAND);
        });

        it('should include predictClass block', () => {
            const predictBlock = info.blocks.find(b => b.opcode === 'predictClass');
            expect(predictBlock).toBeDefined();
            expect(predictBlock.blockType).toBe(BlockType.COMMAND);
            expect(predictBlock.arguments).toHaveProperty('DATA');
            expect(predictBlock.arguments).toHaveProperty('K');
        });

        it('should include reporter blocks', () => {
            const labelBlock = info.blocks.find(b => b.opcode === 'label');
            expect(labelBlock).toBeDefined();
            expect(labelBlock.blockType).toBe(BlockType.REPORTER);

            const confidenceBlock = info.blocks.find(b => b.opcode === 'confidence');
            expect(confidenceBlock).toBeDefined();
            expect(confidenceBlock.blockType).toBe(BlockType.REPORTER);
        });

        it('should have menus defined', () => {
            expect(info.menus).toHaveProperty('listMenu');
            expect(info.menus.listMenu).toHaveProperty('acceptReporters', true);
            expect(info.menus.listMenu).toHaveProperty('items', 'getListMenu');
        });
    });

    describe('getListMenu', () => {
        it('should return list of list variable names', () => {
            mockTarget.getAllVariableNamesInScopeByType.mockReturnValue(['list1', 'list2']);
            const lists = extension.getListMenu(mockTarget.id);
            expect(lists).toContain('list1');
            expect(lists).toContain('list2');
        });

        it('should return default list when no lists exist', () => {
            mockTarget.getAllVariableNamesInScopeByType.mockReturnValue([]);
            const lists = extension.getListMenu(mockTarget.id);
            expect(lists.length).toBeGreaterThan(0);
        });
    });

    describe('addExample', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should add an example with numeric data', () => {
            const args = {
                DATA: '1 2 3',
                LABEL: 'test'
            };

            const result = extension.addExample(args, util);

            expect(result).toContain('Added example');
            expect(result).toContain('test');
        });

        it('should add example with comma-separated data', () => {
            const args = {
                DATA: '1,2,3',
                LABEL: 'test'
            };

            const result = extension.addExample(args, util);

            expect(result).toContain('Added example');
        });

        it('should handle multiple examples for same label', () => {
            const args1 = { DATA: '1 2 3', LABEL: 'label1' };
            const args2 = { DATA: '4 5 6', LABEL: 'label1' };

            extension.addExample(args1, util);
            extension.addExample(args2, util);

            const size = extension.sizeOfExamples({ LABEL: 'label1' }, util);
            expect(size).toBe(2);
        });

        it('should return error message on failure', () => {
            const args = {
                DATA: 'invalid data',
                LABEL: 'test'
            };

            const result = extension.addExample(args, util);
            // Should handle gracefully even with invalid data
            expect(typeof result).toBe('string');
        });
    });

    describe('clearExamples', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should clear examples for a label', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            const result = extension.clearExamples({ LABEL: 'test' }, util);

            expect(result).toContain('Cleared examples');
            expect(result).toContain('test');
        });

        it('should reduce the count of examples', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            extension.clearExamples({ LABEL: 'test' }, util);

            const size = extension.sizeOfExamples({ LABEL: 'test' }, util);
            expect(size).toBe(0);
        });
    });

    describe('sizeOfAnExample', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return 0 when no examples added', () => {
            const size = extension.sizeOfAnExample({}, util);
            expect(size).toBe(0);
        });

        it('should return correct size after adding example', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            const size = extension.sizeOfAnExample({}, util);
            expect(size).toBeGreaterThan(0);
            expect(size).toBe(3);
        });

        it('should return consistent size for examples with same dimensions', () => {
            const util2 = { target: Object.assign({}, mockTarget, { id: 'target-999' }) };
            extension.addExample({ DATA: '1 2 3 4', LABEL: 'test' }, util2);
            const size = extension.sizeOfAnExample({}, util2);
            expect(size).toBeGreaterThan(0);
            expect(size).toBe(4);
        });
    });

    describe('predictClass', () => {
        let util;

        beforeEach(() => {
            util = {
                target: mockTarget,
                yield: jest.fn()
            };
        });

        it('should return error when no examples added', async () => {
            const args = {
                DATA: '1 2 3',
                K: 3
            };

            const result = await extension.predictClass(args, util);
            expect(result).toContain('No examples added');
        });

        it('should return error for invalid data', async () => {
            const args = {
                DATA: '',
                K: 3
            };

            const result = await extension.predictClass(args, util);
            expect(result).toBe('Invalid data');
        });

        it('should return error for invalid k value', async () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            const args = {
                DATA: '1 2 3',
                K: 0
            };

            const result = await extension.predictClass(args, util);
            expect(result).toContain('Invalid value for k');
        });

        it('should predict label after training', async () => {
            extension.addExample({ DATA: '1 1 1', LABEL: 'label1' }, util);
            extension.addExample({ DATA: '5 5 5', LABEL: 'label2' }, util);

            const args = {
                DATA: '1.1 1.1 1.1',
                K: 1
            };

            const result = await extension.predictClass(args, util);
            expect(result).toContain('Predicted label');
            expect(result).toContain('confidence');
        });

        it('should yield if already predicting', async () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            extension._predicting = true;

            const args = { DATA: '1 2 3', K: 1 };
            await extension.predictClass(args, util);

            expect(util.yield).toHaveBeenCalled();
        });
    });

    describe('label', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return empty string when no prediction made', () => {
            const result = extension.label({}, util);
            expect(result).toBe(' ');
        });

        it('should return predicted label after prediction', async () => {
            extension.addExample({ DATA: '1 1 1', LABEL: 'testLabel' }, util);
            await extension.predictClass({ DATA: '1.1 1.1 1.1', K: 1 }, { ...util, yield: jest.fn() });

            const result = extension.label({}, util);
            expect(result).toBe('testLabel');
        });
    });

    describe('confidence', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return 0 when no prediction made', () => {
            const result = extension.confidence({ LABEL: 'test' }, util);
            expect(result).toBe(0);
        });

        it('should return 0 for non-existent label', async () => {
            extension.addExample({ DATA: '1 1 1', LABEL: 'label1' }, util);
            await extension.predictClass({ DATA: '1.1 1.1 1.1', K: 1 }, { ...util, yield: jest.fn() });

            const result = extension.confidence({ LABEL: 'nonexistent' }, util);
            expect(result).toBe(0);
        });

        it('should return confidence value after prediction', async () => {
            extension.addExample({ DATA: '1 1 1', LABEL: 'label1' }, util);
            await extension.predictClass({ DATA: '1.1 1.1 1.1', K: 1 }, { ...util, yield: jest.fn() });

            const result = extension.confidence({ LABEL: 'label1' }, util);
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });
    });

    describe('labelAt', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return empty string when no labels exist', () => {
            const result = extension.labelAt({ INDEX: 1 }, util);
            expect(result).toBe('');
        });

        it('should return label at index', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'first' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'second' }, util);

            const result = extension.labelAt({ INDEX: 1 }, util);
            expect(['first', 'second']).toContain(result);
        });

        it('should return empty string for out of range index', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);

            const result = extension.labelAt({ INDEX: 10 }, util);
            expect(result).toBe('');
        });

        it('should handle 1-based indexing', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);

            const result = extension.labelAt({ INDEX: 1 }, util);
            expect(result).toBe('test');
        });
    });

    describe('sizeOfLabels', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return 0 when no labels exist', () => {
            const result = extension.sizeOfLabels({}, util);
            expect(result).toBe(0);
        });

        it('should return number of unique labels', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'label1' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'label2' }, util);
            extension.addExample({ DATA: '7 8 9', LABEL: 'label3' }, util);

            const result = extension.sizeOfLabels({}, util);
            expect(result).toBe(3);
        });

        it('should not count duplicate labels', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'label1' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'label1' }, util);

            const result = extension.sizeOfLabels({}, util);
            expect(result).toBe(1);
        });
    });

    describe('sizeOfExamples', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return 0 for non-existent label', () => {
            const result = extension.sizeOfExamples({ LABEL: 'nonexistent' }, util);
            expect(result).toBe(0);
        });

        it('should return count of examples for label', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'test' }, util);
            extension.addExample({ DATA: '7 8 9', LABEL: 'test' }, util);

            const result = extension.sizeOfExamples({ LABEL: 'test' }, util);
            expect(result).toBe(3);
        });

        it('should return correct count for each label independently', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'label1' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'label2' }, util);
            extension.addExample({ DATA: '7 8 9', LABEL: 'label2' }, util);

            expect(extension.sizeOfExamples({ LABEL: 'label1' }, util)).toBe(1);
            expect(extension.sizeOfExamples({ LABEL: 'label2' }, util)).toBe(2);
        });
    });

    describe('getDataset', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should return empty array when no examples', () => {
            const newTarget = { 
                ...mockTarget, 
                id: 'empty-target',
                lookupVariableByNameAndType: jest.fn(() => null),
                lookupOrCreateList: jest.fn(() => ({
                    id: 'list-id',
                    name: 'KNN Dataset',
                    type: 'list',
                    value: []
                }))
            };
            const newUtil = { target: newTarget };
            const dataset = extension.getDataset({}, newUtil);
            expect(Array.isArray(dataset)).toBe(true);
            expect(dataset.length).toBe(0);
        });

        it('should return dataset with correct structure', () => {
            const newTarget = { 
                ...mockTarget, 
                id: 'dataset-target',
                lookupVariableByNameAndType: jest.fn(() => null),
                lookupOrCreateList: jest.fn(() => ({
                    id: 'list-id',
                    name: 'KNN Dataset',
                    type: 'list',
                    value: []
                }))
            };
            const newUtil = { target: newTarget };
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, newUtil);
            const dataset = extension.getDataset({}, newUtil);

            expect(Array.isArray(dataset)).toBe(true);
            expect(dataset.length).toBeGreaterThan(0);
            expect(Array.isArray(dataset[0])).toBe(true);
            expect(dataset[0].length).toBe(3); // [label, data, shape]
        });
    });

    describe('initializeDatasetFromTarget', () => {
        it('should handle empty list', () => {
            const mockList = { value: [] };
            mockTarget.lookupVariableByNameAndType.mockReturnValue(mockList);

            expect(() => {
                extension.initializeDatasetFromTarget(mockTarget);
            }).not.toThrow();
        });

        it('should load dataset from list variable', () => {
            const mockList = {
                value: [
                    '["label1" [1 2 3] [1 3]]'
                ]
            };
            mockTarget.lookupVariableByNameAndType.mockReturnValue(mockList);

            expect(() => {
                extension.initializeDatasetFromTarget(mockTarget);
            }).not.toThrow();
        });

        it('should handle missing list variable', () => {
            mockTarget.lookupVariableByNameAndType.mockReturnValue(null);

            expect(() => {
                extension.initializeDatasetFromTarget(mockTarget);
            }).not.toThrow();
        });

        it('should ignore invalid dataset entries', () => {
            const mockList = {
                value: [
                    'invalid json',
                    '["label1" "wrong format"]',
                    '["label2" [1 2 3] [1 3]]'
                ]
            };
            mockTarget.lookupVariableByNameAndType.mockReturnValue(mockList);

            expect(() => {
                extension.initializeDatasetFromTarget(mockTarget);
            }).not.toThrow();
        });
    });

    describe('_getClassifierFor', () => {
        it('should create classifier for new target', () => {
            const classifier = extension._getClassifierFor(mockTarget);

            expect(classifier).toBeDefined();
            expect(extension.classifiers[mockTarget.id]).toBe(classifier);
        });

        it('should return existing classifier for target', () => {
            const classifier1 = extension._getClassifierFor(mockTarget);
            const classifier2 = extension._getClassifierFor(mockTarget);

            expect(classifier1).toBe(classifier2);
        });

        it('should create separate classifiers for different targets', () => {
            const target2 = Object.assign({}, mockTarget, { id: 'target-456' });

            const classifier1 = extension._getClassifierFor(mockTarget);
            const classifier2 = extension._getClassifierFor(target2);

            expect(classifier1).not.toBe(classifier2);
        });
    });

    describe('dataFromList', () => {
        let util;

        beforeEach(() => {
            util = { target: mockTarget };
        });

        it('should handle array string directly', () => {
            const args = { LIST_NAME: '1 2 3' };
            const result = extension.dataFromList(args, util);

            expect(typeof result).toBe('string');
            const parsed = JSON.parse(result);
            expect(Array.isArray(parsed)).toBe(true);
        });

        it('should handle comma-separated values', () => {
            const args = { LIST_NAME: '1,2,3' };
            const result = extension.dataFromList(args, util);

            expect(typeof result).toBe('string');
            const parsed = JSON.parse(result);
            expect(Array.isArray(parsed)).toBe(true);
        });

        it('should return JSON string', () => {
            const args = { LIST_NAME: '1 2 3 4 5' };
            const result = extension.dataFromList(args, util);

            expect(() => JSON.parse(result)).not.toThrow();
        });
    });

    describe('DATASET_LIST constants', () => {
        it('should have DATASET_LIST_ID', () => {
            expect(extension.DATASET_LIST_ID).toBe('tfknn_dataset');
        });

        it('should have DATASET_LIST_NAME', () => {
            expect(extension.DATASET_LIST_NAME).toBe('KNN Dataset');
        });
    });

    describe('integration scenarios', () => {
        let util;

        beforeEach(() => {
            util = {
                target: mockTarget,
                yield: jest.fn()
            };
        });

        it('should handle complete workflow: add, predict, get results', async () => {
            // Add training examples
            extension.addExample({ DATA: '1 1 1', LABEL: 'class1' }, util);
            extension.addExample({ DATA: '5 5 5', LABEL: 'class2' }, util);

            // Predict
            await extension.predictClass({ DATA: '1.2 1.2 1.2', K: 1 }, util);

            // Get results
            const label = extension.label({}, util);
            const confidence = extension.confidence({ LABEL: label }, util);

            expect(label).toBeTruthy();
            expect(confidence).toBeGreaterThan(0);
        });

        it('should maintain separate state for different targets', () => {
            const target2 = Object.assign({}, mockTarget, { id: 'target-456' });
            const util2 = { target: target2 };

            extension.addExample({ DATA: '1 2 3', LABEL: 'target1-label' }, util);
            extension.addExample({ DATA: '4 5 6', LABEL: 'target2-label' }, util2);

            expect(extension.sizeOfLabels({}, util)).toBe(1);
            expect(extension.sizeOfLabels({}, util2)).toBe(1);
        });

        it('should clear and re-add examples correctly', () => {
            extension.addExample({ DATA: '1 2 3', LABEL: 'test' }, util);
            expect(extension.sizeOfExamples({ LABEL: 'test' }, util)).toBe(1);

            extension.clearExamples({ LABEL: 'test' }, util);
            expect(extension.sizeOfExamples({ LABEL: 'test' }, util)).toBe(0);

            extension.addExample({ DATA: '4 5 6', LABEL: 'test' }, util);
            expect(extension.sizeOfExamples({ LABEL: 'test' }, util)).toBe(1);
        });
    });
});
