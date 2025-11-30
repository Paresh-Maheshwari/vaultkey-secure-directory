import { GoogleGenAI, Type } from "@google/genai";
import { Contact } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseContactFromText = async (text: string): Promise<Partial<Contact> | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract contact information from the following text. 
      - Extract all email addresses and phone numbers found into arrays.
      - If banking information (IBAN, SWIFT, Account Number) is found, put it in 'customFields' with isSensitive set to true.
      - Extract any other relevant info like company, position, address, website.
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            emails: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            phones: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            company: { type: Type.STRING },
            position: { type: Type.STRING },
            department: { type: Type.STRING },
            address: { type: Type.STRING },
            website: { type: Type.STRING },
            notes: { type: Type.STRING },
            customFields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  isSensitive: { type: Type.BOOLEAN, description: "True if banking or sensitive info" }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Map response to Contact structure
    const contact: Partial<Contact> = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        company: data.company || '',
        position: data.position || '',
        department: data.department || '',
        address: data.address || '',
        website: data.website || '',
        notes: data.notes || '',
        emails: Array.isArray(data.emails) ? data.emails.map((e: string) => ({
            id: Math.random().toString(36).substr(2, 9),
            label: 'Work',
            value: e
        })) : [],
        phones: Array.isArray(data.phones) ? data.phones.map((p: string) => ({
            id: Math.random().toString(36).substr(2, 9),
            label: 'Mobile',
            value: p
        })) : [],
        customFields: Array.isArray(data.customFields) ? data.customFields.map((cf: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            label: cf.label || 'Field',
            value: cf.value || '',
            isSensitive: !!cf.isSensitive
        })) : []
    };

    return contact;

  } catch (error) {
    console.error("Error parsing contact with Gemini:", error);
    return null;
  }
};