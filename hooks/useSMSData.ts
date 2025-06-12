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
You are an SMS classifier. Return ONLY genuine bank account transaction alerts.

MUST CONTAIN ALL 4:
1. "A/c" OR "Account" 
2. "debited" OR "credited"
3. "Rs." + amount
4. Bank signature ending like "-SBI", "-HDFC", "-ICICI"

VALID EXAMPLES:
- "A/c XX1234 debited Rs. 500 at ATM -SBI"
- "Account ****5678 credited Rs. 1000 salary -HDFC Bank"

REJECT: Credit cards, UPI apps, OTPs, promotions, balance inquiries, loans

For each VALID message, return JSON with originalMessage field containing the EXACT full message text:

[
  {
    "isFinancial": true,
    "type": "DEBIT",
    "amount": "500.00",
    "account": "1234",
    "originalMessage": "EXACT_FULL_MESSAGE_TEXT_HERE",
    "confidence": 0.9
  }
]

Return [] if no valid messages found.

MESSAGES:
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

// Fixed AI Classification function
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

    // Process in smaller batches for better accuracy
    const batchSize = 5; // Reduced batch size
    const allClassifiedMessages = [];

    for (let i = 0; i < newMessages.length; i += batchSize) {
      const batch = newMessages.slice(i, i + batchSize);
      
      // Format messages with clear numbering for AI to reference
      const messagesToAnalyze = batch.map((msg, index) => 
        `MESSAGE ${index + 1}:\nSender: ${msg.address}\nContent: ${msg.body}\n---\n`
      ).join('');

      const fullPrompt = AI_CLASSIFICATION_PROMPT + messagesToAnalyze;

      try {
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, messages ${i+1} to ${Math.min(i+batchSize, newMessages.length)}`);
        
        const response = await callAIService(fullPrompt);
        
        console.log('AI Response for batch:', response);
        
        if (response && Array.isArray(response) && response.length > 0) {
          // Process each AI result
          const batchResults = response.map((aiResult) => {
            // Find matching original message by comparing content
            const matchingMessage = batch.find(msg => 
              msg.body.includes(aiResult.originalMessage?.substring(0, 50)) ||
              aiResult.originalMessage?.includes(msg.body.substring(0, 50))
            );
            
            if (matchingMessage && aiResult.isFinancial) {
              return {
                ...matchingMessage,
                ...aiResult,
                date: new Date(parseInt(matchingMessage.date)),
                id: `${matchingMessage.address}_${matchingMessage.date}`,
                hash: getMessageHash(matchingMessage),
                processedAt: new Date().toISOString(),
              };
            }
            return null;
          }).filter(Boolean); // Remove null entries

          allClassifiedMessages.push(...batchResults);
        }
        
      } catch (batchError) {
        console.error('Error processing batch:', batchError);
      }
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update stored hashes
    const allHashes = [...storedHashes, ...newMessages.map(getMessageHash)];
    await saveMessageHashes(allHashes);

    console.log(`Found ${allClassifiedMessages.length} financial messages out of ${newMessages.length} new messages`);
    return allClassifiedMessages;
    
  } catch (error) {
    console.error('Error in AI classification:', error);
    return [];
  } finally {
    setProcessing(false);
  }
};


// Enhanced callAIService with better error handling
const callAIService = async (prompt) => {
  try {
    const API_KEY = "AIzaSyAxUV2eIEt2hr4-iUHKXmZ1K3ePen3nqck"; 
    const MODEL_ID = "gemini-2.5-flash-preview-05-20"; // Use stable version
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent results
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      console.log('Raw AI Response:', responseText);
      
      try {
        // Clean the response text
        const cleaned = responseText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .replace(/^\s*[\[\{]/, match => match.trim())
          .replace(/[\]\}]\s*$/, match => match.trim())
          .trim();
        
        // Try to parse as JSON
        let parsed;
        if (cleaned.startsWith('[')) {
          parsed = JSON.parse(cleaned);
        } else if (cleaned.startsWith('{')) {
          parsed = [JSON.parse(cleaned)];
        } else {
          // Try to extract JSON from text
          const jsonMatch = cleaned.match(/\[[\s\S]*\]/) || cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed)) parsed = [parsed];
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
        
        console.log('Parsed AI Response:', parsed);
        return Array.isArray(parsed) ? parsed : [parsed];
        
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.log("Cleaned response:", cleaned);
        return [];
      }
    } else {
      throw new Error("No candidates in API response");
    }
  } catch (error) {
    console.error("AI service error:", error);
    return [];
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
 // Add this to your processMessages function for debugging
const processMessages = async (forceRefresh = false) => {
  try {
    if (!forceRefresh) {
      await loadProcessedMessages();
    }

    console.log('=== STARTING SMS PROCESSING ===');

    const rawMessages = await loadAllMessages();
    const safeRawMessages = Array.isArray(rawMessages) ? rawMessages : [];

    console.log(`Total SMS messages loaded: ${safeRawMessages.length}`);
    
    // Log sample messages to see what we're working with
    if (safeRawMessages.length > 0) {
      console.log('Sample messages:');
      safeRawMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`${i+1}. From: ${msg.address}`);
        console.log(`   Body: ${msg.body.substring(0, 100)}...`);
      });
    }

    if (safeRawMessages.length === 0) {
      console.log('No messages found');
      return;
    }

    const newClassifiedMessages = await classifyMessagesWithAI(safeRawMessages);
    console.log(`=== AI CLASSIFICATION COMPLETE ===`);
    console.log(`Found ${newClassifiedMessages.length} financial messages`);
    
    // Log the classified messages
    newClassifiedMessages.forEach((msg, i) => {
      console.log(`Financial Message ${i+1}:`);
      console.log(`  Type: ${msg.type}, Amount: ${msg.amount}`);
      console.log(`  Original: ${msg.originalMessage?.substring(0, 80)}...`);
    });
    
    if (newClassifiedMessages.length > 0) {
      const existingMessages = forceRefresh ? [] : await loadProcessedMessages();
      const allMessages = [...existingMessages, ...newClassifiedMessages];
      
      const uniqueMessages = allMessages.filter((msg, index, self) => 
        index === self.findIndex(m => m.hash === msg.hash)
      );

      uniqueMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

      await saveProcessedMessages(uniqueMessages);
      setMessages(uniqueMessages);
      
      console.log(`=== FINAL RESULT ===`);
      console.log(`Total unique financial messages: ${uniqueMessages.length}`);
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