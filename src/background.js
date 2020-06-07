import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import { Pipeline } from './pipeline';


/**
 * Set initial value of all allowed urls
 */
chrome.storage.sync.set({urls: []})

/**
 * Add listener to recieve requests from tabs, and pass the text to 
 * pipeline and then to model for inference. Returns a response
 * to the tab with the prediction.
 * 
 * @param: message: { 
 *              action: Type of inference task,
 *              textAreaId: ID of the text Area on the page,
 *              text: Text which needs to be analyzed
 *          }
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Recieved request', request);
    if (request && request.action && request.textAreaId && request.text) {
        
        if (request.action ==  'TEXT_SENTIMENT') {
        
            pipeline.process(request.text)
            .then(indices => sentimentClassifier.analyzeText(indices))
            .then(prediction => {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'TEXT_SENTIMENT_CLASSIFIED',
                    prediction: prediction > 0.5 ? 'POSITIVE' : 'NEGATIVE',
                    textAreaId: request.textAreaId
                });
            })
            .catch(err => console.log(err)); 
        }      
    }
});

const ROOT_URL = 'http://localhost:5000/imdb_review/'
const MODEL_URL = ROOT_URL + 'model.json'
const WORD2INDEX_URL = ROOT_URL + 'word2index.json'
const META_DATA_URL = ROOT_URL + 'meta.json'

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
            this.model = await tf.loadLayersModel(MODEL_URL);
            console.log("Model loaded.")
        } catch (e){
            console.error(`Unable to load model from URL: ${MODEL_URL}`);
            console.error(e);
        }
    }

    
    /**
     * Triggers the model to make a prediction on the text provided.
     *
     * @param {string} indices the indices output by Pipeline
     * @param {string} textAreaId Id of the textArea which has text
     * @param {*} tabId tab Id   
     */
    async analyzeText(indices) {
        
        if (!this.model) {
            console.log('Waiting for model to load....');
            setTimeout(() => { this.analyzeText(text) }, FIVE_SECONDS_IN_MS); // try after 5 second
            return;
        }

        try {

            const inputTensor = tf.tensor2d(indices, [1, indices.length], 'int32');
            inputTensor.print();

            // returns a tensor which is converte to array asynchronously
            let prediction = await this.model.predict(inputTensor).data();
            console.log("value ",prediction[0]);
            return prediction[0];
            
        } catch (err) {
            console.log("Error", err);
        }
    }
}

const sentimentClassifier = new SentimentClassifier();
const pipeline = new Pipeline(WORD2INDEX_URL, META_DATA_URL);

