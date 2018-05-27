let waitingForCourses = false;
let ajaxRequests = [];

$(document).ready(function() {
    enableClickHandlers();
    waitForCourses();
});

function enableClickHandlers() {
    $("button.btn-primary").unbind("click");
    $("div.checkbox").unbind("click");
    $("button.btn-primary").click(waitForCourses);
    $("div.checkbox").click(waitForCourses);
}

// Calls main logic once the Courses table is visible on Find Courses page
function waitForCourses() {
    if (waitingForCourses)
        return;

    // Clear current ajax requests, otherwise search is unresponsive until they complete.
    for (const i in ajaxRequests) {
        ajaxRequests[i].abort();
    }

    waitingForCourses = true;
    const watch = setInterval(function() {
        if ($("div.search-heading").length && $(".Loader__background").length < 1) {
            clearInterval(watch);
            waitingForCourses = false;
            onCoursesVisible();
        }
    }, 100);
}

function onCoursesVisible() {
    enableClickHandlers();
    applyStyles();

    // Only inserts column headers if necessary.
    if ($(".results-heading .course-instructor").length < 1) {
        insertColumnHeaders();
    }

    $("div.course-data-mobile").each(insertColumnData);


    // Make ajax requests to Rate My Professor

}

// Apply Custom Styles via classes
function applyStyles() {
    const filterColumn = $("div[aria-label='Filter Your Results']").parent();
    const coursesColumn = filterColumn.next();

    filterColumn.removeClass("col-md-3");
    filterColumn.addClass("col-md-2");

    coursesColumn.removeClass("col-md-9");
    coursesColumn.addClass("col-md-10");
}

// Inserts new columns into Courses list
function insertColumnHeaders() {
    const courseTermHeading = $("div.results-heading span.course-term");
    courseTermHeading.text("Qtr");

    const genEdHeading = $("div.results-heading span.course-genedureqs");

    $("<span class='instructor-would-take-again'>WTA</span>").insertAfter(genEdHeading);
    $("<span class='instructor-level-of-difficulty'>LoD</span>").insertAfter(genEdHeading);
    $("<span class='instructor-overall-quality'>OQ</span>").insertAfter(genEdHeading);
    $("<span class='course-instructor'>Instructor</span>").insertAfter(genEdHeading);
}

// Expects a div.course-data-mobile element to display course details
function insertColumnData() {
    // Get course guid and code for API request
    const courseDiv = $(this);

    if (courseDiv.find("span.course-instructor").length === 0) {
        const courseGenEdReqData = courseDiv.find("span.course-genedureqs");
        $("<span class='instructor-would-take-again'>100%</span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-level-of-difficulty'>1.3</span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-overall-quality'>3.9</span>").insertAfter(courseGenEdReqData);
        $("<span class='course-instructor'>Loading...</span>").insertAfter(courseGenEdReqData);
    }

    const instructorSpan = courseDiv.find("span.course-instructor");
    const courseID = courseDiv.find("span.mobile-title > a").attr("href").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)[0];
    const courseCode = courseDiv.find("span.course-code").text();
    const courseTerm = courseDiv.find("span.course-term").text();

    $(instructorSpan).text("Loading...");

    // Get course details from API
    const courseAPI = "https://myplan.uw.edu/course/api/courses/" + courseCode + "/details?courseId=" + courseID;
    const request = $.ajax(courseAPI);
    ajaxRequests.push(request);

    request.done(function(response) {
        $(instructorSpan).empty();

        const offeredCourses = response.courseOfferingInstitutionList[0].courseOfferingTermList;

        for (const courseIndex in offeredCourses) {
            const course = offeredCourses[courseIndex];

            for (const sectionIndex in course.activityOfferingItemList) {
                const section = course.activityOfferingItemList[sectionIndex];

                const summerTerm =(section.summerTerm === null || section.summerTerm === "Full-term") ? " " : " " + section.summerTerm.slice(0, 1) + " ";

                // Don't show duplicate instructors, quiz sections, or instructors that aren't a part of the same term.
                if (section.activityOfferingType === "quiz"
                    || $(instructorSpan).text().includes(section.instructor)
                    || courseTerm !== section.qtryr.slice(0, 2) + summerTerm + section.qtryr.slice(-2))
                    continue;

                // Display instructor
                $(instructorSpan).append("<div class='instructor-name'>" + section.instructor + "</div>");
            }
        }
    });


}