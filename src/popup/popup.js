/**
 * Set the ui of the toggle accordingly
 */
chrome.storage.sync.get(["urls"], data => {
    let urls = data.urls;
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let url = tabs[0].url;
        document.getElementById('state').checked = (urls.indexOf(url) !== -1);
    })
})


/**
 * Change urls allowed on toggle
 */
document.getElementById('state').onchange = e => {
    chrome.storage.sync.get(["urls"], data => {
        let urls = data.urls;
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            let url = tabs[0].url;
            if (urls.indexOf(url) === -1 && e.target.checked) {
                urls.push(url);
            } else if (urls.indexOf(url) !== -1 && !e.target.checked) {
                urls.splice(urls.indexOf(url), 1);
            }
            chrome.storage.sync.set({urls});
        })
    })
}