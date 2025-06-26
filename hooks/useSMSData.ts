import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SmsAndroid = null;
if (Platform.OS === 'android') {
  try {
    SmsAndroid = require('react-native-get-sms-android');
  } catch (e) {
    console.warn('SMS module not available:', e);
  }
}

// Simplified storage keys for Bank and UPI only
const STORAGE_KEYS = {
  PROCESSED_MESSAGES: 'processed_bank_upi_messages',
  LAST_SYNC: 'last_sync_timestamp',
  MESSAGE_HASHES: 'message_hashes',
  CATEGORIES: {
    BANK: 'bank_transactions',
    UPI: 'upi_transactions'
  }
};

// Focused AI prompt for Bank and UPI transactions only
const AI_CLASSIFICATION_PROMPT = `
You are a specialized SMS classifier for BANK and UPI transactions ONLY.

STRICT REQUIREMENTS - Return ONLY these two types:

1. BANK TRANSACTIONS:
- MUST contain: ("A/c" OR "Account") + ("debited" OR "credited") + "Rs." + Bank signature
- Bank signatures: -SBI, -HDFC, -ICICI, -AXIS, -PNB, -BOI, -KOTAK, -YES, -INDUSIND, etc.
- Types: DEBIT or CREDIT only
- Examples: 
  * "A/c XX1234 debited Rs. 500 at ATM -SBI"
  * "Account ****5678 credited Rs. 25000 salary -HDFC Bank"

2. UPI TRANSACTIONS:
- MUST be from UPI apps: GPay, PhonePe, Paytm, BHIM, Amazon Pay, Mobikwik, Freecharge
- MUST contain: ("paid" OR "received" OR "debited" OR "credited") + amount + "UPI"
- Types: DEBIT or CREDIT only
- Examples:
  * "You paid Rs.150 via Google Pay UPI"
  * "You received Rs.500 from John via PhonePe UPI"

REJECT EVERYTHING ELSE:
- No credit card transactions
- No wallet transactions (unless UPI)
- No bill payments
- No merchant notifications
- No OTPs or promotional messages
- No loan/EMI messages
- No investment messages

RESPONSE FORMAT:
[
  {
    "category": "BANK" | "UPI",
    "type": "DEBIT" | "CREDIT",
    "amount": "500.00",
    "description": "ATM withdrawal" | "UPI payment" | "salary credit" | etc,
    "originalMessage": "EXACT_ORIGINAL_SMS_TEXT",
    "confidence": 0.9,
    "isFinancial": true
  }
]

Return [] if no BANK or UPI transactions found.

MESSAGES TO ANALYZE:
`;

export const useEnhancedSMSData = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [allMessages, setAllMessages] = useState<TransactionMessage[]>([]);
  const [bankMessages, setBankMessages] = useState<TransactionMessage[]>([]);
  const [upiMessages, setUpiMessages] = useState<TransactionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<String[]>([]);

  const addProcessingLogs =(log:string) =>{
    setProcessingLogs(prev => [...prev, log]);
  }

  // Save categorized messages
  interface TransactionMessage {
    category: 'BANK' | 'UPI';
    type: 'DEBIT' | 'CREDIT';
    amount: string;
    description: string;
    originalMessage: string;
    confidence: number;
    isFinancial: boolean;
    date: Date;
    id: string;
    hash: string;
    processedAt: string;
    rawSender: string;
    batchNumber: number;
    address: string;
    body: string;
  }

  const saveCategorizedMessages = async (messages: TransactionMessage[]): Promise<void> => {
    try {
      const bankTxns = messages.filter(msg => msg.category === 'BANK');
      const upiTxns = messages.filter(msg => msg.category === 'UPI');

      // Save all messages
      await AsyncStorage.setItem(STORAGE_KEYS.PROCESSED_MESSAGES, JSON.stringify(messages));
      
      // Save individual categories
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES.BANK, JSON.stringify(bankTxns));
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES.UPI, JSON.stringify(upiTxns));

      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      
      setAllMessages(messages);
      setBankMessages(bankTxns);
      setUpiMessages(upiTxns);
      
      console.log(`Saved: ${bankTxns.length} Bank + ${upiTxns.length} UPI = ${messages.length} total`);
      
    } catch (error) {
      console.error('Error saving categorized messages:', error);
    }
  };

  const loadCategorizedMessages = async () => {
    try {
      const allStored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_MESSAGES);
      if (allStored) {
        const parsed = JSON.parse(allStored);
        setAllMessages(parsed);

        // Load individual categories
        const bankStored = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES.BANK);
        const upiStored = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES.UPI);
        
        setBankMessages(bankStored ? JSON.parse(bankStored) : []);
        setUpiMessages(upiStored ? JSON.parse(upiStored) : []);
        
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error loading categorized messages:', error);
      return [];
    }
  };

  interface Message {
    address: string;
    date: string;
    body: string;
  }

  const getMessageHash = (message: Message): string => {
    return `${message.address}_${message.date}_${message.body.substring(0, 50)}`;
  };

  const getStoredHashes = async () => {
    try {
      const hashes = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_HASHES);
      return hashes ? JSON.parse(hashes) : [];
    } catch (error) {
      console.error('Error loading message hashes:', error);
      return [];
    }
  };

  interface MessageHash extends Array<string> {}

  const saveMessageHashes = async (hashes: MessageHash): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_HASHES, JSON.stringify(hashes));
    } catch (error) {
      console.error('Error saving message hashes:', error);
    }
  };


// Enhanced AI service call with better error handling and retry logic
// Interfaces
interface AIRequestBody {
  contents: {
    role: string;
    parts: { text: string }[];
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    responseMimeType: string;
  };
}

interface APIResponse {
  candidates?: {
    finishReason?: string;
    content?: {
      parts?: { text: string }[];
    };
  }[];
}

interface TransactionResult {
  category: 'BANK' | 'UPI';
  type: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
  originalMessage: string;
  confidence: number;
  isFinancial: boolean;
}

// Main function with types
const callAIService = async (prompt: string, retryCount: number = 0): Promise<TransactionResult[]> => {
  const maxRetries: number = 2;
  
  try {
    const API_KEY: string = "AIzaSyAxUV2eIEt2hr4-iUHKXmZ1K3ePen3nqck"; 
    const MODEL_ID: string = "gemini-2.5-flash-preview-05-20";
    const endpoint: string = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    const requestBody: AIRequestBody = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json"
      }
    };

    console.log(`AI API Call - Attempt ${retryCount + 1}/${maxRetries + 1}`);

    const response: Response = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "BankUPIClassifier/1.0"
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({}));
      console.error(`HTTP ${response.status}:`, errorData);
      
      if (response.status === 429) {
        console.log('Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (retryCount < maxRetries) {
          return callAIService(prompt, retryCount + 1);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data: APIResponse = await response.json();
    
    if (!data) {
      throw new Error('Empty response from API');
    }

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Invalid response structure:', data);
      throw new Error('No candidates in response');
    }

    const candidate = data.candidates[0];
    
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('Response truncated due to token limit');
    } else if (candidate.finishReason === 'SAFETY') {
      console.warn('Response blocked by safety filters');
      return [];
    } else if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('Unexpected finish reason:', candidate.finishReason);
    }
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', candidate);
      
      if (candidate.finishReason === 'MAX_TOKENS' && retryCount < maxRetries) {
        console.log('Retrying with token limit issue...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callAIService(prompt, retryCount + 1);
      }
      
      throw new Error('No content in candidate');
    }

    const responseText: string = candidate.content.parts[0].text;
    
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response text');
      return [];
    }

    console.log(`Raw AI Response (first 200 chars): ${responseText.substring(0, 200)}...`);
    
    try {
      let cleaned: string = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*[\r\n]+/gm, "")
        .trim();
      
      cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
      
      let parsed: TransactionResult[];
      
      if (!cleaned.endsWith(']') && !cleaned.endsWith('}')) {
        console.warn('Response appears truncated, attempting to fix...');
        
        if (cleaned.includes('[') && !cleaned.endsWith(']')) {
          const lastCompleteObject: number = cleaned.lastIndexOf('}');
          if (lastCompleteObject !== -1) {
            cleaned = cleaned.substring(0, lastCompleteObject + 1) + ']';
            console.log('Fixed truncated array');
          }
        } else if (cleaned.includes('{') && !cleaned.endsWith('}')) {
          const openBraces: number = (cleaned.match(/\{/g) || []).length;
          const closeBraces: number = (cleaned.match(/\}/g) || []).length;
          const missingBraces: number = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            cleaned += '}'.repeat(missingBraces);
            console.log(`Added ${missingBraces} closing braces`);
          }
        }
      }
      
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        parsed = JSON.parse(cleaned);
      } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        parsed = [JSON.parse(cleaned)];
      } else {
        const jsonArrayMatch: RegExpMatchArray | null = cleaned.match(/\[[\s\S]*\]/);
        const jsonObjectMatch: RegExpMatchArray | null = cleaned.match(/\{[\s\S]*\}/);
        
        if (jsonArrayMatch) {
          try {
            parsed = JSON.parse(jsonArrayMatch[0]);
          } catch (e) {
            let fixedJson: string = jsonArrayMatch[0];
            
            if (!fixedJson.endsWith(']')) {
              const lastCompleteObject: number = fixedJson.lastIndexOf('}');
              if (lastCompleteObject !== -1) {
                fixedJson = fixedJson.substring(0, lastCompleteObject + 1) + ']';
              }
            }
            
            parsed = JSON.parse(fixedJson);
          }
        } else if (jsonObjectMatch) {
          parsed = [JSON.parse(jsonObjectMatch[0])];
        } else {
          console.error('No valid JSON found in response:', cleaned);
          return [];
        }
      }
      
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
      
      const validResults: TransactionResult[] = parsed.filter(item => {
        if (!item || typeof item !== 'object') return false;
        
        const hasRequired: boolean | string = item.isFinancial && 
                           ['BANK', 'UPI'].includes(item.category) &&
                           ['DEBIT', 'CREDIT'].includes(item.type) &&
                           item.amount && item.originalMessage;
        
        if (!hasRequired) {
          console.log('Filtered out invalid item:', item);
        }
        
        return hasRequired;
      });
      
      console.log(`Parsed ${validResults.length} valid transactions from AI response`);
      return validResults;
      
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw response:", responseText);
      
      if (retryCount < maxRetries) {
        console.log('Retrying due to parse error...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callAIService(prompt, retryCount + 1);
      }
      
      return [];
    }
    
  } catch (error) {
    console.error("AI service error:", error);
    
    if (retryCount < maxRetries && (
      error instanceof Error &&
      (error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('fetch'))
    )) {
      console.log(`Retrying due to network error... (${retryCount + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return callAIService(prompt, retryCount + 1);
    }
    
    return [];
  }
};

// Enhanced classification function with better batch handling
interface RawMessage {
  address: string;
  date: string;
  body: string;
}

interface BatchMessage extends RawMessage {
  id?: string;
  hash?: string;
}

interface ClassifiedMessage extends TransactionResult {
  date: Date;
  id: string;
  hash: string;
  processedAt: string;
  rawSender: string;
  batchNumber: number;
  address: string;
  body: string;
}

const classifyBankAndUPITransactions = async (rawMessages: RawMessage[]): Promise<ClassifiedMessage[]> => {
  try {
    setProcessing(true);
    
    const storedHashes: string[] = await getStoredHashes();
    const newMessages: RawMessage[] = rawMessages.filter(msg => 
      !storedHashes.includes(getMessageHash(msg))
    );

    if (newMessages.length === 0) {
      console.log('No new messages to process');
      return [];
    }

    console.log(`Processing ${newMessages.length} new messages for Bank/UPI transactions`);
    addProcessingLogs(`Processing ${newMessages.length} new messages for Bank/UPI transactions`);
    // Even smaller batch size for better reliability
    const batchSize: number = 3; // Reduced from 5
    const allClassifiedMessages: ClassifiedMessage[] = [];
    let successfulBatches: number = 0;
    let failedBatches: number = 0;

    for (let i = 0; i < newMessages.length; i += batchSize) {
      const batch: BatchMessage[] = newMessages.slice(i, i + batchSize);
      const batchNumber: number = Math.floor(i/batchSize) + 1;
      const totalBatches: number = Math.ceil(newMessages.length/batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} messages)`);
      addProcessingLogs(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} messages)`);
      
      const messagesToAnalyze: string = batch.map((msg, index) => 
        `MESSAGE ${index + 1}:\nSender: ${msg.address}\nContent: ${msg.body}\nDate: ${new Date(parseInt(msg.date)).toISOString()}\n---\n`
      ).join('');

      

      const enhancedPrompt: string = `You are a specialized SMS classifier for BANK and UPI transactions ONLY.

STRICT REQUIREMENTS - Return ONLY these two types:

1. BANK TRANSACTIONS: Must contain ("A/c" OR "Account") + ("debited" OR "credited") + "Rs." + Bank signature (-SBI, -HDFC, etc.)
2. UPI TRANSACTIONS: Must be from UPI apps (GPay, PhonePe, Paytm, BHIM, etc.) + ("paid" OR "received") + amount + "UPI"

REJECT EVERYTHING ELSE. Return [] if no BANK or UPI transactions found.

RESPONSE FORMAT (JSON ONLY):
[{"category":"BANK"|"UPI","type":"DEBIT"|"CREDIT","amount":"500.00","description":"brief desc","originalMessage":"exact SMS text","confidence":0.9,"isFinancial":true}]

MESSAGES:
${messagesToAnalyze}

Return only valid JSON array:`;

      try {
        const response: TransactionResult[] = await callAIService(enhancedPrompt);
        
        if (response && Array.isArray(response) && response.length > 0) {
          const batchResults: ClassifiedMessage[] = response.map((aiResult) => {
            const matchingMessage: BatchMessage | undefined = batch.find(msg => {
              const msgBody: string = msg.body.toLowerCase();
              const aiOriginal: string = (aiResult.originalMessage || '').toLowerCase();
              
              return msgBody.includes(aiOriginal.substring(0, 30)) || 
                     aiOriginal.includes(msgBody.substring(0, 30)) ||
                     (aiResult.amount && msgBody.includes(aiResult.amount.toString()));
            });
            
            if (matchingMessage) {
              return {
                ...matchingMessage,
                ...aiResult,
                date: new Date(parseInt(matchingMessage.date)),
                id: `${matchingMessage.address}_${matchingMessage.date}`,
                hash: getMessageHash(matchingMessage),
                processedAt: new Date().toISOString(),
                rawSender: matchingMessage.address,
                batchNumber: batchNumber
              };
            }
            return null;
          }).filter((msg): msg is ClassifiedMessage => msg !== null);

          allClassifiedMessages.push(...batchResults);
          console.log(`✓ Batch ${batchNumber}: Found ${batchResults.length} transactions`);
          successfulBatches++;
          addProcessingLogs(`✓ Batch ${batchNumber}: Found ${batchResults.length} transactions`);
        } else {
          console.log(`○ Batch ${batchNumber}: No transactions found`);
          successfulBatches++;
          addProcessingLogs(`○ Batch ${batchNumber}: No transactions found`);
        }
        
      } catch (batchError) {
        console.error(`✗ Batch ${batchNumber} failed:`, batchError instanceof Error ? batchError.message : String(batchError));
        failedBatches++;
        addProcessingLogs(`✗ Batch ${batchNumber} failed: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
      }
      
      const delay: number = Math.min(2000 + (batchNumber * 100), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const processedHashes: string[] = newMessages
      .filter((_, index) => Math.floor(index / batchSize) < successfulBatches)
      .map(getMessageHash);
    
    const allHashes: string[] = [...storedHashes, ...processedHashes];
    await saveMessageHashes(allHashes);

    console.log(`=== PROCESSING COMPLETE ===`);
    addProcessingLogs(`=== PROCESSING COMPLETE ===`);
    console.log(`Successful batches: ${successfulBatches}/${Math.ceil(newMessages.length/batchSize)}`);
    setProcessingLogs(prev => [...prev, `Successful batches: ${successfulBatches}/${Math.ceil(newMessages.length/batchSize)}`]);

    console.log(`Failed batches: ${failedBatches}`);
    addProcessingLogs(`Failed batches: ${failedBatches}`);
    console.log(`Total transactions found: ${allClassifiedMessages.length}`);
    addProcessingLogs(`Total transactions found: ${allClassifiedMessages.length}`);
    
    return allClassifiedMessages;
    
  } catch (error) {
    console.error('Error in Bank/UPI classification:', error);
    addProcessingLogs(`Error in Bank/UPI classification: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  } finally {
    setProcessing(false);
  }
};

  // Load SMS messages
  const loadAllMessages = async () => {
    if (!hasPermission || !SmsAndroid) return;

    setLoading(true);
    const minDate = new Date(2025, 4, 1).getTime(); 

    return new Promise((resolve) => {
      interface SMSMessage {
        box: string;
        maxCount: number;
        minDate: number;
      }

      interface SMSItem {
        address: string;
        date: string;
        body: string;
        [key: string]: any; // For any additional fields
      }

      type SMSFailureCallback = (error: string) => void;
      type SMSSuccessCallback = (count: number, smsList: string) => void;

      SmsAndroid.list(
        JSON.stringify({ box: "inbox", maxCount: 1500, minDate } as SMSMessage),
        ((fail: string) => {
          console.log("Failed to list SMS:", fail);
          setLoading(false);
          resolve([]);
        }) as SMSFailureCallback,
        ((count: number, smsList: string) => {
          try {
        const arr: SMSItem[] = JSON.parse(smsList);
        resolve(arr);
          } catch (parseError) {
        console.warn("Failed to parse SMS list:", parseError);
        resolve([]);
          } finally {
        setLoading(false);
          }
        }) as SMSSuccessCallback
      );
    });
  };

  // Main processing function
  const processBankAndUPITransactions = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        await loadCategorizedMessages();
      }
      setProcessingLogs([])
      console.log('=== STARTING BANK & UPI SMS PROCESSING ===');
      addProcessingLogs('=== STARTING BANK & UPI SMS PROCESSING ===')

      const rawMessages = await loadAllMessages();
      const safeRawMessages = Array.isArray(rawMessages) ? rawMessages : [];

      console.log(`Total SMS messages loaded: ${safeRawMessages.length}`);
            addProcessingLogs(`Total SMS messages loaded: ${safeRawMessages.length}`);

      
      if (safeRawMessages.length === 0) {
        console.log('No messages found');
              addProcessingLogs("No message found!!");

        return;
      }

      const newClassifiedMessages = await classifyBankAndUPITransactions(safeRawMessages);
      
      if (newClassifiedMessages.length > 0) {
        const existingMessages = forceRefresh ? [] : await loadCategorizedMessages();
        const allMessages = [...(Array.isArray(existingMessages) ? existingMessages : []), ...newClassifiedMessages];
        
        const uniqueMessages = allMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.hash === msg.hash)
        );

        uniqueMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await saveCategorizedMessages(uniqueMessages);
        
        console.log(`=== FINAL RESULT ===`);
        console.log(`Total unique Bank & UPI transactions: ${uniqueMessages.length}`);
      }
    } catch (error) {
      console.error('Error processing Bank & UPI transactions:', error);
    }
  };

  // Initialize
  useEffect(() => {
    if (Platform.OS === 'android') {
      request(PERMISSIONS.ANDROID.READ_SMS)
        .then((result) => {
          if (result === RESULTS.GRANTED) {
            setHasPermission(true);
            loadCategorizedMessages().then(() => {
              processBankAndUPITransactions();
            });
          } else {
            Alert.alert('Permission denied', 'Cannot read SMS without permission');
          }
        })
        .catch((err) => console.warn('Permission error:', err));
    }
  }, []);

  // Utility functions
  const getTransactionStats = () => {
    const bankStats = {
      total: bankMessages.length,
      debits: bankMessages.filter(msg => msg.type === 'DEBIT').length,
      credits: bankMessages.filter(msg => msg.type === 'CREDIT').length,
      totalDebitAmount: bankMessages
        .filter(msg => msg.type === 'DEBIT')
        .reduce((sum, msg) => sum + (parseFloat(msg.amount) || 0), 0),
      totalCreditAmount: bankMessages
        .filter(msg => msg.type === 'CREDIT')
        .reduce((sum, msg) => sum + (parseFloat(msg.amount) || 0), 0)
    };

    const upiStats = {
      total: upiMessages.length,
      debits: upiMessages.filter(msg => msg.type === 'DEBIT').length,
      credits: upiMessages.filter(msg => msg.type === 'CREDIT').length,
      totalDebitAmount: upiMessages
        .filter(msg => msg.type === 'DEBIT')
        .reduce((sum, msg) => sum + (parseFloat(msg.amount) || 0), 0),
      totalCreditAmount: upiMessages
        .filter(msg => msg.type === 'CREDIT')
        .reduce((sum, msg) => sum + (parseFloat(msg.amount) || 0), 0)
    };

    return { bank: bankStats, upi: upiStats };
  };

  const refreshMessages = async () => {
    await processBankAndUPITransactions(false);
  };

  const forceRefresh = async () => {
    setLoading(true);
    setProcessing(true);
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROCESSED_MESSAGES,
        STORAGE_KEYS.MESSAGE_HASHES,
        STORAGE_KEYS.LAST_SYNC,
        STORAGE_KEYS.CATEGORIES.BANK,
        STORAGE_KEYS.CATEGORIES.UPI
      ]);
      
      await processBankAndUPITransactions(true);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const getSyncInfo = async () => {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return {
        lastSync: lastSync ? new Date(parseInt(lastSync)) : null,
        totalMessages: allMessages.length,
        bankCount: bankMessages.length,
        upiCount: upiMessages.length
      };
    } catch (error) {
      return { lastSync: null, totalMessages: 0, bankCount: 0, upiCount: 0 };
    }
  };

  return {
    // Messages
    allMessages,
    bankMessages,
    upiMessages,
    
    // State
    loading,
    processing,
    hasPermission,
    
    // Functions
    refreshMessages,
    forceRefresh,
    getSyncInfo,
    getTransactionStats,
    processingLogs,
    // Backward compatibility
    messages: allMessages,
    loadBankMessages: refreshMessages,
  };
};