import Peer from 'skyway-js';
import { DataConnection, MediaConnection } from 'skyway-js';
const API_KEY = "e316eaa7-4c1c-468c-b23a-9ce51b074ab7";
const userName = window.prompt("Please input user name", "")

const myPeer = new Peer (userName as string,{
  key: API_KEY,
  debug: 3
});

(async function main() {
  let localVideo = document.getElementById('js-local-stream') as HTMLVideoElement;
  const localId = document.getElementById('js-local-id');
  const captureTrigger = document.getElementById('js-startcapture-trigger')!;
  const callTrigger = document.getElementById('js-call-trigger')!;
  const closeTrigger = document.getElementById('js-close-trigger')!;
  const localText = document.getElementById('js-local-text')as HTMLInputElement;
  const sendTrigger = document.getElementById('js-send-trigger')!;
  const remoteVideo = document.getElementById('js-remote-stream') as HTMLVideoElement;
  const remoteId = document.getElementById('js-remote-id') as HTMLInputElement;
  const messages = document.getElementById('js-messages');
  let videoDevicesElement = document.getElementById('video-device');
  let localVideoBox = document.getElementsByName('stream-type') as NodeListOf<HTMLInputElement>;
  //let localVideoCodec = document.getElementById('js-video-codec').value;
  let localVideoType = 'camera';

  let localStream : MediaStream | null = null;

  captureTrigger.addEventListener('click', () => {
    for (var i = 0; i < localVideoBox.length; ++i) {
      if (localVideoBox[i].checked) {
        localVideoType = localVideoBox[i].value;
      }
    }
    if (localVideoType == 'camera') {
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: Number((document.getElementById('video-width') as HTMLInputElement).value),
          height: Number((document.getElementById('video-height') as HTMLInputElement).value),
          frameRate: Number((document.getElementById('video-rate') as HTMLInputElement).value),
          /*deviceId: {
            exact: cameraOptions.value
          }*/
        }
      }).then(function (mediaStream) {
        localStream = mediaStream;
        localVideo.srcObject = mediaStream;
        localVideo.playsInline = true;
        localVideo.play().catch(console.error);
      })
    }
    else if (localVideoType == 'screen') {
      navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          width: Number((document.getElementById('video-width') as HTMLInputElement).value),
          height: Number((document.getElementById('video-height') as HTMLInputElement).value),
          frameRate: Number((document.getElementById('video-rate') as HTMLInputElement).value)
        }
      }).then(function (mediaStream) {
        localStream = mediaStream;
        localVideo.srcObject = mediaStream;
        localVideo.playsInline = true;
        localVideo.play().catch(console.error);
      });
    }
  })

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (myPeer.open) {
      return;
    }

    let mediaConnection = myPeer.call(remoteId.value, localStream!, {
      videoCodec: String((document.getElementById('js-video-codec') as HTMLInputElement).value)
    });

    mediaConnection.on('stream', async (stream:MediaStream) => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      (remoteVideo.srcObject! as MediaStream).getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    let dataConnection = myPeer.connect(remoteId.value);

    dataConnection.once('open', async () => {
      messages!.textContent += `=== DataConnection has been opened ===\n`;

      sendTrigger.addEventListener('click', onClickSend);
    });

    dataConnection.on('data', (data:String) => {
      messages!.textContent += `${dataConnection.remoteId}: ${data}\n`;
    });

    dataConnection.once('close', () => {
      messages!.textContent += `=== DataConnection has been closed ===\n`;
      sendTrigger.removeEventListener('click', onClickSend);

    });

    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages!.textContent += `You: ${data}\n`;
      localText.value = '';
    }

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  myPeer.once('open', (id:string) => {
    (localId!.textContent = id)
  });

  // Register callee handler
  myPeer.on('call', (mediaConnection:MediaConnection) => {
    mediaConnection.answer(localStream!, {
      videoCodec: String((document.getElementById('js-video-codec')! as HTMLInputElement).value)
    });

    mediaConnection.on('stream', async (stream:MediaStream) => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      (remoteVideo.srcObject! as MediaStream).getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  myPeer.on('connection', (dataConnection:DataConnection) => {
    dataConnection.once('open', async () => {
      messages!.textContent += `=== DataConnection has been opened ===\n`;

      sendTrigger.addEventListener('click', onClickSend);
    });

    dataConnection.on('data', (data:String) => {
      messages!.textContent += `${dataConnection.remoteId}: ${data}\n`;
    });

    dataConnection.once('close', () => {
      messages!.textContent += `=== DataConnection has been closed ===\n`;
      sendTrigger.removeEventListener('click', onClickSend);
    });

    // Register closing handler
    closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });

    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages!.textContent += `You: ${data}\n`;
      localText.value = '';
    }
  });

  myPeer.on('error', console.error);
})();