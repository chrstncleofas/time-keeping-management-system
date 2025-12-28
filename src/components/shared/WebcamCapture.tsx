'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

type Props = {
  onClose?: () => void;
  onConfirm?: (dataUrl: string) => void;
};

export default function WebcamCapture({ onClose, onConfirm }: Props) {
  const webcamRef = useRef<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoConstraints = { facingMode };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setCapturedImage(imageSrc);
  }, []);

  const retake = () => setCapturedImage(null);

  const confirm = () => {
    if (!capturedImage) return;
    try {
      onConfirm?.(capturedImage);
    } finally {
      onClose?.();
    }
  };

  const toggleCamera = () =>
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-4xl h-[80vh] bg-transparent rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between shrink-0" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
          <h2 className="text-lg font-semibold">
            {capturedImage ? 'Review Photo' : 'Take Photo'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0 bg-black/60">
          <div className="w-full h-full flex items-center justify-center">
            {!capturedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-contain"
                />

                {/* Camera Overlay Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 md:w-72 md:h-72 border-4 border-white/40 rounded-lg"></div>
                </div>
              </div>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            )}
          </div>
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
                aria-label="Switch Camera"
              >
                ⟳
              </button>

              <button
                onClick={capture}
                className="p-5 md:p-6 rounded-full text-white transition-colors shadow-lg"
                title="Take Photo"
                aria-label="Take Photo"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                📷
              </button>

              <div className="w-12 md:w-16"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <button
                onClick={retake}
                className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--sidebar-text)' }}
                aria-label="Retake Photo"
              >
                Retake
              </button>

              <button
                onClick={confirm}
                className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm md:text-base"
                style={{ backgroundColor: 'var(--primary-color)' }}
                aria-label="Confirm Photo"
              >
                ✓
                <span>Confirm</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
