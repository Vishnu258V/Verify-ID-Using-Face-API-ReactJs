import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import idCardImage from "./images/id.png";
import selfieImage from "./images/selfie.jpeg";

function App() {
  const idCardRef = useRef();
  const selfieRef = useRef();
  const idCardCanvasRef = useRef();
  const selfieCanvasRef = useRef();
  const [matchResult, setMatchResult] = useState("");

  useEffect(() => {
    const loadModelsAndDetectFaces = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

        const idCardFaceDetection = await detectFace(idCardRef.current, "ID Card");
        const selfieFaceDetection = await detectFace(selfieRef.current, "Selfie");

        if (idCardFaceDetection && selfieFaceDetection) {
          const distance = faceapi.euclideanDistance(
            idCardFaceDetection.descriptor,
            selfieFaceDetection.descriptor
          );

          const threshold = 0.6;
          const match = distance < threshold;

          setMatchResult(match ? "The faces match!" : "The faces do not match.");

          // Render detected faces
          renderFace(idCardRef.current, idCardFaceDetection.detection, idCardCanvasRef);
          renderFace(selfieRef.current, selfieFaceDetection.detection, selfieCanvasRef);
        } else {
          setMatchResult("Could not detect faces in both images.");
        }
      } catch (error) {
        console.error("Error in face detection:", error);
        setMatchResult("An error occurred during face detection.");
      }
    };

    loadModelsAndDetectFaces();
  }, []);

  const detectFace = async (imageRef, imageName) => {
    try {
      const detection = await faceapi
        .detectSingleFace(imageRef, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log(`No face detected in ${imageName} image`);
      }
      return detection;
    } catch (error) {
      console.error(`Error detecting face in ${imageName} image:`, error);
      return null;
    }
  };

  const renderFace = (image, detection, canvasRef) => {
    if (!detection) return;
    const { x, y, width, height } = detection.box;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  };

  return (
    <>
      <div>
        <img ref={idCardRef} src={idCardImage} alt="ID Card" style={{maxWidth: '300px'}} />
        <canvas ref={idCardCanvasRef}></canvas>
      </div>
      <div>
        <img ref={selfieRef} src={selfieImage} alt="Selfie" style={{maxWidth: '300px'}} />
        <canvas ref={selfieCanvasRef}></canvas>
      </div>
      <h1>{matchResult}</h1>
    </>
  );
}

export default App;

