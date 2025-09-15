import React, { createContext, useContext, useEffect } from "react";
import { useEnhancedSMSData } from "./useSMSData";
import type { UseEnhancedSMSDataReturn } from "@/types/type";
const SMSDataContext = createContext<UseEnhancedSMSDataReturn | null>(null);

export const SMSDataProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const smsData = useEnhancedSMSData();

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (smsData?.refreshNewOnly && !smsData.processing) {
          smsData.refreshNewOnly(); // silent incremental
        }
      },
      5 * 60 * 1000
    ); // every 5 minutes (testing)
    return () => clearInterval(interval);
  }, [smsData]);

  return (
    <SMSDataContext.Provider value={smsData}>
      {children}
    </SMSDataContext.Provider>
  );
};

export const useSMSDataContext = () => useContext(SMSDataContext);
