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
    $("div.results-heading span.course-term").text("Qtr");
    $("div.results-heading span.course-credit").text("Cred");

    const genEdHeading = $("div.results-heading span.course-genedureqs");

    $("<span class='instructor-number-of-reviews'>#</span>").insertAfter(genEdHeading);
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
        $("<span class='instructor-number-of-reviews'>-</span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-level-of-difficulty'>-</span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-overall-quality'>-</span>").insertAfter(courseGenEdReqData);
        $("<span class='course-instructor'>Loading...</span>").insertAfter(courseGenEdReqData);
    }

    const instructorSpan = courseDiv.find("span.course-instructor");
    const instructorOverallQualitySpan = instructorSpan.siblings("span.instructor-overall-quality");
    const instructorLevelOfDifficultySpan = instructorSpan.siblings("span.instructor-level-of-difficulty");
    const instructorNumberOfReviewsSpan = instructorSpan.siblings("span.instructor-number-of-reviews");
    const courseID = courseDiv.find("span.mobile-title > a").attr("href").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)[0];
    const courseCode = courseDiv.find("span.course-code").text();
    const courseTerm = courseDiv.find("span.course-term").text();

    $(instructorSpan).empty();
    $(instructorOverallQualitySpan).empty();
    $(instructorLevelOfDifficultySpan).empty();
    $(instructorNumberOfReviewsSpan).empty();
    $(instructorSpan).text("Loading...");

    // Get course details from API
    const uwCourseAPI = "https://myplan.uw.edu/course/api/courses/" + courseCode + "/details?courseId=" + courseID;
    const request = $.ajax(uwCourseAPI);
    ajaxRequests.push(request);

    request.done(function(response) {
        let instructors = {};

        const offeredCourses = response.courseOfferingInstitutionList[0].courseOfferingTermList;

        offeredCourses.forEach(function(course) {
            course.activityOfferingItemList.forEach(function(section) {
                const summerTerm = (section.summerTerm === null || section.summerTerm === "Full-term") ? " " : " " + section.summerTerm.slice(0, 1) + " ";

                // Don't show duplicate instructors, quiz sections, or instructors that aren't a part of the same term.
                if (section.activityOfferingType === "quiz"
                    || instructors.hasOwnProperty(section.instructor) > 0
                    || courseTerm !== section.qtryr.slice(0, 2) + summerTerm + section.qtryr.slice(-2))
                    return;

                instructors[section.instructor] = {};
            });
        });

        $(instructorSpan).empty();
        $(instructorOverallQualitySpan).empty();
        $(instructorLevelOfDifficultySpan).empty();
        $(instructorNumberOfReviewsSpan).empty();

        // Make ajax requests to Rate My Professor
        Object.keys(instructors).forEach(function(instructor) {

            if (instructor === "--") {
                $(instructorSpan).append("<div class='instructor-name'>" + instructor + "</div>");
                $(instructorOverallQualitySpan).append("<div class='instructor-oq'>-</div>");
                $(instructorLevelOfDifficultySpan).append("<div class='instructor-lod'>-</div>");
                $(instructorNumberOfReviewsSpan).append("<div class='instructor-nor'>-</div>");
                return;
            }

            // Only uses the first and last name of the instructor in the rate my professor request.
            const instructorNameArray = instructor.split(" ");
            const instructorFirstName = instructorNameArray[0].substring(0, 6); // Only uses first 6 letters of the first name to increase hits.
            const instructorLastName = instructorNameArray[instructorNameArray.length - 1];
            const rateMyProfessorAPI = "https://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=1&q=" + instructorFirstName + " " + instructorLastName + "+AND+schoolid_s%3A1530&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=1&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s+averageeasyscore_rf&fq";

            const request = $.ajax(rateMyProfessorAPI);
            ajaxRequests.push(request);

            request.done(function(response) {
                response = JSON.parse(response).response;

                // Only display scores if last name matches exactly.
                if (response.docs.length < 1 || response.docs[0].teacherlastname_t.toLowerCase() !== instructorLastName.toLowerCase()) {
                    instructors[instructor].overallQuality = "-";
                    instructors[instructor].levelOfDifficulty = "-";
                    instructors[instructor].numberOfReviews = "-";
                    $(instructorSpan).append("<div class='instructor-name'>" + instructor + "</div>");
                } else {
                    // Rounds the overall and level of difficulty to one decimal place.
                    instructors[instructor].overallQuality = Math.round(response.docs[0].averageratingscore_rf * 10) / 10;
                    instructors[instructor].levelOfDifficulty = Math.round(response.docs[0].averageeasyscore_rf * 10) / 10;
                    instructors[instructor].numberOfReviews = response.docs[0].total_number_of_ratings_i;
                    $(instructorSpan).append("<div class='instructor-name'><a href='http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" +  response.docs[0].pk_id + "' target='_blank'>" + instructor + "</a></div>");
                }

                if (instructors[instructor].overallQuality === 0 || isNaN(instructors[instructor].overallQuality))
                    instructors[instructor].overallQuality = "-";

                if (instructors[instructor].levelOfDifficulty === 0 || isNaN(instructors[instructor].levelOfDifficulty))
                    instructors[instructor].levelOfDifficulty = "-";

                let overallQualityColorClass = "";
                let levelOfDifficultyColorClass = "";

                // Adds color. RMF is on scale from 1-5
                if (!isNaN(instructors[instructor].overallQuality)) {
                    if (instructors[instructor].overallQuality >= 4) {
                        overallQualityColorClass = "rmp-best";
                    } else if (instructors[instructor].overallQuality >= 3) {
                        overallQualityColorClass = "rmp-great";
                    } else if (instructors[instructor].overallQuality >= 2) {
                        overallQualityColorClass = "rmp-okay";
                    } else {
                        overallQualityColorClass = "rmp-bad";
                    }
                }

                if (!isNaN(instructors[instructor].levelOfDifficulty)) {
                    if (instructors[instructor].levelOfDifficulty >= 4) {
                        levelOfDifficultyColorClass = "rmp-bad";
                    } else if (instructors[instructor].levelOfDifficulty >= 3) {
                        levelOfDifficultyColorClass = "rmp-okay";
                    } else if (instructors[instructor].levelOfDifficulty >= 2) {
                        levelOfDifficultyColorClass = "rmp-great";
                    } else {
                        levelOfDifficultyColorClass = "rmp-best";
                    }
                }

                $(instructorOverallQualitySpan).append("<div class='instructor-oq " + overallQualityColorClass + "'>" + instructors[instructor].overallQuality + "</div>");
                $(instructorLevelOfDifficultySpan).append("<div class='instructor-lod " + levelOfDifficultyColorClass + "'>" + instructors[instructor].levelOfDifficulty + "</div>");
                $(instructorNumberOfReviewsSpan).append("<div class='instructor-nor'>" + instructors[instructor].numberOfReviews + "</div>");
            });
        });
    });
}