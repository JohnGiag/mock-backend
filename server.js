const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

// Middleware
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Helper function to generate tokens
function generateTokens(email) {
  const accessToken = jwt.sign({ email, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ email, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper function to get database
function getDB() {
  return router.db;
}

// POST /login
server.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = getDB();
  const account = db.get("accounts").find({ email }).value();

  if (!account) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  bcrypt.compare(password, account.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(email);

    // Store refresh token in database
    db.get("tokens").push({ email, refreshToken }).write();

    res.json({
      accessToken,
      refreshToken,
      user: {
        email: account.email,
        createdAt: account.createdAt,
      },
    });
  });
});

// POST /register
server.post("/register", (req, res) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

  if (!email || !password || !firstName || !lastName || !phoneNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = getDB();

  // Check if user already exists
  const existingAccount = db.get("accounts").find({ email }).value();
  if (existingAccount) {
    return res.status(400).json({ error: "User already exists" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Error hashing password" });
    }

    const now = new Date().toISOString();

    // Create account
    const account = {
      id: Date.now(),
      email,
      password: hashedPassword,
      createdAt: now,
    };

    // Create profile
    const profile = {
      id: Date.now(),
      email,
      firstName,
      lastName,
      phoneNumber,
    };

    db.get("accounts").push(account).write();
    db.get("profiles").push(profile).write();

    res.status(201).json({
      message: "User created successfully",
      user: {
        email: account.email,
        createdAt: account.createdAt,
      },
    });
  });
});

// POST /refresh
server.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded || decoded.type !== "refresh") {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const db = getDB();
  const tokenRecord = db
    .get("tokens")
    .find({ email: decoded.email, refreshToken })
    .value();

  if (!tokenRecord) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  // Remove old refresh token and generate new ones
  db.get("tokens").remove({ email: decoded.email, refreshToken }).write();
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    decoded.email
  );

  // Store new refresh token
  db.get("tokens")
    .push({ email: decoded.email, refreshToken: newRefreshToken })
    .write();

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// GET /profile (protected)
server.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  // Get user's own profile using email from token
  const db = getDB();
  const profile = db.get("profiles").find({ email: decoded.email }).value();

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json(profile);
});

// GET /items (protected)
server.get("/items", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const db = getDB();
  const { page = 1, limit = 10, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Get user's items
  let items = db.get("items").filter({ userId: decoded.email }).value();

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
    );
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limitNum);
  const paginatedItems = items.slice(offset, offset + limitNum);

  res.json({
    items: paginatedItems,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems,
      itemsPerPage: limitNum,
    },
  });
});

// POST /items (protected)
server.post("/items", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const { title, subtitle, description, category } = req.body;

  if (!title || !subtitle || !description || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = getDB();
  const now = new Date().toISOString();

  const newItem = {
    id: Date.now(),
    userId: decoded.email,
    title,
    subtitle,
    description,
    category,
    createdAt: now,
    updatedAt: now,
  };

  db.get("items").push(newItem).write();

  res.status(201).json(newItem);
});

// PUT /items/:id (protected)
server.put("/items/:id", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const { id } = req.params;
  const { title, subtitle, description, category } = req.body;

  const db = getDB();
  const item = db
    .get("items")
    .find({ id: parseInt(id) })
    .value();

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (item.userId !== decoded.email) {
    return res
      .status(403)
      .json({ error: "Not authorized to update this item" });
  }

  const updateData = { updatedAt: new Date().toISOString() };
  if (title !== undefined) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;

  const updatedItem = db
    .get("items")
    .find({ id: parseInt(id) })
    .assign(updateData)
    .write();

  res.json(updatedItem);
});

// DELETE /items/:id (protected)
server.delete("/items/:id", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const { id } = req.params;
  const db = getDB();
  const item = db
    .get("items")
    .find({ id: parseInt(id) })
    .value();

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (item.userId !== decoded.email) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete this item" });
  }

  db.get("items")
    .remove({ id: parseInt(id) })
    .write();

  res.status(204).send();
});

// GET /charts/area (protected)
server.get("/charts/area", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const db = getDB();
  const areaChartData = db.get("areaChartData").value();

  res.json(areaChartData);
});

// GET /charts/bar (protected)
server.get("/charts/bar", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const db = getDB();
  const barChartData = db.get("barChartData").value();

  res.json(barChartData);
});

// GET /charts/pie (protected)
server.get("/charts/pie", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const db = getDB();
  const pieChartData = db.get("pieChartData").value();

  res.json(pieChartData);
});

// Use json-server routes for other endpoints
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server with Authentication is running on port ${PORT}`);
  console.log(`Demo user: demo@example.com / demo123`);
});
