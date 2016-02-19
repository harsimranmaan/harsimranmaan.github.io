var localStream;
var localPeerConnection;
var remotePeerConnection;
var users = [];
var candidates = {};
var descriptions = {};
var me = null;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var initComplete = false;
var servers = {
  "iceServers": [{
    url: 'stun:stun.iptel.org'
  }, {
    url: 'stun:stun.rixtelecom.se'
  }, {
    url: 'stun:stun.schlund.de'
  }, {
    url: 'stun:stun.l.google.com:19302'
  }, {
    url: 'stun:stun1.l.google.com:19302'
  }, {
    url: 'stun:stun2.l.google.com:19302'
  }, {
    url: 'stun:stun3.l.google.com:19302'
  }, {
    url: 'stun:stun4.l.google.com:19302'
  }, {
    url: 'stun:stunserver.org'
  }, {
    url: 'stun:stun.voxgratia.org'
  }, {
    url: 'turn:numb.viagenie.ca',
    credential: 'muazkh',
    username: 'webrtc@live.com'
  }]
};

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
var stopButton = document.getElementById('stopButton');
var startMeetingButton = document.getElementById('startMeetingButton');
var endMeetingButton = document.getElementById('endMeetingButton');
startButton.disabled = true;
stopButton.disabled = true;
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;
stopButton.onclick = stop;
// startMeetingButton.onclick = startMeeting;
// endMeetingButton.onclick = endMeeting;
// endMeetingButton.disabled = true;



// function endMeeting() {
//   startMeeting();
//   if (wave != null) {
//     endMeetingButton.disabled = true;
//     startMeetingButton.disabled = false;
//     startButton.disabled = true;
//   }
// }

function gotStream(stream) {
  trace('Received local stream');
  localVideo.src = URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
}

function start() {
  trace('Requesting local stream');
  startButton.disabled = true;
  stopButton.disabled = false;
  navigator.getUserMedia({
      video: true,
      audio: true
    }, gotStream,
    function(error) {
      trace('navigator.getUserMedia error: ', error);
    });
}

function stop() {

  startButton.disabled = false;
  stopButton.disabled = true;

  localStream.getVideoTracks()[0].stop()
  localStream.getAudioTracks()[0].stop()

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


  localPeerConnection.addStream(localStream);
  trace('Added localStream to localPeerConnection');
  localPeerConnection.createOffer(gotLocalDescription);
}

function gotLocalDescription(description) {
  localPeerConnection.setLocalDescription(description);
  trace('Offer from localPeerConnection: \n' + description.sdp);
  if (wave != null) {
    descriptions[me] = descriptions[me] || [];
    descriptions[me].push(description);
    wave.getState().submitDelta({
      'descriptions': descriptions
    });
  }
}

function gotRemoteDescription(description) {
  remotePeerConnection.setLocalDescription(description);
  trace('Answer from remotePeerConnection: \n' + description.sdp);
  localPeerConnection.setRemoteDescription(description);
}

function hangup() {
  trace('Ending call');
  hangupButton.disabled = true;
  callButton.disabled = false;
  remotePeerConnection.close();
  localPeerConnection.close();
  //  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  remoteVideo.src = null;
}

function gotRemoteStream(event) {
  remoteVideo.src = URL.createObjectURL(event.stream);
  trace('Received remote stream');
}

function gotLocalIceCandidate(event) {
  if (event.candidate) {
    if (wave != null) {
      candidates[me] = candidates[me] || [];
      candidates[me].push(event.candidate);
      wave.getState().submitDelta({
        'candidates': candidates
      });
    }
    //remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
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
  if (!wave.getState() || !wave.getViewer()) {
    return;
  }
  if (!initComplete) {
    wave.getState().submitDelta({
      'candidates': {},
      'users': [],
      'descriptions': {}
    })
    candidates = {};
    descriptions = {};
    users = [];
    localPeerConnection =
      new RTCPeerConnection(servers); // eslint-disable-line new-cap
    trace('Created local peer connection object localPeerConnection');
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    remotePeerConnection =
      new RTCPeerConnection(servers); // eslint-disable-line new-cap
    trace('Created remote peer connection object remotePeerConnection');
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    remotePeerConnection.onaddstream = gotRemoteStream;
    startButton.disabled = false;
    initComplete = true
    return
  }
  me = wave.getViewer().getId();
  if (users.indexOf(me) < 0) {
    users.push(me);
    wave.getState().submitDelta({
      'users': users
    });
  }
  var state = wave.getState();
  users = state.get('users', users) || [];
  candidates = state.get('candidates', candidates) || {};
  descriptions = state.get('descriptions', descriptions) || {};

  //only if started
  if (users[me]) {
    for (var property in candidates) {
      if (candidates.hasOwnProperty(property) && property != me && remotePeerConnection && candidates[property].length) {
        for (var c in candidates[property]) {
          remotePeerConnection.addIceCandidate(new RTCIceCandidate(candidates[property][candidates[property].length - 1]));
          console.log("Setting remote candidate", candidates[property])
        }
        break; // No conference
      }
    }

    for (var property in descriptions) {
      if (descriptions.hasOwnProperty(property) && property != me && remotePeerConnection && descriptions[property].length) {
        remotePeerConnection.setRemoteDescription(new RTCSessionDescription(descriptions[property][descriptions[property].length - 1]));
        remotePeerConnection.createAnswer(gotRemoteDescription);
        console.log("Setting remote description", descriptions[property])
        break; // No conference
      }
    }
  }
  console.log(" state users: ", users);
  console.log(" state candidates: ", candidates);
  console.log(" state descriptions: ", descriptions);
}


function init() {
  if (wave && wave.isInWaveContainer()) {
    // Loads the gadget's initial state and the subsequent changes to it
    wave.setStateCallback(stateChangeHandler);
    // Loads participants and any changes to them
    wave.setParticipantCallback(stateChangeHandler);
    console.log("wave state loaded")
  }

}
// Initializes gadget after receiving a notification that the page is loaded and the DOM is ready.
gadgets.util.registerOnLoadHandler(init);
