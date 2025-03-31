require("dotenv").config();
const mongoose = require("mongoose");
const University = require("../models/University");
const connectDB = require("../config/db");
const moreUniversities = require("./moreUniversities");
const moreUniversities2 = require("./moreUniversities2");
const moreUniversities3 = require("./moreUniversities3");
const moreUniversities4 = require("./moreUniversities4");
const moreUniversities5 = require("./moreUniversities5");

// Process command line arguments
const args = process.argv.slice(2);
const action = args[0] || "seed"; // Default to 'seed'

// Main function to handle different operations
const main = async () => {
  try {
    await connectDB();

    switch (action) {
      case "seed":
        await seedUniversities();
        break;
      case "delete":
        await deleteUniversities();
        break;
      case "list":
        await listUniversities();
        break;
      default:
        console.log("Available commands:");
        console.log(
          "  node seedUniversities.js seed  - Seeds the database with universities"
        );
        console.log(
          "  node seedUniversities.js delete - Deletes all universities"
        );
        console.log(
          "  node seedUniversities.js list  - Lists all universities"
        );
    }

    // Close connection
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// University data to seed
const universities = [
  {
    name: "Stanford University",
    shortName: "Stanford",
    applicationDeadline: new Date("2023-12-01"),
    location: {
      city: "Stanford",
      state: "California",
      country: "USA",
      coordinates: {
        latitude: 37.4275,
        longitude: -122.1697,
      },
    },
    ranking: {
      global: 3,
      national: 2,
      year: 2023,
    },
    admissionStats: {
      acceptanceRate: 3.9,
      totalStudents: 17833,
      internationalStudents: 3500,
      year: 2023,
    },
    departments: [
      {
        name: "Computer Science",
        description:
          "Stanford's Computer Science Department is a leader in AI, machine learning, and theoretical computer science research.",
        programs: [
          {
            name: "Computer Science",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 320,
              },
              gpa: {
                minimum: 3.5,
                preferred: 3.8,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-01"),
              priority: new Date("2023-11-15"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
          {
            name: "Computer Science",
            degree: "Masters",
            requirements: {
              gre: {
                required: true,
                minimumScore: 310,
              },
              gpa: {
                minimum: 3.3,
                preferred: 3.6,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-01"),
              priority: new Date("2023-11-15"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["TA", "RA"],
            },
          },
        ],
      },
      {
        name: "Psychology",
        description:
          "Stanford's Psychology Department is renowned for its leading research in cognitive, developmental, and social psychology.",
        programs: [
          {
            name: "Psychology",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 315,
              },
              gpa: {
                minimum: 3.3,
                preferred: 3.7,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-01"),
              priority: new Date("2023-11-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
        ],
      },
      {
        name: "Engineering",
        description:
          "Stanford School of Engineering is consistently ranked among the top engineering schools in the world.",
        programs: [
          {
            name: "Electrical Engineering",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 320,
              },
              gpa: {
                minimum: 3.5,
                preferred: 3.8,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-01"),
              priority: new Date("2023-11-15"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
          {
            name: "Mechanical Engineering",
            degree: "Masters",
            requirements: {
              gre: {
                required: true,
                minimumScore: 310,
              },
              gpa: {
                minimum: 3.3,
                preferred: 3.6,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-01"),
              priority: new Date("2023-11-15"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["TA", "RA"],
            },
          },
        ],
      },
    ],
    tuition: {
      graduate: {
        inState: 56169,
        outOfState: 56169,
        international: 56169,
      },
      costOfLiving: 25000,
      currency: "USD",
    },
    researchAreas: [
      {
        name: "Artificial Intelligence",
        description:
          "Leading research in machine learning, NLP, computer vision, and robotics.",
        facultyCount: 25,
      },
      {
        name: "Human-Computer Interaction",
        description:
          "Research on novel interfaces, user experience, and social computing.",
        facultyCount: 15,
      },
      {
        name: "Cognitive Psychology",
        description:
          "Research on human cognition, memory, learning, and decision-making.",
        facultyCount: 20,
      },
    ],
    contact: {
      admissionsOffice: {
        email: "gradadmissions@stanford.edu",
        phone: "+1-650-723-4000",
        website: "https://www.stanford.edu/admissions",
      },
      graduateSchool: {
        email: "gradstudies@stanford.edu",
        phone: "+1-650-723-4800",
        website: "https://gradadmissions.stanford.edu",
      },
    },
    resources: {
      libraries: 20,
      researchCenters: 30,
      housingAvailable: true,
      internationalOffice: true,
    },
  },
  {
    name: "Massachusetts Institute of Technology",
    shortName: "MIT",
    applicationDeadline: new Date("2023-12-15"),
    location: {
      city: "Cambridge",
      state: "Massachusetts",
      country: "USA",
      coordinates: {
        latitude: 42.3601,
        longitude: -71.0942,
      },
    },
    ranking: {
      global: 2,
      national: 1,
      year: 2023,
    },
    admissionStats: {
      acceptanceRate: 4.1,
      totalStudents: 11520,
      internationalStudents: 3200,
      year: 2023,
    },
    departments: [
      {
        name: "Computer Science",
        description:
          "MIT's Computer Science department (EECS) is renowned for its innovative research and education in computing.",
        programs: [
          {
            name: "Computer Science",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 325,
              },
              gpa: {
                minimum: 3.7,
                preferred: 3.9,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-15"),
              priority: new Date("2023-12-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
          {
            name: "Computer Science",
            degree: "Masters",
            requirements: {
              gre: {
                required: true,
                minimumScore: 320,
              },
              gpa: {
                minimum: 3.5,
                preferred: 3.8,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-15"),
              priority: new Date("2023-12-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["TA", "RA"],
            },
          },
        ],
      },
      {
        name: "Engineering",
        description:
          "MIT's School of Engineering is consistently ranked as one of the top engineering schools globally.",
        programs: [
          {
            name: "Electrical Engineering",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 325,
              },
              gpa: {
                minimum: 3.7,
                preferred: 3.9,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-15"),
              priority: new Date("2023-12-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
          {
            name: "Mechanical Engineering",
            degree: "Masters",
            requirements: {
              gre: {
                required: true,
                minimumScore: 320,
              },
              gpa: {
                minimum: 3.5,
                preferred: 3.8,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-15"),
              priority: new Date("2023-12-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["TA", "RA"],
            },
          },
        ],
      },
      {
        name: "Mathematics",
        description:
          "MIT's Mathematics Department is known for its excellence in pure and applied mathematics research.",
        programs: [
          {
            name: "Mathematics",
            degree: "PhD",
            requirements: {
              gre: {
                required: true,
                minimumScore: 325,
              },
              gpa: {
                minimum: 3.7,
                preferred: 3.9,
              },
              toefl: {
                required: true,
                minimumScore: 100,
              },
              ielts: {
                required: true,
                minimumScore: 7.0,
              },
            },
            deadlines: {
              regular: new Date("2023-12-15"),
              priority: new Date("2023-12-01"),
              rolling: false,
            },
            funding: {
              available: true,
              types: ["Fellowship", "TA", "RA"],
            },
          },
        ],
      },
    ],
    tuition: {
      graduate: {
        inState: 58790,
        outOfState: 58790,
        international: 58790,
      },
      costOfLiving: 28000,
      currency: "USD",
    },
    researchAreas: [
      {
        name: "Artificial Intelligence",
        description:
          "Cutting-edge research in machine learning, robotics, and computer vision.",
        facultyCount: 30,
      },
      {
        name: "Computer Systems",
        description:
          "Research on distributed systems, security, and networking.",
        facultyCount: 20,
      },
      {
        name: "Applied Mathematics",
        description:
          "Research on computational mathematics, optimization, and algorithms.",
        facultyCount: 25,
      },
    ],
    contact: {
      admissionsOffice: {
        email: "gradadmissions@mit.edu",
        phone: "+1-617-324-6000",
        website: "https://www.mit.edu/admissions",
      },
      graduateSchool: {
        email: "gradschool@mit.edu",
        phone: "+1-617-324-6700",
        website: "https://gradadmissions.mit.edu",
      },
    },
    resources: {
      libraries: 15,
      researchCenters: 35,
      housingAvailable: true,
      internationalOffice: true,
    },
  },
  ...moreUniversities,
  ...moreUniversities2,
  ...moreUniversities3,
  ...moreUniversities4,
  ...moreUniversities5,
];

// Function to seed universities
const seedUniversities = async () => {
  try {
    // Clear existing data
    await University.deleteMany({});
    console.log("Deleted existing universities");

    // Insert new data
    await University.insertMany(universities);
    console.log(`Inserted ${universities.length} universities`);

    console.log("Database seeded successfully");
  } catch (error) {
    console.error(`Error seeding database: ${error}`);
    throw error;
  }
};

// Function to delete all universities
const deleteUniversities = async () => {
  try {
    const result = await University.deleteMany({});
    console.log(`Deleted ${result.deletedCount} universities`);
  } catch (error) {
    console.error(`Error deleting universities: ${error}`);
    throw error;
  }
};

// Function to list all universities
const listUniversities = async () => {
  try {
    const universities = await University.find({});
    console.log(`Found ${universities.length} universities:`);
    universities.forEach((uni) => {
      console.log(`- ${uni.name} (${uni.shortName}), ${uni.location.country}`);
    });
  } catch (error) {
    console.error(`Error listing universities: ${error}`);
    throw error;
  }
};

// Run the script
main();
