function loadLog() {
    var lat = localStorage.getItem("lat");
    var lon = localStorage.getItem("lon");
    document.getElementById("lat").innerHTML = "Latitude: " + lat;
    document.getElementById("lon").innerHTML = "Longitude: " + lon;

    var u = new USNG2(); // Creates the National Grid Zone coordinate based on the current lat/lon.
    var ngz = u.fromLonLat({ lon: lon, lat: lat }, 4);
    localStorage.setItem("ngz", ngz);

    document.getElementById("ngz").innerHTML = "NGZ: " + ngz;

    var results = encodeShortest(lat, lon); // Creates a Mapcode.

    var html = '';
    var mapcodePlaceholder = "<option class=\"text-muted\" value=\"\" selected disabled hidden>Select a Mapcode</option>";
    for (var i = 0; i < results.length; i++) { // Creates a list of the generated Mapcodes in a drop down selection.
        html += "\t<option class=\"text-center\" value=\"" + results[i].fullmapcode + "\">" + results[i].fullmapcode + "</option>\n";
    }
    document.getElementById("mapcodes").innerHTML = mapcodePlaceholder + html;
    document.getElementById("mapcodes").value = "";

    html = '';
    var statePlaceholder = "<option class=\"text-muted\" value=\"\" selected disabled hidden>Select a State</option>";
    for (var key in states) { // Creates a list of states in a drop down selection.
        html += "\t<option class=\"text-center\" value=\"" + key + "\">" + key + "</option>\n";
    }
    countyPlaceholder = "<option class=\"text-muted\" value=\"\" selected disabled hidden>Select a County</option>";
    document.getElementById("counties").innerHTML = countyPlaceholder;
    document.getElementById("states").innerHTML = statePlaceholder + html;
    document.getElementById("states").value = "";
}

function loadCounties() { // Creates a list of counties in a drop down selection that is based on the state that is selected.
    var html = '';
    var select = document.getElementById("states");
    var val = select.options[select.selectedIndex].text;

    for (var i = 0; i < states[val].length; i++) {
        html += "\t<option class=\"text-center\" value=\"" + states[val][i] + "\">" + states[val][i] + "</option>\n";
    }
    document.getElementById("counties").innerHTML = countyPlaceholder + html;
}

function getAddress() {
    var street = document.getElementById("street");
    var city = document.getElementById("city");
    var state = document.getElementById("states");
    var zipCode = document.getElementById("zip");
    var county = document.getElementById("counties");
    var comments = document.getElementById("comments");
    var mapcode = document.getElementById("mapcodes");

    var warningStart = "The following fields were left blank:<br><br>";
    var warningEnd = "<br>Submit anyway?";

    var warning = warningStart; // Creates a warning if some or all of the fields were left blank.
    if (street.value == "")
        warning += "Street Address<br>";
    if (city.value == "")
        warning += "City<br>";
    if (zipCode.value == "")
        warning += "Zip Code<br>";
    if (state.value == "")
        warning += "State/Territory<br>";
    if (county.value == "")
        warning += "County<br>";
    if (mapcode.value == "")
        warning += "Mapcode<br>";
    warning += warningEnd;

    if (warning.length > warningStart.length + warningEnd.length) {
        document.getElementById("warning").innerHTML = warning;
        document.getElementById("secretBtn").click();
    } else {
        saveAddress();
    }
}

function saveAddress() { // Saves all the information to local storage.
    var street = document.getElementById("street");
    var city = document.getElementById("city");
    var state = document.getElementById("states");
    var zipCode = document.getElementById("zip");
    var county = document.getElementById("counties");
    var comments = document.getElementById("comments");
    var mapcode = document.getElementById("mapcodes");

    var guid = uuidv1(); // Creates a globally unique identifier as the ID for the address. This is the primary key for the AWS database.
    var date = new Date(); // Creates a time stamp.
    var accuracy = localStorage.getItem("accuracy");
    var timeStamp = date.getFullYear() + "-" + // Creates a more readable time stamp.
        ((parseInt(date.getMonth()) < 9) ? ("0" + (date.getMonth() + 1)) : (date.getMonth() + 1)) + "-" +
        ((parseInt(date.getDate()) < 10) ? ("0" + date.getDate()) : date.getDate()) + " " +
        ((parseInt(date.getUTCHours()) < 10) ? ("0" + date.getUTCHours()) : date.getUTCHours()) + ":" +
        ((parseInt(date.getUTCMinutes()) < 10) ? ("0" + date.getUTCMinutes()) : date.getUTCMinutes()) + " UTC";

    var streetVal = (street.value == "") ? "undefined" : street.value; // Values from the inputs are assigned here.
    var cityVal = (city.value == "") ? "undefined" : city.value; //Inputs that are left empty are automatically given the value "undefined".
    var stateVal = (state.value == "") ? "undefined" : state.value;
    var zipVal = (zip.value == "") ? "undefined" : zip.value;
    var countyVal = (county == null || county.value == "") ? "undefined" : county.value;
    var commentsVal = (comments.value == "") ? "No comments" : comments.value;
    var mapcodeVal = (mapcode.value == "") ? "undefined" : mapcode.value;

    var address = { // Creates an object out of the address information and saves it to local storage.
        GUID: guid, //These objects are used to populate the history page and send addresses to the AWS database.
        Timestamped: timeStamp,
        Street: streetVal,
        City: cityVal,
        Zip: zipVal,
        Territory: stateVal,
        County: countyVal,
        Latitude: localStorage.getItem("lat"),
        Longitude: localStorage.getItem("lon"),
        Mapcode: mapcodeVal,
        NGZ: localStorage.getItem("ngz"),
        Comments: commentsVal,
        Sync: 0 //sync value of zero means the entry has not been uploaded to AWS database yet
    };
    var existingAddresses = JSON.parse(localStorage.getItem("allAddresses"));

    if (existingAddresses == null)
        existingAddresses = [];

    existingAddresses.push(address);
    localStorage.setItem("allAddresses", JSON.stringify(existingAddresses));

    document.getElementById("street").value = ""; // When an address is saved, it clears out all the inputs on the page.
    document.getElementById("city").value = "";
    document.getElementById("states").value = "";
    document.getElementById("zip").value = "";
    document.getElementById("counties").value = "";
    document.getElementById("comments").value = "";
    document.getElementById("mapcodes").value = "";

    document.getElementById("message").innerHTML = "Saved!";
}