import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';

import { WORD_2_INDEX } from './data/eng_word2index_1k';
import { INDEX_2_VEC } from './data/eng_index2vec_1k';
import { META_DATA } from './data/eng_meta_1k';

// ------------------------------- pipeline.js ----------------------------------//
// import { cleanText, pipeline } from './pipeline'; Will be moved as soon as code gets bigger.

function cleanText(text) {
    // lower case all letters
    text = text.toLowerCase();
    return text;
}

/**
 * Pipeline processes the text and returs words mapped to
 * indices (Now, we will move to NLP libraries in Javascript soon).
 * @todo: As it takes slight amount of time, we will do it in an
 * asynchronous manner.
 * 
 * @param {string} text text to be processed
 */
function pipeline(text) {
    let tokens = text.split(" ");
    let indices = [];
    for(let i=0; i<tokens.length; i++) {
        if(WORD_2_INDEX[tokens[i]] != undefined) {
            indices.push(WORD_2_INDEX[tokens[i]]);
        } else {
            console.log(tokens[i] + " not in vocab.");
        }
    }
    return indices;
}

//----------------------------------- background.js ------------------------------------//

const VOCAB_SIZE = META_DATA.vocabSize;
const EMBEDDING_DIM = META_DATA.embeddingDim;
const POSITIVE_SENT = META_DATA.positiveSentiment;
const MODEL_URL = 'https://placeholderUrl.com'   // 

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
     * @param {string} textAreaId Id of the textArea which has text
     * @param {*} tabId tab Id   
     */
    async analyzeText(text, textAreaId, tabId) {
        
        if (!this.model) {
            console.log('Waiting for model to load....');
            setTimeout(() => { this.analyzeText(text, textAreaId, tabId) }, FIVE_SECONDS_IN_MS); // try after 5 second
            return;
        }
        try {
            text = cleanText(text);

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
        
        } catch (err) {     // catches the unresolved promise
            console.log("Error", err);
        }
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



