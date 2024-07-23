import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Video from './Video';
import { useDispatch, useSelector } from 'react-redux';
import { listUsers } from '../actions/userActions';
import styled from 'styled-components';

const ChatContainer = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  &:hover {
    background-color: #0056b3;
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f8f8f8;
`;

const CallStatus = styled.p`
  margin: 1rem 0;
  font-size: 1rem;
  color: ${props => (props.connected ? 'green' : 'red')};
`;

const IncomingCall = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
`;

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState('commonRoom'); // Common room ID for both users
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callStatus, setCallStatus] = useState('');
    const [incomingCall, setIncomingCall] = useState(false);
    const [incomingCallUser, setIncomingCallUser] = useState('');

    const dispatch = useDispatch();

    const userList = useSelector((state) => state.userList);
    const { users = [] } = userList;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        dispatch(listUsers());
    }, [dispatch]);

    useEffect(() => {
        const newSocket = io('https://vibeconnect-backend-u39d.onrender.com');
        setSocket(newSocket);
        console.log('Socket connection established:', newSocket.id);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('videoOffer', async (data) => {
                console.log('Received video offer:', data);
                const { offer, caller } = data;
                const newPeerConnection = createPeerConnection();
                setPeerConnection(newPeerConnection);
                await newPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                setIncomingCall(true);
                setIncomingCallUser(caller);
                playTune();
            });

            socket.on('videoAnswer', async (data) => {
                console.log('Received video answer:', data);
                const { answer } = data;
                if (peerConnection) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                }
                setCallStatus('Connected');
            });

            socket.on('iceCandidate', async (data) => {
                console.log('Received ICE candidate:', data);
                const { candidate } = data;
                if (peerConnection) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
            });

            socket.on('callRejected', () => {
                console.log('Call rejected by the user.');
                setCallStatus('Call rejected by the user.');
                alert('The user rejected your call.');
            });

            socket.on('callDisconnected', () => {
                console.log('Call disconnected.');
                setCallStatus('Call disconnected.');
                alert('The call has been disconnected.');
                resetCall();
            });
        }
    }, [socket, peerConnection, localStream]);

    const createPeerConnection = () => {
        const newPeerConnection = new RTCPeerConnection();
        newPeerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', event.candidate);
                socket.emit('iceCandidate', { room, candidate: event.candidate });
            }
        };

        newPeerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        if (localStream) {
            localStream.getTracks().forEach((track) => newPeerConnection.addTrack(track, localStream));
        }

        console.log('Created new RTCPeerConnection');
        return newPeerConnection;
    };

    const startCall = async (userId) => {
        if (!localStream) {
            alert('Please join the room first to start a call.');
            return;
        }
        console.log('Starting call with user:', userId);
        const newPeerConnection = createPeerConnection();
        setPeerConnection(newPeerConnection);

        const offer = await newPeerConnection.createOffer();
        await newPeerConnection.setLocalDescription(offer);
        socket.emit('videoOffer', { room, userId, offer, caller: userInfo.name });
        setCallStatus('Calling...');
        playTune();
        console.log('Video offer sent:', offer);
    };

    const joinRoom = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        socket.emit('joinRoom', { room });
        console.log('Joined room:', room);
    };

    const playTune = () => {
        const audio = new Audio('/src/assets/discord.mp3');
        audio.play();
        console.log('Playing tune');
    };

    const acceptCall = async () => {
        if (peerConnection) {
            const state = peerConnection.signalingState;
            console.log('Peer connection state before creating answer:', state);
            if (state === 'have-remote-offer' || state === 'have-local-pranswer') {
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('videoAnswer', { room, answer });
                setCallStatus('Connected');
                setIncomingCall(false);
                console.log('Call accepted, answer sent:', answer);
            } else {
                console.error('Cannot create an answer in state:', state);
            }
        }
    };

    const rejectCall = () => {
        socket.emit('callRejected', { room });
        setCallStatus('Call rejected.');
        setIncomingCall(false);
        console.log('Call rejected');
    };

    const endCall = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
        socket.emit('callDisconnected', { room });
        setCallStatus('Call ended.');
        resetCall();
        console.log('Call ended');
    };

    const resetCall = () => {
        setRemoteStream(null);
        setCallStatus('');
        console.log('Call reset');
    };

    return (
        <ChatContainer>
            <Title>Chat</Title>
            <Button onClick={joinRoom}>Join Room</Button>
            <UserList>
                {users.map((user) => (
                    <UserItem key={user._id}>
                        {user.name}
                        {user._id !== userInfo._id && <Button onClick={() => startCall(user._id)}>Call</Button>}
                    </UserItem>
                ))}
            </UserList>
            <Video localStream={localStream} remoteStream={remoteStream} />
            {callStatus && <CallStatus connected={callStatus === 'Connected'}>Status: {callStatus}</CallStatus>}
            {incomingCall && (
                <IncomingCall>
                    <p>{incomingCallUser} is calling you.</p>
                    <Button onClick={acceptCall}>Accept</Button>
                    <Button onClick={rejectCall}>Reject</Button>
                </IncomingCall>
            )}
            {callStatus === 'Connected' && <Button onClick={endCall}>End Call</Button>}
        </ChatContainer>
    );
};

export default Chat;
