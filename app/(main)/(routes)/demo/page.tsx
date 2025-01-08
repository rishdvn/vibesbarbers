'use client';
import { useState } from 'react';

interface Step {
  label: string;
  completed?: boolean;
}

interface MultiStepProgressProps {
  steps?: Step[];
  currentStep?: number;
  onChange?: (step: number) => void;
}

const MultiStepProgress = ({ 
  steps = [
    { label: 'Details' },
    { label: 'Address' },
    { label: 'Payment' },
    { label: 'Confirm' }
  ],
  currentStep = 1,
  onChange
}: MultiStepProgressProps) => {
  const [activeStep, setActiveStep] = useState(currentStep);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    onChange?.(index);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full bg-gray-200 -translate-y-1/2" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <button
              onClick={() => handleStepClick(index + 1)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all
                ${index + 1 <= activeStep 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : 'border-gray-300 bg-white text-gray-500'}`}
            >
              {index + 1 <= activeStep ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </button>
            <span className={`mt-2 text-xs ${
              index + 1 === activeStep ? 'text-blue-500 font-medium' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Demo Controls - Remove this section when using as a component */}
      <div className="mt-8 flex justify-end gap-2">
        <button
          onClick={() => handleStepClick(Math.max(1, activeStep - 1))}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={activeStep === 1}
        >
          Back
        </button>
        <button
          onClick={() => handleStepClick(Math.min(steps.length, activeStep + 1))}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={activeStep === steps.length}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MultiStepProgress;