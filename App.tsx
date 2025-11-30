import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import QRCode from 'qrcode';
import { 
  Contact, 
  CustomField,
  LabeledValue,
  ViewMode 
} from './types';
import { StorageService } from './services/storage';
import { Modal } from './components/Modal';
import { ContactForm } from './components/ContactForm';
import { ContactView } from './components/ContactView';
import { Toast } from './components/Toast';
import { formatPhoneNumber, generateVCF } from './utils';

// --- Icons (Inline) ---
const Icons = {
  AddressBook: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20v18H2z"/><path d="M16 2v20"/><path d="M2 8h14"/><path d="M2 13h14"/><path d="M2 18h14"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
  Phone: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Warning: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  SortAsc: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h10"/><path d="M11 16h10"/><path d="M11 20h10"/></svg>,
  SortDesc: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 12h10"/><path d="M11 8h10"/><path d="M11 4h10"/></svg>,
  QrCode: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="5" height="5" x="7" y="7"/><rect width="5" height="5" x="7" y="17"/><rect width="5" height="5" x="17" y="17"/><rect width="5" height="5" x="17" y="7"/></svg>,
};

// Memoized Contact Row Component
const ContactRow = memo(({ contact, onViewClick, onEditClick, onQRClick, onDeleteClick }: { 
  contact: Contact; 
  onViewClick: (contact: Contact) => void;
  onEditClick: (contact: Contact) => void;
  onQRClick: (contact: Contact) => void;
  onDeleteClick: (contact: Contact) => void;
}) => (
  <tr key={contact.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => onViewClick(contact)}>
    <td className="px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 overflow-hidden ${!contact.photo ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-600 dark:text-blue-300' : ''} flex items-center justify-center font-bold text-xs sm:text-sm`}>
          {contact.photo ? (
            <img src={contact.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{contact.firstName?.[0]}{contact.lastName?.[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-[200px]" title={`${contact.firstName} ${contact.lastName}`}>
            {contact.firstName} {contact.lastName}
          </div>
          <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[200px] sm:hidden" title={contact.emails[0]?.value}>
            {contact.emails[0]?.value}
          </div>
          <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[200px] hidden sm:block" title={contact.position}>{contact.position}</div>
        </div>
      </div>
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
      <div className="flex flex-col text-sm space-y-1">
         {contact.emails.length > 0 && (
            <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1 truncate">
              {contact.emails[0].value}
              {contact.emails.length > 1 && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-1 rounded">+{contact.emails.length - 1}</span>}
            </span>
         )}
         {contact.phones.length > 0 && (
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <span className="text-xs">{contact.phones[0].value}</span>
              <span className="text-xs text-gray-400">{contact.phones[0].label}</span>
              {contact.phones.length > 1 && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-1 rounded">+{contact.phones.length - 1}</span>}
            </span>
         )}
      </div>
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-end gap-1 sm:gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQRClick(contact);
          }}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Show QR Code"
        >
          <Icons.QrCode />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(contact);
          }}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Edit Contact"
        >
          <Icons.Edit />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewClick(contact);
          }}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:inline-flex"
          title="View Details"
        >
          <Icons.Eye />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(contact);
          }}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete Contact"
        >
          <Icons.Trash />
        </button>
      </div>
    </td>
  </tr>
));

// --- Helpers ---

// Helper to ensure URL has protocol
const ensureUrlProtocol = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

// Robust VCard parsing
const parseVCard = (vcardContent: string): Contact[] => {
  const contacts: Contact[] = [];
  const entries = vcardContent.split(/BEGIN:VCARD/i).filter(e => e.trim().length > 0 && e.toUpperCase().includes('END:VCARD'));

  entries.forEach(entry => {
    // Basic data container
    const data: any = {
      phones: [],
      emails: [],
      customFields: []
    };
    
    const lines = entry.split(/\r?\n/);
    
    // Accumulate multiline values (photos)
    const unfoldedLines: string[] = [];
    lines.forEach(line => {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += line.trim();
        }
      } else {
        unfoldedLines.push(line);
      }
    });

    unfoldedLines.forEach(line => {
      const match = line.match(/^([^:;]+)((?:;[^:]+)*):(.+)$/);
      if (!match) return;
      
      let [_, keyRaw, params, value] = match;
      const key = (keyRaw.includes('.') ? keyRaw.split('.')[1] : keyRaw).toUpperCase().trim();
      value = value.trim().replace(/\\;/g, ';').replace(/\\,/g, ',').replace(/\\n/g, '\n');

      if (['BEGIN', 'END', 'VERSION', 'REV', 'PRODID'].includes(key)) return;

      // Extract TYPE if present
      const typeMatch = params.match(/TYPE=([^;:]+)/i);
      let type = typeMatch ? typeMatch[1].split(',')[0].trim() : 'Other';
      // Normalize type label
      type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

      if (key === 'FN') data.fn = value;
      else if (key === 'N') data.n = value;
      else if (key === 'EMAIL') {
        data.emails.push({ id: Math.random().toString(36).substr(2,9), label: type || 'Work', value: value });
      }
      else if (key === 'TEL') {
        let label = 'Mobile';
        if (params.toUpperCase().includes('WORK')) label = 'Work';
        else if (params.toUpperCase().includes('HOME')) label = 'Home';
        else if (params.toUpperCase().includes('MAIN')) label = 'Main';
        else if (params.toUpperCase().includes('FAX')) label = 'Fax';
        data.phones.push({ id: Math.random().toString(36).substr(2,9), label: label, value: value });
      }
      else if (key === 'ORG') {
          const parts = value.split(';');
          data.company = parts[0];
          if (parts.length > 1) data.department = parts[1];
      }
      else if (key === 'TITLE') data.position = value;
      else if (key === 'URL') data.website = value;
      else if (key === 'BDAY') data.birthday = value;
      else if (key === 'NOTE') data.notes = value;
      else if (key === 'NICKNAME') data.nickname = value;
      else if (key === 'ADR') data.address = value.split(';').filter(x => x.trim()).join(', ');
      else if (key === 'PHOTO') {
        // Remove whitespace from base64 if needed
        const base64 = value.replace(/\s/g, '');
        // Guess MIME type if not explicitly in value, though data uri needs it.
        // Usually VCard provides base64 raw. We prepend standard header if missing.
        if (base64.startsWith('data:')) {
          data.photo = base64;
        } else {
          data.photo = `data:image/jpeg;base64,${base64}`;
        }
      }
      else {
        if (key && value) {
            data.customFields.push({
                id: Math.random().toString(36).substr(2, 9),
                label: key.charAt(0) + key.slice(1).toLowerCase(),
                value: value,
                isSensitive: false
            });
        }
      }
    });

    // Parse Name
    let firstName = '';
    let lastName = '';
    if (data.n) {
        const parts = data.n.split(';');
        lastName = parts[0] || '';
        firstName = parts[1] || '';
    } else if (data.fn) {
        const parts = data.fn.split(' ');
        if (parts.length > 1) {
            lastName = parts.pop() || '';
            firstName = parts.join(' ');
        } else {
            firstName = data.fn;
        }
    }

    if (firstName || lastName || data.emails.length > 0 || data.phones.length > 0 || data.company) {
        contacts.push({
            id: Math.random().toString(36).substr(2, 9),
            firstName: firstName || 'Unknown',
            lastName: lastName || '',
            nickname: data.nickname || '',
            emails: data.emails,
            phones: data.phones,
            photo: data.photo,
            company: data.company || '',
            department: data.department || '',
            position: data.position || '',
            website: data.website || '',
            birthday: data.birthday ? data.birthday.substring(0, 10) : '',
            address: data.address || '',
            notes: data.notes || '',
            customFields: data.customFields,
            createdAt: new Date().toISOString()
        });
    }
  });

  return contacts;
};

// CSV Parser
const parseCSV = (content: string): Contact[] => {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];
  
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const contacts: Contact[] = [];
  
    for (let i = 1; i < lines.length; i++) {
      const row: string[] = [];
      let current = '';
      let inQuote = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { 
            row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"')); 
            current = ''; 
        }
        else { current += char; }
      }
      row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  
      if (row.length < 1) continue; 
  
      const contact: any = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        customFields: [],
        phones: [],
        emails: []
      };
  
      headers.forEach((header, index) => {
        const value = row[index];
        if (!value) return;
  
        if (['first name', 'firstname', 'given name', 'name'].includes(header) && !contact.firstName) contact.firstName = value;
        else if (['last name', 'lastname', 'family name', 'surname'].includes(header)) contact.lastName = value;
        else if (['email', 'e-mail'].includes(header)) contact.emails.push({ id: Math.random().toString(), label: 'Work', value });
        else if (['phone', 'mobile', 'cell'].includes(header)) contact.phones.push({ id: Math.random().toString(), label: 'Mobile', value });
        else if (['work phone', 'business phone'].includes(header)) contact.phones.push({ id: Math.random().toString(), label: 'Work', value });
        else if (['company', 'organization', 'org'].includes(header)) contact.company = value;
        else if (['department', 'dept'].includes(header)) contact.department = value;
        else if (['position', 'title', 'job title'].includes(header)) contact.position = value;
        else if (['address', 'street'].includes(header)) contact.address = value;
        else if (['website', 'web', 'url'].includes(header)) contact.website = value;
        else if (['birthday', 'dob'].includes(header)) contact.birthday = value;
        else if (['notes', 'note'].includes(header)) contact.notes = value;
        else if (['nickname'].includes(header)) contact.nickname = value;
        else {
          contact.customFields.push({
              id: Math.random().toString(36).substr(2, 9),
              label: header.charAt(0).toUpperCase() + header.slice(1),
              value: value,
              isSensitive: false
          });
        }
      });
  
      if (!contact.firstName && !contact.lastName) {
          const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
          if (nameIdx > -1 && row[nameIdx]) {
              const parts = row[nameIdx].split(' ');
              if (parts.length > 1) {
                  contact.lastName = parts.pop();
                  contact.firstName = parts.join(' ');
              } else {
                  contact.firstName = row[nameIdx];
              }
          }
      }

      if (contact.firstName || contact.lastName || contact.emails.length > 0) {
        contacts.push({ firstName: '', lastName: '', ...contact } as Contact);
      }
    }
    return contacts;
};

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'EDIT' | 'VIEW' | 'CREATE' | 'QR'>('CREATE');
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  
  // Sorting state
  const [sortField, setSortField] = useState<'firstName' | 'company' | 'createdAt'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Custom delete modal state
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Toast state
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 contacts per page

  // QR Code state
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const loadData = async () => {
      await StorageService.init();
      const loadedContacts = await StorageService.getAllContacts();
      
      // Migration: Convert old single-string phone/email to arrays if necessary
      const migratedContacts = loadedContacts.map((c: any) => ({
        ...c,
        phones: c.phones || (c.phone ? [{ id: '1', label: 'Mobile', value: c.phone }] : []),
        emails: c.emails || (c.email ? [{ id: '1', label: 'Work', value: c.email }] : []),
        photo: c.photo || '',
      }));
      
      setContacts(migratedContacts);
    };
    loadData();
  }, []);

  const filteredContacts = useMemo(() => {
    let list = [...contacts]; // Clone array to avoid mutating state
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.firstName.toLowerCase().includes(q) || 
        c.lastName.toLowerCase().includes(q) ||
        c.nickname?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.emails.some(e => e.value.toLowerCase().includes(q))
      );
    }

    // Sort
    return list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'company':
          valA = (a.company || '').toLowerCase();
          valB = (b.company || '').toLowerCase();
          break;
        case 'createdAt':
          valA = a.createdAt;
          valB = b.createdAt;
          break;
        case 'firstName':
        default:
          valA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, searchQuery, sortField, sortOrder]);

  // Paginated contacts for performance
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleCreateContact = async (data: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    await StorageService.saveContact(newContact);
    setContacts(prev => [...prev, newContact]);
    setIsModalOpen(false);
    setSelectedContact(undefined);
  };

  const handleUpdateContact = async (data: Omit<Contact, 'id' | 'createdAt'>) => {
      if (!selectedContact?.id) return;
      const updated: Contact = {
          ...data,
          id: selectedContact.id,
          createdAt: selectedContact.createdAt || new Date().toISOString()
      };
      await StorageService.saveContact(updated);
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      
      setIsModalOpen(false);
      setSelectedContact(undefined);
  }

  const promptDeleteContact = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
  };

  const confirmDeleteContact = async () => {
    if (contactToDelete) {
        await StorageService.deleteContact(contactToDelete.id);
        setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
        setContactToDelete(null);
        
        // Also close main modal if we deleted the currently viewed contact
        if (selectedContact?.id === contactToDelete.id) {
          setIsModalOpen(false);
          setSelectedContact(undefined);
        }
    }
  };

  const openViewModal = (contact: Contact) => {
      setSelectedContact(contact);
      setViewMode('VIEW');
      setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
      setSelectedContact(contact);
      setViewMode('EDIT');
      setIsModalOpen(true);
  };

  const openCreateModal = () => {
      setSelectedContact(undefined);
      setViewMode('CREATE');
      setIsModalOpen(true);
  };

  const downloadQRCode = () => {
    if (qrCodeDataURL && selectedContact) {
      const link = document.createElement('a');
      link.download = `${selectedContact.firstName}_${selectedContact.lastName}_QR.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const openQRModal = async (contact: Contact) => {
    setSelectedContact(contact);
    setViewMode('QR');
    setIsModalOpen(true);
    
    try {
      const vcfData = generateVCF(contact, false);
      const qrDataURL = await QRCode.toDataURL(vcfData, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleExportVCF = () => {
    if (filteredContacts.length === 0) {
      setToast({message: "No contacts to export.", type: 'error'});
      return;
    }
    const vcfContent = filteredContacts.map(c => generateVCF(c, true)).join('\n');
    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `vaultkey_contacts_${new Date().toISOString().split('T')[0]}.vcf`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ contacts: filteredContacts }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `vaultkey_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        let importedContacts: Contact[] = [];
        const name = file.name.toLowerCase();

        if (name.endsWith('.vcf') || name.endsWith('.vcard')) {
          importedContacts = parseVCard(content);
        } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
          importedContacts = parseCSV(content);
        } else {
          const json = JSON.parse(content);
          if (json.contacts && Array.isArray(json.contacts)) {
             importedContacts = json.contacts.map((c: any) => ({
               ...c,
               id: Math.random().toString(36).substr(2, 9),
               createdAt: new Date().toISOString(),
               phones: c.phones || (c.phone ? [{id:'1', label:'Mobile', value:c.phone}] : []),
               emails: c.emails || (c.email ? [{id:'1', label:'Work', value:c.email}] : [])
             })) as Contact[];
          }
        }
           
        if (importedContacts.length > 0) {
           for (const contact of importedContacts) {
             await StorageService.saveContact(contact);
           }
           setContacts(prev => [...prev, ...importedContacts]);
           setToast({message: `Imported ${importedContacts.length} contacts successfully.`, type: 'success'});
        } else {
           setToast({message: "No valid contacts found in file.", type: 'error'});
        }
      } catch (err) {
        console.error(err);
        setToast({message: "Failed to parse file.", type: 'error'});
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const getModalTitle = () => {
      if (viewMode === 'VIEW') return "Contact Details";
      if (viewMode === 'EDIT') return "Edit Contact";
      if (viewMode === 'QR') return "Share Contact";
      return "New Contact";
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white flex flex-col flex-shrink-0 transition-all duration-300 shadow-lg lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-sm">
                <Icons.AddressBook />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">VaultKey</h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">Secure Directory</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <Icons.X />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xs uppercase text-gray-500 dark:text-slate-500 font-bold tracking-wider mb-3 px-2">Overview</h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Contacts</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contacts.length}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredContacts.length !== contacts.length && `${filteredContacts.length} filtered`}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs uppercase text-gray-500 dark:text-slate-500 font-bold tracking-wider mb-3 px-2">Navigation</h2>
              <nav className="space-y-1">
                <button 
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-blue-600 text-white shadow-sm"
                >
                  <Icons.Users />
                  <span>All Contacts</span>
                  <span className="ml-auto bg-blue-700/50 text-white py-0.5 px-2 rounded-full text-xs font-semibold">{contacts.length}</span>
                </button>
                <button 
                  onClick={openCreateModal}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <Icons.Plus />
                  <span>Add Contact</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-slate-800 space-y-4">
           <div>
             <h3 className="text-xs uppercase text-gray-500 dark:text-slate-500 font-bold tracking-wider mb-3">Actions</h3>
             <div className="space-y-2">
               <button 
                  onClick={handleExportVCF}
                  className="w-full flex items-center gap-3 py-2.5 px-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors"
                  title="Export for Mobile (vCard)"
               >
                  <Icons.Phone />
                  <span>Export VCF</span>
               </button>
               <button 
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 py-2.5 px-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors"
                  title="Backup Data"
               >
                  <Icons.Download />
                  <span>Backup JSON</span>
               </button>
             </div>
           </div>
           
           <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Icons.Moon /> : <Icons.Sun />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDarkMode ? 'Dark' : 'Light'} Mode
                </span>
              </div>
              <button 
                onClick={toggleTheme} 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all w-full bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <Icons.Menu />
            </button>
            <div className="relative w-full max-w-xs sm:max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></span>
              <input 
                type="text" 
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all text-sm dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            
            <label className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer border border-gray-200 dark:border-slate-700 transition-colors" title="Import JSON, CSV, or VCF">
               <Icons.Upload />
               <span className="hidden sm:inline">Import</span>
               <input type="file" accept=".json,.vcf,.vcard,.csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
            
             <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 dark:shadow-none transition-colors"
              title="New Contact"
            >
              <Icons.Plus />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth custom-scrollbar bg-slate-50 dark:bg-slate-900">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Address Book
              <span className="ml-2 text-sm font-normal text-gray-400">({filteredContacts.length} contacts)</span>
            </h2>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sort by:</span>
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-0.5">
                <select 
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-medium text-gray-700 dark:text-gray-200 py-1 pl-2 pr-1 rounded focus:ring-0 cursor-pointer"
                >
                  <option value="firstName">Name</option>
                  <option value="company">Company</option>
                  <option value="createdAt">Date Created</option>
                </select>
                <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
                <button 
                  onClick={toggleSortOrder}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
                  title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortOrder === 'asc' ? <Icons.SortAsc /> : <Icons.SortDesc />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-medium">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">Name</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm hidden sm:table-cell">Contact Info</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {paginatedContacts.length > 0 ? (
                    paginatedContacts.map(contact => (
                      <ContactRow 
                        key={contact.id} 
                        contact={contact} 
                        onViewClick={openViewModal}
                        onEditClick={openEditModal}
                        onQRClick={openQRModal}
                        onDeleteClick={setContactToDelete}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                        No contacts found. Use "New" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredContacts.length)} of {filteredContacts.length}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Prev
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Modals --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={getModalTitle()} 
        maxWidth={viewMode === 'VIEW' ? "max-w-3xl" : "max-w-2xl"}
      >
        {viewMode === 'VIEW' && selectedContact ? (
          <ContactView 
            contact={selectedContact} 
            onEdit={() => setViewMode('EDIT')} 
            onClose={() => setIsModalOpen(false)} 
          />
        ) : viewMode === 'QR' && selectedContact ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
                {qrCodeDataURL ? (
                  <img 
                    src={qrCodeDataURL}
                    alt="Contact QR Code"
                    className="w-56 h-56"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-500">Generating QR Code...</span>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Scan to add <span className="font-semibold text-gray-900 dark:text-white">{selectedContact.firstName} {selectedContact.lastName}</span> to your device.
              </p>
              <div className="mt-6 flex gap-3 justify-center w-full">
                <button 
                  onClick={downloadQRCode}
                  disabled={!qrCodeDataURL}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Icons.Download />
                  Download QR
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                >
                  Done
                </button>
              </div>
            </div>
        ) : (
           <ContactForm 
            initialData={selectedContact}
            onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        title="Delete Contact"
        maxWidth="max-w-sm"
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <span className="text-red-600 dark:text-red-400"><Icons.Warning /></span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Do you really want to delete <span className="font-semibold text-gray-900 dark:text-white">{contactToDelete?.firstName} {contactToDelete?.lastName}</span>? This process cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={() => setContactToDelete(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={confirmDeleteContact}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Delete
                </button>
            </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}