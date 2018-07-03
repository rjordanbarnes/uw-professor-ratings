let waitingForFindCoursesPage = false;
let waitingForCoursePage = false;
let ajaxRequests = [];
let uwbPrefixes = "B ACCT\0B BUS\0B BECN\0B BSKL\0ELCBUS\0B EDUC\0LEDE\0B ARAB\0B CORE\0B CHIN\0BJAPAN\0BKOREA\0B LEAD\0B MATH\0B SPAN\0B CUSP\0B WRIT\0BISAES\0BISCP\0BCWRIT\0BCULST\0BISCLA\0BEARTH\0BES\0BISGWS\0BISGST\0BISIA\0BISSTS\0BIS\0BISSKL\0BISLEP\0BISMCS\0BPOLST\0BISSEB\0B IMD\0B HLTH\0BHS\0B NURS\0STEM\0B BIO\0BCONSC\0CSS\0CSSSKL\0B CE\0B EE\0B ENGR\0B ME\0STMATH\0B IMD\0B CHEM\0B CLIM\0B PHYS\0BST";


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
    const onClickWaitForFindCourses = ["div.checkbox", "button.btn", "ul.pagination > li > a"];
    const onChangeWaitForFindCourses = ["select#search-results-sort"];

    onClickWaitForFindCourses.forEach(function(element) {
        $("body").on("click", element, function() {
            cancelAllAPIRequests();
            waitForFindCourses();
        });
    });

    onChangeWaitForFindCourses.forEach(function(element) {
        $("body").on("change", element, function() {
            cancelAllAPIRequests();
            waitForFindCourses();
        });
    });
}
