const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { uploadToCloudinary } = require('../config/cloudinary');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractDataFromDocument = async (req, res) => {
  console.log("--- New Multi-File Extraction Request Received ---");
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const prompt = `
      You are an expert HR data extractor. I have provided one or more files (these could be CVs, ID cards, education certificates, etc.).
      Extract and combine ALL relevant details across ALL the provided documents into a SINGLE comprehensive JSON object.
      ONLY return valid JSON. Do not return markdown blocks like \`\`\`json.
      
      CRITICAL EXTRACTION INSTRUCTIONS:
      - EXTRA CERTIFICATES: You MUST carefully extract ALL extra certificates, courses, workshops, and trainings mentioned in the document and put them into the "certificates" array. Do not miss a single certificate!
      - EDUCATION: You MUST extract ALL education degrees, diplomas, schools, colleges, and academic qualifications into the "education" array. Include organization names, dates, and qualifications accurately.
      
      CRITICAL TRANSLATION INSTRUCTION:
      - If any uploaded document is in Nepali, Arabic (Gulf), Hindi, or any other non-English language, you MUST translate all extracted values (such as names, addresses, about me, occupations, responsibilities, certificates, field of study, etc.) into professional English.
      - Never return non-English scripts (like Devnagari, Arabic script, etc.) in the final JSON values.
      
      CRITICAL INSTRUCTIONS FOR ENUM VALUES:
      - Inside "languages", the skills ("listening", "reading", "spokenInteraction", "spokenProduction", "writing") MUST strictly map to one of these CEFR levels: "A1", "A2", "B1", "B2", "C1", "C2". If not specified, map to a reasonable fit (e.g., intermediate is B2, advanced is C1).
      - Inside "education", "eqfLevel" MUST strictly map to one of these: "EQF level 1", "EQF level 2", "EQF level 3", "EQF level 4", "EQF level 5", "EQF level 6", "EQF level 7", "EQF level 8" (typically: Bachelor's/B.Sc/B.E is "EQF level 6", Master's/M.Sc is "EQF level 7", Ph.D. is "EQF level 8", Secondary is "EQF level 4").
      
      Schema:
      {
        "personalInfo": {
          "fullName": "...", "firstName": "...", "lastName": "...", "aboutMe": "...", "dateOfBirth": "...",
          "nationality": "...", "gender": "...", "nationalId": "...", "passportNumber": "...",
          "email": "...", "phone": "...", "address": "...", "city": "...", "country": "...",
          "postalCode": "...", "website": "...", "linkedIn": "...", "motherTongue": "..."
        },
        "workExperience": [{"occupation": "...", "employer": "...", "city": "...", "country": "...", "from": "...", "to": "...", "responsibilities": ["...", "..."]}],
        "education": [{"qualification": "...", "organization": "...", "city": "...", "country": "...", "from": "...", "to": "...", "website": "...", "fieldOfStudy": "...", "eqfLevel": "..."}],
        "certificates": [{"title": "...", "issuer": "...", "date": "..."}],
        "languages": [{"language": "...", "listening": "...", "reading": "...", "spokenInteraction": "...", "spokenProduction": "...", "writing": "..."}],
        "digitalSkills": ["...", "..."],
        "otherSkills": ["...", "..."]
      }
    `;

    let responseText = null;
    let successModel = null;

    // --- TRY GROQ FIRST (User specifically requested Groq) ---
    console.log("[AI] Attempting extraction using Groq...");
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    
    // Prepare message content for Groq
    const groqContent = [{ type: 'text', text: prompt }];
    for (const file of req.files) {
      if (file.mimetype === 'application/pdf') {
        try {
          console.log(`[AI] Parsing PDF text using pdf-parse for: ${file.originalname}`);
          const dataBuffer = fs.readFileSync(file.path);
          const pdfData = await pdfParse(dataBuffer);
          groqContent.push({
            type: 'text',
            text: `--- Start of PDF Content (${file.originalname}) ---\n${pdfData.text}\n--- End of PDF Content ---`
          });
        } catch (pdfErr) {
          console.error(`[AI] Failed to parse PDF text for Groq fallback: ${pdfErr.message}`);
        }
      } else if (file.mimetype.startsWith('image/')) {
        groqContent.push({
          type: 'text',
          text: `Uploaded file name: ${file.originalname} (Image content is not supported by text-only Groq models)`
        });
      } else {
        // Plain text fallback or placeholder
        groqContent.push({
          type: 'text',
          text: `Uploaded file name: ${file.originalname} (Non-image/Non-PDF content)`
        });
      }
    }

    for (const modelName of groqModels) {
      try {
        console.log(`[AI] Attempting extraction using Groq model: ${modelName}`);
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: groqContent }],
          model: modelName,
          response_format: { type: 'json_object' }
        });
        responseText = completion.choices[0].message.content;
        successModel = `Groq (${modelName})`;
        console.log(`[AI] Successfully extracted data using Groq model: ${modelName}`);
        break; // Exit loop if successful
      } catch (err) {
        console.error(`[AI] Groq model ${modelName} failed:`, err.message);
      }
    }

    // --- FALLBACK TO GEMINI IF GROQ FAILS (e.g. for image inputs) ---
    if (!responseText) {
      console.log("[AI] Groq failed completely or could not process images. Falling back to Gemini...");
      const geminiModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
      const contentParts = [prompt];
      for (const file of req.files) {
        const base64Data = fs.readFileSync(file.path).toString('base64');
        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.mimetype
          }
        });
      }

      for (const modelName of geminiModels) {
        try {
          console.log(`[AI] Attempting extraction using Gemini model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const chatCompletion = await model.generateContent(contentParts);
          responseText = chatCompletion.response.text();
          successModel = `Gemini (${modelName})`;
          console.log(`[AI] Successfully extracted data using Gemini model: ${modelName}`);
          break; // Exit loop if successful
        } catch (err) {
          console.error(`[AI] Gemini model ${modelName} failed:`, err.message);
        }
      }
    }

    if (!responseText) {
      throw new Error("All Groq and Gemini models failed to process the request.");
    }
    
    // Clean JSON response
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(responseText);

    // Upload to Cloudinary
    const folderName = (result.personalInfo?.fullName || 'unknown_ai').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim('_');
    const uploadedDocs = [];

    for (const file of req.files) {
      const base64Data = fs.readFileSync(file.path);
      try {
        const cloudRes = await uploadToCloudinary(base64Data, {
          folder: `europass/${folderName}/ai_extracted`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          quality: 'auto',
          fetch_format: 'auto'
        });
        uploadedDocs.push({
          name: file.originalname,
          url: cloudRes.secure_url,
          type: 'ai_extracted'
        });
      } catch(e) {
        console.error("Cloudinary upload failed for", file.originalname, e);
      }
      // Delete after processing safely
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`[AI] Failed to delete temp file ${file.path}:`, err.message);
        }
      }
    }
    
    result.documents = uploadedDocs;
    result.extractedBy = successModel; // Add source info to result
    return res.json(result);

  } catch (error) {
    console.error("AI EXTRACTION ERROR:", error.message);
    // Cleanup files if error occurred
    if (req.files) {
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) {
          try {
            fs.unlinkSync(f.path);
          } catch (err) {
            console.error(`[AI] Failed to cleanup temp file ${f.path}:`, err.message);
          }
        }
      });
    }
    res.status(500).json({ error: "AI extraction failed", details: error.message });
  }
};

module.exports = { extractDataFromDocument };
