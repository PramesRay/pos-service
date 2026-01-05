# POS Service – Restaurant Operational Management Backend

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-REST%20API-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

**POS Service** is a backend REST API for a multi-branch Restaurant Point-of-Sale (POS) and Operational Management System.  
It is designed to digitalize and integrate restaurant operations such as ordering, inventory management, stock requests, shift tracking, reservations, fund requests, and financial summaries.

This project is developed as a **real-world case study** for an undergraduate thesis (*Skripsi*) and is actively used by the restaurant  
**Nasi Uduk Remaja Cikini Haji Sawid**.

⭐ If you find this project useful, feel free to star the repository.



## Overview

POS Service acts as the **central backend system** that powers multiple operational roles:

- Owner / Admin
- Treasurer / Finance
- Cashier
- Kitchen
- Warehouse
- Staff

The backend exposes secure REST APIs consumed by a separate **Vue 3 + Vuetify frontend** application.



## Why POS Service?

This backend was built with the following goals in mind:

- Modular and scalable architecture
- Role-based access control at API level
- Multi-branch data segregation
- Secure authentication using Firebase
- Integration with online payments (Midtrans)
- Clear separation between business logic and routing
- Extensible design for future features



## Core Features

- Menu & category management
- Order processing and payment integration
- Inventory & stock movement tracking
- Stock request workflow (kitchen → warehouse)
- Shift management for multiple roles
- Reservation & table management
- Fund requests & expense tracking
- Financial summary and metrics aggregation
- Role-based authentication & authorization



## Technology Stack

### Backend
- [![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
- [![Express](https://img.shields.io/badge/express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
- [![MySQL](https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
- [![Sequelize](https://img.shields.io/badge/sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

### Authentication & Security
- [![Firebase](https://img.shields.io/badge/firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
- Role-based middleware authorization

### Payments
- [![Midtrans](https://img.shields.io/badge/midtrans-00AEEF?style=for-the-badge&logoColor=white)](https://midtrans.com/)

### Utilities
- dotenv
- cors
- dayjs
- uuid



## Project Structure
```sh
pos-service/
├── app/             # Application layer (models, services)
├── src/             # REST routes & controllers
├── infrastructure/  # Database & external service configuration
├── middleware/      # Auth & role-based middleware
├── package.json
└── README.md
```

### Architectural Principles
- Separation of concerns
- Service-oriented business logic
- Centralized authentication middleware



## Core Data Models

Main entities managed by the system include:

- Branch
- User
- Employee
- Customer
- Category
- Menu
- Order
- InventoryItem
- StockMovement
- StockRequest
- EmployeeShift / KitchenShift
- Reservation
- FundRequest
- FinanceSummary



## REST API Modules

### Authentication
- `POST /auth`
  - Register or retrieve authenticated user
  - Returns role, branch, and active shift information

### Branch Management
- Branch CRUD operations
- Fetch active shifts per branch

### Menu & Category
- Manage menu items per branch
- Category creation, update, deletion
- Menu sales statistics

### Order & Payment
- Order creation and updates
- Midtrans payment token generation
- Payment status handling and refunds

### Inventory
- Inventory item CRUD
- Stock movement recording
- Inventory category management

### Stock Request Workflow
- Kitchen creates stock requests
- Warehouse / owner approval
- Mark as ready and finished

### Shift Management
- Start, update, and end shifts
- Multiple roles supported
- Current and historical shift data

### Reservation
- Reservation creation and approval
- Update and deletion

### Finance & Fund Requests
- Fund request lifecycle management
- Aggregated financial summaries



## Environment Variables

Create a `.env` file with the following configuration:

```env
PORT=your_preference_port

DB_HOST=your_db_host
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```
⚠️ Do not commit sensitive credentials to the repository



## Getting Started

### Clone the Repository

```git
git clone https://github.com/PramesRay/pos-service.git
cd pos-service
```

### Install Dependencies

```git
npm install
```


### Run the Server

```git
npm run start
```



## Error Handling
- Centralized error responses
- Meaningful HTTP status codes
- Designed to be safely consumed by frontend interceptors



## Project Status
- Actively developed
- Used in real restaurant operations
- Part of an undergraduate thesis project
- Designed for extensibility and scalability



## Related Projects
- [![Internal Web App](https://img.shields.io/badge/Internal_Web_App-repo-orange?logo=github)](https://github.com/PramesRay/Point-of-Sales/tree/main)
- [![Customer Web App](https://img.shields.io/badge/Customer_Web_App-repo-yellow?logo=github)](https://github.com/PramesRay/Point-of-Sales/tree/customer)



## Author

### Prames Ray Lapian
Informatics Engineering Universitas Padjadjaran



## License
This project is licensed under the MIT License.
See the LICENSE file for details.
