
const CUSTOM_ATTR = 'unique_id';


/**
 * Returns a DOM textArea element pointing to the textArea having "unique_id"
 * as the provided id.
 * @param {string} unique_id which id to search for
 * @returns {HTMLElement} textArea element having the required "unique_id" attribute
 */
function getTextAreaWithUniqueId(unique_id) {
    const textAreaElArr = Array.from(document.getElementsByTagName('textarea'));
    for (const textArea of textAreaElArr) {
        if (textArea.getAttribute(CUSTOM_ATTR) == unique_id) {
            return textArea;
        }
    }
}

/**
 * Overlays the sentiment emoji on bottom right of the Text Area element.
 * 
 * Converts: 
 * <textarea style="width: 400px; height: 200px;">This is textarea 1</textarea> 
 * 
 * To: 
 * <div style="width: 406px; height: 206px; position: relative;">
 *      <textarea style="width: 400px; height: 200px; position: absolute;">This is textarea 1</textarea>
 *      <div style="right: 4px; bottom: 4px; position: absolute;">😄</div>
 * </div>
 */
const addSentimentEmojiToTextArea = (textArea, sentiment) => {
    textArea.style.position = "absolute";
    const originalParent = textArea.parentElement;
    let emojiDiv;

    
    if(!(originalParent.id == "cryptly_textArea_container"))
    {
        const container = document.createElement("div");
        container.id = 'cryptly_textArea_container';  // to avoid creating container again and again
        container.style.position = "relative";
        let add6Pixels = size => String(Number(size.replace('px','')) + 6) + 'px';  // handy function
        container.style.width = add6Pixels(textArea.style.width);
        container.style.height = add6Pixels(textArea.style.height);
        
        // create a new emoji div
        emojiDiv = document.createElement("div");
        emojiDiv.id = `cryptly_emoji_container_${textArea.getAttribute(CUSTOM_ATTR)}` 
        emojiDiv.style.position = "absolute";
        emojiDiv.style.right = "4px";
        emojiDiv.style.bottom = "4px";

        // Add the containerNode as a peer to the textArea, right next to the textArea.
        originalParent.insertBefore(container, textArea);

        // Move the textArea to inside the container;
        container.appendChild(textArea);

        // Add the emoji Div right after the textArea;
        container.appendChild(emojiDiv);

    }else {
        // Use previously created div.
        emojiDiv = document.getElementById(`cryptly_emoji_container_${textArea.getAttribute(CUSTOM_ATTR)}`);
    }
    
    
    console.log(sentiment);
    if (sentiment === 'POSITIVE') {
        emojiDiv.textContent = `😄 HAPPY` ;
    } else if (sentiment === 'NEGATIVE') {
        emojiDiv.textContent = `😔 SED` ;
    } else {
        emojiDiv.textContent = `😶 ???` ;
    }

    // return focus back to text area, to continue typing
    textArea.focus();
};

/**
 * Called when change in text in a Text Area occurs.
 * Passes the text to the background script for analyzing
 * the text, along with a message for type of analyziation required.
 * @param {event} event 
 */
const onTextChange = event => {
    
    // Communicate to popups here.
    message = {
        action: 'TEXT_SENTIMENT',
        textAreaId: event.target.getAttribute(CUSTOM_ATTR),
        text: event.target.value
    };    
    console.log("Sending text for analysis.")

    chrome.runtime.sendMessage(message);
    // chrome.runtime.sendMessage(message), response => {
    //     if (response && response.action && response.textAreaId && response.prediction) {    
    //         if (response.action ==  'TEXT_SENTIMENT_CLASSIFIED') {
    //             const textArea = getTextAreaWithUniqueId(response.textAreaId);
    //             addSentimentEmojiToTextArea(textArea, response.prediction);
    //         }      
    //     }    
    // });
};


const textAreas = document.getElementsByTagName("textarea");
for(let i=0; i<textAreas.length; i++) {
    // index is used for uniquely identify text areas
    textAreas[i].setAttribute(CUSTOM_ATTR, String(i));
    textAreas[i].addEventListener("input", onTextChange);
    console.log("text area ready ", i);
}

/**
 * Add a listener to hear from the background.js after completion of a task. 
 * 
 * @param: message: { 
 *              action: Type of inference task,
 *              textAreaId: ID of the text Area on the page,
 *              prediction: Outcome of the inference task
 *          }
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("received reponse", message);
    if (message && message.action && message.textAreaId && message.prediction) {    
        if (message.action ==  'TEXT_SENTIMENT_CLASSIFIED') {
            const textArea = getTextAreaWithUniqueId(message.textAreaId);
            addSentimentEmojiToTextArea(textArea, message.prediction);
        }      
    }    
});