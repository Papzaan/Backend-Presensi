
# JS-DASH-API

JS-DASH-API is a robust API built with **Node.js** and **Express.js** to manage various administrative tasks. The API provides endpoints for handling complaints, leave requests, employee tasks, and more.

---

## Project Structure

### Overview

This project is organized into the following folders and files:

```
JS-DASH-API/
├── bin/                       # Contains application startup files
│   └── www                    # Server startup script
│
├── config/                    # Configuration files for database and application settings
│   ├── config.js              # General application configuration (e.g., environment variables, settings)
│   └── database.js            # Database connection setup
│
├── controller/                # Controllers handle the logic for each request
│   ├── complaint.controller.js # Handles complaints-related logic (create, fetch, update, delete complaints)
│   ├── harilibur.controller.js # Handles holidays-related logic
│   ├── izin.controller.js     # Handles leave requests logic
│   ├── jabatan.controller.js  # Handles job positions logic
│   ├── kantor.controller.js   # Handles office-related logic
│   ├── kegiatan.controller.js # Handles activities logic
│   ├── opd.controller.js      # Handles organizational unit (OPD) related logic
│   ├── pangkat.controller.js  # Handles rank-related logic
│   ├── pegawai.controller.js  # Handles employee-related logic
│   ├── presensi.controller.js # Handles attendance (presensi) logic
│   └── public.controller.js   # Handles public routes or APIs
│
├── files/                     # Stores uploaded files related to the app
│   ├── files/bukti-complaint/ # Stores proof files for complaints
│   ├── files/bukti-izin/      # Stores proof files for leave requests
│   └── files/bukti-kegiatan/  # Stores proof files for activities
│
├── middlewares/               # Custom middleware for the app
│   ├── time_handler.js        # Middleware for handling time-based operations
│   └── token_validator.js     # Middleware to validate JWT tokens for authentication
│
├── models/                     # Defines database models for interacting with the database
│   ├── Complaint.js            # Defines the schema for complaints
│   ├── HariLibur.js           # Defines the schema for holidays
│   ├── index.js               # Main entry point for all models (optional)
│   ├── Izin.js                # Defines the schema for leave requests
│   ├── Jabatan.js             # Defines the schema for job positions
│   ├── Kantor.js              # Defines the schema for office-related data
│   ├── Opd.js                 # Defines the schema for organizational units (OPD)
│   ├── Pangkat.js             # Defines the schema for employee ranks
│   ├── Pegawai.js             # Defines the schema for employee data
│   └── Presensi.js            # Defines the schema for attendance (presensi)
│
├── node_modules/              # Contains installed Node.js modules (dependencies)
├── public/                    # Static files served by Express (e.g., JavaScript, CSS, images)
│   ├── app.js                 # Custom JavaScript for front-end
│   ├── style.css              # CSS file for styling front-end
│   ├── index.html             # Front-end HTML template
│   └── images/                # Image files used in front-end
│
├── routes/                     # Defines routes for various parts of the application
│   ├── complaint.js            # Routes for complaints-related API endpoints
│   ├── dashboard.js           # Routes for dashboard-related API endpoints
│   ├── hariLibur.js           # Routes for holiday-related API endpoints
│   ├── index.js               # Main entry point for routing
│   ├── izin.js                # Routes for leave-related API endpoints
│   ├── jabatan.js             # Routes for job positions-related API endpoints
│   ├── kantor.js              # Routes for office-related API endpoints
│   ├── kegiatan.js            # Routes for activities-related API endpoints
│   ├── opd.js                 # Routes for organizational unit-related API endpoints
│   ├── pangkat.js             # Routes for rank-related API endpoints
│   ├── pegawai.js             # Routes for employee-related API endpoints
│   ├── tokenValidation.js     # Routes to validate JWT tokens
│   └── presensi.js            # Routes for attendance-related API endpoints
│
├── .env                       # Environment variables for database, JWT secret, etc.
├── .gitignore                 # Git ignore configuration
├── package.json               # Contains project metadata and dependencies
├── README.md                  # Project documentation
└── app.js                      # Main entry file for running the server
```

---

## Installation

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/JS-DASH-API.git
   cd JS-DASH-API
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the `.env` file with your configuration:
   ```env
   JWT_SECRET=your_jwt_secret
   DB_URI=your_database_uri
   ```

4. Run the application:
   ```bash
   npm start
   ```

Visit `http://localhost:3000` to see the API in action.

---

## Routes

### Authentication Routes

- **POST /login**: Logs in the user and returns a JWT token.
- **POST /signup**: Registers a new user.

### Task Management Routes

- **GET /tasks**: Fetches all tasks for the logged-in user.
- **POST /tasks**: Creates a new task.
- **PUT /tasks/:id**: Updates a task.
- **DELETE /tasks/:id**: Deletes a task.

---

## Technologies Used

- **Node.js** with **Express.js**
- **EJS** for templating
- **MySql** for the database
- **JWT** for authentication
- **Bcrypt.js** for password hashing

---

## License

This project is licensed under the MIT License.
