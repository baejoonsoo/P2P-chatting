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
  call.style.display = 'flex';
  makeConnection();
};

const makeMsg = (msg, isMe) => {
  if (msg) {
    const writer = isMe ? 'myMsg' : 'anonMsg';
    const li = document.createElement('li');
    li.id = writer;
    const msgBox = document.createElement('div');
    li.append(msgBox);
    msgBox.innerText = msg;
    chatList.append(li);
    chatList.scrollTop = chatList.scrollHeight;
  }
};

const chatForm = (event) => {
  event.preventDefault();

  const input = chattingForm.querySelector('input');
  makeMsg(input.value, true);

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
  makeMsg(msg.data, false);
};

socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', AnonMsg);

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, roomName);
});

socket.on('offer', async (offer) => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', AnonMsg);
  });

  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
});

socket.on('answer', (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
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
  socket.emit('ice', data.candidate, roomName);
};
