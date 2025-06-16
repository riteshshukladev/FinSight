import React, { createContext, useContext,useEffect } from "react";
import { useEnhancedSMSData } from "./useSMSData"; // <-- use the correct hook

const SMSDataContext = createContext(null);

export const SMSDataProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const smsData = useEnhancedSMSData(); // <-- use the correct hook

  useEffect(() => {
    const interval = setInterval(() => {
      if (smsData && smsData.refreshMessages) {
        smsData.refreshMessages();
      }
    }, 12 * 60 * 60 * 1000); // 12 hours in ms

    return () => clearInterval(interval);
  }, [smsData]);
  return (
    <SMSDataContext.Provider value={smsData}>
      {children}
    </SMSDataContext.Provider>
  );
};

export const useSMSDataContext = () => useContext(SMSDataContext);
