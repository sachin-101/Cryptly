const CUSTOM_ATTR = 'unique_id';
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
    let resultEmojiDiv;
    if (!(originalParent.id == 'cryptly_textArea_container')) {
        console.log("here");
        const container = document.createElement('div');
        container.id = 'cryptly_textArea_container'; // to avoid creating container again and again
        container.style.position = 'relative';
        let add6Pixels = (size) => String(Number(size.replace('px', '')) + 6) + 'px'; // handy function
        container.style.width = add6Pixels(textArea.style.width);
        container.style.height = add6Pixels(textArea.style.height);
        
        // create a new emoji div
        let emojiDiv = document.createElement('div');
        emojiDiv.id = `cryptly_emoji_container_${textArea.getAttribute(CUSTOM_ATTR)}`;
        emojiDiv.setAttribute(CUSTOM_ATTR, textArea.getAttribute(CUSTOM_ATTR));
        emojiDiv.style.position = 'absolute';
        emojiDiv.style.right = '4px';
        emojiDiv.style.bottom = '4px';
        
        // Create result_emoji div
        resultEmojiDiv = document.createElement('div');
        resultEmojiDiv.setAttribute(CUSTOM_ATTR, textArea.getAttribute(CUSTOM_ATTR));
        resultEmojiDiv.id = `result_emoji_${textArea.getAttribute(CUSTOM_ATTR)}`;
        resultEmojiDiv.style.fontSize = '30px';

        // Create emoji change div
        let changeEmojiDiv = document.createElement('div');
        changeEmojiDiv.id = `emoji_change_container_${textArea.getAttribute(CUSTOM_ATTR)}`;
        changeEmojiDiv.style.position = 'absolute';
        changeEmojiDiv.style.bottom = '40px';
        changeEmojiDiv.style.right = '10px';
        changeEmojiDiv.style.display = 'none';

        // Add table to changeEmojiDiv
        changeEmojiDiv.innerHTML = `
            <table id='panel_${textArea.getAttribute(CUSTOM_ATTR)}' class='panel'>
                <caption>Correct our prediction</caption>
                <tr id='HAPPY'>
                    <td id='emoji'>😄</td>
                    <td>HAPPY</td>
                    <!-- <td>70%</td> -->
                </tr>
                <tr id='SAD'>
                    <td id='emoji'>😔</td>
                    <td>SAD</td>
                    <!-- <td>30%</td> -->
                </tr>
                <tr id='NEUTRAL'>
                    <td id='emoji'>😶</td>
                    <td>NEUTRAL</td>
                    <!-- <td>0%</td> -->
                </tr>
            </table>
        `

        // done emoji button
        let changeEmojiButton = document.createElement('button');
        changeEmojiButton.setAttribute(CUSTOM_ATTR, textArea.getAttribute(CUSTOM_ATTR));
        changeEmojiButton.id = 'btn_change_emoji';
        changeEmojiButton.innerText = 'Done';

        /* Add the necessary callback functions */
        // Display change emoji panel upon clicking the emoji
        resultEmojiDiv.onclick = e => {
            console.log(e.target);
            console.log(`cryptly_emoji_container_${e.target.getAttribute(CUSTOM_ATTR)}`);
            let changeEmojiContainer = document.getElementById(`emoji_change_container_${e.target.getAttribute(CUSTOM_ATTR)}`);
            if (changeEmojiContainer.style.display === 'none') {
                changeEmojiContainer.style.display = 'block';
                changeEmojiContainer.style.zIndex = 1;
            }
            console.log("hello change Emoji Container");
        };

        changeEmojiButton.onclick = e => {
            let changeEmojiContainer = document.getElementById(`emoji_change_container_${e.target.getAttribute(CUSTOM_ATTR)}`);
            console.log(changeEmojiContainer);
            changeEmojiContainer.style.display = 'none';
            changeEmojiContainer.style.zIndex = -1;
            console.log("bye conaitner")
        };

        /* Add the above created elements in the proper order */
        changeEmojiDiv.appendChild(changeEmojiButton);

        emojiDiv.appendChild(changeEmojiDiv);
        emojiDiv.appendChild(resultEmojiDiv);

        // Add the containerNode as a peer to the textArea, right next to the textArea.
        originalParent.insertBefore(container, textArea);
        
        // Move the textArea to inside the container;
        container.appendChild(textArea);
        
        // Add the emoji Div right after the textArea;
        container.appendChild(emojiDiv);

        // Add the style sheet designing the panel
        let style = document.createElement('style');
        style.innerText = `
            #cryptly_emoji_container {
                border: 1px solid darkgray;
                max-width: 300px;
                padding: 5px;
                /* display: flex; */
                /* background-color: lightgray; */
            }
            
            .panel {
                border-collapse: collapse;
            }
            .panel, tr, td{ 
                width: 100%; 
                padding: 5px;
                width: 100%;
                font-size: large;
                text-align: center;
            }
            .panel caption {
                white-space: nowrap;
                padding: 5px;
            }
            .panel tr:hover {
                background-color: #b1afaf;
            }

            #btn_change_emoji {
                margin: 5px;
                width: auto;
            }
        `
        document.getElementsByTagName("head")[0].appendChild(style);

        // Add necessary scripts
        emotion_to_emoji = {
            'HAPPY': '😄',
            'SAD': '😔',
            'NEUTRAL': '😶'
        }

        let panel = document.getElementById(`panel_${textArea.getAttribute(CUSTOM_ATTR)}`);
        let rows = panel.getElementsByTagName('tr');
        for (let row of rows) {
            row.addEventListener('click', event => {
                document.getElementById(`result_emoji_${textArea.getAttribute(CUSTOM_ATTR)}`).innerHTML = 
                        `${emotion_to_emoji[event.target.parentNode.id]} ${event.target.parentNode.id}`;
            });
        }


    } else {
        // Use previously created div.
        resultEmojiDiv = document.getElementById(`result_emoji_${textArea.getAttribute(CUSTOM_ATTR)}`);
    }
    
    console.log(sentiment);
    if (sentiment === 'POSITIVE') {
        resultEmojiDiv.textContent = `😄 HAPPY`;
    } else if (sentiment === 'NEGATIVE') {
        resultEmojiDiv.textContent = `😔 SAD`;
    } else {
        resultEmojiDiv.textContent = `😶 NEUTRAL`;
    }

    // return focus back to text area, to continue typing
    textArea.focus();
};

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
            addSentimentEmojiToTextArea(textArea, message.prediction);
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
