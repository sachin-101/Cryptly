
/**
 * Set the ui of the toggle accordingly
 */
chrome.storage.sync.get(['blocked_urls'], data => {
    let blocked_urls = data.blocked_urls;    
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let url = tabs[0].url;
        document.getElementById('switch_sent').checked = (blocked_urls.indexOf(url) === -1);
    })
})


/**
 * Change urls allowed on toggle
 */
document.getElementById('switch_sent').onchange = e => {
    chrome.storage.sync.get(["blocked_urls"], data => {
        let blocked_urls = data.blocked_urls;
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            let url = tabs[0].url;
            if (blocked_urls.indexOf(url) !== -1 && e.target.checked) {
                blocked_urls.splice(blocked_urls.indexOf(url), 1);
            } else if (blocked_urls.indexOf(url) === -1 && !e.target.checked) {
                blocked_urls.push(url);
            }
            chrome.storage.sync.set({'blocked_urls': blocked_urls});
        })
    })
}

/**
 * Send message to background script to start Federated Learning process
 * upon user request.
 */
document.getElementById('new_model_button').onclick = e => {
    chrome.runtime.sendMessage({
        action: 'START_FL'
    })
}