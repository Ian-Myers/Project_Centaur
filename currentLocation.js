var watchID = null; // This variable is global and will be assigned the location method.
var paused = false;

var size = 10; // Size limit for position history.
var posHistory = [];
var historyIndex = 0;

function loadLocation() {
    document.getElementById("load").innerHTML = "<div class=\"loading\"><div id=\"loadingspinner\"></div></div>"; // This populates the loading animation.
    document.getElementById("enableLog").disabled = true; // Disables the button that captures a lat/lon because there is no lat/lon yet.
    getLocation();
}

function getLocation() {
    options = {
        enableHighAccuracy: true, // enabling high accuracy ensures the device uses the GPS chip when there is no data or internet connection.
        timeout: 30000, // If the location method doesn't receive an update after 30 seconds, it stops the function.
        maximumAge: 0 // The location method is getting a new location each time instead of pulling from a cache.
    };
    watchID = navigator.geolocation.watchPosition(showPosition, error, options); // watchPosition returns a new lat/lon every time the gps detects a change in location.
}

function error(error) {
    alert(error.code + " " + error.message);
}

function showPosition(position) {
    lat = Math.round(position.coords.latitude * 1000000) / 1000000; // Rounding lat/lon to six digits after the decimal.
    lon = Math.round(position.coords.longitude * 1000000) / 1000000;
    accuracy = Math.round(position.coords.accuracy * 100) / 100; // Rounding accuracy to two digits after the decimal.

    processLatLon(lat, lon, accuracy);

    var pos = {
        x: lat,
        y: lon,
        a: accuracy,
        z: 0,
        sh: false
    }
    newPos(pos);

    if ($("#map").is(":empty")) { // Checks to see if the map section of the page is empty. If it is, it removes the loading animation and loads the map.
        $("#load").remove("div");
        document.getElementById("pauseButton").disabled = false;
        load_mapstuff(); // Creates the TomTom map. This only loads once when the page is loaded.
        document.getElementById("enableLog").disabled = false; // Enables the button to capture a lat/lon.
    } else {// Moves the thumbtack on the map according to any change in the lat/lon.
		addDot(lat, lon);

		var dotArr = dotGroup.getLayers();
		if (dotArr.length > size) {
			var firstDot = dotArr[0];
			var dotId = dotGroup.getLayerId(firstDot);
			dotGroup.removeLayer(dotId);
		}

		var shapeArr = shapeGroup.getLayers();
		var shapeLength = shapeArr.length;
		if (shapeLength > 1) {
			shapeArr[shapeLength - 2].setRadius(0);
		}

		if (shapeLength > size) {
			var firstShape = shapeArr[0];
			var shapeId = shapeGroup.getLayerId(firstShape);
			shapeGroup.removeLayer(shapeId);
		}

		handleclick(lat, lon);
	}
}

function processLatLon(lat, lon, accuracy) {
    accSummary = "";

    if (accuracy >= 0 && accuracy <= 10) {
        accSummary = "<span class=\"text-success\">Good</span>"; // Accuracy less than 10 meters is considered "Good"
    } else if (accuracy > 10 && accuracy <= 25) {
        accSummary = "<span class=\"text-warning\">Ok</span>"; // Accuracy between 10 and 25 meters is considered "Ok"
    } else if (accuracy > 25) {
        accSummary = "<span class=\"text-danger\">Poor</span>"; // Accuracy more than 25 meters is considered "Bad"
    } else {
        accSummary = "N/A";
    }

    localStorage.setItem("lat", lat); // Saves the latitude, longitude, and accuracy values to local storage.
    localStorage.setItem("lon", lon);
    localStorage.setItem("accuracy", accuracy);

    localStorage.setItem("accuracySummary", accSummary);
    document.getElementById("latlon").innerHTML = "Latitude: " + lat + "<br>Longitude: " + lon + "<br>Accuracy: " + accSummary;
}

function newPos(pos) { // Adds a new position to the history.
	posHistory.push(pos);

	if (posHistory.length > size)
		posHistory.splice(0, 1);

	historyIndex = posHistory.length - 1;
}

function showHistoryItem(val) { // val == -1 shows previous entry and 1 shows next entry.
	shapeGroup.getLayers()[historyIndex].setRadius(0);

    historyIndex = (historyIndex + val) % posHistory.length;

    if (historyIndex < 0) {
        historyIndex = posHistory.length - 1;
    }

    processLatLon(posHistory[historyIndex].x, posHistory[historyIndex].y, posHistory[historyIndex].a);
	handleclick(posHistory[historyIndex].x, posHistory[historyIndex].y);

	shapeGroup.getLayers()[historyIndex].setRadius(posHistory[historyIndex].a);
}

function nls() {
    var input = [];
    var zone, shemi;

    for (var i = 0; i < posHistory.length; i++) {
        var pos = posHistory[i];
        var xyd = [];
        var ret = latlonToUTM(pos.x, pos.y);

        xyd.push(ret.x);
        xyd.push(ret.y);
        xyd.push(pos.a);

        zone = ret.z;
        shemi = ret.sh;

        input.push(xyd);
    }

    var output = trilat(input);
    var result = getLatLon(output[0], output[1], zone, shemi);

    newLat = Math.round(result[0] * 1000000) / 1000000;
    newLon = Math.round(result[1] * 1000000) / 1000000;

    processLatLon(newLat, newLon, -1);
    handleclick(newLat, newLon);
}

// Uses a weighted average of recorded locations to find an average location
function average() {
	var avgX = 0;
	var avgY = 0;
	var weightSum = 0;

	var zone, shemi;

	for (var i = 0; i < posHistory.length; i++) {
		var pos = posHistory[i];
		var weight = 1 / pos.a;
		var ret = latlonToUTM(pos.x, pos.y);

		avgX += ret.x * weight;
		avgY += ret.y * weight;
		weightSum += weight;

		zone = ret.z;
		shemi = ret.sh;
	}

	var result = getLatLon(avgX / weightSum, avgY / weightSum, zone, shemi);

	newLat = Math.round(result[0] * 1000000) / 1000000;
	newLon = Math.round(result[1] * 1000000) / 1000000;

	processLatLon(newLat, newLon, -1);
	handleclick(newLat, newLon);
}

// Get UTM x,y coordinates from latitude and longitude
function getLatLon(x, y, zone, southhemi) {
	// Need to make sure you use the right UTM zone or else location will be off by about 400km
	var r1 = utmToLatLon(x, y, zone - 1, southhemi);
	var r2 = utmToLatLon(x, y, zone, southhemi);
	var r3 = utmToLatLon(x, y, zone + 1, southhemi);

	var pos = posHistory[0];
	var d1 = getDistanceFromLatLonInKm(r1[0], r1[1], pos.x, pos.y);
	var d2 = getDistanceFromLatLonInKm(r2[0], r2[1], pos.x, pos.y);
	var d3 = getDistanceFromLatLonInKm(r3[0], r3[1], pos.x, pos.y);

	var shortest = 999999999;
	shortest = Math.min(shortest, d1);
	shortest = Math.min(shortest, d2);
	shortest = Math.min(shortest, d3);

	return (shortest == d1) ? r1 : (shortest == d2) ? r2 : r3;
}

function pauseResume() {
	var curIndex = posHistory.length - 1;

	if (paused) { // Unpauses, restarts getLocation and resets marker to last recorded location.
		shapeGroup.getLayers()[historyIndex].setRadius(0);
		shapeGroup.getLayers()[curIndex].setRadius(posHistory[curIndex].a);

        processLatLon(posHistory[curIndex].x, posHistory[curIndex].y, posHistory[curIndex].a);
        handleclick(posHistory[curIndex].x, posHistory[curIndex].y);

        getLocation();
    } else { // Pauses getLocation and begins history browsing.
        historyIndex = curIndex; // Starts history at last recorded location.

        navigator.geolocation.clearWatch(watchID); // Stops the watchPosition method.
    }

    toggleHistory(paused);
    paused = !paused;
}

function toggleHistory(val) { // Toggles history buttons on if paused is true and off if not.
    document.getElementById("pauseButton").innerHTML = (val) ? "Pause" : "Resume";
    document.getElementById("nextButton").disabled = val;
    document.getElementById("prevButton").disabled = val;
	document.getElementById("nearestButton").disabled = val;
	document.getElementById("averageButton").disabled = val;
} 

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = (R * c); // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function log() {
    navigator.geolocation.clearWatch(watchID); // Stops the watchPosition method.

    if (!paused) { // If its not paused pause it.
        pauseResume();
    }

    document.getElementById("confirmCoords").innerHTML = // This is the text that appears in the pop up to confirm coordinates.
        "Your coordinates are: <br>Latitude: " + posHistory[historyIndex].x + "<br>Longitude: " + posHistory[historyIndex].y + "<br>And your accuracy is: " + accSummary + "<br>Would you like to use these coordinates?";
}