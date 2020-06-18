import json
import struct
from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)    # This will enable CORS for all routes

app.config['CORS_HEADERS'] = 'Content-Type'

@app.route("/yelp_polarity_review/model.json")
@cross_origin()
def get_model():
    with open("yelp_polarity_review/model.json", "r") as f:
        model = json.load(f)
    return model

@app.route("/yelp_polarity_review/group1-shard1of1.bin")
@cross_origin()
def get_binary():
    with open("yelp_polarity_review/group1-shard1of1.bin", "rb") as f:
        meta_data = f.read()
    return meta_data

@app.route("/yelp_polarity_review/word2index.json")
@cross_origin()
def get_word2index():
    with open("yelp_polarity_review/word2index.json", "r") as f:
        word2index = json.load(f)
    return word2index

@app.route("/yelp_polarity_review/meta.json")
@cross_origin()
def get_meta():
    with open("yelp_polarity_review/meta.json", "r") as f:
        meta = json.load(f)
    return meta



if __name__ == "__main__":
    app.run(debug=True)