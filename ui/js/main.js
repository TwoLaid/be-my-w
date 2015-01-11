var getUserId = function() {
    return localStorage.getItem('user_id');
};

var getValues = function() {
    var values = {};    
    var forms = $('form');

    $.each(forms, function(i, form) {
        var action = $(form).attr('action') || '';
        
        if(action.indexOf('#!') != 0) {
            return;
        }

        action = action.slice(2);
        

        if ($(form).attr("id") === "mirrorForm") {
            values[action] = $("input", form).map(function(_, e){return e.value}).get();
        }
        else if ($(form).is('[slider]')) {
            values[action] = $("input", form).val();

        } else if ($(form).is('[text]')) {
            values[action] = $('input', form).val();

        } else {    
            var checked = $(':checked', form);
            values[action] = checked.attr('id') || 'off';
        }
    });
    return values;    
};

var setValues = function(values) {
    $('input[type=radio]').prop('checked', false);
    $('input[type=checkbox]').prop('checked', false);


    $.each(values, function(key, value) {
        if (key === 'temperature'){
            $('#tempGauge').val(value).trigger('change');
        }
        else if(key === 'destination'){
            $('#destination').attr('value', value).change();
            $('label[for="destination"]').addClass('active');
        }
        else if(value !== 'off'){
            $('#' + value).prop('checked', true);                
        }
    });
};

var postPreferences = function(preferences) {
    var user = getUserId();
    if (user == null) {
        return;
    }
    var url = 'http://be-my-wife.herokuapp.com/preferences/' + user, preferences;

    $.ajax({
      type: 'POST',
      url: url,
      data: JSON.stringify(preferences),
      dataType: 'json'
    });
};

var getPreferences = function() {
    var user = getUserId();
    if (user == null) {
        return;
    }
    $.ajax({
        url: 'http://be-my-wife.herokuapp.com/preferences/' + user,
        success: function(result) {
            setValues(result.preferences);
        }
    });
};


$(document).ready(function() {
    
    // Routing Logic

    var restrictedHashes = ['#driving', '#meetings', '#preferences'];
    $(window).hashchange(function() {
        var hash = location.hash;
        if (hash == '') hash = '#main';
        if (getUserId() == null && restrictedHashes.indexOf(hash) != -1) window.location.hash = '#login';
        if ('#' + $('div[role=page].selected').attr('id') == hash) return;
        $(window).scrollTop(0);
        $('div[role=page]').removeClass('selected');
        $('div[role=page]' + hash).addClass('selected');
    });
    $(window).hashchange();


    // User Management Logic

    var submitLoginForm = function() {
        $.ajax({
            type: 'GET',
            url: 'http://be-my-wife.herokuapp.com/login/' + $('#loginform').find('#email').val(),
            success: function(data) {
                $('#loginerror').hide();
                loginUser(data.userid);
            },
            error: function() {
                $('#loginerror').show();
            }
        });
    };

    var adaptPageToLoggedInUser = function(user_id) {
        $('.loggedout').hide();
        $('.loggedin').show();
    };

    var loginUser = function(user_id) {
        localStorage.setItem('user_id', user_id);
        adaptPageToLoggedInUser(user_id);
        window.location.hash = '#main';
        getPreferences();
    };

    var checkForSignedInUser = function() {
        user_id = localStorage.getItem('user_id');
        if (user_id != null) {
            adaptPageToLoggedInUser(user_id)
        } else {
            $('.loggedin').hide(); 
        }
    };
    checkForSignedInUser();

    $('#loginform input').keydown(function(e) {
        if (e.which == 13) submitLoginForm();
    });

    $('#loginform a.submit').click(function() {
        submitLoginForm();
    });

    $('a.logout').click(function() {
        localStorage.removeItem('user_id');
        $('.loggedout').show();
        $('.loggedin').hide();
    });


    // Driving Options Management

    var update = function() {
        var preferences = getValues();
        postPreferences(preferences);
    };

    $('form').change(update);

    var gauge = $('#tempGauge'),
        gaugeText = $('#tempValue'),
        gaugeCText = $('#tempCValue');

    var setTemperature = function(temperature){
        gaugeText.text(temperature);
        gaugeCText.text(Math.round((temperature - 32) * (5 / 9)));
        update();
    };

    gauge.change(function(e) {
        var temperature = $('#tempGauge').val();
        setTemperature(temperature);
    });

    var mirror = $("#mirrorForm input").change(function(e) {
        var target = $(e.target),
            angle = target.val(),
            gid = target.attr("id"),
            tid = gid.slice(0, -1) + 'Text' + gid.slice(-1);
        $("#" + tid).text(angle + '°');
    });


    // Destination / Google Maps

    var destinationMap;
    var destinationMarker;

    var initializeMaps = function() {
        var options = {
            zoom: 8,
            center: new google.maps.LatLng(-34.397, 150.644)
        };
        destinationMap = new google.maps.Map(document.getElementById('destinationMap'), options);
    };

    google.maps.event.addDomListener(window, 'load', initializeMaps);

    var updateMap = function(callback) {
        var geocoder = new google.maps.Geocoder();
        var address = $('#destination').val();
        geocoder.geocode({ 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                destinationMap.setCenter(results[0].geometry.location);
                if (destinationMarker) {
                    destinationMarker.setMap(null);
                    destinationMarker = null;
                }
                destinationMarker = new google.maps.Marker({map: destinationMap, position: results[0].geometry.location});

                $('#destination').val(results[0].formatted_address);

                if (callback) {
                    callback();
                }
            }
        });
    };

    $('#destinationForm').submit(function(e) {
        e.preventDefault();
        updateMap();
    });

    $('#destination').change(function() {
        updateMap(update);
    });

    getPreferences();
});
