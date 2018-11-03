
var view;
var controller;

$(() => {
    $('#reset').on('click touchstart', () => {
        controller.startGame();
    });
    $('#start').on('click touchstart', () => {
        controller.resetGame();
    });

    let username = sessionStorage.getItem('username');
    if (username === null) {
        window.location.href = './index.html';
        return false;
    } else {
        view = new View();
        controller = new Controller(view, username);
        view.controller = controller;
    }
});