var EVENTKEY = "eventKey"; // meetup key
var EVENTGUID = "eventGuid"; // meetup GUID
var EVENTNAME = "eventName"; // meetup Name
var EVENTTYPE = "eventType"; // Meetup or Hackerlab
var showBenefitTypes = [0];
var _typeMappingText = ["Meetup", "Hackerlab"];
var _typeMappingTag = ["GDMU", "HL"];
var _APP_ID = "pgOw7HSXNSdsWZSp"; // AGOL app id
var _message = ""; // Alert message
var _oauth_info;
var _token = null;
var _attendeeBaseUrl = "https://services.arcgis.com/uCXeTVveQzP4IIcx/arcgis/rest/services/GDMUEvents/FeatureServer";
var _feature_service = `${_attendeeBaseUrl}/0`;
var _attendee_table = `${_attendeeBaseUrl}/1`;

$('#myModal').modal({
    show: false
});

$('#alertModal').modal({
    show: false
});

$('#successModal').modal({
    show: false
});

document.getElementById("config").addEventListener("click", function showConfig() {
    updateConfigPanel();

    $('#myModal').modal('show');
});

document.getElementById("save-config").addEventListener("click", function saveConfig() {
    updateStoredEvent();
    reflectStoredEvent();
});

document.getElementById("login-btn").addEventListener("click", function (e) {
    require(["esri/IdentityManager"], function (esriId) {
        esriId.getCredential(_oauth_info.portalUrl + "/sharing")
            .then(function (result) {
                console.log("hah");
            });
    });
});

document.getElementById("sign-out").addEventListener("click", function (e) {
    require(["esri/IdentityManager"], function (esriId) {
        console.log("Signing out");
        esriId.destroyCredentials();
        window.location.reload();
    });
});

$('#alertModal').on('show.bs.modal', function (evt) {
    $('#alert-message').text(_message);
});

reflectStoredEvent();

require(["dojo/Deferred"], function (Deferred) {
    logIntoPortal()
        .then(function () {
            require(["esri/tasks/QueryTask", "esri/tasks/query"], function (QueryTask, Query) {
                var qt = new QueryTask(_feature_service);
                var q = new Query();
                q.where = "1=1";
                q.outFields = ["Name", "Date", "Type", "EventKey", "GlobalID"];
                q.orderByFields = ["Date DESC"];

                qt.execute(q, function (results) {
                    for (var i = 0, len = results.features.length; i < len; i++) {
                        var event = results.features[i],
                            eventGuid = event.attributes["GlobalID"],
                            eventName = event.attributes["Name"],
                            eventType = event.attributes["Type"],
                            eventDate = new Date(event.attributes["Date"]),
                            eventDateString = eventDate.toISOString().split("T")[0];

                        // This is naughty and lazy. Really we should load the layer, read the 
                        // CodedValueDomain from the field, and look up the name for the codes.
                        var eventTypeTag = _typeMappingTag[eventType],
                            eventTypeText = _typeMappingText[eventType];

                        var eventKey = `${eventName} ${eventDateString} ${eventTypeTag}`,
                            eventTitle = `${eventDateString} ${eventName} [${eventTypeText}]`;

                        $("#events-list").append(
                            `<option value="${eventGuid}" data-event-key="${eventKey}" data-event-type="${eventType}" data-event-name="${eventName}">${eventTitle}</option>`
                        )
                    }

                    // Initialize chosen
                    $(".chosen-select").chosen({
                        width: "100%"
                    });
                }, function (error) {
                    console.error("Error getting events list: " + error);
                });
            });
        })
        .otherwise(function () {
            console.log("")
        });

    function showAlert(message) {
        _message = message;
        $('#alertModal').modal('show');
    }

    document.getElementById("submit-form").addEventListener("click", function (e) {
        var reject = false;
        var regValidate = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        var firstName = $("#first-name").val().trim();
        var lastName = $("#last-name").val().trim();
        var title = $("#title").val().trim();
        var organization = $("#organization").val().trim();
        var email = $("#email").val().trim();

        if (firstName === '') {
            reject = true;
        }
        if (lastName === '') {
            reject = true;
        }
        if (title === '') {
            reject = true;
        }
        if (organization === '') {
            reject = true;
        }
        if (email === '') {
            reject = true;
        } else if (!regValidate.test(email)) {
            showAlert("Please enter a valid email address");
            return false;
        }

        if (reject) {
            showAlert("Please fill out all fields.");
        } else {

            var firstTimer;

            if (document.getElementById("firsttimer-yes").checked) {
                firstTimer = 1;
            } else if (document.getElementById("firsttimer-no").checked) {
                firstTimer = 0;
            }

            submitUpdate(firstName, lastName, title, organization, email, firstTimer);
        }
    });

    function submitUpdate(firstName, lastName, title, organization, email, firstTimer) {

        var newEntry = {
            'attributes': {
                'FirstName': firstName,
                'LastName': lastName,
                'Title': title,
                'Organization': organization,
                'Email': email,
                'FirstTimer': firstTimer,
                'EventID': localStorage[EVENTGUID],
                'EventKey': localStorage[EVENTKEY]
            }
        };

        var params = "f=json&token=" + _token + "&adds=[" + encodeURIComponent(JSON.stringify(newEntry)) +
            "]";
        var req = new XMLHttpRequest();
        req.open("POST", _attendee_table + "/applyEdits", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onload = function () {
            if (req.status === 200 && req.responseText !== "") {
                try {
                    var obj = JSON.parse(this.responseText);

                    if (obj.hasOwnProperty('addResults') && obj.addResults[0].success === true) {
                        $("#first-name").val('');
                        $("#last-name").val('');
                        $("#title").val('');
                        $("#organization").val('');
                        $("#email").val('');

                        $('#successModal').modal('show');
                        window.setTimeout(function hideSuccess() {
                            $('#successModal').modal('hide');
                        }, 3000);
                    } else {
                        showAlert("There was a problem with submitting your entry. " + this.responseText);
                    }

                } catch (err) {
                    console.error("applyEdits failed: ", err);
                    showAlert("Unable to submit entry: " + err);
                }
            }

        };
        req.onerror = function (e) {
            console.error("_makeEditRequest failed: " + e);
        };
        req.ontimeout = function () {
            console.warn("xhr timeout error");
        };
        req.timeout = 30000;
        req.send(params);
    }

    function logIntoPortal() {
        var d = new Deferred();
        require(["esri/arcgis/OAuthInfo", "esri/IdentityManager", "dojo/on"], function (OAuthInfo,
            esriId, on) {

            if (_APP_ID === undefined) {
                console.error("Set the APP ID in the configuration window. ");
            } else {
                _oauth_info = new OAuthInfo({
                    appId: _APP_ID,
                    // Uncomment the next line and update if using your own portal
                    //portalUrl: "https://<host>:<port>/arcgis"
                    // Uncomment the next line to prevent the user's signed in state from being shared
                    // with other apps on the same domain with the same authNamespace value.
                    //authNamespace: "portal_oauth_inline",
                    popup: false
                });
            }

            esriId.registerOAuthInfos([_oauth_info]);

            esriId.checkSignInStatus(_oauth_info.portalUrl + "/sharing").then(
                function (result) {
                    console.log("We are already logged in. Good to go!");
                    _token = result.token;
                    document.getElementById("sign-out").disabled = false;
                    d.resolve(_token);
                }
            ).otherwise(
                function () {
                    document.getElementById("sign-out").disabled = true;
                    console.warn("Log in required to get things going.");
                    d.reject();
                }
            );

        });

        return d.promise;
    }

});

function updateStoredEvent() {
    var eventGuid = $("#events-list").chosen().val(),
        eventKey = $("#events-list option:selected").data("event-key"),
        eventName = $("#events-list option:selected").data("event-name"),
        eventType = $("#events-list option:selected").data("event-type");

    localStorage[EVENTKEY] = eventKey;
    localStorage[EVENTGUID] = eventGuid;
    localStorage[EVENTNAME] = eventName;
    localStorage[EVENTTYPE] = eventType;

    console.log(`Set local storage event to ${localStorage[EVENTKEY]}`);
}

function updateConfigPanel() {
    var eventGuid = localStorage[EVENTGUID];
  
    $("#events-list").val(eventGuid);
    $("#events-list").trigger("chosen:updated");

    $('#myModal #app-id').val(_APP_ID);
}

function reflectStoredEvent() {
    var eventGuid = localStorage[EVENTGUID];
    var eventName = localStorage[EVENTNAME];
    var eventType = localStorage[EVENTTYPE],
        eventTypeText = _typeMappingText[eventType];

    if (eventName !== undefined) {
        $("#event-title").text(`the ${eventName} GeoDev ${eventTypeText}`);
    }

    if (showBenefitTypes.indexOf(parseInt(eventType)) > -1) {
        $("#signin-benefit").show()
    } else {
        $("#signin-benefit").hide()
    }
}
