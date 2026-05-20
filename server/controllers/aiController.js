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
    let skipGroq = false;

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
          const extractedText = pdfData.text ? pdfData.text.trim() : '';
          
          if (extractedText.length < 50) {
            console.log(`[AI] PDF ${file.originalname} has very little text. Might be scanned. Skipping Groq for better OCR with Gemini.`);
            skipGroq = true;
          }
          
          groqContent.push({
            type: 'text',
            text: `--- Start of PDF Content (${file.originalname}) ---\n${pdfData.text}\n--- End of PDF Content ---`
          });
        } catch (pdfErr) {
          console.error(`[AI] Failed to parse PDF text for Groq fallback: ${pdfErr.message}`);
        }
      } else if (file.mimetype.startsWith('image/')) {
        skipGroq = true;
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

    if (!skipGroq) {
      for (const modelName of groqModels) {
        try {
          console.log(`[AI] Attempting extraction using Groq model: ${modelName}`);
          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: groqContent }],
            model: modelName,
            response_format: { type: 'json_object' }
          });
          responseText = completion.choices[0].message.content;
          
          // Verify if Groq returned empty/not available data
          try {
            const cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const testResult = JSON.parse(cleanResponse);
            const name = testResult?.personalInfo?.fullName || "";
            if (!name || name.toLowerCase().includes("not available") || name.toLowerCase().includes("unknown") || name === "(no name)") {
              console.log("[AI] Groq returned 'Not available' or empty data. Discarding Groq response to trigger Gemini fallback.");
              responseText = null;
              continue; // Try next Groq model or fail
            }
          } catch(e) {
             console.log("[AI] Failed to parse Groq response to verify it.");
             responseText = null;
             continue; // JSON parse failed, try next
          }

          successModel = `Groq (${modelName})`;
          console.log(`[AI] Successfully extracted data using Groq model: ${modelName}`);
          break; // Exit loop if successful
        } catch (err) {
          console.error(`[AI] Groq model ${modelName} failed:`, err.message);
        }
      }
    } else {
      console.log("[AI] Skipping Groq models because uploaded files require image OCR capabilities.");
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

    // --- FALLBACK TO GROQ VISION IF GEMINI FAILS ---
    if (!responseText) {
      console.log("[AI] Gemini failed or not available. Falling back to Groq Vision models...");
      const groqVisionModels = ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
      const groqVisionContent = [{ type: 'text', text: prompt }];
      let canUseVision = false;

      for (const file of req.files) {
        if (file.mimetype.startsWith('image/')) {
          const base64Data = fs.readFileSync(file.path).toString('base64');
          groqVisionContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimetype};base64,${base64Data}`
            }
          });
          canUseVision = true;
        } else if (file.mimetype === 'application/pdf') {
           try {
             const dataBuffer = fs.readFileSync(file.path);
             const pdfData = await pdfParse(dataBuffer);
             groqVisionContent.push({
                type: 'text',
                text: `--- Start of PDF Content (${file.originalname}) ---\n${pdfData.text}\n--- End of PDF Content ---`
             });
           } catch(e) {}
        }
      }

      if (canUseVision) {
        for (const modelName of groqVisionModels) {
          try {
            console.log(`[AI] Attempting extraction using Groq Vision model: ${modelName}`);
            const completion = await groq.chat.completions.create({
              messages: [{ role: 'user', content: groqVisionContent }],
              model: modelName,
            });
            responseText = completion.choices[0].message.content;
            
            // Validate response
            try {
              const cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
              const testResult = JSON.parse(cleanResponse);
              const name = testResult?.personalInfo?.fullName || "";
              if (!name || name.toLowerCase().includes("not available") || name.toLowerCase().includes("unknown") || name === "(no name)") {
                 console.log("[AI] Groq Vision returned empty or 'Not available' data.");
                 responseText = null;
                 continue;
              }
            } catch(e) {
               console.log("[AI] Failed to parse Groq Vision response.");
               responseText = null;
               continue;
            }

            successModel = `Groq Vision (${modelName})`;
            console.log(`[AI] Successfully extracted data using Groq Vision model: ${modelName}`);
            break;
          } catch (err) {
            console.error(`[AI] Groq Vision model ${modelName} failed:`, err.message);
          }
        }
      }
    }

    if (!responseText) {
      throw new Error("All Groq and Gemini models failed to process the request.");
    }
    
    // Clean JSON response
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    console.log('[AI] Raw responseText length:', responseText.length ? responseText.length : 0);
    const result = JSON.parse(responseText);
    console.log('[AI] Parsed result:', !!result && !!result.personalInfo ? (result.personalInfo.fullName || '(no name)') : 'no personalInfo');

    // Upload to Cloudinary
    const folderName = (result.personalInfo?.fullName || 'unknown_ai').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim('_');
    const uploadedDocs = [];

    console.log('[AI] Uploading', req.files.length, 'files to Cloudinary');
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

    // Persist extracted result as a CV document in DB
    try {
      const CV = require('../models/CV');
      const cvPayload = {
        personalInfo: result.personalInfo || {},
        workExperience: result.workExperience || [],
        education: result.education || [],
        certificates: result.certificates || [],
        languages: result.languages || [],
        digitalSkills: result.digitalSkills || [],
        otherSkills: result.otherSkills || [],
        documents: uploadedDocs,
        folderName,
        cvFormat: result.cvFormat || 'europass'
      };

      // If authenticated user context exists, attach userId
      if (req.user && req.user.userId) {
        cvPayload.userId = req.user.userId;
      }

      console.log('[AI] Saving CV to DB for', cvPayload.personalInfo?.fullName || '(no name)');
      const cvDoc = new CV(cvPayload);
      await cvDoc.save();
      console.log('[AI] CV saved to DB with id', cvDoc._id.toString());
      // include saved CV id in response
      result._savedCvId = cvDoc._id;
    } catch (saveErr) {
      console.error('[AI] Failed to save extracted CV to DB:', saveErr);
      // proceed without failing the whole response
      result._savedCvError = saveErr.message;
    }

    console.log('[AI] Returning response, savedId=', result._savedCvId, ' savedError=', result._savedCvError);
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
