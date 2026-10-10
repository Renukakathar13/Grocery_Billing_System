# Grocery Billing System

A grocery billing application built using HTML, CSS, JavaScript, Node.js, Express, and MySQL. It helps manage grocery products, stock, billing, and sales records.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- MySQL
- MySQL Workbench

## Features

- Admin login
- Dashboard with sales and stock statistics
- Add, edit, delete, and search products
- Inventory and stock management
- Customer information management
- Grocery billing
- Automatic 5% GST calculation
- Automatic stock reduction after billing
- Bill history and search
- View individual bills
- Print bills
- MySQL database integration

## Project Structure

The project contains frontend files, backend files, and a database SQL file.

- `frontend/` - User interface files
- `backend/` - Node.js and Express backend
- `database/grocery_billing.sql` - Database structure and sample data
- `README.md` - Project documentation

## Requirements

Install the following before running the application:

- Node.js
- MySQL Server
- MySQL Workbench (recommended)
- Visual Studio Code

## Database Setup

1. Open MySQL Workbench and connect to your MySQL server.
2. Open the `database/grocery_billing.sql` file.
3. Execute the SQL script to create the database tables and insert the exported data, if included.
4. Verify that the database and tables have been created successfully.

If the SQL script does not create the database itself, create the database named `grocery_billing` before executing the script.

## Backend Configuration

1. Open the `backend/` folder in VS Code.
2. Create a copy of `.env.example` named `.env`.
3. Update the database settings with your own MySQL credentials.

Example configuration:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=grocery_billing
DB_PORT=3306
PORT=5000

Never share your actual `.env` file or database password.

## Install Dependencies

Open the VS Code terminal and navigate to the backend folder.

Run:

npm install

## Run the Application

Start the backend using the command configured in `package.json`.

For example, if the start script is configured:

npm start

Keep the backend terminal running.

Open the frontend using the method supported by your project, such as the VS Code Live Server extension.

The frontend communicates with the backend API at:

http://localhost:5000/api

Make sure the backend and MySQL server are running before using the application.

## Login

Default demonstration credentials, if present in the imported database:

Username: admin
Password: admin123

These credentials work only if the corresponding user exists in the database.

For a real deployment, use secure password storage and change default credentials.

## Important Notes

- The application requires a working MySQL database and backend.
- Browser LocalStorage is not the primary database for products and bills in this version.
- Each user must configure their own database credentials.
- Do not share `.env` or real customer information.