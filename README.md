# JSON Server with Authentication

A mock JSON server with authentication endpoints for mobile app development. Built with `json-server` and custom middleware for JWT-based authentication.

## Features

- User registration and login
- JWT access and refresh tokens
- Protected profile endpoint
- Token rotation for security
- Demo user included

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication

#### POST /login

Login with email and password.

**Request:**

```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "demo@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /register

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "email": "user@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### POST /refresh

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Endpoints

#### GET /me

Get authenticated user's own profile (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": 1,
  "email": "demo@example.com",
  "firstName": "Demo",
  "lastName": "User",
  "phoneNumber": "+1234567890"
}
```

### Items Management

#### GET /items

Get user's items with pagination and search (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term to filter items

**Example Requests:**

```
GET /items
GET /items?page=2&limit=5
GET /items?search=mobile
GET /items?page=1&limit=10&search=development
```

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "userId": "demo@example.com",
      "title": "Mobile App Development",
      "subtitle": "React Native Project",
      "description": "Building a cross-platform mobile application...",
      "category": "Development",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 20,
    "itemsPerPage": 10
  }
}
```

#### POST /items

Create a new item (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "title": "New Project",
  "subtitle": "Project Subtitle",
  "description": "Detailed description of the project",
  "category": "Development"
}
```

**Response:**

```json
{
  "id": 21,
  "userId": "demo@example.com",
  "title": "New Project",
  "subtitle": "Project Subtitle",
  "description": "Detailed description of the project",
  "category": "Development",
  "createdAt": "2024-02-04T10:00:00.000Z",
  "updatedAt": "2024-02-04T10:00:00.000Z"
}
```

#### PUT /items/:id

Update an existing item (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:**

```json
{
  "id": 1,
  "userId": "demo@example.com",
  "title": "Updated Title",
  "subtitle": "React Native Project",
  "description": "Updated description",
  "category": "Development",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-02-04T10:00:00.000Z"
}
```

#### DELETE /items/:id

Delete an item (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```
204 No Content
```

### Chart Data

#### GET /charts/area

Get area chart data (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  { "x": "Jan", "y": 100, "label": "January" },
  { "x": "Feb", "y": 120, "label": "February" },
  { "x": "Mar", "y": 90, "label": "March" },
  { "x": "Apr", "y": 140, "label": "April" },
  { "x": "May", "y": 160, "label": "May" },
  { "x": "Jun", "y": 180, "label": "June" },
  { "x": "Jul", "y": 200, "label": "July" },
  { "x": "Aug", "y": 190, "label": "August" },
  { "x": "Sep", "y": 170, "label": "September" },
  { "x": "Oct", "y": 150, "label": "October" },
  { "x": "Nov", "y": 130, "label": "November" },
  { "x": "Dec", "y": 110, "label": "December" }
]
```

#### GET /charts/bar

Get bar chart data (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  { "label": "Q1", "value": 100, "color": "#3b82f6" },
  { "label": "Q2", "value": 120, "color": "#ef4444" },
  { "label": "Q3", "value": 90, "color": "#10b981" },
  { "label": "Q4", "value": 140, "color": "#f59e0b" },
  { "label": "Q5", "value": 110, "color": "#8b5cf6" },
  { "label": "Q6", "value": 160, "color": "#06b6d4" },
  { "label": "Q7", "value": 130, "color": "#f97316" },
  { "label": "Q8", "value": 180, "color": "#ec4899" }
]
```

#### GET /charts/pie

Get pie chart data (requires access token).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  { "label": "Sales", "value": 120 },
  { "label": "Marketing", "value": 98 },
  { "label": "Support", "value": 86 },
  { "label": "Development", "value": 140 },
  { "label": "Operations", "value": 75 },
  { "label": "Research", "value": 95 }
]
```

**Note:** Chart data is static and shared across all users. These endpoints are read-only and require authentication.

## Demo User

For testing purposes, a demo user is included:

- **Email:** demo@example.com
- **Password:** demo123

## Database Structure

The server uses `db.json` with the following tables:

- **accounts**: User credentials (id, email, password, createdAt)
- **profiles**: User profile information (id, email, firstName, lastName, phoneNumber)
- **tokens**: Refresh tokens for token rotation (email, refreshToken)
- **items**: User-specific items (id, userId, title, subtitle, description, category, createdAt, updatedAt)
- **areaChartData**: Static area chart data (x, y, label)
- **barChartData**: Static bar chart data (label, value, color)
- **pieChartData**: Static pie chart data (label, value)

## Environment Variables

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT signing (default: 'your-secret-key-change-in-production')

## Deployment to Render

1. Connect your repository to Render
2. Set the following environment variables in Render dashboard:
   - `JWT_SECRET`: A secure random string for JWT signing
3. Deploy!

The server will automatically use the `PORT` environment variable provided by Render.

## Token Security

- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Token rotation: New refresh tokens are issued on each refresh
- Refresh tokens are stored in the database for revocation capability

## Error Responses

All endpoints return appropriate HTTP status codes:

- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (invalid credentials or tokens)
- `404`: Not Found (profile not found)
- `500`: Internal Server Error (server issues)
