'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCw, Check } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
        <h2 className="text-lg font-semibold">
          {capturedImage ? 'Review Photo' : 'Take Photo'}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        {!capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Camera Overlay Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 md:w-80 md:h-80 border-4 border-white/40 rounded-lg"></div>
            </div>
          </div>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-4 md:p-6 shrink-0" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
        {!capturedImage ? (
          <div className="flex items-center justify-center gap-6 md:gap-8">
            <button
              onClick={toggleCamera}
              className="p-3 md:p-4 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--sidebar-text)' }}
              title="Switch Camera"
            >
              <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={capture}
              className="p-5 md:p-6 rounded-full text-white transition-colors shadow-lg"
              title="Take Photo"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <Camera className="w-7 h-7 md:w-8 md:h-8" />
            </button>

            <div className="w-12 md:w-16"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <button
              onClick={retake}
              className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--sidebar-text)' }}
            >
              Retake
            </button>

            <button
              onClick={confirm}
              className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm md:text-base"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <Check className="w-4 h-4 md:w-5 md:h-5" />
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
