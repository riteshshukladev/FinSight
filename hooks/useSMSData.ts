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

// Storage keys
const STORAGE_KEYS = {
  PROCESSED_MESSAGES: 'processed_bank_messages',
  LAST_SYNC: 'last_sync_timestamp',
  MESSAGE_HASHES: 'message_hashes',
};

// AI prompt for message classification
// ...existing code...
const AI_CLASSIFICATION_PROMPT = `
Analyze the following SMS messages and classify ONLY those that are actual transaction alerts from a recognized bank or financial institution (not promotional, spam, or offers). 
Ignore all messages that are not from a bank or do not contain a clear transaction (credit/debit) alert. 
Do NOT include messages from credit card companies, loan offers, insurance, ISP or any sender that is not a bank.

For each message that IS financial/banking related, extract the following information:

1. type: "CREDIT" or "DEBIT"
2. amount: numerical value (without currency symbols)
3. balance: available balance if mentioned
4. merchant: merchant/vendor name
5. card: card number (usually last 4 digits)
6. category: spending category (food, shopping, utilities, etc.)
7. Most important, it should be a message from a bank or financial institution, specifically banks, not a promotional message, check wisely.

Return a JSON array with only the financial messages in this exact format:
[
  {
    "isFinancial": true,
    "type": "CREDIT|DEBIT",
    "amount": "1000.00",
    "balance": "5000.00",
    "merchant": "Amazon",
    "card": "xxxx1234",
    "category": "Shopping",
    "originalMessage": "full original message text",
    "confidence": 0.95
  }
]

If no financial messages are found, return an empty array [].

Messages to analyze:
`;

export const useSMSData = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Local storage functions
  const saveProcessedMessages = async (processedMessages) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROCESSED_MESSAGES,
        JSON.stringify(processedMessages)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
    } catch (error) {
      console.error('Error saving processed messages:', error);
    }
  };

  const loadProcessedMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_MESSAGES);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error loading processed messages:', error);
      return [];
    }
  };

  const getMessageHash = (message) => {
    // Create a simple hash from message content and timestamp
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

  // AI Classification function
  const classifyMessagesWithAI = async (rawMessages) => {
    try {
      setProcessing(true);
      
      // Filter out already processed messages
      const storedHashes = await getStoredHashes();
      const newMessages = rawMessages.filter(msg => 
        !storedHashes.includes(getMessageHash(msg))
      );

      if (newMessages.length === 0) {
        console.log('No new messages to process');
        return [];
      }

      // Prepare messages for AI analysis (process in batches of 20)
      const batchSize = 10;
      const allClassifiedMessages = [];

      for (let i = 0; i < newMessages.length; i += batchSize) {
        const batch = newMessages.slice(i, i + batchSize);
        const messagesToAnalyze = batch.map((msg, index) => 
          `${index + 1}. From: ${msg.address}\nMessage: ${msg.body}\n---`
        ).join('\n');

        const fullPrompt = AI_CLASSIFICATION_PROMPT + messagesToAnalyze;

        try {
          // Replace this with your actual AI service call
          // For demo purposes, I'll show the structure
          const response = await callAIService(fullPrompt);
          
          if (response && Array.isArray(response)) {
            // Map AI results back to original messages
            const batchResults = response.map((aiResult, index) => {
              const originalMessage = batch[index];
              return {
                ...originalMessage,
                ...aiResult,
                date: new Date(parseInt(originalMessage.date)),
                id: `${originalMessage.address}_${originalMessage.date}`,
                hash: getMessageHash(originalMessage),
                processedAt: new Date().toISOString(),
              };
            });

            allClassifiedMessages.push(...batchResults.filter(msg => msg.isFinancial));
          }
        } catch (batchError) {
          console.error('Error processing batch:', batchError);
        }
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds

      }

      // Update stored hashes
      const allHashes = [...storedHashes, ...newMessages.map(getMessageHash)];
      await saveMessageHashes(allHashes);

      return allClassifiedMessages;
    } catch (error) {
      console.error('Error in AI classification:', error);
      return [];
    } finally {
      setProcessing(false);
    }
  };

  // Mock AI service call - replace with your actual AI service
  // Mock AI service call - replace with your actual AI service
const callAIService = async (prompt) => {
  try {
    const API_KEY = "AIzaSyAxUV2eIEt2hr4-iUHKXmZ1K3ePen3nqck"; 
    const MODEL_ID = "gemini-2.0-flash"; // Replace with the correct Gemini model ID
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    // Construct the request body for text-only analysis
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ],
        },
      ],
    };

    // Make the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log('Gemini API Response:', data);

    // Return the first candidate's response (assuming it exists)
    if (data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      try {
        // Try to parse the response as JSON since we expect a JSON array
        const cleanedText = responseText
          .replace(/```json\s*/g, "") // Remove "```json" block start
          .replace(/```/g, "") // Remove "```" block end
          .trim(); // Remove leading/trailing spaces
        
        const parsedResponse = JSON.parse(cleanedText);
        return parsedResponse;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.log("Raw response:", responseText);
        return []; // Return empty array if parsing fails
      }
    } else {
      throw new Error("No candidates returned from the Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini AI service:", error);
    throw new Error(`Gemini AI Service Error: ${error.message}`);
  }
};

  // Load all SMS messages
  const loadAllMessages = async () => {
    if (!hasPermission || !SmsAndroid) return;

    setLoading(true);
    const minDate = new Date(2025, 4, 1).getTime(); 

    return new Promise((resolve) => {
      SmsAndroid.list(
        JSON.stringify({ box: "inbox", maxCount: 1000 , minDate}),
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

  // Process and classify messages
  const processMessages = async (forceRefresh = false) => {
    try {
      // Load existing processed messages first
      if (!forceRefresh) {
        await loadProcessedMessages();
      }

      console.log(`reached LoadAllMessages`);

      // Get all raw messages
      const rawMessages = await loadAllMessages();
      const safeRawMessages = Array.isArray(rawMessages) ? rawMessages : [];

      console.log(`passed LoadAllMessages`);
      if (safeRawMessages.length === 0) {
        console.log('No messages found');
        return;
      }
      console.log(`reachead LoadMessages`);

      // Classify with AI
      const newClassifiedMessages = await classifyMessagesWithAI(safeRawMessages);
      console.log("reached ai classification");
      
      if (newClassifiedMessages.length > 0) {
        // Merge with existing messages
        const existingMessages = forceRefresh ? [] : await loadProcessedMessages();
        const allMessages = [...existingMessages, ...newClassifiedMessages];
        
        // Remove duplicates based on hash
        const uniqueMessages = allMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.hash === msg.hash)
        );

        // Sort by date (newest first)
        uniqueMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Save and update state
        await saveProcessedMessages(uniqueMessages);
        setMessages(uniqueMessages);
        
        console.log(`Processed ${newClassifiedMessages.length} new financial messages`);
      }
    } catch (error) {
      console.error('Error processing messages:', error);
    }
  };

  // Initialize on permission grant
  useEffect(() => {
    if (Platform.OS === 'android') {
      request(PERMISSIONS.ANDROID.READ_SMS)
        .then((result) => {
          if (result === RESULTS.GRANTED) {
            setHasPermission(true);
            // Load existing messages first, then process new ones
            loadProcessedMessages().then(() => {
              processMessages();
            });
          } else {
            Alert.alert('Permission denied', 'Cannot read SMS without permission');
          }
        })
        .catch((err) => console.warn('Permission error:', err));
    }
  }, []);

  // Manual refresh function
  const refreshMessages = async () => {
    await processMessages(false);
  };

  // Force refresh (reprocess all messages)
  const forceRefresh = async () => {
    setLoading(true);
    setProcessing(true);
    try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PROCESSED_MESSAGES);
    await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGE_HASHES);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    
    // Reprocess all messages
    await processMessages(true);
    }
    finally {
      setLoading(false);
      setProcessing(false);
      console.log('Cache cleared and messages reprocessed');
    }
    // Clear stored data
    
  };

  // Get sync info
  const getSyncInfo = async () => {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return {
        lastSync: lastSync ? new Date(parseInt(lastSync)) : null,
        messageCount: messages.length,
      };
    } catch (error) {
      return { lastSync: null, messageCount: 0 };
    }
  };

  return {
    messages,
    loading,
    processing,
    hasPermission,
    refreshMessages,
    forceRefresh,
    getSyncInfo,
    loadBankMessages: refreshMessages, // Backward compatibility
  };
};