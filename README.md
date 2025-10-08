# Tensorflow KNN
An extension for [Xcratch](https://xcratch.github.io/) that provides K-Nearest Neighbors (KNN) classification capabilities using TensorFlow.js ([GitHub - tfjs-models/knn-classifier](https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier)).

This extension allows you to train a KNN model by adding examples with labels and then classify new data points based on the learned examples.

## ✨ What You Can Do With This Extension

*   **Train a KNN Model:** Add data points (as strings of numbers) associated with specific labels.
*   **Classify Data:** Predict the label for new data points using the trained model.
*   **Inspect the Model:** Get information about the number of labels, examples per label, and the dimensions of the data.
*   **Analyze Predictions:** Retrieve the predicted label and the confidence scores for each label.
*   **Persist the Model:** Save the trained dataset to a Scratch list (`KNN Dataset`) or download it as a file, and load it back later.
*   **Integrate with Lists:** Easily use data directly from Scratch lists as input for examples or predictions.

### Example Project

Play the [Example Project](https://xcratch.github.io/editor/#https://yokobond.github.io/xcx-tf-knn/projects/example.sb3) to see the "TF KNN" extension in action.

In this example, sample points are scattered across the four quadrants of the stage. The KNN classifier is trained with these points and their corresponding quadrant labels. The cat sprite's position is then predicted to determine which quadrant it belongs to using the trained KNN model.

<iframe src="https://xcratch.github.io/editor/player#https://yokobond.github.io/xcx-tf-knn/projects/example.sb3" width="540px" height="460px"></iframe>

### Advanced Example
[rock-paper-scissors project](https://xcratch.github.io/editor/#https://yokobond.github.io/xcx-tf-knn/projects/rock-paper-scissors.sb3) uses the KNN classifier to recognize hand gestures (rock, paper, scissors) based on pre-extracted features. The features are extracted using the [MediaPipe Hand Detection Extension for Xcratch \| xcx\-mp\-hand](https://yokobond.github.io/xcx-mp-hand/).

## Blocks

### Training Blocks

*   `add example [DATA] with label [LABEL]`: Adds a data example (string of numbers or array) to the classifier under the specified label. The data will be automatically stored in the `KNN Dataset` list.
*   `clear examples for [LABEL]`: Removes all examples associated with the specified label from the classifier.

### Data Blocks

*   `size of an example`: Reports the number of dimensions (features) expected for each data example. Returns 0 if no examples have been added yet.
*   `KNN data from [LIST_NAME]`: Converts a Scratch list into a string format suitable for the `[DATA]` input. This block accepts a list name from the dropdown menu.

### Prediction Blocks

*   `predict [DATA] with [K] nearest neighbors`: Classifies the given data using the specified number of neighbors (K) and updates the prediction results. Returns a status message with the predicted label and confidence.
*   `label`: Reports the most likely label from the last prediction. Returns a space character if no prediction has been made yet.
*   `confidence of [LABEL]`: Reports the confidence score (0.0-1.0) for the specified label from the last prediction. Returns 0 if the label doesn't exist or no prediction has been made.

### Information Blocks

*   `label at [INDEX]`: Reports the name of the label at the given index (1-based) in the list of all known labels. Returns an empty string if the index is out of range.
*   `size of labels`: Reports the total number of unique labels known to the classifier.
*   `size of example for [LABEL]`: Reports the number of examples added for the specified label. Returns 0 if the label doesn't exist.

### Dataset Management Blocks

*   `KNN Dataset`: A list that automatically stores the current classifier dataset. This list is created in the current sprite and is loaded automatically when the project starts. 
*   `load dataset from [LIST_NAME]`: Loads a classifier dataset from a specified Scratch list. The list should contain the dataset in JSON format, as `KNN Dataset` does when saved.

## How to Use in Xcratch

This extension can be used with other extensions in [Xcratch](https://xcratch.github.io/).
1.  Open [Xcratch Editor](https://xcratch.github.io/editor)
2.  Click 'Add Extension' button
3.  Select 'Extension Loader' extension
4.  Type the module URL in the input field
    ```
    https://yokobond.github.io/xcx-tf-knn/dist/tfknn.mjs
    ```
5.  Click 'OK' button
6.  Now you can use the blocks of this extension

## Development

### Install Dependencies

```sh
npm install
```

### Setup Development Environment

Change ```vmSrcOrg``` to your local ```scratch-vm``` directory in ```./scripts/setup-dev.js``` then run setup-dev script to setup development environment.

```sh
npm run setup-dev
```

### Bundle into a Module

Run build script to bundle this extension into a module file which could be loaded on Xcratch.

```sh
npm run build
```

### Watch and Bundle

Run watch script to watch the changes of source files and bundle automatically.

```sh
npm run watch
```

### Test

Run test script to test this extension.

```sh
npm run test
```

## 🏠 Home Page

Open this page from [https://yokobond.github.io/xcx-tf-knn/](https://yokobond.github.io/xcx-tf-knn/)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/yokobond/xcx-tf-knn/issues).
