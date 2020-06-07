export class Pipeline {

    constructor(word2index_url, meta_url) {
        this.fetchWord2Index(word2index_url);
        this.fetchMetaData(meta_url);
    }

    /**
     * Fetchs word2index object to map words to indices.
     */
    async fetchWord2Index(word2index_url) {
        console.log("Fetching word2index");
        try {
            let response = await fetch(word2index_url);
            this.word2index = await response.json();
        } catch (err) {
            console.error(`Failed load Word2index from ${word2index_url}`);
        }
    }

    /**
     * Fetchs training meta data from server.
     */
    async fetchMetaData(meta_url) {
        console.log("Fetching meta Data")
        try {
            let response = await fetch(meta_url);
            this.meta = await response.json();
        } catch (err) {
            console.error(`Failed load Word2index from ${word2index_url}`);
        }
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

        console.log(`Text mapped to indices ${indices}`);
        
        // pad the indices if shorter than max length
        let pad = this.meta.max_length - indices.length;
        
        if(this.meta.trunc_type == "post") {
            for(let i=0; i<pad; i++) {
                indices.unshift(0);     // IS IT COSTLY OPERATION ?       
            }
        } else {
            for(let i=0; i<pad; i++) {
                indices.push(0);
            }
        }
        
        return indices
    }
}
