function loadHistoryPage() {
	window.setTimeout(jumpToEdit, 100);

    var history = JSON.parse(localStorage.getItem("allAddresses"));
    document.getElementById("historyHeader").innerHTML =
        "<h2 class=\"text-border text-center text-white font-weight-bold\" id=\"focus" + (history.length - 1) + "\">HISTORY</h2>";

    var searching = localStorage.getItem("search");

    //if entry is edited in search run the search again after loading else load history like normal
    if (searching == null || searching == "false") {
        loadHistory();
    } else {
        showSearch();
        document.getElementById("searchStreet").value = localStorage.getItem("searchStreet");
        document.getElementById("searchCity").value = localStorage.getItem("searchCity");
        document.getElementById("searchTerritory").value = localStorage.getItem("searchTerritory");
        document.getElementById("searchZip").value = localStorage.getItem("searchZip");
        document.getElementById("searchCounty").value = localStorage.getItem("searchCounty");
        document.getElementById("searchTime").value = localStorage.getItem("searchTime");
        document.getElementById("searchComments").value = localStorage.getItem("searchComments");
        search();
	}
}

function jumpToEdit() { //set focus to the edited entry after returning from editor
    var editing = localStorage.getItem("editing");

    if (editing != null) {
        var obj = JSON.parse(editing);
        var num = obj['num'];
        window.location.href = "#focus" + num;
    }
}

function displayEntry(entry, index) { //displays entry from local storage
    var html = "";

    var bttnStr = "<div class=\"col\"><button type=\"button\" onmouseover \"\" onclick=\"edit(" + index + ")\" class=\"btn btn-sm btn-success text-white w-50\">EDIT</button></div>";
    html += "<div class=\"container-fluid\"><div class=\"row text-center\"><div class=\"col\"><h4 class=\"text-border text-white font-weight-bold\">ENTRY " + (index + 1) + "<input class=\"ml-2\" type=\"checkbox\" id=\"chk" + index + "\"></h4></div>" + bttnStr;

    if (entry['Sync'] == 0)
        html += "<table class=\"table table-bordered table-sm table-primary\" style=\"background-color:Tomato\">";
    else
        html += "<table class=\"table table-bordered table-sm table-primary\">";

    var counter = 0;
    for (var key in entry) {
        counter++;
        if (key != 'Sync' && key != 'EntryVal') {
            html += "<tr>";
            html += (counter == Object.keys(entry).length - 1) ? "<th id=\"focus" + (index - 1) + "\">" + key + "</th>" : "<th>" + key + "</th>"; //focus for next entry is placed in second to last table tag
            html += "<td>" + entry[key] + "</td>";
            html += "</tr>";
        }
    }
    html += "</table>";
    html += "<br />";
    html += "<br />";

    return html;
}

function loadHistory() { //load addresses from local storage and display them
    var storedAddresses = localStorage.getItem("allAddresses");
    var history = JSON.parse(storedAddresses);

    var html = "";
    for (var i = history.length - 1; i >= 0; i--) {
        html += displayEntry(history[i], i);
    }
    document.getElementById("retrieveAddress").innerHTML = html;
}

function edit(num) {
    var storedAddresses = localStorage.getItem("allAddresses");
    var history = JSON.parse(storedAddresses);
    var obj = history[num];
    var objStr = JSON.stringify(obj);

    //add an extra number field to the edited JSON which will be used to jump to the correct entry after editing
    objStr = objStr.slice(0, objStr.length - 1);
    objStr = objStr.concat(",\"num\":" + num + "}");

    localStorage.setItem("editing", objStr);
    window.location.assign("editor.html");
}

function clearSavedAddresses() {
    if (localStorage.getItem("allAddresses") == null) {
        alert("No entries to delete.");
    } else if (confirm("Clear all entries?")) {
        localStorage.removeItem("allAddresses");
        document.getElementById("retrieveAddress").innerHTML = "";
    }
}

function deleteSelected() {
    if (localStorage.getItem("allAddresses") == null) {
        alert("No entries to delete.");
    } else {
        var storedAddresses = localStorage.getItem("allAddresses");
        var history = JSON.parse(storedAddresses);
        var deleted = 0;

        for (var i = history.length - 1; i >= 0; i--) {
            var obj = history[i];
            var checked = document.getElementById("chk" + i);

            if (checked != null && checked.checked) {
                history.splice(i, 1);
                deleted++;
            }
        }

        if (deleted == 0) {
            alert("No entries selected.");
        } else if (confirm("Delete selected entries?")) {
            if (history.length == 0) {
                localStorage.removeItem("allAddresses");
                document.getElementById("retrieveAddress").innerHTML = "";
            } else {
                localStorage.setItem("allAddresses", JSON.stringify(history));
                var searching = localStorage.getItem("search");

                //if currently searching search again
                if (searching == null || searching == "false")
                    loadHistory();
                else
                    search();
            }
        }
    }
}