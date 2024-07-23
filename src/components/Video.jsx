import { useRef, useEffect } from 'react';
import styled from 'styled-components';

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  background: black;
  padding: 1rem;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-evenly;
  }
`;

const StyledVideo = styled.video`
  width: 100%;
  height: auto;
  max-width: 100%;
  border: 5px solid #007bff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  }

  @media (min-width: 768px) {
    width: 45%;
  }
`;

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
    <VideoContainer>
      <StyledVideo ref={localVideoRef} autoPlay playsInline />
      <StyledVideo ref={remoteVideoRef} autoPlay playsInline />
    </VideoContainer>
  );
};

export default Video;
