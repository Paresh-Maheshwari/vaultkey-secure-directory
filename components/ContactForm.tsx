
import React, { useState, useEffect, useRef } from 'react';
import { Contact, CustomField, LabeledValue } from '../types';
import { formatPhoneNumber, isValidPhoneNumber, isValidEmail, isValidUrl } from '../utils';

interface ContactFormProps {
  initialData?: Partial<Contact>;
  onSubmit: (data: Omit<Contact, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    photo: '',
    emails: [] as LabeledValue[],
    phones: [] as LabeledValue[],
    company: '',
    department: '',
    position: '',
    address: '',
    website: '',
    birthday: '',
    notes: '',
    customFields: [] as CustomField[],
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure arrays exist even if importing old data structure
        emails: initialData.emails || [],
        phones: initialData.phones || [],
        customFields: initialData.customFields || [],
        photo: initialData.photo || ''
      }));
    } else {
      // Default empty fields for new contact
      setFormData(prev => ({
        ...prev,
        phones: [{ id: '1', label: 'Mobile', value: '' }],
        emails: [{ id: '1', label: 'Work', value: '' }]
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // --- Photo Handling ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize image to max 256x256 to save space
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({ ...prev, photo: compressedBase64 }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Dynamic Lists (Phones/Emails) ---

  const handleLabeledChange = (
    type: 'phones' | 'emails',
    id: string,
    field: keyof LabeledValue,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
    
    // Clear error for specific item when typing
    if (field === 'value') {
        const errorKey = type === 'phones' ? `phone_${id}` : `email_${id}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    }
  };

  const handleItemBlur = (type: 'phones' | 'emails', id: string, value: string) => {
      if (type === 'phones') {
          // Format phone number
          const formatted = formatPhoneNumber(value);
          handleLabeledChange('phones', id, 'value', formatted);
          
          // Validate
          if (value.trim() && !isValidPhoneNumber(value)) {
              setErrors(prev => ({...prev, [`phone_${id}`]: 'Invalid phone number format'}));
          }
      } else if (type === 'emails') {
          // Validate Email
          if (value.trim() && !isValidEmail(value)) {
              setErrors(prev => ({...prev, [`email_${id}`]: 'Invalid email address'}));
          }
      }
  };

  const addItem = (type: 'phones' | 'emails') => {
    const newItem: LabeledValue = {
      id: Math.random().toString(36).substr(2, 9),
      label: type === 'phones' ? 'Mobile' : 'Work',
      value: ''
    };
    setFormData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
  };

  const removeItem = (type: 'phones' | 'emails', id: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
    const errorKey = type === 'phones' ? `phone_${id}` : `email_${id}`;
    if (errors[errorKey]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
        });
    }
  };

  // --- Custom Fields ---

  const handleCustomFieldChange = (id: string, field: keyof CustomField, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(cf => 
        cf.id === id ? { ...cf, [field]: value } : cf
      )
    }));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      value: '',
      isSensitive: false
    };
    setFormData(prev => ({ ...prev, customFields: [...prev.customFields, newField] }));
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(cf => cf.id !== id)
    }));
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;

    // Validate Required Fields
    if (!formData.firstName.trim()) {
        newErrors['firstName'] = 'First name is required';
        isValid = false;
    }

    // Validate Phone Numbers
    formData.phones.forEach(phone => {
        if (phone.value.trim() && !isValidPhoneNumber(phone.value)) {
            newErrors[`phone_${phone.id}`] = 'Invalid phone number format';
            isValid = false;
        }
    });

    // Validate Emails
    formData.emails.forEach(email => {
        if (email.value.trim() && !isValidEmail(email.value)) {
            newErrors[`email_${email.id}`] = 'Invalid email format';
            isValid = false;
        }
    });

    // Validate Website
    if (formData.website.trim() && !isValidUrl(formData.website)) {
        newErrors['website'] = 'Invalid URL format (e.g. example.com)';
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
        return;
    }

    // Filter out empty entries
    const cleanData = {
      ...formData,
      phones: formData.phones.filter(p => p.value.trim() !== ''),
      emails: formData.emails.filter(e => e.value.trim() !== '')
    };
    onSubmit(cleanData);
  };

  const getInputClass = (error?: string) => `w-full px-3 py-2 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'} rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400`;
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const selectClass = "px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white text-xs font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Top Section: Photo + Name */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 ${formData.photo ? 'border-blue-500' : 'border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700'}`}>
              {formData.photo ? (
                <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </div>
            {formData.photo && (
              <button 
                type="button" 
                onClick={removePhoto}
                className="absolute -top-1 -right-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Names */}
        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-5">
            <label className={labelClass}>First Name *</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={getInputClass(errors.firstName)}
            />
            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName}</span>}
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className={labelClass}>Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={getInputClass()}
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <label className={labelClass}>Nickname</label>
            <input
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className={getInputClass()}
              placeholder="Optional"
            />
          </div>
          <div className="col-span-12">
            <label className={labelClass}>Job Title & Company</label>
            <div className="flex gap-2">
              <input
                name="position"
                placeholder="Job Title"
                value={formData.position}
                onChange={handleChange}
                className={`${getInputClass()} w-1/2`}
              />
              <input
                name="company"
                placeholder="Company"
                value={formData.company}
                onChange={handleChange}
                className={`${getInputClass()} w-1/2`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Phones Section */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>Phone Numbers</label>
            <button type="button" onClick={() => addItem('phones')} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">+ Add Phone</button>
          </div>
          <div className="space-y-2">
            {formData.phones.map((phone, idx) => (
              <div key={phone.id} className="flex flex-col gap-1">
                <div className="flex gap-2">
                    <select 
                    value={phone.label}
                    onChange={(e) => handleLabeledChange('phones', phone.id, 'label', e.target.value)}
                    className={selectClass}
                    >
                    <option value="Mobile">Mobile</option>
                    <option value="Work">Work</option>
                    <option value="Home">Home</option>
                    <option value="Main">Main</option>
                    <option value="Other">Other</option>
                    </select>
                    <input
                    type="tel"
                    placeholder="Number"
                    value={phone.value}
                    onChange={(e) => handleLabeledChange('phones', phone.id, 'value', e.target.value)}
                    onBlur={() => handleItemBlur('phones', phone.id, phone.value)}
                    className={`${getInputClass(errors[`phone_${phone.id}`])} flex-1 text-sm py-1.5`}
                    />
                    {formData.phones.length > 1 && (
                    <button type="button" onClick={() => removeItem('phones', phone.id)} className="text-gray-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
                    </button>
                    )}
                </div>
                {errors[`phone_${phone.id}`] && (
                    <span className="text-xs text-red-500 ml-1">{errors[`phone_${phone.id}`]}</span>
                )}
              </div>
            ))}
            {formData.phones.length === 0 && (
               <button type="button" onClick={() => addItem('phones')} className="w-full text-center py-2 text-sm text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-md hover:bg-white dark:hover:bg-slate-700">
                 No phones added
               </button>
            )}
          </div>
        </div>

        {/* Emails Section */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>Emails</label>
            <button type="button" onClick={() => addItem('emails')} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">+ Add Email</button>
          </div>
          <div className="space-y-2">
            {formData.emails.map((email, idx) => (
              <div key={email.id} className="flex flex-col gap-1">
                <div className="flex gap-2">
                    <select 
                    value={email.label}
                    onChange={(e) => handleLabeledChange('emails', email.id, 'label', e.target.value)}
                    className={selectClass}
                    >
                    <option value="Work">Work</option>
                    <option value="Home">Home</option>
                    <option value="Other">Other</option>
                    </select>
                    <input
                    type="email"
                    placeholder="Email Address"
                    value={email.value}
                    onChange={(e) => handleLabeledChange('emails', email.id, 'value', e.target.value)}
                    onBlur={() => handleItemBlur('emails', email.id, email.value)}
                    className={`${getInputClass(errors[`email_${email.id}`])} flex-1 text-sm py-1.5`}
                    />
                    {formData.emails.length > 1 && (
                    <button type="button" onClick={() => removeItem('emails', email.id)} className="text-gray-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
                    </button>
                    )}
                </div>
                {errors[`email_${email.id}`] && (
                    <span className="text-xs text-red-500 ml-1">{errors[`email_${email.id}`]}</span>
                )}
              </div>
            ))}
             {formData.emails.length === 0 && (
               <button type="button" onClick={() => addItem('emails')} className="w-full text-center py-2 text-sm text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-md hover:bg-white dark:hover:bg-slate-700">
                 No emails added
               </button>
            )}
          </div>
        </div>

      </div>

      {/* Details Section */}
      <div className="grid grid-cols-12 gap-4">
         <div className="col-span-12 sm:col-span-4">
          <label className={labelClass}>Department</label>
          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={getInputClass()}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <label className={labelClass}>Website</label>
          <input
            type="text"
            name="website"
            placeholder="www.example.com"
            value={formData.website}
            onChange={handleChange}
            className={getInputClass(errors.website)}
          />
          {errors.website && <span className="text-xs text-red-500">{errors.website}</span>}
        </div>
        <div className="col-span-12 sm:col-span-4">
          <label className={labelClass}>Birthday</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            className={getInputClass()}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <textarea
          name="address"
          rows={2}
          value={formData.address}
          onChange={handleChange}
          className={getInputClass()}
          placeholder="Street, City, Zip, Country"
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          className={getInputClass()}
          placeholder="General notes..."
        />
      </div>

      {/* Custom Fields / Banking */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Additional Information / Banking</h4>
          <button
            type="button"
            onClick={addCustomField}
            className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Field
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.customFields.map((field) => (
            <div key={field.id} className="flex gap-2 items-start bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-700">
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Label (e.g., IBAN)"
                  value={field.label}
                  onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                />
                <input
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                  className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                 <button
                  type="button"
                  title="Toggle Sensitivity (Secure)"
                  onClick={() => handleCustomFieldChange(field.id, 'isSensitive', !field.isSensitive)}
                  className={`p-1 rounded ${field.isSensitive ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
                </button>
              </div>
            </div>
          ))}
          {formData.customFields.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-2">No custom fields added yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
        >
          Save Contact
        </button>
      </div>
    </form>
  );
};
