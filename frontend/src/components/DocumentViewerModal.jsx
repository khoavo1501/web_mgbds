import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

const DocumentViewerModal = ({ isOpen, onClose, documentUrl, documentName, documentType }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = documentType === 'pdf' || (documentUrl && documentUrl.toLowerCase().endsWith('.pdf'));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-11/12 max-w-5xl h-[85vh]'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-800 truncate">{documentName || 'Xem tài liệu'}</h3>
            <div className="flex items-center gap-2">
              {!isPdf && (
                <>
                  <button onClick={handleZoomOut} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Zoom Out">
                    <ZoomOut className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={handleZoomIn} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Zoom In">
                    <ZoomIn className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={handleRotate} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Rotate">
                    <RotateCw className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Fullscreen">
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Download">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-gray-100 overflow-auto relative flex items-center justify-center p-4">
            {isPdf ? (
              <iframe
                src={`${documentUrl}#toolbar=0`}
                className="w-full h-full rounded shadow-sm bg-white"
                title={documentName}
              />
            ) : (
              <motion.div
                animate={{ scale, rotate: rotation }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                <img
                  src={documentUrl}
                  alt={documentName}
                  className="max-w-none max-h-none shadow-lg rounded"
                  style={{ transformOrigin: 'center center' }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentViewerModal;
