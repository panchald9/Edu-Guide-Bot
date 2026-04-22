# Edu-Guide-Bot - High-Level System Architecture & Advanced Diagrams

## Overview
This document contains advanced system architecture diagrams, use case scenarios, alert flows, and project timeline for the Edu-Guide-Bot system.

---

## 1. HIGH LEVEL SYSTEM ARCHITECTURE

```mermaid
graph TB
    subgraph Client["🖥️ CLIENT LAYER"]
        WEB["Web Browser<br/>React + TypeScript"]
        MOBILE["Mobile Responsive UI<br/>Tailwind CSS"]
    end
    
    subgraph API["🔌 API GATEWAY LAYER"]
        ROUTER["Express.js Router<br/>Request Handler"]
        MIDDLEWARE["Authentication & Middleware<br/>Request Validation"]
    end
    
    subgraph Business["💼 BUSINESS LOGIC LAYER"]
        AUTH["Authentication Service<br/>JWT, Session Management"]
        CHAT["Chat Processing Service<br/>Message Handling"]
        ADMIN["Admin Management Service<br/>User & Content Mgmt"]
        STORAGE["Storage Service<br/>File & Image Management"]
    end
    
    subgraph Data["💾 DATA LAYER"]
        DB["PostgreSQL Database<br/>Drizzle ORM"]
        CACHE["Redis Cache<br/>Session Store"]
        STORAGE_SVC["File Storage<br/>Images & Assets"]
    end
    
    subgraph External["🌍 EXTERNAL SERVICES"]
        AI["AI Chat Service<br/>OpenAI/Claude API"]
        EMAIL["Email Service<br/>SMTP/SendGrid"]
        STORAGE_EXT["Cloud Storage<br/>AWS S3/Replit Storage"]
    end
    
    Client -->|HTTP/WebSocket| ROUTER
    ROUTER -->|Validate| MIDDLEWARE
    MIDDLEWARE -->|Route| AUTH
    MIDDLEWARE -->|Route| CHAT
    MIDDLEWARE -->|Route| ADMIN
    MIDDLEWARE -->|Route| STORAGE
    
    AUTH -->|Query/Update| DB
    AUTH -->|Store Session| CACHE
    AUTH -->|Send Email| EMAIL
    
    CHAT -->|Get History| DB
    CHAT -->|Save Messages| DB
    CHAT -->|Cache Session| CACHE
    CHAT -->|Request| AI
    CHAT -->|Display| Client
    
    ADMIN -->|Query| DB
    ADMIN -->|Manage| DB
    ADMIN -->|Dashboard| Client
    
    STORAGE -->|Save Metadata| DB
    STORAGE -->|Upload| STORAGE_EXT
    STORAGE -->|Retrieve| STORAGE_EXT
    STORAGE -->|Display| Client
    
    AI -->|Response| CHAT
    EMAIL -->|Verification| AUTH
    
    style Client fill:#e3f2fd
    style API fill:#fff3e0
    style Business fill:#f3e5f5
    style Data fill:#e8f5e9
    style External fill:#ffe0b2
```

---

## 2. USE CASE DIAGRAM

```mermaid
graph TB
    Student["👨‍🎓 Student User"]
    Admin["👨‍💼 Admin User"]
    System["🌐 Edu-Guide-Bot<br/>System"]
    AIService["🤖 AI Service"]
    
    subgraph StudentUseCases["Student Use Cases"]
        REG["Register Account"]
        LOGIN["Login to System"]
        CHAT["Send Chat Messages"]
        VIEW_HIST["View Chat History"]
        SEARCH["Search Conversations"]
        EDIT_PROFILE["Edit User Profile"]
        MANAGE_SETTINGS["Manage Settings"]
        LOGOUT["Logout"]
    end
    
    subgraph AdminUseCases["Admin Use Cases"]
        VIEW_USERS["View All Users"]
        MANAGE_USERS["Manage User Accounts"]
        VIEW_ANALYTICS["View Analytics"]
        MONITOR_CHATS["Monitor Chats"]
        MANAGE_CONTENT["Manage AI Content"]
        SYSTEM_CONFIG["Configure System"]
        VIEW_LOGS["View Audit Logs"]
    end
    
    subgraph SystemFunctions["System Functions"]
        PROCESS_MSG["Process Message"]
        GENERATE_RESP["Generate Response"]
        STORE_DATA["Store Data"]
        VALIDATE_AUTH["Validate Authentication"]
        SEND_EMAIL["Send Notifications"]
    end
    
    Student --> REG
    Student --> LOGIN
    Student --> CHAT
    Student --> VIEW_HIST
    Student --> SEARCH
    Student --> EDIT_PROFILE
    Student --> MANAGE_SETTINGS
    Student --> LOGOUT
    
    Admin --> VIEW_USERS
    Admin --> MANAGE_USERS
    Admin --> VIEW_ANALYTICS
    Admin --> MONITOR_CHATS
    Admin --> MANAGE_CONTENT
    Admin --> SYSTEM_CONFIG
    Admin --> VIEW_LOGS
    
    REG --> VALIDATE_AUTH
    REG --> SEND_EMAIL
    LOGIN --> VALIDATE_AUTH
    CHAT --> PROCESS_MSG
    CHAT --> GENERATE_RESP
    CHAT --> STORE_DATA
    GENERATE_RESP --> AIService
    MANAGE_USERS --> STORE_DATA
    MONITOR_CHATS --> STORE_DATA
    VIEW_LOGS --> STORE_DATA
    
    VALIDATE_AUTH --> System
    PROCESS_MSG --> System
    GENERATE_RESP --> System
    STORE_DATA --> System
    SEND_EMAIL --> System
    
    style Student fill:#bbdefb
    style Admin fill:#c8e6c9
    style AIService fill:#ffe0b2
    style System fill:#f8bbd0
```

---

## 3. APPLICATION & ALERT FLOWCHART

```mermaid
flowchart TD
    START([System Started]) --> INIT["Initialize Application<br/>Load Configuration"]
    INIT --> DB_CHECK{"Database<br/>Connected?"}
    
    DB_CHECK -->|No| DB_ERROR["🔴 Database Alert<br/>Connection Failed"]
    DB_ERROR --> RETRY_DB{"Retry<br/>Connection?"}
    RETRY_DB -->|Yes| DB_CHECK
    RETRY_DB -->|No| SHUTDOWN1["System Shutdown"]
    SHUTDOWN1 --> END1([End])
    
    DB_CHECK -->|Yes| SERVICE_START["Start Core Services<br/>Auth, Chat, Admin"]
    SERVICE_START --> API_SERVER["Start Express Server<br/>Port: 3000"]
    API_SERVER --> LISTEN["Server Listening<br/>Ready for Requests"]
    
    LISTEN --> REQUEST{"Incoming<br/>Request?"}
    REQUEST -->|Auth| AUTH_PROCESS["Process Authentication<br/>Verify JWT/Session"]
    REQUEST -->|Chat| CHAT_PROCESS["Process Chat Message<br/>Validate & Store"]
    REQUEST -->|Admin| ADMIN_PROCESS["Process Admin Action<br/>Check Permissions"]
    REQUEST -->|Other| OTHER_PROCESS["Process Other Requests"]
    
    AUTH_PROCESS --> AUTH_CHECK{"Authentication<br/>Valid?"}
    AUTH_CHECK -->|No| AUTH_ALERT["🟡 Auth Alert<br/>Invalid Credentials"]
    AUTH_ALERT --> AUTH_LOG["Log Failed Attempt"]
    AUTH_LOG --> SEND_ALERT1["Send Alert Email"]
    SEND_ALERT1 --> RESPONSE1["Return 401 Error"]
    
    AUTH_CHECK -->|Yes| AUTH_SUCCESS["✅ Auth Success<br/>Generate Token"]
    AUTH_SUCCESS --> RESPONSE2["Return Token"]
    
    CHAT_PROCESS --> MSG_VALIDATE{"Message<br/>Valid?"}
    MSG_VALIDATE -->|No| MSG_ALERT["🟡 Message Alert<br/>Invalid Format"]
    MSG_ALERT --> MSG_LOG["Log Invalid Message"]
    MSG_LOG --> RESPONSE3["Return 400 Error"]
    
    MSG_VALIDATE -->|Yes| STORE_MSG["Store Message in DB"]
    STORE_MSG --> STORE_CHECK{"Storage<br/>Success?"}
    STORE_CHECK -->|No| STORAGE_ALERT["🔴 Storage Alert<br/>Database Write Failed"]
    STORAGE_ALERT --> STORAGE_LOG["Log Error"]
    STORAGE_LOG --> SEND_ALERT2["Send Alert to Admin"]
    SEND_ALERT2 --> RESPONSE4["Return 500 Error"]
    
    STORE_CHECK -->|Yes| AI_REQUEST["Send to AI Service<br/>Request Response"]
    AI_REQUEST --> AI_CHECK{"AI Service<br/>Available?"}
    AI_CHECK -->|No| AI_ALERT["🟡 AI Service Alert<br/>Service Unavailable"]
    AI_ALERT --> AI_RETRY{"Retry<br/>Attempt?"}
    AI_RETRY -->|Yes| AI_REQUEST
    AI_RETRY -->|No| RESPONSE5["Return Cached Response"]
    
    AI_CHECK -->|Yes| GET_RESPONSE["Get AI Response<br/>Process Response"]
    GET_RESPONSE --> SAVE_RESPONSE["Save Response to DB"]
    SAVE_RESPONSE --> RESPONSE6["Return to Client"]
    
    ADMIN_PROCESS --> PERM_CHECK{"User<br/>Admin?"}
    PERM_CHECK -->|No| PERM_ALERT["🔴 Permission Alert<br/>Unauthorized Access"]
    PERM_ALERT --> PERM_LOG["Log Unauthorized Attempt"]
    PERM_LOG --> SEND_ALERT3["Send Alert Email"]
    SEND_ALERT3 --> RESPONSE7["Return 403 Error"]
    
    PERM_CHECK -->|Yes| ADMIN_ACTION["Execute Admin Action"]
    ADMIN_ACTION --> RESPONSE8["Return Result"]
    
    OTHER_PROCESS --> OTHER_RESPONSE["Process & Respond"]
    
    RESPONSE1 --> LISTEN
    RESPONSE2 --> LISTEN
    RESPONSE3 --> LISTEN
    RESPONSE4 --> LISTEN
    RESPONSE5 --> LISTEN
    RESPONSE6 --> LISTEN
    RESPONSE7 --> LISTEN
    RESPONSE8 --> LISTEN
    OTHER_RESPONSE --> LISTEN
    
    LISTEN --> MONITOR{"Health<br/>Check?"}
    MONITOR -->|Fail| HEALTH_ALERT["🔴 Health Alert<br/>System Down"]
    HEALTH_ALERT --> SHUTDOWN2["System Shutdown"]
    SHUTDOWN2 --> END2([End])
    
    MONITOR -->|Pass| LISTEN
    
    style DB_ERROR fill:#ffcdd2
    style AUTH_ALERT fill:#fff9c4
    style MSG_ALERT fill:#fff9c4
    style STORAGE_ALERT fill:#ffcdd2
    style AI_ALERT fill:#fff9c4
    style PERM_ALERT fill:#ffcdd2
    style HEALTH_ALERT fill:#ffcdd2
    style AUTH_SUCCESS fill:#c8e6c9
    style LISTEN fill:#b3e5fc
```

---

## 4. ALERT SEQUENCE DIAGRAM

```mermaid
sequenceDiagram
    participant User as 👤 User/Client
    participant Server as 🖥️ Express Server
    participant Auth as 🔐 Auth Service
    participant DB as 💾 Database
    participant AI as 🤖 AI Service
    participant AlertSvc as 🚨 Alert Service
    participant Admin as 👨‍💼 Admin

    rect rgb(200, 150, 255)
        Note over User,Admin: Scenario 1: Authentication Failure Alert
    end
    
    User->>Server: POST /login (invalid credentials)
    Server->>Auth: validateUser(email, password)
    Auth->>DB: query user by email
    DB-->>Auth: user not found
    Auth-->>Server: authentication failed
    Server->>AlertSvc: createAlert(AUTH_FAILURE, userId, details)
    AlertSvc->>AlertSvc: log alert to database
    AlertSvc->>Admin: send email notification
    Admin-->>AlertSvc: alert received
    Server-->>User: 401 Unauthorized

    rect rgb(255, 200, 150)
        Note over User,Admin: Scenario 2: Database Connection Failure
    end
    
    User->>Server: POST /chat (send message)
    Server->>DB: saveMessage(messageData)
    DB-->>Server: connection timeout
    Server->>AlertSvc: createAlert(DB_CONNECTION_FAILURE, level=CRITICAL)
    AlertSvc->>AlertSvc: log to database (cache)
    AlertSvc->>AlertSvc: trigger retry logic
    AlertSvc->>Admin: send SMS + Email alert
    Admin-->>AlertSvc: alert acknowledged
    Server-->>User: 500 Internal Server Error
    Server->>AlertSvc: retryConnection()
    AlertSvc->>DB: attempt reconnection
    DB-->>AlertSvc: connection restored
    AlertSvc->>Admin: send recovery notification
    Admin-->>AlertSvc: recovery confirmed

    rect rgb(150, 200, 255)
        Note over User,Admin: Scenario 3: AI Service Timeout
    end
    
    User->>Server: POST /chat (complex query)
    Server->>AI: generateResponse(message)
    Note over AI: Processing takes too long...
    AI->>AI: 30 second timeout
    AI-->>Server: timeout exception
    Server->>AlertSvc: createAlert(AI_SERVICE_TIMEOUT, severity=MEDIUM)
    AlertSvc->>AlertSvc: log alert
    AlertSvc->>DB: save alert record
    AlertSvc->>Admin: send warning
    Server->>Server: serve cached response
    Server-->>User: response from cache
    AlertSvc->>AI: verify service status
    AI-->>AlertSvc: service status: recovering

    rect rgb(200, 255, 150)
        Note over User,Admin: Scenario 4: Unauthorized Access Attempt
    end
    
    User->>Server: POST /admin/users (without admin role)
    Server->>Auth: verifyAdminRole(userId)
    Auth->>DB: checkUserRole(userId)
    DB-->>Auth: role = student
    Auth-->>Server: authorization failed
    Server->>AlertSvc: createAlert(UNAUTHORIZED_ACCESS, userId, endpoint)
    AlertSvc->>AlertSvc: log security event
    AlertSvc->>DB: save security log
    AlertSvc->>Admin: send security alert
    Admin-->>AlertSvc: alert reviewed
    AlertSvc->>User: record potential threat
    Server-->>User: 403 Forbidden

    rect rgb(255, 150, 150)
        Note over User,Admin: Scenario 5: System Health Check Failure
    end
    
    Server->>Server: runHealthCheck()
    Server->>DB: ping
    DB-->>Server: OK
    Server->>AI: ping
    AI-->>Server: timeout
    Server->>Server: service degraded
    Server->>AlertSvc: createAlert(HEALTH_CHECK_FAILED, services=[AI])
    AlertSvc->>AlertSvc: escalate alert
    AlertSvc->>Admin: send critical alert
    Admin-->>AlertSvc: acknowledged
    AlertSvc->>Admin: send detailed diagnostic
    Admin->>Admin: investigate issue
```

---

## 5. PROJECT TIMELINE

```mermaid
gantt
    title Edu-Guide-Bot Development Timeline
    dateFormat YYYY-MM-DD
    
    section Planning & Design
    Requirements Gathering     :req, 2025-06-01, 15d
    System Architecture Design :arch, after req, 20d
    Database Schema Design     :db_design, after req, 20d
    UI/UX Design              :ux_design, after req, 25d
    
    section Backend Development
    Project Setup & Configuration    :be_setup, after arch, 10d
    Authentication Module            :auth, after be_setup, 20d
    Chat Processing Service          :chat, after be_setup, 25d
    Admin Management Module          :admin, after be_setup, 20d
    API Development & Testing        :api_test, after auth, 25d
    Database Integration            :db_int, after db_design, 25d
    
    section Frontend Development
    React Project Setup         :fe_setup, after ux_design, 10d
    Components Development     :components, after fe_setup, 30d
    Pages Implementation       :pages, after components, 25d
    Integration with Backend   :fe_int, after pages, 20d
    Responsive Design          :responsive, after pages, 15d
    
    section Testing & QA
    Unit Testing               :unit_test, after api_test, 15d
    Integration Testing        :int_test, after unit_test, 20d
    End-to-End Testing        :e2e_test, after int_test, 15d
    Performance Testing       :perf_test, after int_test, 10d
    Security Testing          :sec_test, after unit_test, 15d
    
    section Deployment & Documentation
    Documentation              :docs, after e2e_test, 15d
    Deployment Preparation    :deploy_prep, after e2e_test, 10d
    Production Deployment     :deploy, after deploy_prep, 7d
    Post-Deployment Support   :support, after deploy, 14d
    
    section Milestones
    Project Kickoff            :crit, milestone, 2025-06-01, 0d
    Backend Ready             :crit, milestone, 2025-08-15, 0d
    Frontend Ready            :crit, milestone, 2025-09-20, 0d
    Testing Complete          :crit, milestone, 2025-10-25, 0d
    Launch                    :crit, milestone, 2025-11-15, 0d
    
    section Contingency
    Buffer Time               :buffer, 2025-11-16, 30d
```

---

## 6. SYSTEM COMPONENTS INTERACTION

```mermaid
graph LR
    subgraph Frontend
        UI["React UI<br/>Components"]
        STATE["State Management<br/>React Hooks"]
        API_CLIENT["API Client<br/>Fetch/Axios"]
    end
    
    subgraph Gateway
        REST["REST API<br/>Endpoints"]
        WS["WebSocket<br/>Real-time"]
    end
    
    subgraph Backend
        AUTH["Authentication<br/>JWT/Session"]
        VALIDATORS["Request<br/>Validators"]
        HANDLERS["Route<br/>Handlers"]
        SERVICES["Business<br/>Services"]
    end
    
    subgraph Database
        DRIZZLE["Drizzle ORM<br/>Query Builder"]
        POSTGRES["PostgreSQL<br/>Database"]
    end
    
    subgraph External
        OPENAI["OpenAI API<br/>AI Responses"]
        EMAIL["Email Service<br/>Notifications"]
    end
    
    UI -->|Event| STATE
    STATE -->|HTTP/WebSocket| API_CLIENT
    API_CLIENT -->|Request| REST
    API_CLIENT -->|Connect| WS
    
    REST -->|Validate| AUTH
    WS -->|Validate| AUTH
    AUTH -->|Authorize| VALIDATORS
    VALIDATORS -->|Route| HANDLERS
    HANDLERS -->|Execute| SERVICES
    
    SERVICES -->|Query| DRIZZLE
    SERVICES -->|Request| OPENAI
    SERVICES -->|Send| EMAIL
    
    DRIZZLE -->|SQL| POSTGRES
    POSTGRES -->|Data| DRIZZLE
    DRIZZLE -->|Results| SERVICES
    
    OPENAI -->|Response| SERVICES
    EMAIL -->|Confirmation| SERVICES
    
    SERVICES -->|Response| HANDLERS
    HANDLERS -->|JSON| REST
    HANDLERS -->|Message| WS
    REST -->|Response| API_CLIENT
    WS -->|Update| API_CLIENT
    API_CLIENT -->|Render| UI
    
    style Frontend fill:#e3f2fd
    style Gateway fill:#fff3e0
    style Backend fill:#f3e5f5
    style Database fill:#e8f5e9
    style External fill:#ffe0b2
```

---

## 7. ALERT SEVERITY LEVELS & ACTIONS

```mermaid
graph TD
    ALERT["🚨 Alert Triggered"] --> CLASSIFY["Classify Alert Severity"]
    
    CLASSIFY --> CRITICAL["🔴 CRITICAL<br/>System Down/Data Loss Risk"]
    CLASSIFY --> HIGH["🟠 HIGH<br/>Service Degradation"]
    CLASSIFY --> MEDIUM["🟡 MEDIUM<br/>Functionality Issues"]
    CLASSIFY --> LOW["🟢 LOW<br/>Informational"]
    
    CRITICAL --> CRIT_ACTION["⚡ Immediate Actions:<br/>1. Auto-restart service<br/>2. Failover to backup<br/>3. Page all admins<br/>4. SMS + Email alerts<br/>5. Log to database"]
    
    HIGH --> HIGH_ACTION["📢 Priority Actions:<br/>1. Email admin<br/>2. Create incident<br/>3. Schedule fix<br/>4. Monitor closely<br/>5. Notify stakeholders"]
    
    MEDIUM --> MED_ACTION["📧 Standard Actions:<br/>1. Send email alert<br/>2. Log to system<br/>3. Add to dashboard<br/>4. Schedule for review<br/>5. Track metrics"]
    
    LOW --> LOW_ACTION["📝 Basic Actions:<br/>1. Log to database<br/>2. Add to logs<br/>3. Periodic review<br/>4. Track trends<br/>5. Archive after 30 days"]
    
    CRIT_ACTION --> CRIT_FOLLOW["Follow-up:<br/>• Root cause analysis<br/>• Post-mortem report<br/>• Preventive measures<br/>• System improvements"]
    
    HIGH_ACTION --> HIGH_FOLLOW["Follow-up:<br/>• Issue investigation<br/>• Patch development<br/>• Testing & deployment<br/>• Status updates"]
    
    MED_ACTION --> MED_FOLLOW["Follow-up:<br/>• Monitor trends<br/>• Plan fixes<br/>• Update documentation<br/>• Review logs"]
    
    LOW_ACTION --> LOW_FOLLOW["Follow-up:<br/>• Analytics review<br/>• Optimization<br/>• Archive & cleanup<br/>• Historical tracking"]
    
    CRIT_FOLLOW --> RESOLUTION["✅ Resolution<br/>Document & Close"]
    HIGH_FOLLOW --> RESOLUTION
    MED_FOLLOW --> RESOLUTION
    LOW_FOLLOW --> RESOLUTION
    
    style CRITICAL fill:#ffcdd2
    style HIGH fill:#ffe0b2
    style MEDIUM fill:#fff9c4
    style LOW fill:#c8e6c9
    style RESOLUTION fill:#c8e6c9
```

---

## Key System Characteristics

### High Availability Features:
- ✅ Health check monitoring
- ✅ Automatic failover mechanisms
- ✅ Database redundancy
- ✅ Cache layer for performance
- ✅ Alert escalation procedures

### Security Measures:
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation & sanitization
- ✅ Secure password hashing
- ✅ Audit logging for all admin actions
- ✅ Rate limiting for API endpoints

### Performance Optimization:
- ✅ Response caching
- ✅ Database query optimization
- ✅ Lazy loading for components
- ✅ Image optimization
- ✅ CDN integration ready

### Scalability:
- ✅ Modular architecture
- ✅ Microservice-ready design
- ✅ Database connection pooling
- ✅ Horizontal scaling support
- ✅ Load balancing ready

---

## Deployment Architecture

### Development Environment:
```
Local Machine → npm run dev → Vite Dev Server → React + Node.js
```

### Production Environment:
```
Docker Container → Express Server → PostgreSQL → External APIs
                ↓
            Load Balancer
                ↓
            AWS/Cloud Infrastructure
                ↓
            CDN for Static Assets
```

---

## Contact & Support

For questions about system architecture or alerts, contact:
- **Development Team**: dev@eduguidebot.local
- **Admin Panel**: Access via `/admin`
- **Documentation**: See docs/ directory
- **Issue Tracking**: GitHub Issues

---

**Last Updated**: April 2026
**Version**: 1.0
