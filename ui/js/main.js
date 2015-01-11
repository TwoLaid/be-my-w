    var getUserId = function() {
        return localStorage.getItem('user_id');
    }

    var getValues = function() {
        var values = {};    
        var forms = $('form');

        $.each(forms, function(i, form) {
            if ($(form).is('[slider]')) return;

            var action = $(form).attr('action') || '';
            if(action.indexOf('#!') == 0) {
                action = action.slice(2);
                var checked = $(':checked', form);
                values[action] = checked.attr('id') || '';
            }
        });
        return values;    
    };

    var setValues = function(values) {
        $('input[type=radio]').prop('checked', false);
        $('input[type=checkbox]').prop('checked', false);

        $.each(values, function(key, value) {
            $('#' + value).prop('checked', true);
        });
    }

    var postPreferences = function(preferences) {
        var user = getUserId();
        var url = 'http://be-my-wife.herokuapp.com/preferences/' + user, preferences;

        $.ajax({
          type: 'POST',
          url: url,
          data: JSON.stringify(preferences),
          dataType: 'json'
        });
    };

    var getPreferences = function() {
        $.ajax({
            url: 'http://be-my-wife.herokuapp.com/preferences/' + getUserId(),
            success: function(result) {
                setValues(result.preferences);
            }
        });
    };

$(document).ready(function() {
    
    // Routing Logic

    $(window).hashchange(function() {
        var hash = location.hash;
        if (hash == '') hash = '#main';
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
    }

    var adaptPageToLoggedInUser = function(user_id) {
        $('.loggedout').hide();
        $('.loggedin').show();
    }

    var loginUser = function(user_id) {
        localStorage.setItem('user_id', user_id);
        adaptPageToLoggedInUser(user_id);
        window.location.hash = '#main';
        getPreferences();
    }

    var checkForSignedInUser = function() {
        user_id = localStorage.getItem('user_id');
        if (user_id != null) {
            adaptPageToLoggedInUser(user_id)
        } else {
            $('.loggedin').hide(); 
        }
    }
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

    $('form').change(function() {
        var preferences = getValues();
        postPreferences(preferences);
    });

    getPreferences();
});