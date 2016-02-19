var localStream;
var localPeerConnection;
var remotePeerConnection;
var users = [];
var me = null;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

localVideo.addEventListener('loadedmetadata', function() {
  trace('Local video currentSrc: ' + this.currentSrc +
    ', videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

remoteVideo.addEventListener('loadedmetadata', function() {
  trace('Remote video currentSrc: ' + this.currentSrc +
    ', videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

var total = '';

function trace(text) {
  total += text;
  console.log((window.performance.now() / 1000).toFixed(3) + ': ' + text);
}

function gotStream(stream) {
  trace('Received local stream');
  localVideo.src = URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
}

function start() {
  trace('Requesting local stream');
  startButton.disabled = true;
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  navigator.getUserMedia({
      video: true
    }, gotStream,
    function(error) {
      trace('navigator.getUserMedia error: ', error);
    });
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  trace('Starting call');

  if (localStream.getVideoTracks().length > 0) {
    trace('Using video device: ' + localStream.getVideoTracks()[0].label);
  }
  if (localStream.getAudioTracks().length > 0) {
    trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
  }

  var servers = null;

  localPeerConnection =
    new webkitRTCPeerConnection(servers); // eslint-disable-line new-cap
  trace('Created local peer connection object localPeerConnection');
  localPeerConnection.onicecandidate = gotLocalIceCandidate;

  remotePeerConnection =
    new webkitRTCPeerConnection(servers); // eslint-disable-line new-cap
  trace('Created remote peer connection object remotePeerConnection');
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.onaddstream = gotRemoteStream;

  localPeerConnection.addStream(localStream);
  trace('Added localStream to localPeerConnection');
  localPeerConnection.createOffer(gotLocalDescription);
}

function gotLocalDescription(description) {
  localPeerConnection.setLocalDescription(description);
  trace('Offer from localPeerConnection: \n' + description.sdp);
  remotePeerConnection.setRemoteDescription(description);
  remotePeerConnection.createAnswer(gotRemoteDescription);
}

function gotRemoteDescription(description) {
  remotePeerConnection.setLocalDescription(description);
  trace('Answer from remotePeerConnection: \n' + description.sdp);
  localPeerConnection.setRemoteDescription(description);
}

function hangup() {
  trace('Ending call');
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

function gotRemoteStream(event) {
  remoteVideo.src = URL.createObjectURL(event.stream);
  trace('Received remote stream');
}

function gotLocalIceCandidate(event) {
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function gotRemoteIceCandidate(event) {
  if (event.candidate) {
    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}



// Renders the gadget
function stateChangeHandler() {
  // Get state
  if (!wave.getState()) {
    return;
  }
  var state = wave.getState();
  users = state.get('users', '[]')
  console.log(" state users: ", users)
}

function partcipantChangeHandler() {
  me = wave.getViewer().getId();
  if (users.indexOf(me) < 0) {
    users.push(me);
  }
  wave.getState().submitDelta({
    users: users
  });
  console.log(" participant users: ", users)
}


function init() {
  if (wave && wave.isInWaveContainer()) {
    // Loads the gadget's initial state and the subsequent changes to it
    wave.setStateCallback(stateChangeHandler);

    // Loads participants and any changes to them
    wave.setParticipantCallback(partcipantChangeHandler);
    console.log("wave state loaded")
  }

  // resetStatus();
  // openChannel('AHRlWrqvgCpvbd9B-Gl5vZ2F1BlpwFv0xBUwRgLF/* ...*/');
  // doGetUserMedia();

}
// Initializes gadget after receiving a notification that the page is loaded and the DOM is ready.
gadgets.util.registerOnLoadHandler(init);

/*
card = document.getElementById("card");
localVideo = document.getElementById("localVideo");
miniVideo = document.getElementById("miniVideo");
remoteVideo = document.getElementById("remoteVideo");
var pc = new webkitRTCPeerConnection(servers, {
  optional: [{
    RtpDataChannels: true
  }]
});

pc.ondatachannel = function(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = function(event) {
    document.querySelector("div#receive").innerHTML = event.data;
  };
};

sendChannel = pc.createDataChannel("sendDataChannel", {
  reliable: false
});

document.querySelector("button#send").onclick = function() {
  var data = document.querySelector("textarea#send").value;
  sendChannel.send(data);
};



function onUserMediaSuccess(stream) {
  console.log("User has granted access to local media.");
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(localVideo, stream);
  localVideo.style.opacity = 1;
  localStream = stream;
  // Caller creates PeerConnection.
  if (initiator) maybeStart();
}

function maybeStart() {
  if (!started && localStream && channelReady) {
    // ...
    createPeerConnection();
    // ...
    pc.addStream(localStream);
    started = true;
    // Caller initiates offer to peer.
    if (initiator)
      doCall();
  }
}

function createPeerConnection() {
  var pc_config = {
    "iceServers": [{
      "url": "stun:stun.l.google.com:19302"
    }]
  };
  try {
    // Create an RTCPeerConnection via the polyfill (adapter.js).
    pc = new RTCPeerConnection(pc_config);
    pc.onicecandidate = onIceCandidate;
    console.log("Created RTCPeerConnnection with config:\n" + "  \"" +
      JSON.stringify(pc_config) + "\".");
  } catch (e) {
    console.log("Failed to create PeerConnection, exception: " + e.message);
    alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.");
    return;
  }

  pc.onconnecting = onSessionConnecting;
  pc.onopen = onSessionOpened;
  pc.onaddstream = onRemoteStreamAdded;
  pc.onremovestream = onRemoteStreamRemoved;
}

function onRemoteStreamAdded(event) {
  // ...
  miniVideo.src = localVideo.src;
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
  waitForRemoteVideo();
}

function doCall() {
  console.log("Sending offer to peer.");
  pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function onIceCandidate(event) {
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log("End of candidates.");
  }
}

function sendMessage(message) {
  var msgString = JSON.stringify(message);
  console.log('C->S: ' + msgString);
  wave.getState().submitDelta(message);
  // path = '/message?r=99688636' + '&u=92246248';
  // var xhr = new XMLHttpRequest();
  // xhr.open('POST', path, true);
  // xhr.send(msgString);
}

function processSignalingMessage(message) {
  var msg = JSON.parse(message);

  if (msg.type === 'offer') {
    // Callee creates PeerConnection
    if (!initiator && !started)
      maybeStart();

    pc.setRemoteDescription(new RTCSessionDescription(msg));
    doAnswer();
  } else if (msg.type === 'answer' && started) {
    pc.setRemoteDescription(new RTCSessionDescription(msg));
  } else if (msg.type === 'candidate' && started) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: msg.label,
      candidate: msg.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (msg.type === 'bye' && started) {
    onRemoteHangup();
  }
}

function doAnswer() {
  console.log("Sending answer to peer.");
  pc.createAnswer(setLocalAndSendMessage, null, mediaConstraints);
}
*/
