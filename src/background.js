import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';

// ------------------------------- pipeline.js ----------------------------------//
// import { cleanText, pipeline } from './pipeline';

function cleanText(text) {
    // lower case all letters
    text = text.toLowerCase();
    return text;
}

function pipeline(text) {
    
    // Tokenize
    let tokens = text.split(" ");
    let indices = [];
    for(let i=0; i<tokens.length; i++) {
        if(WORD_TO_INDEX[tokens[i]] != undefined) {
            indices.push(WORD_TO_INDEX[tokens[i]]);
        } else {
            console.log(tokens[i] + " not in vocab.");
        }
    }
    return indices;
}

//------------------------------- data.js ----------------------------------------------//
// import { EMBEDDING_MATRIX, META_DATA, WORD_TO_INDEX } from './data';

const WORD_TO_INDEX = {
    'love': 0,
    'hate': 1,
    'great': 2,
    'movie': 3
};

const EMBEDDING_MATRIX = {
    0: [0.123, 0.325],
    1: [-0.234, 0.129],
    2: [0.234, 0.654],
    3: [0.823, 0.123]
};

const META_DATA = {
    vocabSize: 4,
    embeddingDim: 2,
    positiveSentiment: 1
};

//----------------------------------- background.js ------------------------------------//

const VOCAB_SIZE = META_DATA.vocabSize;
const EMBEDDING_DIM = META_DATA.embeddingDim;
const POSITIVE_SENT = META_DATA.positiveSentiment;

// https://miro.medium.com/max/1136/1*QJpDCVVeYhklYJ3uJGNRXQ.jpeg
// One simply does not write async-await without knowing promises.

class SentimentClassifier {
    constructor() {
        this.loadModel();
    }

    /**
     * Loads sentimentClassifier from URL and keeps a reference to it in the object.
     */
    async loadModel() {
        console.log('Loading model...');
        try {
            // this.model = await tf.loadGraphModel(MODEL_URL);
            this.model = tf.sequential({
                layers: [tf.layers.embedding({inputDim: VOCAB_SIZE, outputDim: EMBEDDING_DIM}),
                        tf.layers.lstm({units: 4, returnSequences: false}),
                        tf.layers.dense({units: 1, activation: 'sigmoid'})
                    ]
            });
            console.log("Model loaded");
        } catch {
            console.error(`Unable to load model from URL: ${MODEL_URL}`);
        }
    }

    /**
     * Triggers the model to make a prediction on the text provided.
     *
     * @param {string} text the text to be analyzed.   
     */
    async analyzeText(text, textAreaId, tabId) {
        
        if (!this.model) {
            console.log('Waiting for model to load....');
            setTimeout(() => { this.analyzeImage(url) }, FIVE_SECONDS_IN_MS); // try after 5 second
            return;
        }

        text = cleanText(text);
        console.log(" cleaned text ", text);

        let indices = pipeline(text); // tokenizes and returns a list of tokens indices
        console.log(indices)

        const inputTensor = tf.tensor2d(indices, [1, indices.length], 'int32');
        inputTensor.print();

        // returns a tensor which is converte to array asynchronously
        let prediction = await this.model.predict(inputTensor).data();
        console.log("value ",prediction[0]);
        
        // Send back the response to the tab
        let response = {
            action: 'TEXT_SENTIMENT_CLASSIFIED',
            prediction: prediction[0] > 0.5 ? 'POSITIVE' : 'NEGATIVE',
            textAreaId: textAreaId
        };
        console.log("response ", response);
        chrome.tabs.sendMessage(tabId, response);
    }
}

const sentimentClassifier = new SentimentClassifier();



/**
 * Add a listener to hear from the content.js for an inference task. 
 * 
 * @param: message: { 
 *              action: Type of inference task,
 *              textAreaId: ID of the text Area on the page,
 *              text: Text which needs to be analyzed
 *          }
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("received request", request);
    if (request && request.action && request.textAreaId && request.text) {
        if (request.action ==  'TEXT_SENTIMENT') {
            sentimentClassifier.analyzeText(request.text, request.textAreaId, sender.tab.id);
        }      
    }
});



