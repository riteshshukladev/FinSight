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
  const [allMessages, setAllMessages] = useState([]);
  const [bankMessages, setBankMessages] = useState([]);
  const [upiMessages, setUpiMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Save categorized messages
  const saveCategorizedMessages = async (messages) => {
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

  const getMessageHash = (message) => {
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

  const saveMessageHashes = async (hashes) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_HASHES, JSON.stringify(hashes));
    } catch (error) {
      console.error('Error saving message hashes:', error);
    }
  };

  // Enhanced AI service call with better error handling and retry logic
const callAIService = async (prompt, retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    const API_KEY = "AIzaSyAxUV2eIEt2hr4-iUHKXmZ1K3ePen3nqck"; 
    const MODEL_ID = "gemini-2.5-flash-preview-05-20";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
        // Add response format instruction
        responseMimeType: "application/json"
      }
    };

    console.log(`AI API Call - Attempt ${retryCount + 1}/${maxRetries + 1}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "BankUPIClassifier/1.0"
      },
      body: JSON.stringify(requestBody),
    });

    // Log response status
    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`HTTP ${response.status}:`, errorData);
      
      // Handle specific error codes
      if (response.status === 429) { // Rate limit
        console.log('Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (retryCount < maxRetries) {
          return callAIService(prompt, retryCount + 1);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Enhanced response validation
    if (!data) {
      throw new Error('Empty response from API');
    }

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('Invalid response structure:', data);
      throw new Error('No candidates in response');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', candidate);
      throw new Error('No content in candidate');
    }

    const responseText = candidate.content.parts[0].text;
    
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response text');
      return [];
    }

    console.log(`Raw AI Response (first 200 chars): ${responseText.substring(0, 200)}...`);
    
    try {
      // Enhanced JSON parsing with multiple fallbacks
      let cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*[\r\n]+/gm, "") // Remove empty lines
        .trim();
      
      // Remove any markdown formatting that might interfere
      cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
      
      let parsed;
      
      // Try direct parsing first
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        parsed = JSON.parse(cleaned);
      } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        parsed = [JSON.parse(cleaned)];
      } else {
        // Try to extract JSON from text
        const jsonArrayMatch = cleaned.match(/\[[\s\S]*\]/);
        const jsonObjectMatch = cleaned.match(/\{[\s\S]*\}/);
        
        if (jsonArrayMatch) {
          parsed = JSON.parse(jsonArrayMatch[0]);
        } else if (jsonObjectMatch) {
          parsed = [JSON.parse(jsonObjectMatch[0])];
        } else {
          console.error('No valid JSON found in response:', cleaned);
          return [];
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
      
      // Validate and filter results
      const validResults = parsed.filter(item => {
        if (!item || typeof item !== 'object') return false;
        
        const hasRequired = item.isFinancial && 
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
      
      // If retry available and it's a parsing error, try again
      if (retryCount < maxRetries) {
        console.log('Retrying due to parse error...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callAIService(prompt, retryCount + 1);
      }
      
      return [];
    }
    
  } catch (error) {
    console.error("AI service error:", error);
    
    // Retry on network errors
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('fetch')
    )) {
      console.log(`Retrying due to network error... (${retryCount + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return callAIService(prompt, retryCount + 1);
    }
    
    return [];
  }
};

// Enhanced classification function with better batch handling
const classifyBankAndUPITransactions = async (rawMessages) => {
  try {
    setProcessing(true);
    
    const storedHashes = await getStoredHashes();
    const newMessages = rawMessages.filter(msg => 
      !storedHashes.includes(getMessageHash(msg))
    );

    if (newMessages.length === 0) {
      console.log('No new messages to process');
      return [];
    }

    console.log(`Processing ${newMessages.length} new messages for Bank/UPI transactions`);

    // Smaller batch size for better reliability
    const batchSize = 5; // Reduced from 8
    const allClassifiedMessages = [];
    let successfulBatches = 0;
    let failedBatches = 0;

    for (let i = 0; i < newMessages.length; i += batchSize) {
      const batch = newMessages.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(newMessages.length/batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} messages)`);
      
      // Create more structured prompt for this batch
      const messagesToAnalyze = batch.map((msg, index) => 
        `MESSAGE ${index + 1}:\nSender: ${msg.address}\nContent: ${msg.body}\nDate: ${new Date(parseInt(msg.date)).toISOString()}\n---\n`
      ).join('');

      // Enhanced prompt with stricter instructions
      const enhancedPrompt = `${AI_CLASSIFICATION_PROMPT}

IMPORTANT: Return ONLY valid JSON array format. No explanations, no markdown, just JSON.

${messagesToAnalyze}

Remember: Return [] if no BANK or UPI transactions found in these messages.`;

      try {
        const response = await callAIService(enhancedPrompt);
        
        if (response && Array.isArray(response) && response.length > 0) {
          const batchResults = response.map((aiResult) => {
            // Find matching original message
            const matchingMessage = batch.find(msg => {
              const msgBody = msg.body.toLowerCase();
              const aiOriginal = (aiResult.originalMessage || '').toLowerCase();
              
              // More precise matching
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
          }).filter(Boolean);

          allClassifiedMessages.push(...batchResults);
          console.log(`✓ Batch ${batchNumber}: Found ${batchResults.length} transactions`);
          successfulBatches++;
        } else {
          console.log(`○ Batch ${batchNumber}: No transactions found`);
          successfulBatches++;
        }
        
      } catch (batchError) {
        console.error(`✗ Batch ${batchNumber} failed:`, batchError.message);
        failedBatches++;
      }
      
      // Progressive delay - longer delays for later batches to avoid rate limiting
      const delay = Math.min(2000 + (batchNumber * 100), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Update stored hashes only for successfully processed messages
    const processedHashes = newMessages
      .filter((_, index) => Math.floor(index / batchSize) < successfulBatches)
      .map(getMessageHash);
    
    const allHashes = [...storedHashes, ...processedHashes];
    await saveMessageHashes(allHashes);

    console.log(`=== PROCESSING COMPLETE ===`);
    console.log(`Successful batches: ${successfulBatches}/${Math.ceil(newMessages.length/batchSize)}`);
    console.log(`Failed batches: ${failedBatches}`);
    console.log(`Total transactions found: ${allClassifiedMessages.length}`);
    
    return allClassifiedMessages;
    
  } catch (error) {
    console.error('Error in Bank/UPI classification:', error);
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
      SmsAndroid.list(
        JSON.stringify({ box: "inbox", maxCount: 1500, minDate }),
        (fail) => {
          console.log("Failed to list SMS:", fail);
          setLoading(false);
          resolve([]);
        },
        (count, smsList) => {
          try {
            const arr = JSON.parse(smsList);
            resolve(arr);
          } catch (parseError) {
            console.warn("Failed to parse SMS list:", parseError);
            resolve([]);
          } finally {
            setLoading(false);
          }
        }
      );
    });
  };

  // Main processing function
  const processBankAndUPITransactions = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        await loadCategorizedMessages();
      }

      console.log('=== STARTING BANK & UPI SMS PROCESSING ===');

      const rawMessages = await loadAllMessages();
      const safeRawMessages = Array.isArray(rawMessages) ? rawMessages : [];

      console.log(`Total SMS messages loaded: ${safeRawMessages.length}`);
      
      if (safeRawMessages.length === 0) {
        console.log('No messages found');
        return;
      }

      const newClassifiedMessages = await classifyBankAndUPITransactions(safeRawMessages);
      
      if (newClassifiedMessages.length > 0) {
        const existingMessages = forceRefresh ? [] : await loadCategorizedMessages();
        const allMessages = [...(Array.isArray(existingMessages) ? existingMessages : []), ...newClassifiedMessages];
        
        const uniqueMessages = allMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.hash === msg.hash)
        );

        uniqueMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

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
    
    // Backward compatibility
    messages: allMessages,
    loadBankMessages: refreshMessages,
  };
};