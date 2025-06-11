import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

let SmsAndroid = null;
if (Platform.OS === 'android') {
  try {
    SmsAndroid = require('react-native-get-sms-android');
  } catch (e) {
    console.warn('SMS module not available:', e);
  }
}

export const useSMSData = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Your existing bank sender patterns and extraction logic here...
 const BANK_SENDERS = [
    // Indian Banks
    "SBIINB",
    "HDFCBK",
    "ICICIB",
    "AXISBK",
    "KOTAKB",
    "YESBNK",
    "INDUSB",
    "UNIONB",
    "CANBK",
    "BOBCRD",
    "PNBSMS",
    "IOBCHN",
    "SYNDBK",
    "ANDBNK",
    "VIJAYB",
    "KARNBK",
    "MAHBK",
    "DENABNK",
    "FEDRAL",
    "TMBSMS",
    // Generic patterns
    "BANK",
    "ATM",
    "CARD",
    "PAY",
    "UPI",
    "WALLET",
    "RUPAY",
    "VISA",
    "MASTER",
    // Payment services
    "PAYTM",
    "GPAY",
    "PHONEPE",
    "AMAZON",
    "FLIPKART",
    "MOBIKW",
    "FREECRG",
    "OLAMON",
    "BHARTP",
    "AIRTEL",
    "JIOMON",
    "VODAFI",
  ];

  // Enhanced transaction keywords
  const TRANSACTION_KEYWORDS = [
    // Credit keywords
    "credited",
    "credit",
    "received",
    "deposited",
    "added",
    "refund",
    "cashback",
    "reward",
    "bonus",
    "transfer received",
    "amount received",
    // Debit keywords
    "debited",
    "debit",
    "withdrawn",
    "spent",
    "paid",
    "purchase",
    "transaction",
    "charges",
    "fee",
    "auto debit",
    "emi",
    "bill payment",
    // Amount patterns
    "rs",
    "inr",
    "₹",
    "amount",
    "balance",
    "available",
    "limit",
    // Transaction types
    "upi",
    "neft",
    "rtgs",
    "imps",
    "atm",
    "pos",
    "online",
    "mobile banking",
    "net banking",
    "card payment",
    "contactless",
  ];

  // Check if sender is a bank
  const isBankSender = (address) => {
    if (!address) return false;

    const upperAddress = address.toUpperCase();
    return BANK_SENDERS.some(
      (sender) =>
        upperAddress.includes(sender) ||
        upperAddress.startsWith(sender) ||
        // Check for numeric bank codes (6-7 digits)
        /^[A-Z]{2}-\d{6}$/.test(upperAddress) ||
        /^\d{6,7}$/.test(address)
    );
  };

  // Check if message contains transaction keywords
  const isTransactionMessage = (body) => {
    if (!body) return false;

    const lowerBody = body.toLowerCase();
    return TRANSACTION_KEYWORDS.some((keyword) => lowerBody.includes(keyword));
  };

  // Extract transaction details from message
  const extractTransactionDetails = (body) => {
    const details = {
      type: null,
      amount: null,
      balance: null,
      merchant: null,
      card: null,
    };

    // Extract transaction type
    const lowerBody = body.toLowerCase();
    if (
      lowerBody.includes("credited") ||
      lowerBody.includes("credit") ||
      lowerBody.includes("received") ||
      lowerBody.includes("deposited") ||
      lowerBody.includes("refund") ||
      lowerBody.includes("cashback")
    ) {
      details.type = "CREDIT";
    } else if (
      lowerBody.includes("debited") ||
      lowerBody.includes("debit") ||
      lowerBody.includes("withdrawn") ||
      lowerBody.includes("paid") ||
      lowerBody.includes("purchase") ||
      lowerBody.includes("charges")
    ) {
      details.type = "DEBIT";
    }

    // Extract amount (matches patterns like Rs.1000, ₹1,000, INR 1000)
    const amountMatch = body.match(
      /(?:rs\.?|₹|inr)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
    );
    if (amountMatch) {
      details.amount = amountMatch[1].replace(/,/g, "");
    }

    // Extract balance
    const balanceMatch = body.match(
      /(?:balance|bal|available)\s*(?:rs\.?|₹|inr)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
    );
    if (balanceMatch) {
      details.balance = balanceMatch[1].replace(/,/g, "");
    }

    // Extract card number (last 4 digits)
    const cardMatch = body.match(/(?:card|xx)\d{4}/i);
    if (cardMatch) {
      details.card = cardMatch[0];
    }

    // Extract merchant/vendor name
    const merchantMatch = body.match(/(?:at|to|from)\s+([A-Z\s]{3,20})/i);
    if (merchantMatch && !merchantMatch[1].includes("ACCOUNT")) {
      details.merchant = merchantMatch[1].trim();
    }

    return details;
  };

  const loadBankMessages = () => {
    if (!hasPermission || !SmsAndroid) return;

    setLoading(true);

    SmsAndroid.list(
      JSON.stringify({ box: "inbox", maxCount: 500 }),
      (fail) => {
        console.log("Failed to list SMS:", fail);
        setLoading(false);
      },
      (count, smsList) => {
        try {
          const arr = JSON.parse(smsList);

          // Enhanced filtering for bank transaction messages
          const bankTransactionSMS = arr
            .filter((sms) => {
              // Check if sender is a bank
              const isBankMessage = isBankSender(sms.address);

              // Check if message contains transaction keywords
              const isTransaction = isTransactionMessage(sms.body);

              return isBankMessage && isTransaction;
            })
            .map((sms) => {
              // Extract transaction details
              const transactionDetails = extractTransactionDetails(sms.body);

              return {
                ...sms,
                ...transactionDetails,
                date: new Date(parseInt(sms.date)),
              };
            });

          // Sort by date (newest first)
          bankTransactionSMS.sort((a, b) => b.date - a.date);

          setMessages(bankTransactionSMS);
        } catch (parseError) {
          console.warn("Failed to parse SMS list:", parseError);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      request(PERMISSIONS.ANDROID.READ_SMS)
        .then((result) => {
          if (result === RESULTS.GRANTED) {
            setHasPermission(true);
            setTimeout(() => loadBankMessages(), 100);
          } else {
            Alert.alert('Permission denied', 'Cannot read SMS without permission');
          }
        })
        .catch((err) => console.warn('Permission error:', err));
    }
  }, []);

  useEffect(() => {
    if (hasPermission) {
      loadBankMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  return {
    messages,
    loading,
    hasPermission,
    loadBankMessages,
  };
};