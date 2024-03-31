const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    name: { type: String, required: true },
    mobile_number: { type: String, required: true }, // Assuming mobile_number should be unique
    medical_history: [{
        date: { type: Date },
        notes: String,
        diagnosis: [String],
        treatment_plan: String,
        education_pamphlet_content: String,
    }]
}, { timestamps: true }); // Optionally add timestamps to automatically get createdAt and updatedAt fields

const Patient = mongoose.model('Patient', patientSchema,'patients_collection');

module.exports = Patient;
