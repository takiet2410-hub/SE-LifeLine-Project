import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface ScheduleData {
  locationId?: string;
  date?: string;
  timeSlot?: string;
  healthAnswers?: Record<string, boolean>;
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
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
};
