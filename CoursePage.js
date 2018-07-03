const uwbPrefixes = "B ACCT\0B BUS\0B BECN\0B BSKL\0ELCBUS\0B EDUC\0LEDE\0B ARAB\0B CORE\0B CHIN\0BJAPAN\0BKOREA\0B LEAD\0B MATH\0B SPAN\0B CUSP\0B WRIT\0BISAES\0BISCP\0BCWRIT\0BCULST\0BISCLA\0BEARTH\0BES\0BISGWS\0BISGST\0BISIA\0BISSTS\0BIS\0BISSKL\0BISLEP\0BISMCS\0BPOLST\0BISSEB\0B IMD\0B HLTH\0BHS\0B NURS\0STEM\0B BIO\0BCONSC\0CSS\0CSSSKL\0B CE\0B EE\0B ENGR\0B ME\0STMATH\0B IMD\0B CHEM\0B CLIM\0B PHYS\0BST";

function onCoursePageFound() {

    $(".course-section-instructor").each(function() {
        let instructorElement = $(this);

        // Only uses the first and last name of the instructor in the rate my professor request.
        const instructorFullName = instructorElement.text().replace("View syllabus", "");
        const instructorNameArray = instructorFullName.split(" ");
        const instructorFirstName = instructorNameArray[0].substring(0, 6); // Only uses first 6 letters of the first name to increase hits.
        const instructorLastName = instructorNameArray[instructorNameArray.length - 1];

        if (instructorFirstName.includes("--"))
            return;

        const schoolID = !uwbPrefixes.includes(instructorElement[0].ownerDocument.title.replace(/ \d*\D*$/g, "")) ? 1530 : 4466;
        const rateMyProfessorAPI = "https://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=1&q=" + instructorFirstName + " " + instructorLastName + "+AND+schoolid_s%3A" + schoolID + "&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=1&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s+averageeasyscore_rf&fq";
        const professorURL = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid=';
        const request = $.ajax(rateMyProfessorAPI);

        request.done(function(response) {
            response = JSON.parse(response).response.docs[0];

            if (response !== undefined && response.teacherlastname_t.toLowerCase() === instructorLastName.toLowerCase()) {

                let elementToReplace = $(instructorElement).children("div");

                // Works around optional View Syllabus div
                if (elementToReplace.text().includes("View syllabus")) {
                    elementToReplace = $(elementToReplace).children("div");
                }

                $(elementToReplace[0]).html("<a href='" + professorURL + response.pk_id + "' target='_blank'>" + instructorFullName + "</a>")
            }
        });
    });
}