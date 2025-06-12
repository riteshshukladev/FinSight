import React, { createContext, useContext } from "react";
import { useEnhancedSMSData } from "./useSMSData"; // <-- use the correct hook

const SMSDataContext = createContext(null);

export const SMSDataProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const smsData = useEnhancedSMSData(); // <-- use the correct hook
  return (
    <SMSDataContext.Provider value={smsData}>
      {children}
    </SMSDataContext.Provider>
  );
};

export const useSMSDataContext = () => useContext(SMSDataContext);
