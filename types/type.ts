interface SMSMessage {
  _id?: string;
  address: string;
  date: string | number | Date;
  body: string;
  type?: "CREDIT" | "DEBIT";
  amount?: string | number;
  category?: string;
  confidence?: number;
  description?: string;
  merchant?: string;
  isFinancial?: boolean;
  hash?: string;
  processedAt?: string;
  rawSender?: string;
  batchNumber?: number;
}

interface TransactionStats {
  bank: {
    total: number;
    debits: number;
    credits: number;
    totalDebitAmount: number;
    totalCreditAmount: number;
  };
  upi: {
    total: number;
    debits: number;
    credits: number;
    totalDebitAmount: number;
    totalCreditAmount: number;
  };
}

// Define sync info structure
interface SyncInfo {
  lastSync: Date | null;
  totalMessages: number;
  bankCount: number;
  upiCount: number;
}

// Main return type for useEnhancedSMSData hook
interface UseEnhancedSMSDataReturn {
  // Messages
  allMessages: SMSMessage[];
  bankMessages: SMSMessage[];
  upiMessages: SMSMessage[];
  
  // State
  loading: boolean;
  processing: boolean;
  hasPermission: boolean;
  processingLogs: string[];
  // Functions
  refreshMessages: () => Promise<void> | void;
  forceRefresh: () => Promise<void> | void;
  getSyncInfo: () => Promise<SyncInfo>;
  getTransactionStats: () => TransactionStats;

  messages: SMSMessage[];
  loadBankMessages: () => Promise<void> | void;
}

// Export the type for use in context
export type { UseEnhancedSMSDataReturn, SMSMessage, TransactionStats, SyncInfo };