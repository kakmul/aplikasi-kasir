import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Scan, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (sku: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(false);

  // Simulated barcode detection - in a real app, you'd use a proper barcode scanning library
  const handleScan = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Simulate finding a barcode - in reality, you'd process the image
        // This is just for demonstration
        const mockSku = 'SKU' + Math.floor(Math.random() * 1000000);
        onScan(mockSku);
        setScanning(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-red-500 w-64 h-32 rounded-lg"></div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Scan size={20} className="mr-2" />
            {scanning ? 'Scanning...' : 'Scan Barcode'}
          </button>
        </div>
      </div>
    </div>
  );
}
