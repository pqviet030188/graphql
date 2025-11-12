# Media GraphQL API

This project is a Node.js + TypeScript + Apollo Server GraphQL API to mange **Media** entities, including **Images** and **Videos**, with Sequelize and MySQL. 

It supports authentication via **client credentials** and can be tested safely using a separate test database.

---

## Environment Setup

Create a `.env` file for development:

```env
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
JWT_SECRET=
NODE_ENV=development


Create a `test.env` file for testing:
