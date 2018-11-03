"use strict"

var view = new View();
var controller;

$(() => {
    $('#start').on('click touchstart', () => {
        controller.startGame();
    });
    $('#reset').on('click touchstart', () => {
        controller.resetGame();
    });

    let username = sessionStorage.getItem('username');
    if (username === null) {
        window.location.href = './index.html';
        return false;
    }

    console.log("making view");
    controller = new Controller(view, username);
    view.controller = controller;
});