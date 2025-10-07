import { readAsNumericArray } from '../../src/vm/extensions/block/util.js';

describe('readAsNumericArray', () => {
    // Test basic functionality
    test('converts space-separated numbers to array', () => {
        expect(readAsNumericArray('0.0 -0.1 0')).toEqual([0.0, -0.1, 0]);
        expect(readAsNumericArray('1 2 3 4 5')).toEqual([1, 2, 3, 4, 5]);
        expect(readAsNumericArray('-5 -4 -3')).toEqual([-5, -4, -3]);
    });

    test('handles bracketed arrays with spaces', () => {
        expect(readAsNumericArray('[ 0.0 -0.1 0 ]')).toEqual([0.0, -0.1, 0]);
        expect(readAsNumericArray('[ 1 2 3 ]')).toEqual([1, 2, 3]);
        expect(readAsNumericArray('[ -5.5 -4.4 -3.3 ]')).toEqual([-5.5, -4.4, -3.3]);
    });

    test('handles bracketed arrays without outer spaces', () => {
        expect(readAsNumericArray('[0.0 -0.1 0]')).toEqual([0.0, -0.1, 0]);
        expect(readAsNumericArray('[1 2 3]')).toEqual([1, 2, 3]);
    });

    test('handles multiple arrays', () => {
        expect(readAsNumericArray('[ 0.0 -0.1 0 ] [ 0.0 -0.1 0 ]')).toEqual([[0.0, -0.1, 0], [0.0, -0.1, 0]]);
        expect(readAsNumericArray('[1 2] [3 4]')).toEqual([[1, 2], [3, 4]]);
        expect(readAsNumericArray('[ 1 ] [ 2 ] [ 3 ]')).toEqual([[1], [2], [3]]);
    });

    // Test edge cases
    test('handles empty string', () => {
        expect(readAsNumericArray('')).toEqual([]);
        expect(readAsNumericArray('   ')).toEqual([]);
    });

    test('handles non-string inputs', () => {
        expect(readAsNumericArray(123)).toEqual(123);
        expect(readAsNumericArray(0)).toEqual(0);
        expect(readAsNumericArray(-45.67)).toEqual(-45.67);
        expect(readAsNumericArray(null)).toEqual(0); // null converts to 0
        expect(readAsNumericArray(undefined)).toEqual(undefined); // undefined converts to NaN
    });

    test('handles already formatted JSON arrays', () => {
        expect(readAsNumericArray('[1,2,3]')).toEqual([1, 2, 3]);
        expect(readAsNumericArray('[[1,2],[3,4]]')).toEqual([[1, 2], [3, 4]]);
    });

    test('handles mixed formats', () => {
        expect(readAsNumericArray('[1, 2 3]')).toEqual([1, 2, 3]);
        expect(readAsNumericArray('[1,2] [3 4]')).toEqual([[1, 2], [3, 4]]);
    });

    // Test error handling and recovery
    test('attempts to recover from malformed inputs', () => {
        // The function should attempt to recover and provide a best-effort result
        expect(() => readAsNumericArray('1 2 ] 3')).not.toThrow();
        expect(readAsNumericArray('not a number')).toEqual([]);
    });
});
