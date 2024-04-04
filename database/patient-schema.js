const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    name: { type: String, required: true },
    mobile_number: { type: String, required: true },
    medical_history: [{
        visitDate: { type: Date, default: Date.now },
        notes: mongoose.Schema.Types.Mixed
    }]
}, { timestamps: true }); // Optionally add timestamps to automatically get createdAt and updatedAt fields

const Patient = mongoose.model('Patient', patientSchema,'patients_collection');

module.exports = Patient;
