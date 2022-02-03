var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Peer from './node_modules/skyway-js/skyway-js';
const API_KEY = "e316eaa7-4c1c-468c-b23a-9ce51b074ab7";
const userName = window.prompt("Please input user name", "");
const myPeer = new Peer(userName, {
    key: API_KEY,
    debug: 3
});
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let localVideo = document.getElementById('js-local-stream');
        const localId = document.getElementById('js-local-id');
        const captureTrigger = document.getElementById('js-startcapture-trigger');
        const callTrigger = document.getElementById('js-call-trigger');
        const closeTrigger = document.getElementById('js-close-trigger');
        const localText = document.getElementById('js-local-text');
        const sendTrigger = document.getElementById('js-send-trigger');
        const remoteVideo = document.getElementById('js-remote-stream');
        const remoteId = document.getElementById('js-remote-id');
        const messages = document.getElementById('js-messages');
        let videoDevicesElement = document.getElementById('video-device');
        let localVideoBox = document.getElementsByName('stream-type');
        //let localVideoCodec = document.getElementById('js-video-codec').value;
        let localVideoType = 'camera';
        let localStream = null;
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
                        width: Number(document.getElementById('video-width').value),
                        height: Number(document.getElementById('video-height').value),
                        frameRate: Number(document.getElementById('video-rate').value),
                        /*deviceId: {
                          exact: cameraOptions.value
                        }*/
                    }
                }).then(function (mediaStream) {
                    localStream = mediaStream;
                    localVideo.srcObject = mediaStream;
                    localVideo.playsInline = true;
                    localVideo.play().catch(console.error);
                });
            }
            else if (localVideoType == 'screen') {
                navigator.mediaDevices.getDisplayMedia({
                    audio: false,
                    video: {
                        width: Number(document.getElementById('video-width').value),
                        height: Number(document.getElementById('video-height').value),
                        frameRate: Number(document.getElementById('video-rate').value)
                    }
                }).then(function (mediaStream) {
                    localStream = mediaStream;
                    localVideo.srcObject = mediaStream;
                    localVideo.playsInline = true;
                    localVideo.play().catch(console.error);
                });
            }
        });
        // Register caller handler
        callTrigger.addEventListener('click', () => {
            // Note that you need to ensure the peer has connected to signaling server
            // before using methods of peer instance.
            if (myPeer.open) {
                return;
            }
            let mediaConnection = myPeer.call(remoteId.value, localStream, {
                videoCodec: String(document.getElementById('js-video-codec').value)
            });
            mediaConnection.on('stream', (stream) => __awaiter(this, void 0, void 0, function* () {
                // Render remote stream for caller
                remoteVideo.srcObject = stream;
                remoteVideo.playsInline = true;
                yield remoteVideo.play().catch(console.error);
            }));
            mediaConnection.once('close', () => {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject = null;
            });
            let dataConnection = myPeer.connect(remoteId.value);
            dataConnection.once('open', () => __awaiter(this, void 0, void 0, function* () {
                messages.textContent += `=== DataConnection has been opened ===\n`;
                sendTrigger.addEventListener('click', onClickSend);
            }));
            dataConnection.on('data', (data) => {
                messages.textContent += `${dataConnection.remoteId}: ${data}\n`;
            });
            dataConnection.once('close', () => {
                messages.textContent += `=== DataConnection has been closed ===\n`;
                sendTrigger.removeEventListener('click', onClickSend);
            });
            function onClickSend() {
                const data = localText.value;
                dataConnection.send(data);
                messages.textContent += `You: ${data}\n`;
                localText.value = '';
            }
            closeTrigger.addEventListener('click', () => mediaConnection.close(true));
        });
        myPeer.once('open', (id) => {
            (localId.textContent = id);
        });
        // Register callee handler
        myPeer.on('call', (mediaConnection) => {
            mediaConnection.answer(localStream, {
                videoCodec: String(document.getElementById('js-video-codec').value)
            });
            mediaConnection.on('stream', (stream) => __awaiter(this, void 0, void 0, function* () {
                // Render remote stream for callee
                remoteVideo.srcObject = stream;
                remoteVideo.playsInline = true;
                yield remoteVideo.play().catch(console.error);
            }));
            mediaConnection.once('close', () => {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                remoteVideo.srcObject = null;
            });
            closeTrigger.addEventListener('click', () => mediaConnection.close(true));
        });
        myPeer.on('connection', (dataConnection) => {
            dataConnection.once('open', () => __awaiter(this, void 0, void 0, function* () {
                messages.textContent += `=== DataConnection has been opened ===\n`;
                sendTrigger.addEventListener('click', onClickSend);
            }));
            dataConnection.on('data', (data) => {
                messages.textContent += `${dataConnection.remoteId}: ${data}\n`;
            });
            dataConnection.once('close', () => {
                messages.textContent += `=== DataConnection has been closed ===\n`;
                sendTrigger.removeEventListener('click', onClickSend);
            });
            // Register closing handler
            closeTrigger.addEventListener('click', () => dataConnection.close(true), {
                once: true,
            });
            function onClickSend() {
                const data = localText.value;
                dataConnection.send(data);
                messages.textContent += `You: ${data}\n`;
                localText.value = '';
            }
        });
        myPeer.on('error', console.error);
    });
})();
