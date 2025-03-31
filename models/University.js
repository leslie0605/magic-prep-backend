const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define department schema as a sub-document
const departmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  programs: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      degree: {
        type: String,
        required: true,
        enum: ["Bachelors", "Masters", "PhD", "Certificate", "Diploma"],
      },
      requirements: {
        gre: {
          required: {
            type: Boolean,
            default: false,
          },
          minimumScore: {
            type: Number,
            default: 0,
          },
        },
        gpa: {
          minimum: {
            type: Number,
            default: 0,
          },
          preferred: {
            type: Number,
            default: 0,
          },
        },
        toefl: {
          required: {
            type: Boolean,
            default: false,
          },
          minimumScore: {
            type: Number,
            default: 0,
          },
        },
        ielts: {
          required: {
            type: Boolean,
            default: false,
          },
          minimumScore: {
            type: Number,
            default: 0,
          },
        },
      },
      deadlines: {
        regular: Date,
        priority: Date,
        rolling: {
          type: Boolean,
          default: false,
        },
      },
      funding: {
        available: {
          type: Boolean,
          default: false,
        },
        types: [String],
      },
    },
  ],
});

// Main university schema
const universitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    ranking: {
      global: Number,
      national: Number,
      year: Number,
    },
    admissionStats: {
      acceptanceRate: Number,
      totalStudents: Number,
      internationalStudents: Number,
      year: Number,
    },
    departments: [departmentSchema],
    tuition: {
      graduate: {
        inState: Number,
        outOfState: Number,
        international: Number,
      },
      costOfLiving: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    researchAreas: [
      {
        name: String,
        description: String,
        facultyCount: Number,
      },
    ],
    contact: {
      admissionsOffice: {
        email: String,
        phone: String,
        website: String,
      },
      graduateSchool: {
        email: String,
        phone: String,
        website: String,
      },
    },
    resources: {
      libraries: Number,
      researchCenters: Number,
      housingAvailable: Boolean,
      internationalOffice: Boolean,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create indexes for common queries
universitySchema.index({ name: "text", "departments.name": "text" });
universitySchema.index({ "location.country": 1, "location.state": 1 });
universitySchema.index({ "ranking.global": 1 });

// Update the updatedAt timestamp on save
universitySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("University", universitySchema);
