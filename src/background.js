import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
// import { Pipeline } from './pipeline';

// import { WORD_2_INDEX } from './data/eng_word2index_1k';
// import { INDEX_2_VEC } from './data/eng_index2vec_1k';
// import { META_DATA } from './data/eng_meta_1k';
// import { array } from '../dist/src/background';
// const VOCAB_SIZE = META_DATA.vocabSize;
// const EMBEDDING_DIM = META_DATA.embeddingDim;
// const POSITIVE_SENT = META_DATA.positiveSentiment;

const ROOT_URL = 'http://localhost:5000/imdb_review/'
const MODEL_URL = ROOT_URL + 'model.json'
const WORD2INDEX_URL = ROOT_URL + 'word2index.json'
const META_DATA_URL = ROOT_URL + 'meta.json'


class Pipeline {

    constructor(word2index_url, meta_url) {
        this.fetchWord2Index(word2index_url);
        this.fetchMetaData(meta_url);
    }

    /**
     * Loads the word2index to map words to indices.
     */
    async fetchWord2Index(word2index_url) {
        console.log("Fetching word2index");
        fetch(word2index_url)
            .then(response => response.json())
            .then((response) => {
                this.word2index = response;
                console.log("Word2index data loaded.", response);
            })
            .catch(err => console.log(err));
    }

    /**
     * Loads the meta data related to training.
     */
    fetchMetaData(meta_url) {
        console.log("Fetching meta Data")
        fetch(meta_url)
            .then(response => response.json())
            .then((response) => {
                this.meta = response;
                console.log("meta data loaded.", response);
            })
            .catch(err => console.log(err));
    }

    async process(text) {
        
        if(!this.word2index) {
            console.log('Waiting for word2index to load....');
            setTimeout(() => { this.process(text) }, FIVE_SECONDS_IN_MS);
            return;
        }
        
        if(!this.meta) {
            console.log('Waiting for meta data to load....');
            setTimeout(() => { this.process(text) }, FIVE_SECONDS_IN_MS);
            return;
        }

        // preprocessing
        text = text.toLowerCase();
        
        // Tokenization
        let tokens = text.split(" ");
        
        // map the tokens to correpsonding indices
        let indices = [];

        for(let i=0; i < tokens.length && i < this.meta.max_length; i++) {
            let index = this.word2index[tokens[i]];
            if(index != undefined && index < this.meta.vocab_size) {
                indices.push(this.word2index[tokens[i]])
            }else {
                indices.push(this.word2index[this.meta.oov_token]);  // oov token
            }
        }

        // pad the indices if shorter than max length
        let pad = this.meta.max_length - indices.length;
        
        if(this.meta.trun_type == "post") {
            for(let i=0; i<pad; i++) {
                indices.unshift(0);     // IS IT COSTLY OPERATION ?       
            }
        } else {
            for(let i=0; i<pad; i++) {
                indices.push(0);
            }
        }

        console.log("indices here", indices);
        
        return indices
    }
}



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
    async analyzeText(indices, textAreaId, tabId) {
        
        if (!this.model) {
            console.log('Waiting for model to load....');
            setTimeout(() => { this.analyzeText(text, textAreaId, tabId) }, FIVE_SECONDS_IN_MS); // try after 5 second
            return;
        }

        try {

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
const pipeline = new Pipeline(WORD2INDEX_URL, META_DATA_URL);


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
            let indices = pipeline.process(request.text);
            indices.then(indices => {
                console.log("Going to analyze text", indices);
                sentimentClassifier.analyzeText(indices, request.textAreaId, sender.tab.id);
            })
            .catch(err => console.log(err)); 
        }      
    }
});



