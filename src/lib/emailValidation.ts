export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: {
    originalDomain: string;
    suggestedDomain: string;
    suggestedEmail: string;
  };
}

export const COMMON_DOMAIN_MAPPINGS: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmaill.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmaild.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmail.xom': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahu.com': 'yahoo.com',
  'ymail.con': 'ymail.com',
  // Hotmail & Outlook typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmial.co': 'hotmail.com',
  'hotamil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'ootlook.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'iclou.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  // Rediffmail typos
  'redifmail.com': 'rediffmail.com',
  'rediff.com': 'rediffmail.com',
};

/**
 * Normalizes email address by trimming and converting to lowercase.
 */
export const normalizeEmail = (rawEmail: string): string => {
  return (rawEmail || '').trim().toLowerCase();
};

/**
 * Fast boolean check if email is valid.
 */
export const isEmailValid = (rawEmail: string): boolean => {
  return validateEmailInput(rawEmail).isValid;
};

/**
 * Validate email syntax strictly according to RFC standards and detect domain typos.
 */
export const validateEmailInput = (rawEmail: string): EmailValidationResult => {
  const email = (rawEmail || '').trim();
  if (!email) {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (/\s/.test(email)) {
    return { isValid: false, error: 'Email address cannot contain spaces.' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid email address with an "@" symbol.' };
  }

  const [localPart, domainPart] = parts;
  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: 'Email is missing the username before "@".' };
  }

  if (localPart.length > 64) {
    return { isValid: false, error: 'Email username cannot exceed 64 characters.' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Email username cannot start or end with a dot.' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, error: 'Email username cannot contain consecutive dots.' };
  }

  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: 'Email is missing a domain name after "@".' };
  }

  if (domainPart.length > 255) {
    return { isValid: false, error: 'Email domain cannot exceed 255 characters.' };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: 'Email domain cannot start or end with a dot.' };
  }

  if (domainPart.includes('..')) {
    return { isValid: false, error: 'Email domain cannot contain consecutive dots.' };
  }

  if (!domainPart.includes('.')) {
    return { isValid: false, error: 'Email domain must contain an extension (e.g. .com, .org).' };
  }

  const domainSubparts = domainPart.split('.');
  for (const part of domainSubparts) {
    if (!part || part.startsWith('-') || part.endsWith('-')) {
      return { isValid: false, error: 'Email domain contains invalid characters or hyphens.' };
    }
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return { isValid: false, error: 'Email domain contains invalid characters.' };
    }
  }

  const tld = domainSubparts[domainSubparts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Email domain extension must be at least 2 letters (e.g. .com).' };
  }

  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return { isValid: false, error: 'Email domain extension contains invalid characters.' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }

  const lowerDomain = domainPart.toLowerCase();
  if (COMMON_DOMAIN_MAPPINGS[lowerDomain]) {
    const suggestedDomain = COMMON_DOMAIN_MAPPINGS[lowerDomain];
    return {
      isValid: true,
      suggestion: {
        originalDomain: domainPart,
        suggestedDomain,
        suggestedEmail: `${localPart}@${suggestedDomain}`,
      },
    };
  }

  return { isValid: true };
};
