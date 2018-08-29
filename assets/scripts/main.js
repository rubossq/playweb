$(".publishing-card").hover(showDesc, hideDesc);

function showDesc(){
    $(this).find("div:first").fadeIn('slow');
}

function hideDesc(){
    $(this).find("div:first").fadeOut('fast');
}

$('#headerCarousel').carousel({
    interval: 4500,
    ride: true,
    pause: false
});

$('#gamesCarousel').carousel({
    interval: 4500,
    ride: true,
    pause: false
});

