const socket = io();

const call = document.querySelector('#call');
const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');

const chatList = call.querySelector('#chatList');
const chattingForm = call.querySelector('#chattingForm');

call.hidden = true;

let roomName;
let myPeerConnection;
let myDataChannel;

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  makeConnection();
};

const makeMsg = (msg) => {
  const li = document.createElement('li');
  li.innerText = msg;
  chatList.append(li);
};

const chatForm = (event) => {
  event.preventDefault();

  const input = chattingForm.querySelector('input');
  makeMsg(`you : ${input.value}`);

  if (myDataChannel) {
    myDataChannel.send(input.value);
  }

  input.value = '';
};

chattingForm.addEventListener('submit', chatForm);

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

const AnonMsg = (msg) => {
  makeMsg(`Anon : ${msg.data}`);
};

socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', AnonMsg);
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
    myDataChannel.addEventListener('message', AnonMsg);
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
