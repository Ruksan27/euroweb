const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { uploadToCloudinary } = require('../config/cloudinary');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractDataFromDocument = async (req, res) => {
  console.log("--- New Multi-File Extraction Request Received (GEMINI) ---");
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert HR data extractor. I have provided one or more files (these could be CVs, ID cards, education certificates, etc.).
      Extract and combine ALL relevant details across ALL the provided documents into a SINGLE comprehensive JSON object.
      ONLY return valid JSON. Do not return markdown blocks like \`\`\`json.
      
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

    // Process all files to pass into Gemini
    const contentParts = [prompt];
    for (const file of req.files) {
      const base64Data = fs.readFileSync(file.path).toString('base64');
      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimetype
        }
      });
      // Do NOT delete yet, we need it for Cloudinary upload
    }

    const chatCompletion = await model.generateContent(contentParts);
    let responseText = chatCompletion.response.text();
    
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
        });
        uploadedDocs.push({
          name: file.originalname,
          url: cloudRes.secure_url,
          type: 'ai_extracted'
        });
      } catch(e) {
        console.error("Cloudinary upload failed for", file.originalname, e);
      }
      // Delete after processing
      fs.unlinkSync(file.path);
    }
    
    result.documents = uploadedDocs;
    return res.json(result);

  } catch (error) {
    console.error("GEMINI ERROR:", error.message);
    // Cleanup files if error occurred
    if (req.files) {
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    res.status(500).json({ error: "Gemini AI failed", details: error.message });
  }
};

module.exports = { extractDataFromDocument };
