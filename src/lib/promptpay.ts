// PromptPay QR Code Payload Generator (EMVCo Standard)
// Reference: https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/ThaiQRCode_Standard.pdf

// CRC-16 CCITT-FALSE calculation
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function formatTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return id + length + value;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters (dashes, spaces, etc.)
  const digits = phone.replace(/\D/g, "");
  
  // Thai phone numbers: convert 0x to 66x format
  // e.g., 0616080720 -> 66616080720
  if (digits.startsWith("0")) {
    return "66" + digits.substring(1);
  }
  
  // If already has country code 66
  if (digits.startsWith("66")) {
    return digits;
  }
  
  return digits;
}

export function generatePromptPayPayload(
  phoneNumber: string,
  amount?: number
): string {
  // Format phone number to international format (66xxxxxxxxx)
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // PromptPay Application ID
  const AID = "A000000677010111";
  
  // Build Merchant Account Information subfields (Tag 29)
  // Sub-tag 00: Application ID
  // Sub-tag 01: Phone number with prefix "00" + country code
  const merchantSubfields = 
    formatTLV("00", AID) + 
    formatTLV("01", "00" + formattedPhone);
  
  // Build main payload
  let payload = "";
  
  // Tag 00: Payload Format Indicator (always "01")
  payload += formatTLV("00", "01");
  
  // Tag 01: Point of Initiation Method
  // "11" = Static QR (reusable), "12" = Dynamic QR (one-time with amount)
  payload += formatTLV("01", amount && amount > 0 ? "12" : "11");
  
  // Tag 29: Merchant Account Information (PromptPay)
  payload += formatTLV("29", merchantSubfields);
  
  // Tag 58: Country Code
  payload += formatTLV("58", "TH");
  
  // Tag 53: Transaction Currency (764 = THB)
  payload += formatTLV("53", "764");
  
  // Tag 54: Transaction Amount (optional)
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    payload += formatTLV("54", amountStr);
  }
  
  // Tag 63: CRC - Add placeholder and calculate
  payload += "6304";
  const checksum = crc16(payload);
  payload += checksum;
  
  return payload;
}

// Default PromptPay phone number for receiving payments
export const PROMPTPAY_PHONE = "061-6080-720";
