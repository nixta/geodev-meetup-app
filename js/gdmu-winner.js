var LOCATION = "eventKey";   // meetup location
var _APP_ID = "pgOw7HSXNSdsWZSp";   // AGOL app id
var _token = null;
var _oauth_info;
var _names = "";
var _attendeeBaseUrl = "https://services.arcgis.com/uCXeTVveQzP4IIcx/arcgis/rest/services/GDMUEvents/FeatureServer";
var _feature_service = `${_attendeeBaseUrl}/0`;
var _attendee_table = `${_attendeeBaseUrl}/1`;

// Let's initialize everything
(function init(){
    $('#myModal').modal({ show: false});

    // Set appId value in modal form
    $('#myModal #app-id').val(_APP_ID);

    // // Sign into AGOL
    // document.getElementById("login-btn").addEventListener("click", function(e){
    //     require(["esri/IdentityManager"], function(esriId){
    //         esriId.getCredential(_oauth_info.portalUrl + "/sharing");
    //     });
    //
    // });

    document.getElementById("save-location-btn").addEventListener("click", function(e){
        //var location = $("#meetup-location").val().trim();
        var location = $("#events-list option:selected").data("event-key");

        if(location == ""){
            alert("Location is blank. Please enter a new location and the old location will be overwritten. ");
        }
        else {
            localStorage[LOCATION] = location;
            alert("The new value: " + location + " has been saved.");
        }
    });

    if(localStorage[LOCATION]){
        $('#myModal #meetup-location').val(localStorage[LOCATION]);
    }

    logIntoPortal(function(result){
        if(!result){

            require(["esri/IdentityManager"], function(esriId){
                esriId.getCredential(_oauth_info.portalUrl + "/sharing");
            });

        }
        else {

            getEventNames();

            $('#myModal').modal( 'show' );
        }
    });
})();

function signOut(){
    require(["esri/IdentityManager"], function(esriId){
        console.log("Signing out");
        esriId.destroyCredentials();

        // Delete the old meetup location
        localStorage[LOCATION] = "";

        window.location.reload();
    });
}

function logIntoPortal(callback){
    require(["esri/arcgis/OAuthInfo", "esri/IdentityManager", "dojo/on"], function(OAuthInfo, esriId, on){

        if(_APP_ID === undefined){
            console.error("Set the APP ID in the configuration window. ");
        }
        else {
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
            function (result){
                console.log("We are already logged in. Good to go!");
                _token = result.token;
                document.getElementById("login-btn").disabled = true;
                callback(true);
            }
        ).otherwise(
            function (){
                document.getElementById("login-btn").disabled = false;
                console.warn("Log in required to get things going.");
                callback(false);
            }
        );

    });
}

function getEventNames(){
    require(["esri/tasks/QueryTask", "esri/tasks/query"], function (QueryTask, Query) {
        var qt = new QueryTask(_feature_service);
        var q = new Query();
        q.where = "1=1";
        q.outFields = ["Name", "Date", "EventKey", "GlobalID"];
        q.orderByFields = ["Date DESC"];

        qt.execute(q, function (results) {
            for (var i = 0, len = results.features.length; i < len; i++) {
                var event = results.features[i],
                    eventGuid = event.attributes["GlobalID"],
                    eventName = event.attributes["Name"],
                    eventDate = new Date(event.attributes["Date"]),
                    eventDateString = eventDate.toISOString().split("T")[0],
                    eventId = `${eventName} ${eventDateString}`;
                $("#events-list").append(
                    `<option value="${eventGuid}" data-event-key="${eventId}" data-event-name="${eventName}">${eventId}</option>`
                )
            }

            // // Initialize chosen
            // $(".chosen-select").chosen({
            //     width: "100%"
            // });
        }, function (error) {
            console.error("Error getting events list: " + error);
        });
    });
}

function getNames(){

    var whereClause = "EventKey='" + localStorage[LOCATION] + "'";

    var params = "f=json&token=" + _token + "&where=" + whereClause + "&outFields=FirstName,LastName" + "&returnGeometry=false";
    var req = new XMLHttpRequest();
    req.open("POST", _attendee_table + "/query", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function()
    {
        if( req.status === 200 && req.responseText !== "")
        {
            var myNames = "";

            try {
                var obj = JSON.parse(this.responseText);

                if(obj.hasOwnProperty("error")){
                    alert("Unable to make request: " + JSON.stringify(obj.error));
                }
                else {
                    for(var a = 0; a < obj.features.length; a++){
                        myNames += obj.features[a].attributes.FirstName + " " + obj.features[a].attributes.LastName + "\n";
                    }

                    $("#namesbox").text(myNames);
                }
            }
            catch(err) {
                console.error("Failed to parse xhr request: ", err);
                alert("Unable to submit entry: " + err);
            }
        }

    };
    req.onerror = function(e)
    {
        console.error("xhr failed: " + e);
    };
    req.ontimeout = function() {
        console.error("xhr timeout error");
    };
    req.timeout = 30000;
    req.send(params);
}

var text;

function randOrd() {
    return (Math.round(Math.random()) - 0.5);
}

function save() {
    $("#varnote").hide();
    $("#popdown").show();
    $("#values").hide();
    $("div").remove("#result1");
    savenames = $("#namesbox").val();
    savenames = savenames.replace(/\n\r?/g, '101');
    $('#headline').fadeOut();
    $('#headline').text('The name list is saved and updated.').fadeIn();
    $("#names").show();
    $('#namesbox').attr('disabled', 'disabled');
}

function namelist() {

    getNames();

    $("#varnote").hide();
    $('#namesbox').removeAttr('disabled', 'disabled');
    $('#headline').text('Configure name list for ' + localStorage[LOCATION]);
    $("#popdown").show();
    $("#values").hide();
    $("#names").show();
    $('body').css({"overflow-y": "visible"});
}

// does the actual animation
function go() {
    $("#varnote").hide();
    $('body').css({"overflow-y": "hidden"});
    $('#go').attr('disabled', 'disabled');
    $('#list').attr('disabled', 'disabled');
    $('#save').attr('disabled', 'disabled');
    $('#headline').slideUp();
    $('#namesbox').slideDown();

    var count = 1;
    count = 1;
    $("div").remove("#result1");

    /////////////////////////////
    // Global!!
    _names = $("#namesbox").val();

    if (document.all) { // IE
        _names = _names.split("\n");
    }
    else { //Mozilla
        _names = _names.split("\n");
    }
    $("#values").show();
    $(".name").show();
    $("#popdown").hide();
    $("div").remove(".name");
    $("div").remove(".extra");
    $("#playback").html("");
    newtop = _names.length * 200 * -1;
    $('#values').css({top: +newtop});

    _names.sort(randOrd);
    for (var i in _names) {
        if (_names[i] == "" || typeof(_names[i]) == undefined) {
            count = count - 1;
        } else {
            var name = _names[i];
            //console.log(name);
            $('#values').append('<div id=result' + count + ' class=name>' + name + '</div>');
        }
        count = count + 1;
    }

    text = $('#result1').text()
    $('#values').animate({top: '+176'}, 5000);

    // make it stand out
    setTimeout("standout(text)", 5000);
    //setTimeout("$('#playback').hide('slow')",11005);
}

function standout(text) {

    $('#result1').removeClass('name');
    $('.name').animate({opacity: .25});
    $('#result1').animate({height: '+=60px'});
    $('#result1').append('<div class="extra"><a class="small alert button" href="#" onClick="removeName();">Remove name from list</a></div>');
    $('#go').removeAttr('disabled', 'disabled');
    $('#list').removeAttr('disabled', 'disabled');
    $('#save').removeAttr('disabled', 'disabled');
    $('#headline').text('DevSummit 2018 Winner!');
    $('#headline').slideDown();
}

function removeName() {
    // Rewriting namesbox contents
    var nameupdated = "";
    for (var i in _names) {
        var name = _names[i];
        if (name == "" || name == text || typeof(name) == undefined) {
        } else {
            // On initial loop - do not insert a blank row
            if( nameupdated == ""){
                nameupdated = name;
            }
            else {
                nameupdated = nameupdated + "\n" + name;
            }
        }
    }
    $('#namesbox').val("");
    $('#namesbox').val(nameupdated);
    $('#result1').html("Removed");
    $('#result1').fadeOut(1000);
    $("div").remove(".name");
    $("div").remove(".extra");
    $('#headline').text('You missed out! Let\'s see who is next?');
}
