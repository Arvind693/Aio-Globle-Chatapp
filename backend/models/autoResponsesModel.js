const mongoose = require('mongoose');

const autoResponseSchema = new mongoose.Schema(
    {
        trigger: {
            type: String,
            required: true,
            trim: true,
        },
        response: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true, 
    }
);

const AutoResponse = mongoose.model('AutoResponse', autoResponseSchema);

module.exports = AutoResponse;

