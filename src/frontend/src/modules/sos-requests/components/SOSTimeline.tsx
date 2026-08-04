import React from 'react';
import type { SOSStatus } from '../services/mockSosData';
import { Check, Clock, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineStep {
  status: SOSStatus;
  label: string;
  description: string;
}

const STEPS: TimelineStep[] = [
  { status: 'Pending', label: 'Request Submitted', description: 'Waiting for Blood Center review' },
  { status: 'EvaluationInProgress', label: 'Validating Request', description: 'Verifying hospital and patient details' },
  { status: 'NotificationsDispatched', label: 'Processing Blood', description: 'Preparing blood units for dispatch' },
  { status: 'Fulfilled', label: 'Request Fulfilled', description: 'Blood dispatched to hospital' },
];

interface SOSTimelineProps {
  currentStatus: SOSStatus;
  className?: string;
}

export const SOSTimeline: React.FC<SOSTimelineProps> = ({ currentStatus, className }) => {
  if (currentStatus === 'EvaluationFailed' || currentStatus === 'Cancelled' || currentStatus === 'Expired') {
    return (
      <div className={cn("p-4 rounded-lg bg-brand-error/10 border border-brand-error/20 text-brand-error", className)}>
        <p className="font-medium flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-error animate-pulse" />
          This SOS Request was {currentStatus}
        </p>
        <p className="text-sm mt-1 opacity-90">Please contact the Blood Center for more details.</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex(s => s.status === currentStatus);

  return (
    <div className={cn("py-6", className)}>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-brand-border-dark hidden md:block" />
        <div className="space-y-8 relative">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.status} className="flex gap-4 md:gap-6 relative">
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-brand-bg-card transition-colors duration-300",
                      isCompleted ? "border-brand-success bg-brand-success text-white" :
                      isCurrent ? "border-brand-primary text-brand-primary ring-4 ring-brand-primary/10" :
                      "border-brand-border-dark text-brand-text-muted"
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> :
                     isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  {/* Mobile line */}
                  {index !== STEPS.length - 1 && (
                    <div className={cn(
                      "w-0.5 h-full mt-2 md:hidden",
                      isCompleted ? "bg-brand-success" : "bg-brand-border-dark"
                    )} />
                  )}
                </div>
                
                <div className="pt-2.5 pb-6 md:pb-0">
                  <h4 className={cn(
                    "text-base font-semibold",
                    isCompleted || isCurrent ? "text-brand-text-main" : "text-brand-text-muted"
                  )}>
                    {step.label}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1",
                    isCompleted || isCurrent ? "text-brand-text-secondary" : "text-brand-text-muted"
                  )}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
