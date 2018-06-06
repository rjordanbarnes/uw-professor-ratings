let waitingForFindCoursesPage = false;
let waitingForCoursePage = false;
let ajaxRequests = [];

enableClickHandlers();

// Listens for background script to request a refresh.
chrome.runtime.onMessage.addListener( function(request) {
    if (request.refreshFindCoursesPage) {
        cancelAllAPIRequests();
        waitForFindCourses();
    } else if (request.refreshCoursePage) {
        cancelAllAPIRequests();
        waitForCourse();
    }
});

// Calls main logic once the Courses table is visible on Find Courses page
function waitForFindCourses() {
    if (waitingForFindCoursesPage)
        return;

    waitingForFindCoursesPage = true;
    const watch = setInterval(function() {
        if ($("div.search-heading").length && $(".Loader__background").length < 1) {
            clearInterval(watch);
            waitingForFindCoursesPage = false;
            onFindCoursesPageFound();
        }
    }, 200);
}

// Inserts RMP links once the Course information is visible on the Course page
function waitForCourse() {
    if (waitingForCoursePage)
        return;

    waitingForCoursePage = true;

    const watch = setInterval(function() {
        if ($("div#course-institutions").length) {
            clearInterval(watch);
            waitingForCoursePage = false;
            onCoursePageFound();
        }
    }, 200);
}

// Clear current ajax requests.
function cancelAllAPIRequests() {
    ajaxRequests.forEach(function(request) {
        request.abort();
    });
}

// Clicking certain page elements should refresh and/or cancel API requests, for example Filters.
// Needed because changing filters doesn't cause a network request but does update the list of courses.
function enableClickHandlers() {
    const elementsToWaitForFindCourses = ["div.checkbox", "button.btn"];

    elementsToWaitForFindCourses.forEach(function(element) {
        $("body").on("click", element, function() {
            cancelAllAPIRequests();
            waitForFindCourses();
        });
    });
}