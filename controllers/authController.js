// Simple in-memory authentication controller

// Define student users
const students = [
  {
    id: "1",
    name: "Alex Chen",
    email: "alex@student.edu",
    password: "password",
    role: "student",
    avatar: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@student.edu",
    password: "password",
    role: "student",
    avatar: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Miguel Lopez",
    email: "miguel@student.edu",
    password: "password",
    role: "student",
    avatar: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma@student.edu",
    password: "password",
    role: "student",
    avatar: "/placeholder.svg",
  },
];

// Define mentor users
const mentors = [
  {
    id: "mentor1",
    name: "Dr. Mentor",
    email: "mentor@university.edu",
    password: "password",
    role: "mentor",
    avatar: "/placeholder.svg",
    mentees: ["1", "2", "3", "4"], // IDs of students this mentor is responsible for
  },
];

// Login function
exports.login = (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and role are required",
    });
  }

  // Determine which user collection to check based on role
  const userCollection = role === "student" ? students : mentors;

  // Find user by email
  const user = userCollection.find((u) => u.email === email);

  // Check if user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // In a real app, you'd create and send a proper JWT token
  // For simplicity, we're sending the user info directly
  const userInfo = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    // Include mentees list if the user is a mentor
    ...(role === "mentor" && { mentees: user.mentees }),
  };

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: userInfo,
  });
};

// Get all students (for mentor's reference)
exports.getStudents = (req, res) => {
  // In a real app, you'd filter based on the mentor's permissions
  const studentList = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    avatar: student.avatar,
  }));

  res.status(200).json(studentList);
};

// Get user profile
exports.getUserProfile = (req, res) => {
  const { userId, role } = req.params;

  // Determine which user collection to check
  const userCollection = role === "student" ? students : mentors;

  // Find user by ID
  const user = userCollection.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Return user info without password
  const { password, ...userInfo } = user;

  res.status(200).json({
    success: true,
    user: userInfo,
  });
};

// Export students and mentors for use in other controllers
exports.students = students;
exports.mentors = mentors;
