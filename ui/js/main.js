$(document).ready(function() {

    // Routing Logic
    $(window).hashchange(function() {
        var hash = location.hash;
        if (hash == '') hash = '#main';
        $('div[role=page]').hide();
        $('div[role=page]' + hash).show();
    });
    $(window).hashchange();
});