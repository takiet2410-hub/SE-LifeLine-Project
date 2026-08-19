import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { HealthAnswers } from '../api/bookingApi';

export interface ScheduleData {
  locationId?: string;
  date?: string;
  timeSlot?: string;
  healthAnswers?: HealthAnswers;
  // For storing location data from Step 1 to use in Step 3
  locationData?: {
    id: string;
    name: string;
    address: string;
    timeslots?: Array<{
      startTime: string;
      endTime: string;
      capacity: number;
      registeredCount: number;
    }>;
  };
}

interface ScheduleContextType {
  data: ScheduleData;
  updateData: (newData: Partial<ScheduleData>) => void;
  resetData: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ScheduleData>({});

  const updateData = (newData: Partial<ScheduleData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const resetData = () => {
    setData({});
  };

  return (
    <ScheduleContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    return {
      data: {},
      updateData: () => {},
      resetData: () => {},
    };
  }
  return context;
};
