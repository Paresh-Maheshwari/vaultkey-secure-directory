
import React, { useState } from 'react';
import { Contact } from '../types';
import { formatPhoneNumber, generateVCF } from '../utils';

interface ContactViewProps {
  contact: Contact;
  onEdit: () => void;
  onClose: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ contact, onEdit, onClose }) => {
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState(false);

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

  const qrData = React.useMemo(() => {
     if (!showQR) return '';
     // Generate VCF without photo to keep the QR code simple and scannable
     return generateVCF(contact, false); 
  }, [contact, showQR]);

  return (
    <div className="space-y-6">
      {/* Header with Photo and Name */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-100 dark:border-slate-700 pb-6">
        <div className={`w-32 h-32 rounded-full flex-shrink-0 overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ${!contact.photo ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center' : ''}`}>
          {contact.photo ? (
            <img src={contact.photo} alt={`${contact.firstName} ${contact.lastName}`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-300 opacity-50">
              {contact.firstName?.[0]}{contact.lastName?.[0]}
            </span>
          )}
        </div>
        
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {contact.firstName} {contact.lastName}
          </h2>
          {contact.nickname && (
            <p className="text-gray-500 dark:text-gray-400 font-medium">"{contact.nickname}"</p>
          )}
          {(contact.position || contact.company) && (
            <div className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              {contact.position}
              {contact.position && contact.company && <span className="mx-2 text-gray-300">•</span>}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{contact.company}</span>
            </div>
          )}
          {contact.department && (
            <p className="text-sm text-gray-400 mt-1 uppercase tracking-wide">{contact.department}</p>
          )}
          
          <div className="mt-4 flex justify-center sm:justify-start">
             <button 
               onClick={() => setShowQR(!showQR)}
               className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="5" height="5" x="7" y="7"/><rect width="5" height="5" x="7" y="17"/><rect width="5" height="5" x="17" y="17"/><rect width="5" height="5" x="17" y="7"/></svg>
               {showQR ? 'Hide QR Code' : 'Share via QR Code'}
             </button>
          </div>
        </div>
      </div>

      {showQR && (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl animate-in zoom-in fade-in duration-200">
          <div className="bg-white p-2 rounded-lg shadow-sm">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
               alt="Scan to add contact"
               className="w-48 h-48"
             />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">Scan with your mobile camera to add contact</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-2">
            Contact Details
          </h3>
          
          <div className="space-y-4">
            {contact.emails.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Email</label>
                <div className="space-y-1">
                  {contact.emails.map((email) => (
                    <div key={email.id} className="flex items-center gap-2">
                      <a href={`mailto:${email.value}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {email.value}
                      </a>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
                        {email.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.phones.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
                <div className="space-y-1">
                  {contact.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center gap-2">
                      <a href={`tel:${phone.value}`} className="text-gray-800 dark:text-gray-200 font-mono">
                        {formatPhoneNumber(phone.value)}
                      </a>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
                        {phone.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.website && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Website</label>
                <a 
                  href={getWebsiteUrl(contact.website)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {contact.website}
                </a>
              </div>
            )}

            {contact.address && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Address</label>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{contact.address}</p>
              </div>
            )}

             {contact.birthday && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Birthday</label>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
                  {contact.birthday}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-6">
           <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-2">
            Notes & Secure Data
          </h3>

          {contact.notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <label className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase mb-1 block">Notes</label>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
            </div>
          )}

          {contact.customFields && contact.customFields.length > 0 ? (
            <div className="space-y-3">
              {contact.customFields.map((field) => (
                <div key={field.id} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{field.label}</span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 flex items-center">
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
                    
                    {field.isSensitive && (
                        <button 
                            onClick={() => toggleFieldVisibility(field.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            title={revealedFields.has(field.id) ? "Hide" : "Show"}
                        >
                            {revealedFields.has(field.id) ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                        </button>
                    )}
                    
                    {!field.isSensitive && (
                       <div className="w-5" /> 
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No additional custom fields.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700 gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          Edit Contact
        </button>
      </div>
    </div>
  );
};
