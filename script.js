var data = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.clientId,
    Region: _config.cognito.region,
    IdentityPoolId: _config.cognito.identityPoolId,
};

var sessionValid;
var syncTimeOut;
var idToken;

function loadIndex() {
	localStorage.removeItem("editing");
    localStorage.removeItem("search");
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, session) {
            if (err) {
                return;
            } else {
                sessionValid = session.isValid();
                if (sessionValid == false) {
                    document.getElementById("loginButton").innerHTML = "LOG IN";
                    document.getElementById("uploadButton").disabled = true;
                    document.getElementById("textarea").innerHTML = "Upload and auto syncing are currently disabled. However, you can still collect addresses while logged off.";
                } else if (sessionValid == true) {
                    idToken = session.getIdToken().getJwtToken();
                    document.getElementById("loginButton").innerHTML = "LOG OUT";
                    document.getElementById("uploadButton").disabled = false;
                    syncTimeOut = window.setTimeout(syncLoop, 10000);
                } else {
                    alert("Sorry, something went wrong");
                }
            }
        });
    }
    if (cognitoUser == null) {
        sessionValid = false;
        document.getElementById("loginButton").innerHTML = "LOG IN";
        document.getElementById("uploadButton").disabled = true;
        document.getElementById("textarea").innerHTML = "Upload and auto syncing are currently disabled. However, you can still collect addresses while logged off.";
    }
	document.getElementById("historyButton").disabled = localStorage.getItem("allAddresses") == null;
}

//runs every 10 seconds when logged in to try and connect to AWS and upload entries
function syncLoop(buttonPress = false) {
	window.clearTimeout(syncTimeOut);

    if (navigator.onLine) {
        var needsSync = false;
        var storedAddresses = localStorage.getItem("allAddresses");

        //check if any entry in history needs to be uploaded
        if (storedAddresses != null) {
            var history = JSON.parse(storedAddresses);

            for (var i = history.length - 1; i >= 0; i--) {
                if (history[i]['Sync'] == 0) {
                    needsSync = true;
                    break;
                }
            }
        }

        //awsCheck checks for connectivity and begins the upload
        if (needsSync) {
			document.getElementById('textarea').innerHTML = "Begin sync";
			awsCheck(createItem, syncError);
		} else {
			document.getElementById('textarea').innerHTML = (buttonPress) ? "Nothing to sync." : "";
        }
	} else {
		syncError();
	}

	syncTimeOut = window.setTimeout(syncLoop, 10000);
}

function syncError() {
	document.getElementById("textarea").innerHTML = "Unable to sync: No connection.";
}

function createItem() {
    document.getElementById("textarea").innerHTML = "Syncing...";

    var attemptCount = 0;
    var getCount = 0;

    var successCount = 0;
    var failCount = 0;

    var obj;
    var toBeSynced = [];

    var history = JSON.parse(localStorage.getItem("allAddresses"));

    //creates array of entries that need to be synced
    for (var i = 0; i < history.length; i++) {
        obj = history[i];

        if (obj['Sync'] == 0)
            toBeSynced.push(i);
    }

    var tosync = toBeSynced.length;

    AWS.config.region = data.Region;
    var login = "cognito-idp." + data.Region + ".amazonaws.com/" + data.UserPoolId;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: data.IdentityPoolId,
        Logins: {
            [login]: idToken
        }
    });

    AWS.config.credentials.get(function (err) {
        if (!err) {
            var docClient = new AWS.DynamoDB.DocumentClient();
            for (var i = 0; i < toBeSynced.length; i++) {
                obj = history[toBeSynced[i]];
                var params = {
                    TableName: "Centaur_Data",
                    Item: {
                        "GUID": obj['GUID'],
                        "Mapcode": obj['Mapcode'],
                        "Timestamped": obj['Timestamped'],
                        "Street": obj['Street'],
                        "City": obj['City'],
                        "Territory": obj['Territory'],
                        "Zip": obj['Zip'],
                        "County": obj['County'],
                        "Latitude": obj['Latitude'],
                        "Longitude": obj['Longitude'],
                        "NGZ": obj['NGZ'],
                        "Comments": obj['Comments'],
                        "Uploader": localStorage.getItem("user")
                    }
                }
                docClient.put(params, function (err, data) { // This send the params variable with the address information to DynamoDB.
                    if (err) {
                        document.getElementById('textarea').innerHTML = "Unable to add item: " + err.message;
                    }
                    attemptCount++;

                    if (attemptCount == tosync) {
                        for (var k = 0; k < toBeSynced.length; k++) {
                            obj = history[toBeSynced[k]];

                            params = {
                                TableName: "Centaur_Data",
                                Key: {
                                    "GUID": obj['GUID']
                                }
                            }
                            docClient.get(params, function (err, data) { // look up to see if the entries were saved to the database
                                getCount++;

                                if (err) {
                                    document.getElementById('textarea').innerHTML = "Get request error: " + err.message;
                                }
                                else {
                                    var jason = JSON.stringify(data);

                                    if (jason != "{}") {
                                        jason = jason.slice(8, jason.length - 1);
                                        var jarr = JSON.parse(jason);
                                        var entryIndex;

                                        for (var x = 0; x < toBeSynced.length; x++) {
                                            if (history[toBeSynced[x]]['GUID'] == jarr['GUID']) {
                                                entryIndex = toBeSynced[x];
                                                break;
                                            }
                                        }

                                        var synced = true;
                                        //if there is a discrepancy between the local entry on the device and the entry on the database then the sync failed
                                        for (var key in history[entryIndex]) {
                                            if (key != 'Sync' && history[entryIndex][key] != jarr[key]) {
                                                synced = false;
                                                break;
                                            }
                                        }

                                        if (synced) {
                                            successCount++;

                                            if (successCount == 1)
                                                document.getElementById('textarea').innerHTML = " 1 entry synced!";
                                            else
                                                document.getElementById('textarea').innerHTML = successCount + " entries synced!";

                                            history[entryIndex]['Sync'] = 1;
                                        }
                                        else {
                                            failCount++;
                                        }
                                    }
                                    else {
                                        failCount++;
                                    }
                                }
                                //when all the callbacks are finished update the local history to reflect sync status
                                if (getCount == tosync) {
                                    localStorage.setItem("allAddresses", JSON.stringify(history));
                                    document.getElementById('textarea').innerHTML = successCount + " Synced   " + failCount + " Error(s)";
                                }
                            });
                        }
                    }
                });
            }
        }
        else {
            alert("Sorry, something went wrong.");
        }
    });
}

function beginLogIn() {
    if (sessionValid == false) { // Checks if someone is logged in.
        window.location.assign("login.html"); // Takes the user to the log in page.
    } else {
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
        var cognitoUser = userPool.getCurrentUser();
        cognitoUser.signOut();
        window.location.reload();
    }
}