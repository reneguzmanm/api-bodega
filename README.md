# Warehouse Management API

A RESTful API for warehouse inventory management, built with **Node.js, Express, and TypeScript**.

This project focuses on backend development, REST API design, separation of concerns, data validation, and database integration.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — HTTP server framework
- **TypeScript** — Static typing
- **PostgreSQL** — Planned database integration

## Features

- Create products
- Retrieve all products
- Retrieve a product by ID
- Update existing products
- Delete products
- Validate incoming requests
- Handle HTTP status codes

**Current status:** Product data is stored in memory. Database persistence has not been implemented yet.

## Project Structure

```text
src/
├── controllers/
│   └── products.controller.ts
├── routes/
│   └── products.routes.ts
├── services/
│   └── products.service.ts
├── app.ts
└── server.ts
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/api-bodega.git
cd api-bodega
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The API will be available at:

`http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get a product by ID |
| POST | `/products` | Create a product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

### Example: Create a Product

**POST** `/products`

Request body:

```json
{
  "name": "Pallet",
  "stock": 50
}
```

Successful response (`201 Created`):

```json
{
  "id": 3,
  "name": "Pallet",
  "stock": 50
}
```

## HTTP Status Codes

- `200 OK` — Successful retrieval or update
- `201 Created` — Product created
- `204 No Content` — Product deleted
- `400 Bad Request` — Invalid request data
- `404 Not Found` — Product not found

## Roadmap

- [x] Product CRUD operations
- [x] Routes, controllers, and services
- [x] Basic request validation
- [ ] PostgreSQL integration
- [ ] Database migrations
- [ ] Inventory movements
- [ ] Warehouse locations
- [ ] Automated tests
- [ ] Docker configuration
- [ ] API documentation with Swagger

## License

No license has been assigned to this project yet.