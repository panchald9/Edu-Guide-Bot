# Edu-Guide-Bot - Project Submission Diagrams

## Overview
This document contains all essential project diagrams required for system design documentation and project submission. These diagrams illustrate the system architecture, data flow, database structure, and process flows.

---

## 1. SYSTEM FLOWCHART

The system flowchart depicts the complete user journey through the Edu-Guide-Bot system, including authentication, chat interactions, history management, profile updates, and admin functions.

### Key Flows:
- **User Access**: Login/Registration → Authentication
- **Main Dashboard**: Central hub for all user actions
- **Chat Flow**: Send message → AI Processing → Display response → Save to DB
- **Conversation History**: View and manage past conversations
- **User Profile**: Edit and update user information
- **Admin Functions**: Access control, user management, statistics, content management

### Process Chain:
```
User Access → Authentication → Dashboard → Multiple Actions:
├── Chat Interface (Message → AI → Response → Display → Save)
├── Conversation History (View → Select → Details)
├── User Profile (Edit → Save)
└── Admin Panel (if authorized):
    ├── User Management
    ├── Statistics
    └── Content Management
```

---

## 2. ER DIAGRAM (Entity-Relationship Diagram)

The ER diagram represents the database schema and relationships between entities in the PostgreSQL database.

### Entities:

#### **USERS** (Primary Entity)
- `user_id` (PK): Primary key
- `email` (UK): Unique key for login
- `password_hash`: Encrypted password
- `full_name`: User's full name
- `is_admin`: Boolean flag for admin role
- `avatar_url`: User profile picture
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `is_active`: Account status

#### **CONVERSATIONS** (Related to USERS)
- `conversation_id` (PK): Primary key
- `user_id` (FK): Foreign key to USERS
- `title`: Conversation title
- `topic`: Educational topic
- `created_at`: Conversation start time
- `updated_at`: Last activity time
- `is_archived`: Archive status

#### **MESSAGES** (Related to CONVERSATIONS & USERS)
- `message_id` (PK): Primary key
- `conversation_id` (FK): Foreign key to CONVERSATIONS
- `user_id` (FK): Foreign key to USERS
- `content`: Message text content
- `sender_type`: "user" or "ai"
- `created_at`: Message timestamp
- `message_type`: "text" or "image"

#### **USER_SETTINGS** (Related to USERS)
- `setting_id` (PK): Primary key
- `user_id` (FK): Foreign key to USERS
- `theme`: "light" or "dark" mode
- `language`: Language preference
- `notifications_enabled`: Boolean flag
- `updated_at`: Settings update time

### Relationships:
- USERS → CONVERSATIONS (1:M) - One user creates many conversations
- USERS → MESSAGES (1:M) - One user sends many messages
- CONVERSATIONS → MESSAGES (1:M) - One conversation contains many messages
- USERS → USER_SETTINGS (1:1) - One user has one settings record

---

## 3. DATA FLOW DIAGRAM (System Overview)

High-level data flow showing how data moves between different system components.

### Components:

**Client Layer:**
- Web Browser (React Application)

**Server Layer:**
- Authentication Module (🔐)
- Chat Processing Module (💬)
- Admin Module (⚙️)
- Image Service (🖼️)

**Data Layer:**
- PostgreSQL Database
- Cache System

**External Services:**
- AI Chat Service (🤖)
- Email Service (📧)

### Data Flows:
1. **User Input** → Auth Module → Database → Auth Token → Browser
2. **Chat Messages** → Chat Module → AI Service → Response → Chat Module → Database → Display
3. **Admin Commands** → Admin Module → Database → Results → Admin Interface
4. **Image Upload** → Image Service → Database → Retrieval & Display
5. **Caching** → Chat Module ↔ Cache for performance optimization

---

## 4. ZERO LEVEL DFD (Context Diagram)

Context diagram showing the system as a single process with external entities and data stores.

### External Entities:
- **Users/Admins**: Primary actors interacting with the system
- **AI Service**: External AI processing engine
- **Email Service**: External email delivery system

### System (Edu-Guide-Bot):
- Central processing entity

### Data Stores:
- **D1 - User Data**: User accounts and profiles
- **D2 - Conversations**: Conversation records
- **D3 - Settings**: User preferences and configurations

### Interactions:
- Users send login requests, chat input, and admin commands
- System processes requests and sends responses
- System communicates with AI Service for chat responses
- System sends emails through Email Service for verification
- System stores/retrieves data from all data stores

---

## 5. FIRST LEVEL DFD (Main Processes)

Decomposition of the system into four primary processes.

### Process 1.0: Authentication Module (P1.0)
- **Input**: User credentials
- **Processing**: Verify credentials, generate tokens
- **Output**: Authentication tokens
- **Data Store**: D1 (Users)
- **External**: Email Service for verification

### Process 2.0: Chat Processing Module (P2.0)
- **Input**: User messages
- **Processing**: Query history, send to AI, store responses
- **Output**: AI responses to chatbot
- **Data Stores**: D2 (Conversations), D3 (Messages)
- **External**: AI Service for responses

### Process 3.0: User Management Module (P3.0)
- **Input**: Admin commands
- **Processing**: Manage user accounts
- **Output**: User reports and confirmations
- **Data Store**: D1 (Users)

### Process 4.0: Data Management Module (P4.0)
- **Input**: Settings from other processes
- **Processing**: Store and retrieve user preferences
- **Output**: Retrieved settings
- **Data Store**: D4 (Settings)

---

## 6. FIRST LEVEL DFD - ADMIN SIDE

Detailed decomposition of admin-specific operations.

### Process 3.1: User Account Management
- **Functions**: List, search, edit, delete users
- **Data Access**: D1 (Users)
- **Output**: User reports and confirmations

### Process 3.2: Chat Monitoring
- **Functions**: Monitor active chats, review messages
- **Data Access**: D2 (Conversations), D3 (Messages)
- **Data Store**: D4 (Audit Logs)
- **Output**: Activity reports

### Process 3.3: System Analytics
- **Functions**: View statistics, generate dashboards
- **Data Access**: D1 (Users), D2 (Conversations)
- **Output**: Analytics dashboard

### Process 3.4: Content Management
- **Functions**: Manage educational content
- **Data Store**: D5 (System Config)
- **Output**: Confirmation messages

### Process 3.5: Settings Configuration
- **Functions**: Configure system settings
- **Data Store**: D5 (System Config)
- **Data Store**: D4 (Audit Logs)
- **Output**: Configuration confirmations

---

## 7. FIRST LEVEL DFD - USER/STUDENT SIDE

Detailed decomposition of user-specific operations.

### Process 1.1: User Registration
- **Functions**: Collect registration info, create account
- **Data Store**: D1 (Users)
- **External**: Email Service for verification
- **Output**: Account confirmation

### Process 1.2: User Login
- **Input**: Login credentials
- **Processing**: Verify credentials against database
- **Output**: Authentication token
- **Data Store**: D1 (Users)

### Process 2.1: Send Message
- **Input**: User question/query
- **Processing**: Store message, send to AI
- **Output**: Message stored
- **Data Stores**: D3 (Messages), D2 (Conversations)
- **External**: AI Service receives query

### Process 2.2: Receive Response
- **Input**: AI response
- **Processing**: Format and store response
- **Output**: Display response to user
- **Data Store**: D3 (Messages)

### Process 2.3: View History
- **Functions**: Retrieve and display past conversations
- **Data Stores**: D2 (Conversations), D3 (Messages)
- **Output**: Conversation list to user

### Process 4.1: Profile Management
- **Functions**: Edit profile information
- **Data Stores**: D1 (Users), D4 (User Settings)
- **Output**: Profile update confirmation

---

## System Architecture Summary

### Technology Stack:
- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM
- **AI Integration**: External AI Chat Service
- **Authentication**: Replit Auth + Token-based

### Key Features:
1. User Authentication & Authorization
2. Real-time Chat with AI Assistant
3. Conversation History Management
4. Admin Dashboard & User Management
5. Content Management System
6. User Settings & Preferences
7. Email Notifications
8. Responsive Web Interface

### Data Flow Patterns:
- **Synchronous**: Authentication, profile management, user queries
- **Asynchronous**: AI chat responses (SSE - Server-Sent Events)
- **Event-driven**: Chat message processing, settings updates

---

## DFD Notation Legend

### Symbols Used:
- **Circle (P1.0, P2.0, etc.)**: Process
- **Square/Rectangle**: External Entity
- **Parallel Lines**: Data Store
- **Arrows**: Data Flow
- **Labels on Arrows**: Data flowing between components

### Color Coding:
- **Green**: Processes
- **Yellow**: Data Stores
- **Blue**: External Entities

---

## Document Information

- **Project**: Edu-Guide-Bot
- **System Type**: AI-Powered Educational Guidance System
- **Diagram Types**: 7 comprehensive diagrams
- **Database**: PostgreSQL
- **Created**: April 2026

---

## Notes for Evaluators

1. **System Flowchart**: Provides complete user journey and system workflow
2. **ER Diagram**: Shows normalized database schema with proper relationships
3. **Data Flow Diagram**: Illustrates system components and data movement
4. **Zero Level DFD**: Context showing system boundaries and external entities
5. **First Level DFD**: Decomposes system into main processes
6. **Admin DFD**: Specifically addresses administrative functionalities
7. **User DFD**: Specifically addresses student/user functionalities

All diagrams follow standard DFD notation and are suitable for academic submission and professional documentation.

