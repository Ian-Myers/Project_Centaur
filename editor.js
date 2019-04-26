function loadEditor() {
    var editing = localStorage.getItem("editing");
    var obj = JSON.parse(editing);

    var html = "";
    var stateDropdown = "";
    var statePlaceholder = obj["Territory"]; // Gets the state associated with the entry that's being edited.

    if (obj['Sync'] == 0)
        html += "<table class=\"table table-bordered table-sm table-primary\" id=\"editingTable\" style=\"background-color:Tomato\">";
    else
        html += "<table class=\"table table-bordered table-sm table-primary\" id=\"editingTable\">";

    for (var key in obj) {
        if (key != 'Sync' && key != 'num') {
            html += "<tr>";
            html += "<th>" + key + "</th>";
            var editable = (key == 'GUID' || key == 'Latitude' || key == 'Longitude' || key == 'NGZ' || key == 'Mapcode' || key == 'Timestamped' || key == 'Accuracy');
            if (key == 'Territory') {
                html += "<td><select class=\"w-100\" id=\"states\" onchange=\"loadCounties()\"></select></td>";
                for (var x in states) {
                    if (x == statePlaceholder) { // The default value of the dropdown option is the state associated with the entry that's being edited.
                        stateDropdown += "<option selected=\"selected\" class=\"text-center\" value=\"" + statePlaceholder + "\">" + statePlaceholder + "</option>\n";
                    } else {
                        stateDropdown += "<option class=\"text-center\" value=\"" + x + "\">" + x + "</option>\n";
                    }
                }
            }
            else if (key == 'County') {
                html += "<td><select class=\"w-100\" id=\"counties\"></select></td>";
            }
            else {
                html += editable ? "<td style=\"color:gray\">" + obj[key] + "</td>" : "<td contenteditable='true'>" + obj[key] + "</td>";
                html += "</tr>";
            }
        }
    }
    html += "</table>";
    html += "<br />";
    html += "<br />";
    document.getElementById("editingArea").innerHTML = html;

    document.getElementById("states").innerHTML = stateDropdown;
    loadCounties();
}

function submitChanges() {
    var editing = localStorage.getItem("editing");
    var obj = JSON.parse(editing);
    var num = obj['num'];

    var storedAddresses = localStorage.getItem("allAddresses");
    var history = JSON.parse(storedAddresses);

    var table = document.getElementById("editingTable");
    var key;

    var rows = table.rows;
    var cells;

    for (var r = 0; r < rows.length; r++) {
        cells = rows[r].cells;
        for (var c = 0; c < cells.length; c++) {
            if (c % 2 == 1) {
                var oldVal = history[num][key];
                if (key == 'Territory') {
                    history[num][key] = document.getElementById("states").value; // Only saves the value inside the drop down list.
                } else if (key == 'County') {
                    history[num][key] = document.getElementById("counties").value; // Only saves the value inside the drop down list.
                } else {
                    history[num][key] = cells[c].innerHTML;
                }
                if (oldVal != history[num][key]) {
                    history[num]['Sync'] = 0;
                }
            }
            else {
                key = cells[c].innerHTML;
            }
        }
    }

    localStorage.setItem("allAddresses", JSON.stringify(history));
    window.location.assign("history.html");
}

function loadCounties() {
    var html = '';
    var select = document.getElementById("states");
    var val = select.options[select.selectedIndex].text;
    var editing = localStorage.getItem("editing");
    var obj = JSON.parse(editing);
    var countyPlaceholder = obj["County"]; // Gets the county associated with the entry being edited.

    for (var i = 0; i < states[val].length; i++) {
        if (countyPlaceholder == states[val][i]) { // Makes the default value of the drop down the county associated with the entry being edited.
            html += "<option selected=\"selected\" class=\"text-center\" value=\"" + states[val][i] + "\">" + states[val][i] + "</option>\n";
        } else {
            html += "<option class=\"text-center\" value=\"" + states[val][i] + "\">" + states[val][i] + "</option>\n";
        }
    }
    document.getElementById("counties").innerHTML = html;
}