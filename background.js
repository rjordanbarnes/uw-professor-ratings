// Tells the main script when an API call is made that would require a refresh.
chrome.webRequest.onBeforeRequest.addListener(refreshFindCoursesPage, {urls: ["https://myplan.uw.edu/course/api/courses"]});
chrome.webRequest.onBeforeRequest.addListener(refreshCoursePage, {urls: ["https://myplan.uw.edu/course/api/courses/*/messages"]});

function refreshFindCoursesPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {refreshFindCoursesPage: true});
    });
}
function refreshCoursePage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {refreshCoursePage: true});
    });
}