# Warehouse Management API

A RESTful API for warehouse inventory management, built with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL**.

This project focuses on backend development, REST API design, separation of concerns, relational database modeling, data validation, error handling, and automated testing.

The application is being developed incrementally, following a layered architecture and Git version control practices.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — REST API framework
- **TypeScript** — Static typing
- **PostgreSQL** — Relational database
- **Prisma ORM** — Database access, schema management, and migrations
- **Docker Compose** — Local PostgreSQL environment
- **Git and GitHub** — Version control
- **Jest** — Unit testing (in progress)
- **GitHub Actions** — Continuous integration (in progress)

## Features

### Implemented

- Create products with unique SKUs
- Retrieve active products
- Retrieve products by ID
- Update product information
- Soft-delete products using `isActive`
- Validate incoming requests
- Handle database uniqueness conflicts
- Return appropriate HTTP status codes
- Persist data in PostgreSQL
- Manage the database schema with Prisma migrations
- Automatically manage creation and modification timestamps

### Planned

- Manage physical warehouse locations
- Track product quantities by location
- Record inventory entries, exits, and adjustments
- Track users responsible for inventory movements
- Manage stock updates using database transactions
- Implement authentication and authorization
- Add automated unit and integration tests
- Implement continuous integration and automated deployment

## Architecture

The API follows a layered architecture:

**Routes → Controllers → Services → Prisma ORM → PostgreSQL**

Each layer has a specific responsibility:

- **Routes:** Define HTTP endpoints.
- **Controllers:** Handle requests, validation, and HTTP responses.
- **Services:** Implement business logic and database operations.
- **Prisma ORM:** Provides type-safe access to PostgreSQL.
- **PostgreSQL:** Stores application data.

## Project Structure

```text
api-bodega/
├── .github/
│   └── workflows/              # CI workflows (in progress)
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   │   └── products.controller.ts
│   ├── generated/
│   │   └── prisma/             # Generated Prisma Client
│   ├── lib/
│   │   └── prisma.ts
│   ├── routes/
│   │   └── products.routes.ts
│   ├── services/
│   │   └── products.service.ts
│   ├── app.ts
│   └── server.ts
├── tests/                       # Automated tests (in progress)
├── compose.yaml
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

The directory structure will expand as inventory management features are implemented.

## Database Design

The application uses **PostgreSQL** with **Prisma ORM**.

The database schema defines five main models:

| Model | Responsibility |
|---|---|
| Product | Product catalog and soft deletion |
| Location | Physical storage locations |
| Inventory | Product quantities per location |
| InventoryMovement | Historical inventory operations |
| User | Users responsible for inventory movements |

The database currently represents a single warehouse with support for multiple internal storage locations.

Although these models are defined in Prisma, the inventory and location management APIs are still under development.

### Product Model

Products contain:

- `id`: Unique product identifier
- `sku`: Unique stock keeping unit
- `name`: Product name
- `isActive`: Product activation status
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

Product stock is not stored directly in the `Product` model. Inventory