const socket = io();

const call = document.querySelector('#call');

call.hidden = true;

let roomName;
let myPeerConnection;
let myDataChannel;

const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  makeConnection();
};

const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initCall();
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
};

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

//socket code

socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', (msg) => console.log(msg.data));
  console.log('made data channel');

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log('sent the offer');
  socket.emit('offer', offer, roomName);
});

socket.on('offer', async (offer) => {
  console.log('received the offer');
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', (msg) => console.log(msg.data));
  });

  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
  console.log('sent the answer');
});

socket.on('answer', (answer) => {
  console.log('received the answer');
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
  console.log('received candidate');
  myPeerConnection.addIceCandidate(ice);
});

//RTC code

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  });
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('addstream', handleAddStream);
};

const handleAddStream = (data) => {
  const peersFace = document.querySelector('#peersFace');
  peersFace.srcObject = data.stream;
};

const handleIce = (data) => {
  console.log('sent candidate');
  socket.emit('ice', data.candidate, roomName);
};
