import React, { createContext, useContext } from "react";
import { useSMSData } from "./useSMSData";

const SMSDataContext = createContext(null);

export const SMSDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const smsData = useSMSData();
  return (
    <SMSDataContext.Provider value={smsData}>
      {children}
    </SMSDataContext.Provider>
  );
};

export const useSMSDataContext = () => useContext(SMSDataContext);