# Edu-Guide-Bot Documentation

## Project Overview
Edu-Guide-Bot is an AI-powered educational guidance system that helps students with their learning queries through an interactive chat interface.

## Documentation Index

### Architecture Diagrams
1. [System Architecture](./System-Architecture.md) - Overall system structure and layers
2. [ER Diagram](./ER-Diagram.md) - Database schema and relationships
3. [Data Flow Diagram](./Data-Flow-Diagram.md) - How data moves through the system
4. [Sequence Diagram](./Sequence-Diagram.md) - Interaction flows for key operations
5. [Deployment Diagram](./Deployment-Diagram.md) - Physical architecture and infrastructure
6. [Class Diagram](./Class-Diagram.md) - Object-oriented structure
7. [Use Case Diagram](./Use-Case-Diagram.md) - User interactions
8. [Component Diagram](./Component-Diagram.md) - Modular system structure

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM

### Database
- PostgreSQL 14+

### External Services
- AI Chat Service for educational responses
- File storage for images and assets

## Quick Start

1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run migrations: `npm run db:migrate`
4. Start development server: `npm run dev`

## Key Features

- User authentication and authorization
- Real-time chat with AI educational assistant
- Conversation history management
- Admin panel for user management
- Responsive design for all devices
