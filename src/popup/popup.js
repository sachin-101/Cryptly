
/**
 * Set the ui of the toggle accordingly
 */
chrome.storage.sync.get(["urls"], data => {
    let blocked_urls = data.urls;
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
    chrome.storage.sync.get(["urls"], data => {
        let blocked_urls = data.urls;
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
            chrome.storage.sync.set({blocked_urls});
        })
    })
}
