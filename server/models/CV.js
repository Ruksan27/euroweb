const mongoose = require('mongoose');

const CVSchema = new mongoose.Schema({
  personalInfo: {
    fullName: String,
    firstName: String,
    lastName: String,
    aboutMe: String,
    dateOfBirth: String,
    nationality: String,
    gender: String,
    nationalId: String,
    passportNumber: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    postalCode: String,
    website: String,
    linkedIn: String,
    motherTongue: String,
  },
  photoUrl: String,
  photoShape: { type: String, default: 'rounded' }, // 'circle' | 'square' | 'rounded'

  workExperience: [{
    occupation: String,
    employer: String,
    city: String,
    country: String,
    from: String,
    to: String,
    responsibilities: [String]
  }],

  education: [{
    qualification: String,
    organization: String,
    city: String,
    country: String,
    from: String,
    to: String,
    website: String,
    fieldOfStudy: String,
    eqfLevel: String,
    documentUrl: String,    // Uploaded education certificate
    documentName: String,
  }],

  certificates: [{
    title: String,
    issuer: String,
    date: String,
    documentUrl: String,
    documentName: String,
  }],

  languages: [{
    language: String,
    listening: String,
    reading: String,
    spokenInteraction: String,
    spokenProduction: String,
    writing: String,
  }],

  digitalSkills: [String],
  otherSkills: [String],

  // All uploaded documents (organized)
  documents: [{
    name: String,
    url: String,
    type: { type: String },  // 'photo' | 'education' | 'certificate' | 'other'
    uploadedAt: { type: Date, default: Date.now }
  }],

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  folderName: String,  // Cloudinary folder: e.g. "john_doe_2024"
  cvFormat: { type: String, default: 'europass' }, // 'europass' | 'modern' | 'minimal'
  themeColor: { type: String, default: '#0e4a8e' },
  europassVariant: { type: String, default: 'v1' },
  textSize: { type: String, default: 'medium' },
  europassLogo: { type: String, default: 'first_page' },
  pageNumbers: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CV', CVSchema);
