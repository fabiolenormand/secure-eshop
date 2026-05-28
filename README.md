# Secure E-Shop — Lab 7

A full-stack e-commerce app with REST API, persistent data, and secure admin panel.

## Features
- **Business layer** (`/api/`): full CRUD for products and orders
- **Persistent storage**: JSON files
- **Public shop**: browse products, add to cart, place orders
- **Admin panel**: login required, manage products & orders, export CSV, charts

## Setup
```bash
npm install
node server.js
```
Open http://localhost:3000

## Admin credentials
- **Username**: admin
- **Password**: admin123

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | No | List all products |
| POST | /api/products | Yes | Create product |
| PUT | /api/products/:id | Yes | Update product |
| DELETE | /api/products/:id | Yes | Delete product |
| GET | /api/orders | Yes | List all orders |
| POST | /api/order | No | Place an order |
| PUT | /api/orders/:id | Yes | Update order |
| DELETE | /api/orders/:id | Yes | Delete order |
| POST | /api/admin/login | No | Admin login |
| GET | /api/export/products | Yes | Export CSV |
| GET | /api/export/orders | Yes | Export CSV |
