// Tells the main script when an API call is made that would require a refresh.
chrome.webRequest.onBeforeRequest.addListener(refreshResults, {urls: ["https://myplan.uw.edu/course/api/courses"]});

function refreshResults() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {refresh: true});
    });
}