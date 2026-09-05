/**
 * Data Preprocessing & Anonymization Utility
 * TCS | CHARUSAT UNIVERSITY Use Case 21: Student Doubt Resolution Chatbot
 */

export interface AnonymizationResult {
  cleanText: string;
  redactedCount: number;
  detectedTypes: string[];
}

/**
 * Anonymizes student documents or queries by masking sensitive personal identifiers (PII).
 */
export function anonymizeStudentData(text: string): AnonymizationResult {
  if (!text) {
    return { cleanText: '', redactedCount: 0, detectedTypes: [] };
  }

  let cleanText = text;
  let redactedCount = 0;
  const detectedTypes: Set<string> = new Set();

  // 1. Student Enrollment Number Pattern (e.g. 21DCS001, 22DEP045, 23CE102)
  const enrollmentRegex = /\b2[0-9][A-Z]{2,4}[0-9]{3,4}\b/gi;
  if (enrollmentRegex.test(cleanText)) {
    detectedTypes.add('Enrollment_Number');
    cleanText = cleanText.replace(enrollmentRegex, (match) => {
      redactedCount++;
      return `[STUDENT_ID_${match.slice(0, 5)}***]`;
    });
  }

  // 2. Email Pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(cleanText)) {
    detectedTypes.add('Email_Address');
    cleanText = cleanText.replace(emailRegex, () => {
      redactedCount++;
      return '[EMAIL_ANONYMIZED]';
    });
  }

  // 3. Indian Mobile Phone Number Pattern (+91 9876543210 or 9876543210)
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;
  if (phoneRegex.test(cleanText)) {
    detectedTypes.add('Phone_Number');
    cleanText = cleanText.replace(phoneRegex, () => {
      redactedCount++;
      return '[PHONE_REDACTED]';
    });
  }

  // 4. Aadhaar / SSN Number Pattern (xxxx xxxx xxxx)
  const aadhaarRegex = /\b\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/g;
  if (aadhaarRegex.test(cleanText)) {
    detectedTypes.add('Aadhaar_ID');
    cleanText = cleanText.replace(aadhaarRegex, () => {
      redactedCount++;
      return '[GOVT_ID_REDACTED]';
    });
  }

  return {
    cleanText,
    redactedCount,
    detectedTypes: Array.from(detectedTypes),
  };
}
