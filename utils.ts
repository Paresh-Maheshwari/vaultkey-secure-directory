
import { Contact } from './types';

export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';

  // Remove existing formatting to check raw digits
  const clean = value.replace(/[^\d+]/g, '');

  // India: +91 98765 43210
  if (clean.startsWith('+91') && clean.length === 13) {
    return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
  }
  
  // India: 10 digits (Mobile usually starts with 6-9)
  if (/^[6-9]\d{9}$/.test(clean)) {
     return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }

  // US/Canada: +1 (234) 567-8900
  if (clean.startsWith('+1') && clean.length === 11) {
    return `+1 (${clean.slice(2, 5)}) ${clean.slice(5, 8)}-${clean.slice(8)}`;
  }

  // US/Canada: (234) 567-8900
  if (/^\d{10}$/.test(clean)) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }

  // Return original if no pattern matches
  return value;
};

export const isValidPhoneNumber = (value: string): boolean => {
  if (!value) return true; 
  // Remove formatting characters to check actual content
  const clean = value.replace(/[\s-()]/g, '');
  
  // Check for international format (e.g. +91...) or standard local mobile (10 digits)
  // E.164 can be up to 15 digits. 
  // We enforce at least 7 digits to avoid short extensions being passed as valid numbers if they aren't intended.
  // We allow optional + at start.
  return /^\+?\d{7,15}$/.test(clean);
};

export const isValidEmail = (email: string): boolean => {
  if (!email) return true;
  // More robust email regex
  // 1. Standard characters before @
  // 2. Domain must contain dots
  // 3. TLD must be at least 2 characters
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const isValidUrl = (url: string): boolean => {
  if (!url) return true;
  // Regex to check for domain structure. 
  // Allow optional http/https.
  // Must have at least one dot in the domain part.
  const pattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return pattern.test(url);
};

export const generateVCF = (contact: Contact, includePhoto: boolean = true): string => {
    const escape = (str: string) => (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const parts = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escape(contact.firstName)} ${escape(contact.lastName)}`.trim(),
      `N:${escape(contact.lastName)};${escape(contact.firstName)};;;`,
      contact.nickname ? `NICKNAME:${escape(contact.nickname)}` : '',
    ];

    // Emails
    contact.emails.forEach(e => {
        parts.push(`EMAIL;TYPE=INTERNET,${e.label.toUpperCase()}:${escape(e.value)}`);
    });

    // Phones
    contact.phones.forEach(p => {
        let type = 'VOICE';
        const label = p.label.toLowerCase();
        if (label === 'mobile') type = 'CELL,VOICE';
        else if (label === 'work') type = 'WORK,VOICE';
        else if (label === 'home') type = 'HOME,VOICE';
        else if (label === 'fax') type = 'FAX';
        parts.push(`TEL;TYPE=${type}:${escape(p.value)}`);
    });

    // Photo (remove data:image/jpeg;base64, prefix)
    // QR codes have limited data capacity, so we usually skip the photo for the QR version
    if (includePhoto && contact.photo) {
        const cleanBase64 = contact.photo.split(',')[1];
        if (cleanBase64) {
             parts.push(`PHOTO;ENCODING=b;TYPE=JPEG:${cleanBase64}`);
        }
    }

    if (contact.company || contact.department) {
        parts.push(`ORG:${escape(contact.company || '')};${escape(contact.department || '')}`);
    }
    if (contact.position) parts.push(`TITLE:${escape(contact.position)}`);
    if (contact.website) parts.push(`URL:${escape(contact.website)}`);
    if (contact.birthday) parts.push(`BDAY:${escape(contact.birthday)}`);
    if (contact.address) parts.push(`ADR;TYPE=HOME:;;${escape(contact.address)};;;;`);
    
    parts.push(`REV:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    const notes: string[] = [];
    if (contact.notes) notes.push(contact.notes);
    
    if (contact.customFields && contact.customFields.length > 0) {
      if (notes.length > 0) notes.push('--- Additional Info ---');
      contact.customFields.forEach(f => {
        const val = f.isSensitive ? `[SECURE] ${f.value}` : f.value;
        notes.push(`${f.label}: ${val}`);
      });
    }

    if (notes.length > 0) parts.push(`NOTE:${escape(notes.join('\n'))}`);
    parts.push('END:VCARD');
    return parts.filter(line => line.trim() !== '').join('\n');
};
