var signalServer = "https://" + location.host.split(":")[0] + ":9000/";
var socket;

var video;
var webRtcPeer;
var cameraName;

window.onload = function () {
    video = document.getElementById('video');

    // get the camera name from the parameter
    var urlParams = new URLSearchParams(window.location.search);
    cameraName = urlParams.get('camera');
    
    // dynamically load the signal.io.js library so its not hardcoded in index.html
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = signalServer + 'socket.io/socket.io.js';
    script.async = false;
    script.onload = function () {
        console.log("Connecting to signal server: " + signalServer)

        socket = io(signalServer);

        socket.on("connect", function () {
            viewer();
        });

        socket.on("message", function (msg) {
            var parsedMessage = JSON.parse(msg);
            console.info("Received message: " + msg);

            switch (parsedMessage.id) {
                case 'presenterResponse':
                    presenterResponse(parsedMessage);
                    break;
                case 'viewerResponse':
                    viewerResponse(parsedMessage);
                    break;
                case 'stopCommunication':
                    dispose();
                    break;
                case 'iceCandidate':
                    webRtcPeer.addIceCandidate(parsedMessage.candidate)
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        });
    };
    document.body.appendChild(script);
}

window.onbeforeunload = function () {

    // disconnect from server
    console.log("Disconnecting from signal server");
    socket.disconnect();
}

function presenterResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.warn('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function viewerResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.warn('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

function viewer() {
    if (!webRtcPeer) {
        if (cameraName == "") {
            alert("Please enter a camera name!");
            return;
        }
        showSpinner(video);

        var options = {
            remoteVideo: video,
            onicecandidate: onIceCandidate,
            configuration: {
                iceServers: [
                    { "urls": "stun:54.83.10.15:3478" },
                    { "urls": "turn:54.83.10.15", "username": "test", "credential": "test" }
                ]
            }
        }

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) return onError(error);

            this.generateOffer(onOfferViewer);
        });
    }
}

function onOfferViewer(error, offerSdp) {
    if (error) return onError(error)

    var message = {
        id: 'viewer',
        sdpOffer: offerSdp
    }
    socket.emit('join', cameraName, function (err, roomDescription) {
        console.log("Connecting to cameraName: " + cameraName);
        sendMessage(message);
    });
}

function onIceCandidate(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));

    var message = {
        id: 'onIceCandidate',
        candidate: candidate
    }
    sendMessage(message);
}

function stop() {
    if (webRtcPeer) {
        var message = {
            id: 'stop'
        }
        sendMessage(message);
        dispose();
    }
}

function dispose() {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
    hideSpinner(video);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    socket.emit('message', jsonMessage);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}
