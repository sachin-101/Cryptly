const CUSTOM_ATTR = 'unique_id';
/**
 * Called when an animation set for textarea begins, thereby binding that new element
 * with an event listener
 * @param event
 */
let i = 0; // unique id for the textareas
const insertListener = (event) => {
    if (event.animationName == 'nodeInserted') {
        let target = event.target;
        target.setAttribute(CUSTOM_ATTR, i);
        i++;
        target.removeEventListener('input', onTextChange);
        target.addEventListener('input', onTextChange);
    }
};

document.removeEventListener('animationstart', insertListener); // removes listener first to avoid multiple listeners
document.addEventListener('animationstart', insertListener); // adds listener for new or existing textarea elements

/**
 * Returns a DOM textArea element pointing to the textArea having "unique_id"
 * as the provided id.
 * @param {string} unique_id which id to search for
 * @returns {HTMLElement} textArea element having the required "unique_id" attribute
 */
const getTextAreaWithUniqueId = (unique_id) => document.querySelector(`textarea[${CUSTOM_ATTR}="${unique_id}"]`);

/**
 * Overlays the sentiment emoji on bottom right of the Text Area element.
 *
 * Converts:
 * <textarea style="width: 400px; height: 200px;"></textarea>
 *
 * To:
 * <div style="width: 406px; height: 206px; position: relative;">
 *      <textarea style="width: 400px; height: 200px; position: absolute;"></textarea>
 *      <div style="right: 4px; bottom: 4px; position: absolute;">😄</div>
 * </div>
 */
const addSentimentEmojiToTextArea = (textArea, sentiment) => {
    textArea.style.position = 'absolute';
    const originalParent = textArea.parentElement;
    let emojiDiv;

    if (!(originalParent.id == 'cryptly_textArea_container')) {
        const container = document.createElement('div');
        container.id = 'cryptly_textArea_container'; // to avoid creating container again and again
        container.style.position = 'relative';
        let add6Pixels = (size) => String(Number(size.replace('px', '')) + 6) + 'px'; // handy function
        container.style.width = add6Pixels(textArea.style.width);
        container.style.height = add6Pixels(textArea.style.height);
        
        // create a new emoji div
        emojiDiv = document.createElement('div');
        emojiDiv.id = `cryptly_emoji_container_${textArea.getAttribute(CUSTOM_ATTR)}`;
        emojiDiv.style.position = 'absolute';
        emojiDiv.style.right = '4px';
        emojiDiv.style.bottom = '4px';
        
        // Add the containerNode as a peer to the textArea, right next to the textArea.
        originalParent.insertBefore(container, textArea);
        
        // Move the textArea to inside the container;
        container.appendChild(textArea);
        
        // Add the emoji Div right after the textArea;
        container.appendChild(emojiDiv);
    } else {
        // Use previously created div.
        emojiDiv = document.getElementById(`cryptly_emoji_container_${textArea.getAttribute(CUSTOM_ATTR)}`);
    }
    
    console.log(sentiment);
    if (sentiment === 'POSITIVE') {
        emojiDiv.textContent = `😄 HAPPY`;
    } else if (sentiment === 'NEGATIVE') {
        emojiDiv.textContent = `😔 SED`;
    } else {
        emojiDiv.textContent = `😶 ???`;
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
const onTextChange = (event) => {
    // Communicate to popups here.

    chrome.runtime.sendMessage({
        action: 'TEXT_SENTIMENT',
        textAreaId: event.target.getAttribute(CUSTOM_ATTR),
        text: event.target.value,
    });
};

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
    console.log('Received reponse', message);
    if (message && message.action && message.textAreaId && message.prediction) {
        if (message.action == 'TEXT_SENTIMENT_CLASSIFIED') {
            const textArea = getTextAreaWithUniqueId(message.textAreaId);
            addSentimentEmojiToTextArea(textArea, message.prediction);
        }
    }
});
