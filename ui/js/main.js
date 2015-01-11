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

    $('#loginform a.submit').click(function() {
        $.ajax({
            type: 'GET',
            url: 'http://be-my-wife.herokuapp.com/login/' + $('#loginform').find('#email').val(),
            success: function(data) {
                $('#loginerror').hide();
                login_user(data.userid);
            },
            error: function() {
                $('#loginerror').show();
            }
        });
    });

    $('a.logout').click(function() {
        localStorage.removeItem('user_id');
        $('.loggedout').show();
        $('.loggedin').hide();
    });

    function adapt_page_to_logged_in_user(user_id) {
        $('.loggedout').hide();
        $('.loggedin').show();
    }

    function login_user(user_id) {
        localStorage.setItem('user_id', user_id);
        adapt_page_to_logged_in_user(user_id);
        window.location.hash = '#main';
    }

    function check_for_signed_in_user() {
        user_id = localStorage.getItem('user_id');
        if (user_id != null) {
            adapt_page_to_logged_in_user(user_id)
        } else {
            $('.loggedin').hide(); 
        }
    }
    check_for_signed_in_user();
});