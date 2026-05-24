import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, X } from 'lucide-react';

const AnimatedTimeline = ({ steps, currentStatus }) => {
  
  // Define status sequence
  const statusSequence = [
    'customer_confirmed',
    'contract_agreed',
    'documents_submitted',
    'documents_verified',
    'payment_submitted',
    'deposit_paid',
    'notarizing',
    'completed'
  ];

  const currentStepIndex = statusSequence.indexOf(currentStatus);

  const getStatusColor = (stepStatus, index) => {
    if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
        if (index === currentStepIndex) return 'text-red-500';
    }
    if (index < currentStepIndex || currentStatus === 'completed') return 'text-green-500';
    if (index === currentStepIndex) return 'text-purple-500';
    return 'text-gray-400';
  };

  const getLineColor = (index) => {
    if (index < currentStepIndex || currentStatus === 'completed') return 'bg-green-500';
    return 'bg-gray-200';
  };

  return (
    <div className="py-8">
      <div className="relative flex items-center justify-between">
        {/* Animated Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full rounded-full" />
        
        {/* Animated Progress Line */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ 
            width: currentStatus === 'completed' 
              ? '100%' 
              : `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || currentStatus === 'completed';
          const isCurrent = index === currentStepIndex && currentStatus !== 'rejected' && currentStatus !== 'cancelled';
          const isRejected = index === currentStepIndex && (currentStatus === 'rejected' || currentStatus === 'cancelled');

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.2 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 transition-colors duration-300
                  ${isCompleted ? 'border-green-500' : isCurrent ? 'border-purple-500' : isRejected ? 'border-red-500' : 'border-gray-300'}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : isRejected ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Circle className="w-4 h-4 text-purple-500 fill-current" />
                  </motion.div>
                ) : (
                  <Circle className="w-3 h-3 text-gray-300 fill-current" />
                )}
              </motion.div>
              
              <div className={`absolute top-12 w-32 text-center text-xs font-medium transition-colors duration-300 ${getStatusColor(step.id, index)}`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedTimeline;
