const uwbPrefixes = "B ACCT\0B BUS\0B BECN\0B BSKL\0ELCBUS\0B EDUC\0LEDE\0B ARAB\0B CORE\0B CHIN\0BJAPAN\0BKOREA\0B LEAD\0B MATH\0B SPAN\0B CUSP\0B WRIT\0BISAES\0BISCP\0BCWRIT\0BCULST\0BISCLA\0BEARTH\0BES\0BISGWS\0BISGST\0BISIA\0BISSTS\0BIS\0BISSKL\0BISLEP\0BISMCS\0BPOLST\0BISSEB\0B IMD\0B HLTH\0BHS\0B NURS\0STEM\0B BIO\0BCONSC\0CSS\0CSSSKL\0B CE\0B EE\0B ENGR\0B ME\0STMATH\0B IMD\0B CHEM\0B CLIM\0B PHYS\0BST";

function onFindCoursesPageFound() {
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

    $("<span class='instructor-number-of-reviews' title='Number of Reviews'>#</span>").insertAfter(genEdHeading);
    $("<span class='instructor-level-of-difficulty' title='Level of Difficulty'>LoD</span>").insertAfter(genEdHeading);
    $("<span class='instructor-overall-quality' title='Overall Quality'>OQ</span>").insertAfter(genEdHeading);
    $("<span class='course-instructor'>Instructor</span>").insertAfter(genEdHeading);
}

// Expects a div.course-data-mobile element to display course details
function insertColumnData() {
    // Get course guid and code for API request
    const courseDiv = $(this);

    // Inserts custom columns
    if (courseDiv.find("span.course-instructor").length === 0) {
        const courseGenEdReqData = courseDiv.find("span.course-genedureqs");
        $("<span class='instructor-number-of-reviews'></span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-level-of-difficulty'></span>").insertAfter(courseGenEdReqData);
        $("<span class='instructor-overall-quality'></span>").insertAfter(courseGenEdReqData);
        $("<span class='course-instructor'></span>").insertAfter(courseGenEdReqData);
    }

    const instructorSpan = courseDiv.find("span.course-instructor");
    const instructorOverallQualitySpan = instructorSpan.siblings("span.instructor-overall-quality");
    const instructorLevelOfDifficultySpan = instructorSpan.siblings("span.instructor-level-of-difficulty");
    const instructorNumberOfReviewsSpan = instructorSpan.siblings("span.instructor-number-of-reviews");
    const courseID = courseDiv.find("span.mobile-title > a").attr("href").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)[0];
    const courseCode = courseDiv.find("span.course-code").text();
    const courseTerm = courseDiv.find("span.course-term").text();

    // Resets results
    $(instructorSpan).empty();
    $(instructorOverallQualitySpan).empty();
    $(instructorLevelOfDifficultySpan).empty();
    $(instructorNumberOfReviewsSpan).empty();
    $(instructorSpan).addClass("loader spinner-small instructor-loading");

    // Get course details from UW API
    const uwCourseAPI = "https://myplan.uw.edu/course/api/courses/" + courseCode + "/details?courseId=" + courseID;
    const request = $.ajax(uwCourseAPI);
    ajaxRequests.push(request);

    request.done(function(response) {
        let instructors = {};

        // Course Catalog search isn't officially supported.
        if (response.courseOfferingInstitutionList.length === 0)
            $(instructorSpan).removeClass("loader spinner-small instructor-loading");

        const offeredCourses = response.courseOfferingInstitutionList[0].courseOfferingTermList;

        // Finds the instructor names in the UW API response
        offeredCourses.forEach(function(course) {
            course.activityOfferingItemList.forEach(function(section) {
                // Handles summer A and B terms
                const summerTerm = (section.summerTerm === null || section.summerTerm === "Full-term") ? " " : " " + section.summerTerm.slice(0, 1) + " ";

                // Don't show duplicate instructors, quiz sections, or instructors that aren't a part of the same term.
                if (section.activityOfferingType === "quiz"
                    || instructors.hasOwnProperty(section.instructor) > 0
                    || courseTerm !== section.qtryr.slice(0, 2) + summerTerm + section.qtryr.slice(-2))
                    return;

                instructors[section.instructor] = {};
            });
        });

        // Handles case where there aren't any instructors.
        if (Object.keys(instructors).length === 0)
            $(instructorSpan).removeClass("loader spinner-small instructor-loading");


        // Make ajax requests to Rate My Professor for each instructor found in the UW API response
        Object.keys(instructors).forEach(function(instructor) {

            $(instructorSpan).removeClass("loader spinner-small instructor-loading");

            if (instructor === "--")
                return;

            // Only uses the first and last name of the instructor in the rate my professor request. Also only searches the UW Seattle campus
            const instructorNameArray = instructor.split(" ");
            const instructorFirstName = instructorNameArray[0].substring(0, 6); // Only uses first 6 letters of the first name to increase hits.
            const instructorLastName = instructorNameArray[instructorNameArray.length - 1];

            const schoolID = !uwbPrefixes.includes(courseCode.replace(/ \d*$/g, "")) ? 1530 : 4466;
            const rateMyProfessorAPI = "https://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=1&q=" + instructorFirstName + " " + instructorLastName + "+AND+schoolid_s%3A" + schoolID + "&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=1&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s+averageeasyscore_rf&fq";

            const request = $.ajax(rateMyProfessorAPI);
            ajaxRequests.push(request);

            request.done(function(response) {
                response = JSON.parse(response).response.docs[0];

                // Only display scores if last name matches exactly.
                if (response === undefined || response.teacherlastname_t.toLowerCase() !== instructorLastName.toLowerCase()) {
                    instructors[instructor].overallQuality = "-";
                    instructors[instructor].levelOfDifficulty = "-";
                    instructors[instructor].numberOfReviews = "-";
                    $(instructorSpan).append("<div class='instructor-name'>" + instructor + "</div>");
                } else {
                    // Rounds the overall and level of difficulty to one decimal place.
                    instructors[instructor].overallQuality = Math.round(response.averageratingscore_rf * 10) / 10;
                    instructors[instructor].levelOfDifficulty = Math.round(response.averageeasyscore_rf * 10) / 10;
                    instructors[instructor].numberOfReviews = response.total_number_of_ratings_i;
                    $(instructorSpan).append("<div class='instructor-name'><a href='http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" +  response.pk_id + "' target='_blank'>" + instructor + "</a></div>");
                }

                // Handles cases where there aren't any reviews yet for the professor.
                if (instructors[instructor].overallQuality === 0 || isNaN(instructors[instructor].overallQuality))
                    instructors[instructor].overallQuality = "-";

                if (instructors[instructor].levelOfDifficulty === 0 || isNaN(instructors[instructor].levelOfDifficulty))
                    instructors[instructor].levelOfDifficulty = "-";

                let overallQualityColorClass = "";
                let levelOfDifficultyColorClass = "";

                // Adds color for Overall Quality. RMP is on scale from 1-5
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

                // Adds color for Level of Difficulty. RMP is on scale from 1-5
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

                // Inserts instructor data.
                $(instructorSpan).removeClass("loader spinner-small instructor-loading");
                $(instructorOverallQualitySpan).append("<div class='instructor-oq " + overallQualityColorClass + "' title='Overall Quality: " + instructors[instructor].overallQuality + "'>" + instructors[instructor].overallQuality + "</div>");
                $(instructorLevelOfDifficultySpan).append("<div class='instructor-lod " + levelOfDifficultyColorClass + "' title='Level of Difficulty: " + instructors[instructor].levelOfDifficulty + "'>" + instructors[instructor].levelOfDifficulty + "</div>");
                $(instructorNumberOfReviewsSpan).append("<div class='instructor-nor' title='Number of Reviews: " + instructors[instructor].numberOfReviews + "'>" + instructors[instructor].numberOfReviews + "</div>");
            });
        });
    });
}