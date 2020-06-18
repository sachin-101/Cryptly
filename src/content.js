const DELAY = 1000; // One second
const URL = window.location.href;
const permissions = {
    USE_CRYPTLY: true
}


/**
 * Attaches oninput listener to textarea
 * @param event
 */
let i = 0; // unique id for the textareas
const insertListener = (target) => {    
    if (target.getAttribute(CUSTOM_ATTR) === null) {
        target.setAttribute(CUSTOM_ATTR, i);
        i++;
    }
    target.removeEventListener('input', debounceOnTextChange);
    target.addEventListener('input', debounceOnTextChange);
};


/**
 * Called when an animation set for textarea begins, thereby binding that new element
 * with an event listener
 * @param {*} event 
 */
const animationStartListenser = event => {
    if (event.animationName === "nodeInserted") {
        insertListener(event.target);
    }
}


/**
 * Attaches animation event listeners to the body, which will eventually help tracking new textarea nodes
 */
const addAnimationEventListeners = () => {
    document.removeEventListener('animationstart', animationStartListenser); // removes listener first to avoid multiple listeners
    document.addEventListener('animationstart', animationStartListenser); // adds listener for new or existing textarea elements
}


/**
 * checks if url is in blocked urls, if not then attach event listeners
 */
chrome.storage.sync.get(['blocked_urls'], data => {
    let blocked_urls = data.blocked_urls;
    if (blocked_urls.indexOf(URL) !== -1) permissions.USE_CRYPTLY = false;
    if (permissions.USE_CRYPTLY) {
        document.querySelectorAll(`textarea`).forEach(el => insertListener(el));
        addAnimationEventListeners();   // for the text areas added on fly
    }
});    

/**
 * Returns a DOM textArea element pointing to the textArea having "unique_id"
 * as the provided id.
 * @param {string} unique_id which id to search for
 * @returns {HTMLElement} textArea element having the required "unique_id" attribute
 */
const getTextAreaWithUniqueId = (unique_id) => document.querySelector(`textarea[${CUSTOM_ATTR}="${unique_id}"]`);



/**
 * Wraps a function to perform debouncing.
 * @param {function} func to be debounced 
 */
var debounceFunction = (func, delay) => {
    let inDebounce; // helps to cancel the setTimeOut()
    return function() {
        const context = this;   // global object
        const args = arguments; // List of arguments passed to pass to func
        clearTimeout(inDebounce);   // cancel the setTimeOut() function
        inDebounce = setTimeout(() => func.apply(context, args), delay);
    };
};

/**
 * Called when change in text in a Text Area occurs.
 * Passes the text to the background script for analyzing
 * the text, along with a message for type of analyziation required.
 * @param {event} event
 */
const onTextChange = (event) => {
    chrome.runtime.sendMessage({
        action: 'TEXT_SENTIMENT',
        textAreaId: event.target.getAttribute(CUSTOM_ATTR),
        text: event.target.value,
    });
};

// Define a debounced onTextChange function
var debounceOnTextChange = debounceFunction(onTextChange, DELAY);

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
            displaySentiment(textArea, message.prediction, message.textAreaId);
            textArea.focus();   // return focus back to text area, to continue typing
        }
    }
});


/**
 * Listens to changes in allowed urls. Accordingly removes or adds event listeners
 */
chrome.storage.onChanged.addListener((changes, _) => {
    if (!("blocked_urls" in changes)) return;
    if (changes.blocked_urls.newValue.indexOf(URL) !== -1 && permissions.USE_CRYPTLY) {
        
        console.log("Cryptly paused on this site.");
        permissions.USE_CRYPTLY = false;
        // remove listeners
        document.querySelectorAll(`*[${CUSTOM_ATTR}]`).forEach(el => {
            el.removeEventListener('input', debounceOnTextChange)
        });
        document.removeEventListener('animationstart', animationStartListenser);
    } else if (changes.blocked_urls.newValue.indexOf(URL) === -1 && !permissions.USE_CRYPTLY) {
        
        console.log("Cryptly started on this site.");
        permissions.USE_CRYPTLY = true;
        // Add listeners
        addAnimationEventListeners();
        document.querySelectorAll(`textarea`).forEach(el => {
            insertListener(el);
        });
    }
})


// **********************************************************
/**
 * Overlays the sentiment emoji on bottom right of the Text Area element.
 *
 * Converts:
 * <textarea style="width: 400px; height: 200px;"></textarea>
 *
 * To:
 * <div style='width: 406px; height: 206px; position: relative;'>
        <textarea style='width: 400px; height: 200px; position: absolute;'></textarea>
        <div style='right: 8px; bottom: 8px; position: absolute;'>
            <div id='result_emoji' onclick="displayPopup()">😄</div>
            <div class='popup_container' style='position: absolute; bottom: 40px; right: 10px; display: none;'>
                <table class='popup'>
                    <caption>Correct our prediction</caption>
                    <tr id='happy'>
                        <td id='emoji'>😄</td>
                        <td>Happy</td>
                        <td>70%</td>
                    </tr>
                    <tr id='sad'>
                        <td id='emoji'>😔</td>
                        <td>Sed</td>
                        <td>30%</td>
                    </tr>
                    <tr id='neutral'>
                        <td id='emoji'>😶</td>
                        <td>???</td>
                        <td>0%</td>
                    </tr>
                </table>
                <button id='btn_save_change' onclick="hidePopup()">Done</button>
            </div>
        </div>
    </div>
 */

const CUSTOM_ATTR = 'unique_id'; 

const TEXTAREA_CONTAINER_NAME    = 'cryptlyTextAreaContainer';
const EMOJI_CONTAINER_NAME       = 'cryptlyEmojiContainer';
const PRED_EMOJI_NAME            = 'cryptlyPredEmoji';
const EMOJI_PANEL_NAME           = 'cryptlyEmojiPanel';
const EMOJI_PANEL_TABLE_NAME     = 'cryptlyEmojiPanelTable';
const EMOJI_PANEL_TABLE_ROW_NAME = 'crptlyEmojiPanelTableRow';
const SAVE_EMOJI_BUTTON_NAME     = 'cryptlySaveEmoji';

const add6Pixels = (size) => String(Number(size.replace('px', '')) + 6) + 'px'; // handy function

pred_to_emoji = {
    'POSITIVE': '😄',
    'NEGATIVE': '😔'
}

pred_to_emotion = {
    'POSITIVE': 'HAPPY',
    'NEGATIVE': 'SAD'
}

const showPanel = e => {
    let emojiPanel = document.getElementById(`${EMOJI_PANEL_NAME}_${e.target.getAttribute(CUSTOM_ATTR)}`);
    if (emojiPanel.style.display === 'none') {
        emojiPanel.style.display = 'block';
        emojiPanel.style.zIndex = 1;
    }
}

const hidePanel = e => {
    let emojiPanel = document.getElementById(`${EMOJI_PANEL_NAME}_${e.target.getAttribute(CUSTOM_ATTR)}`);
    emojiPanel.style.display = 'none';
    emojiPanel.style.zIndex = -1;
}

/** @todo: Remove emotion_to_emoji, and rather use a custom attribute of row. */
const changeEmoji = e => {
    let pred = e.target.parentNode.getAttribute('sentiment');    
    let predEmoji = document.getElementById(`${PRED_EMOJI_NAME}_${e.target.parentNode.getAttribute(CUSTOM_ATTR)}`);
    predEmoji.innerHTML = `${pred_to_emoji[pred]} ${pred_to_emotion[pred]}`;
}

const createElement = (tagName, elementName, uniqueId) => {
    let element = document.createElement(tagName);
    element.id = `${elementName}_${uniqueId}`;
    element.className = elementName;
    element.setAttribute(CUSTOM_ATTR, uniqueId);
    return element;
}

/**
 * 
 * @param {DOMElement} textArea 
 * @param {Array} sentiments 
 * @param {number} textAreaId 
 */
const displaySentiment = (textArea, predictions, textAreaId) => {
    
    textArea.style.position = 'absolute';
    const uniqueId = textAreaId;

    const originalParent = textArea.parentElement;
    
    let predEmoji, emojiPanelTable;

    if (!(originalParent.id == TEXTAREA_CONTAINER_NAME)) {
        
        console.log('Wrapping textArea in Cryptly container.');
        
        const tAreaContainer = document.createElement('div');
        tAreaContainer.id = TEXTAREA_CONTAINER_NAME; // to avoid creating container again and again
        tAreaContainer.style.position = 'relative';
        tAreaContainer.style.width = add6Pixels(textArea.style.width);
        tAreaContainer.style.height = add6Pixels(textArea.style.height);
        
        let emojiContainer = createElement('div', EMOJI_CONTAINER_NAME, uniqueId);  // To hold emoji and panel
        predEmoji = createElement('div', PRED_EMOJI_NAME, uniqueId);    // To display predicted emoji
        let emojiPanel = createElement('div', EMOJI_PANEL_NAME, uniqueId);  // Emoji display panel
        emojiPanelTable = document.createElement('table', EMOJI_PANEL_TABLE_NAME, uniqueId);    // Create emoji table to add to panel
        emojiPanelTable.className = EMOJI_PANEL_TABLE_NAME;
        emojiPanelTable.innerHTML = '<caption>Correct our prediction</caption>';    // Add caption
        // Certain inline parameters which needs to be modified later
        emojiPanel.style.display = 'none';

        // Add rows to emoji panel table
        let i = 0;
        for (let pred in predictions) {
            let tableRow = document.createElement('tr');
            tableRow.id = `${EMOJI_PANEL_TABLE_ROW_NAME}_${uniqueId}_${pred}`;
            tableRow.className = EMOJI_PANEL_TABLE_ROW_NAME;
            tableRow.setAttribute(CUSTOM_ATTR, uniqueId);
            tableRow.setAttribute('sentiment', pred);
            tableRow.innerHTML = `<td>${pred_to_emoji[pred]}</td><td>${pred_to_emotion[pred]}</td><td>${predictions[pred].toPrecision(2)}</td>`
            tableRow.onclick = changeEmoji;     // add callback function
            emojiPanelTable.appendChild(tableRow);
            i++;
        }

        // Create Save emoji button to add to panel
        let saveEmoji = createElement('button', SAVE_EMOJI_BUTTON_NAME, uniqueId);
        saveEmoji.innerText = 'Save';

        /* @TODO: Move it to another file.
        Add styles sheet to style the above added elements 
        */
        let style = document.createElement('style');
        style.innerHTML = 
        `   .${PRED_EMOJI_NAME} {
                font-size: 30px;
            }

            .${EMOJI_CONTAINER_NAME} {
                position: absolute;
                right: 4px;
                bottom: 4px;   
            }

            .${EMOJI_PANEL_NAME} {
                border: 1px solid darkgray;
                max-width: 300px;
                padding: 5px;

                /* Set position of panel w.r.t to textArea */
                position: absolute;
                bottom: 40px;
                right: 10px;
            }

            .${EMOJI_PANEL_TABLE_NAME} {
                border-collapse: collapse;
            }
            .${EMOJI_PANEL_TABLE_NAME}, tr, td{ 
                width: 100%; 
                padding: 5px;
                width: 100%;
                font-size: x-large;
                text-align: center;
            }

            .${EMOJI_PANEL_TABLE_NAME} caption {
                white-space: nowrap;
                padding: 5px;
            }

            .${EMOJI_PANEL_TABLE_NAME} tr:hover {
                background-color: #b1afaf;
            }

            .${SAVE_EMOJI_BUTTON_NAME} {
                font-size: x-large;
                margin: 5px;
                width: auto;
            }
        `
        document.getElementsByTagName('head')[0].appendChild(style);
        
        /* Attach event listeners */
        predEmoji.onclick = showPanel;  // show panel upon clicking predicted emoji
        saveEmoji.onclick = hidePanel;  // hide panel upon clicking save emoji button

        /* Attach the above created elements to their parents */
        emojiPanel.appendChild(emojiPanelTable);
        emojiPanel.appendChild(saveEmoji);
        emojiContainer.appendChild(predEmoji);
        emojiContainer.appendChild(emojiPanel);
        originalParent.insertBefore(tAreaContainer, textArea);  // Add cryptly container as a peer to the textArea
        tAreaContainer.appendChild(textArea);   // Move the textArea to inside the container
        tAreaContainer.appendChild(emojiContainer); // Add the emoji Container right after the textArea

    } else {    // Use previously created div.
        predEmoji = document.getElementById(`${PRED_EMOJI_NAME}_${uniqueId}`);
    }
    
    let maxPred = 0, predSentiment;
    for(let pred in predictions) {
        if (predictions[pred] > maxPred) {
            predSentiment = pred;
        }

        // update the panel table rows with latest predictions
        let row = document.getElementById(`${EMOJI_PANEL_TABLE_ROW_NAME}_${uniqueId}_${pred}`);
        if (row) {
            row.innerHTML = `<td>${pred_to_emoji[pred]}</td><td>${pred_to_emotion[pred]}</td><td>${predictions[pred].toPrecision(2)}</td>`
        }
    }
    predEmoji.textContent = `${pred_to_emoji[predSentiment]} ${pred_to_emotion[predSentiment]}`;
};
