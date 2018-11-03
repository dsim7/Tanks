"use strict"



var goToGame = () => {
    let username = $('#username').val();
    if (username == 0) {
        $('#warning').html('<p>Enter a username</p>');
    } else {
        sessionStorage.setItem('username', username);
        window.location.href = './nop5game.html';
        //window.location.href = './game.html';
        return false;
    }
}

$(() => {
    $('#go').on('click touchstart', goToGame);
});