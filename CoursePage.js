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

        const schoolID = uwbPrefixes.indexOf(instructorElement[0].ownerDocument.title.replace(/ \d*\D*$/g, "")) == -1 ? 1530 : 4466;
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