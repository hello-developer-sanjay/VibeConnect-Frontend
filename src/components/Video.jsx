import  { useRef, useEffect } from 'react';

const Video = ({ localStream, remoteStream }) => {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div>
            <video ref={localVideoRef} autoPlay playsInline />
            <video ref={remoteVideoRef} autoPlay playsInline />
        </div>
    );
};

export default Video;
