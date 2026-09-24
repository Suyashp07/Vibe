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

// Known temporary / disposable email providers
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'temp-mail.org',
  'maildrop.cc',
  'crazymailing.com',
]);

// Known fake / dummy / non-existent test usernames
export const FAKE_USERNAMES = new Set([
  'susu',
  'test',
  'asdf',
  'dummy',
  'fake',
  'invalid',
  'temp',
  'noemail',
  'qwerty',
  'abc',
  'xyz',
  '123456',
  'sample',
  'example',
]);

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
 * Validate email syntax strictly according to RFC standards, Gmail rules, and domain checks.
 */
export const validateEmailInput = (rawEmail: string): EmailValidationResult => {
  const email = (rawEmail || '').trim();
  if (!email) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (/\s/.test(email)) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  const [localPart, domainPart] = parts;
  const lowerLocal = localPart.toLowerCase();
  const lowerDomain = domainPart.toLowerCase();

  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (localPart.length > 64) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  // Check known fake / dummy test usernames
  if (FAKE_USERNAMES.has(lowerLocal)) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (domainPart.length > 255) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (domainPart.includes('..')) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (!domainPart.includes('.')) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  // Gmail specific rule: Gmail usernames MUST be between 6 and 30 characters
  if (lowerDomain === 'gmail.com' || lowerDomain === 'googlemail.com') {
    const cleanGmailLocal = lowerLocal.replace(/\./g, ''); // dots don't count in Gmail length
    if (cleanGmailLocal.length < 6 || cleanGmailLocal.length > 30) {
      return { isValid: false, error: 'Provided email is invalid' };
    }
  }

  // Disposable domain check
  if (DISPOSABLE_DOMAINS.has(lowerDomain)) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  const domainSubparts = domainPart.split('.');
  for (const part of domainSubparts) {
    if (!part || part.startsWith('-') || part.endsWith('-')) {
      return { isValid: false, error: 'Provided email is invalid' };
    }
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return { isValid: false, error: 'Provided email is invalid' };
    }
  }

  const tld = domainSubparts[domainSubparts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Provided email is invalid' };
  }

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
