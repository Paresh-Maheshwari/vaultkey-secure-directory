import React, { useState } from 'react';
import { Contact } from '../types';
import { formatPhoneNumber, generateVCF } from '../utils';
import QRCode from 'qrcode';

interface ContactViewProps {
  contact: Contact;
  onEdit: () => void;
  onClose: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ contact, onEdit, onClose }) => {
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState(false);
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string>('');

  const toggleFieldVisibility = (id: string) => {
    const next = new Set(revealedFields);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setRevealedFields(next);
  };

  const getWebsiteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const generateQR = async () => {
    if (!showQR) {
      setShowQR(true);
      try {
        const vcfData = generateVCF(contact, false);
        const qr = await QRCode.toDataURL(vcfData, { width: 200, margin: 2 });
        setQrDataURL(qr);
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    } else {
      setShowQR(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const downloadVCard = () => {
    const vcfContent = generateVCF(contact, true);
    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${contact.firstName}_${contact.lastName}.vcf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Photo and Name */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border-b border-gray-100 dark:border-slate-700 pb-6">
        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex-shrink-0 overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ${!contact.photo ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center' : ''}`}>
          {contact.photo ? (
            <img src={contact.photo} alt={`${contact.firstName} ${contact.lastName}`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-300 opacity-50">
              {contact.firstName?.[0]}{contact.lastName?.[0]}
            </span>
          )}
        </div>
        
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {contact.firstName} {contact.lastName}
          </h2>
          {contact.nickname && (
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">"{contact.nickname}"</p>
          )}
          {(contact.position || contact.company) && (
            <div className="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              {contact.position}
              {contact.position && contact.company && <span className="mx-2 text-gray-300">•</span>}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{contact.company}</span>
            </div>
          )}
          {contact.department && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1 uppercase tracking-wide">{contact.department}</p>
          )}
          
          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            {contact.phones.length > 0 && (
              <a 
                href={`tel:${contact.phones[0].value}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call
              </a>
            )}
            {contact.emails.length > 0 && (
              <a 
                href={`mailto:${contact.emails[0].value}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </a>
            )}
            <button 
              onClick={generateQR}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1"/>
                <rect width="5" height="5" x="16" y="3" rx="1"/>
                <rect width="5" height="5" x="3" y="16" rx="1"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                <path d="M21 21v.01"/>
                <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                <path d="M3 12h.01"/>
                <path d="M12 3h.01"/>
                <path d="M12 16v.01"/>
                <path d="M16 12h1"/>
                <path d="M21 12v.01"/>
                <path d="M12 21v-1"/>
              </svg>
              {showQR ? 'Hide QR' : 'QR Code'}
            </button>
            <button 
              onClick={downloadVCard}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {showQR && qrDataURL && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <img src={qrDataURL} alt="Scan to add contact" className="w-40 h-40 sm:w-48 sm:h-48" />
          </div>
          <p className="mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium text-center">Scan with your mobile camera to add contact</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Contact Information */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-2">
            Contact Details
          </h3>
          
          <div className="space-y-4">
            {contact.emails.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Email</label>
                <div className="space-y-2">
                  {contact.emails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <a href={`mailto:${email.value}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                          {email.value}
                        </a>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {email.label}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(email.value, `email-${email.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                        title="Copy"
                      >
                        {copiedField === `email-${email.id}` ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.phones.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
                <div className="space-y-2">
                  {contact.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                      <div className="flex-1">
                        <a href={`tel:${phone.value}`} className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                          {formatPhoneNumber(phone.value)}
                        </a>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {phone.label}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(phone.value, `phone-${phone.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                        title="Copy"
                      >
                        {copiedField === `phone-${phone.id}` ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.website && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Website</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                  <a 
                    href={getWebsiteUrl(contact.website)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex-1"
                  >
                    {contact.website}
                  </a>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                </div>
              </div>
            )}

            {contact.address && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Address</label>
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{contact.address}</p>
                </div>
              </div>
            )}

            {contact.birthday && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Birthday</label>
                <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
                  {contact.birthday}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-2">
            Notes & Secure Data
          </h3>

          {contact.notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 sm:p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <label className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase mb-1 block">Notes</label>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
            </div>
          )}

          {contact.customFields && contact.customFields.length > 0 ? (
            <div className="space-y-3">
              {contact.customFields.map((field) => (
                <div key={field.id} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">{field.label}</span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {field.isSensitive && !revealedFields.has(field.id) ? (
                        <span className="font-mono text-sm text-gray-400 dark:text-slate-600 select-none tracking-widest">
                          ••••••••••••
                        </span>
                      ) : (
                        <span className={`font-mono text-sm break-all ${field.isSensitive ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded' : 'text-gray-800 dark:text-gray-200'}`}>
                          {field.value}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {field.isSensitive && (
                        <button 
                          onClick={() => toggleFieldVisibility(field.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                          title={revealedFields.has(field.id) ? "Hide" : "Show"}
                        >
                          {revealedFields.has(field.id) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      )}
                      {revealedFields.has(field.id) && (
                        <button
                          onClick={() => copyToClipboard(field.value, `field-${field.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                          title="Copy"
                        >
                          {copiedField === `field-${field.id}` ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No additional custom fields.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end pt-6 border-t border-gray-200 dark:border-slate-700 gap-2 sm:gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          Edit Contact
        </button>
      </div>
    </div>
  );
};
