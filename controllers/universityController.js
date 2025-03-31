const University = require("../models/University");

// Get all universities with optional filtering
exports.getUniversities = async (req, res) => {
  try {
    const {
      country,
      state,
      department,
      degree,
      minRanking,
      maxRanking,
      limit = 10,
      page = 1,
    } = req.query;

    // Build filter object
    const filter = {};

    if (country) {
      filter["location.country"] = country;
    }

    if (state) {
      filter["location.state"] = state;
    }

    if (department) {
      filter["departments.name"] = { $regex: department, $options: "i" };
    }

    if (degree) {
      filter["departments.programs.degree"] = degree;
    }

    if (minRanking && maxRanking) {
      filter["ranking.global"] = {
        $gte: parseInt(minRanking),
        $lte: parseInt(maxRanking),
      };
    } else if (minRanking) {
      filter["ranking.global"] = { $gte: parseInt(minRanking) };
    } else if (maxRanking) {
      filter["ranking.global"] = { $lte: parseInt(maxRanking) };
    }

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    };

    const universities = await University.find(filter, null, options);
    const total = await University.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: universities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Get university by ID
exports.getUniversity = async (req, res) => {
  try {
    const university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error("Error fetching university:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Create a new university
exports.createUniversity = async (req, res) => {
  try {
    const university = await University.create(req.body);

    return res.status(201).json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error("Error creating university:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Update university
exports.updateUniversity = async (req, res) => {
  try {
    const university = await University.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!university) {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error("Error updating university:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Delete university
exports.deleteUniversity = async (req, res) => {
  try {
    const university = await University.findByIdAndDelete(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting university:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Search universities by name or department
exports.searchUniversities = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const universities = await University.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    return res.status(200).json({
      success: true,
      data: universities,
    });
  } catch (error) {
    console.error("Error searching universities:", error);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Get departments for a university
exports.getDepartments = async (req, res) => {
  try {
    const university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: university.departments,
    });
  } catch (error) {
    console.error("Error fetching university departments:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        error: "University not found",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
