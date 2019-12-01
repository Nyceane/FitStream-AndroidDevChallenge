

$(document).ready(()=> {
    setUpViewScreenEvents();
    setUpClickIconEvents();
    setupPubNubListener();
    setUpCloseIconEvents();
});

const pubnub = new PubNub({
    publishKey: "pub-c-0f22c5e7-a0d5-4694-bd0c-73da75b0db21",
    subscribeKey: "sub-c-8fc78270-e7dd-11e9-914e-0a6be83abca1"
});

function setupPubNubListener(){

    let inScreen = 0
    pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === "PNConnectedCategory") {
                
            }
        },
        message: function(msg) {
            updateScore(msg.message.name, msg.message.score);
            if (msg.message.inScreen){
                if (inScreen != msg.message.inScreen){
                    inScreen = msg.message.inScreen
                    console.log(msg.message.name);
                    console.log("update one engagment");
                    console.log(msg.message.score);
                    updateEngagement(1)
                }
            }else{
                if (inScreen != msg.message.inScreen){
                    inScreen = msg.message.inScreen
                    console.log(msg.message.name);
                    console.log("update negative engagment");
                    console.log(msg.message.score);
                    updateEngagement(-1)
                }
            }
        },
        presence: function(presenceEvent) {
            // handle presence
        }
    })      
    console.log("PubNub Subscribing..");
    pubnub.subscribe({
        channels: ['pubnub_onboarding_channel'] 
    });
}


function setUpViewScreenEvents() {
    const $startLiveScreenButton = $('.view-screen-start .glowingButton');
    $startLiveScreenButton.click(()=> {
        $('.view-screen-start').fadeOut('slow');
        setTimeout(function() {
            $('.view-screen-stream').removeClass('hidden').fadeIn();
            bottomRowIconsAnim();
        }, 600);
    });
}

function setUpClickIconEvents() {
    // $('.click-icon-viewers').click(() => {
    //     $('.view-screen-stream').addClass('hidden');
    //     $('.view-screen-viewers').removeClass('hidden').addClass('animated fadeInUp');
    // });

    $('.click-icon-leaderboard').click(() => {
        $('.view-screen-stream').addClass('hidden');
        $('.view-screen-leaderboard').removeClass('hidden').addClass('animated fadeIn');
        setTimeout(function() {
            leaderboardAnimation();
            resetBottomRowIconsAnim();
        }, 500);
    });

    $('.click-icon-chat').click(() => {
        $('.view-screen-stream').addClass('hidden');
        $('.view-screen-chat').removeClass('hidden').addClass('animated fadeIn');
        // spinner
        setTimeout(function() {
            chatAnimation();
            resetBottomRowIconsAnim();
        }, 500);
    });
}


function setUpCloseIconEvents() {
    // $('.close-screen-viewers').click(() => {
    //     $('.view-screen-viewers').addClass('hidden');
    //     $('.view-screen-stream').removeClass('hidden').addClass('animated fadeInRight');
    // });

    $('.close-screen-leaderboard').click(() => {
        resetLeaderboardAnimation();
        bottomRowIconsAnim();
    });

    $('.close-screen-chat').click(() => {
        resetChatAnimation();
        bottomRowIconsAnim();
    });
}

export function circleNumberBadgeShow(number) {
    // SHOW data when available
    // LEADERBOARD
    $('.circle-number-badge-leaderboard').fadeIn();
    $('.circle-number-badge-leaderboard').text(number);

    // CHAT
    $('.circle-number-badge-chat').fadeIn();
    $('.circle-number-badge-chat').text('3');
}

export function circleNumberBadgeHide() {
    // HIDE circle data when not available
    // LEADERBOARD
    // $('.circle-number-badge-leaderboard').fadeOut();

    // CHAT
    // $('.circle-number-badge-chat').fadeOut();
}

export function resetLeaderboardAnimation() {
    $('.leaderboard-spinner').fadeIn();
    $('.leaderboard-content').fadeOut();

    $('.view-screen-leaderboard .toggle-leaderboard').addClass('hidden').removeClass('animated fadeInDown');
    $('.view-screen-leaderboard .title-icon').addClass('hidden').removeClass('animated fadeInDown');

    $('.view-screen-leaderboard').addClass('hidden');
    $('.view-screen-stream').removeClass('hidden').addClass('animated fadeInRight');

    $('.table-leaderboard').addClass('hidden').removeClass('animated fadeInUp');
}

export function bottomRowIconsAnim() {
    setTimeout(function() {
        $('.row-icons-stream').removeClass('hidden').addClass('animated fadeInUp');
    }, 400);
}

export function resetBottomRowIconsAnim() {
    $('.row-icons-stream').addClass('hidden').removeClass('animated fadeInUp');
}

export function resetChatAnimation() {
    $('.chat-spinner').fadeIn();
    $('.chat-content').fadeOut();

    $('.chat-window').removeClass('animated fadeInUp');
    $('.chat-window .btn-send').addClass('hidden').removeClass('animated fadeInUp');
    $('.view-screen-chat .title-icon').addClass('hidden').removeClass('animated fadeIn');

    $('.view-screen-chat').addClass('hidden');
    $('.view-screen-stream').removeClass('hidden').addClass('animated fadeInRight');

    $('.message-1').addClass('hidden').removeClass('animated fadeInUp');
    $('.message-2').addClass('hidden').removeClass('animated fadeInUp');
    $('.message-2').addClass('hidden').removeClass('animated fadeInUp');
    $('.message-3').addClass('hidden').removeClass('animated fadeInUp');
    $('.message-4').addClass('hidden').removeClass('animated fadeInUp');
    $('.message-5').addClass('hidden').removeClass('animated fadeInUp');
    $('.bottom-bar').addClass('hidden').removeClass('animated fadeInUp');
}

export function leaderboardAnimation() {
    $('.leaderboard-spinner').fadeOut();

    setTimeout(function() {
        $('.leaderboard-content').fadeIn();
        
        $('.view-screen-leaderboard .title-icon').removeClass('hidden').addClass('animated fadeInDown');
        
        setTimeout(function() {
            $('.view-screen-leaderboard .toggle-leaderboard').removeClass('hidden').addClass('animated fadeInDown');
        }, 50);
        setTimeout(function() {
            $('.table-leaderboard').removeClass('hidden').addClass('animated fadeInUp');
        }, 150);

    }, 250);
}

export function chatAnimation() {
    $('.chat-spinner').fadeOut();
    setTimeout(function() {
        $('.chat-content').fadeIn();
        $('.view-screen-chat .title-icon').removeClass('hidden').addClass('animated fadeIn');    
        $('.chat-window').addClass('animated fadeInUp');

        $('.message-1').removeClass('hidden').addClass('animated fadeInUp');
        
        setTimeout(function() {
            $('.message-2').removeClass('hidden').addClass('animated fadeInUp');
        }, 50);
        setTimeout(function() {
            $('.message-2').removeClass('hidden').addClass('animated fadeInUp');
        }, 150);
        setTimeout(function() {
            $('.message-3').removeClass('hidden').addClass('animated fadeInUp');
        }, 250);
        setTimeout(function() {
            $('.message-4').removeClass('hidden').addClass('animated fadeInUp');
        }, 350);
        setTimeout(function() {
            $('.message-5').removeClass('hidden').addClass('animated fadeInUp');
        }, 450);
        setTimeout(function() {
            $('.bottom-bar').removeClass('hidden').addClass('animated fadeInUp');
        }, 550);
        setTimeout(function() {
            $('.chat-window .btn-send').removeClass('hidden').addClass('animated fadeInUp');
        }, 650);
    }, 250);
}

function updateScore(name, score)
{
    let x;
    if(name == 'ethan')
    {
        x = parseInt(document.getElementById('ethan').innerHTML);
        document.getElementById('ethan').innerHTML = Math.round(score);   
    }
    else if(name == 'peter')
    {
        x = parseInt(document.getElementById('peter').innerHTML);
        document.getElementById('peter').innerHTML = Math.round(score);   
    }
    else
    {
        x = parseInt(document.getElementById('grace').innerHTML);
        document.getElementById('grace').innerHTML = Math.round(score);   
    }
}

let engagment = 0;
function updateEngagement(x)
{
    engagment += x;

    var count = parseInt(document.getElementById('subCount').innerHTML);
    var score = (Math.abs(engagment)/count)*100;
    var round = Math.round(score);
    document.getElementById('engagementnumber').innerHTML = String(round) + "%";
}
