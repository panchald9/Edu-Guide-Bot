# Edu-Guide-Bot - Mermaid Diagram Codes

This file contains all Mermaid diagram codes for the project. These can be copied and pasted into any Mermaid viewer or editor.

---

## 1. SYSTEM FLOWCHART

```mermaid
flowchart TD
    Start([User Access System]) --> Login{User Logged In?}
    Login -->|No| Auth["Authentication Module<br/>Login/Register"]
    Login -->|Yes| Dashboard["User Dashboard"]
    Auth --> AuthSuccess{Authentication<br/>Successful?}
    AuthSuccess -->|No| LoginFail["Display Error Message"]
    LoginFail --> Login
    AuthSuccess -->|Yes| Dashboard
    Dashboard --> UserChoice{User Action}
    UserChoice -->|Start Chat| Chat["Chat Interface"]
    UserChoice -->|View History| History["Conversation History"]
    UserChoice -->|View Profile| Profile["User Profile"]
    UserChoice -->|Admin Panel| AdminCheck{Is Admin?}
    AdminCheck -->|No| AccessDenied["Access Denied"]
    AccessDenied --> Dashboard
    AdminCheck -->|Yes| AdminPanel["Admin Panel"]
    Chat --> SendMsg["Send Message"]
    SendMsg --> ProcessMsg["Process Message<br/>with AI"]
    ProcessMsg --> GetResponse["Generate Response<br/>from AI Service"]
    GetResponse --> DisplayResponse["Display Response"]
    DisplayResponse --> SaveChat["Save Chat to DB"]
    SaveChat --> MoreChat{Continue Chat?}
    MoreChat -->|Yes| Chat
    MoreChat -->|No| Dashboard
    History --> ViewConv["View Conversations"]
    ViewConv --> SelectConv{Select Conversation}
    SelectConv -->|View| ChatDetail["View Chat Details"]
    ChatDetail --> Dashboard
    Profile --> EditProfile["Edit User Profile"]
    EditProfile --> SaveProfile["Save Changes"]
    SaveProfile --> Dashboard
    AdminPanel --> AdminAction{Admin Action}
    AdminAction -->|Manage Users| UserMgmt["User Management"]
    AdminAction -->|View Stats| Stats["View Statistics"]
    AdminAction -->|Manage Content| Content["Content Management"]
    UserMgmt --> Dashboard
    Stats --> Dashboard
    Content --> Dashboard
    Dashboard --> Logout["Logout"]
    Logout --> End([End Session])
```

---

## 2. ER DIAGRAM

```mermaid
erDiagram
    USERS ||--o{ CONVERSATIONS : creates
    USERS ||--o{ MESSAGES : sends
    CONVERSATIONS ||--o{ MESSAGES : contains
    USERS ||--o{ USER_SETTINGS : has
    USERS {
        int user_id PK
        string email UK
        string password_hash
        string full_name
        boolean is_admin
        string avatar_url
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    CONVERSATIONS {
        int conversation_id PK
        int user_id FK
        string title
        string topic
        timestamp created_at
        timestamp updated_at
        boolean is_archived
    }
    MESSAGES {
        int message_id PK
        int conversation_id FK
        int user_id FK
        string content
        string sender_type "user/ai"
        timestamp created_at
        string message_type "text/image"
    }
    USER_SETTINGS {
        int setting_id PK
        int user_id FK
        string theme "light/dark"
        string language
        boolean notifications_enabled
        timestamp updated_at
    }
```

---

## 3. DATA FLOW DIAGRAM (System Overview)

```mermaid
graph LR
    subgraph External Services
        AIService["🤖 AI Chat Service"]
        EmailService["📧 Email Service"]
    end
    
    subgraph Client Layer
        Browser["💻 Web Browser<br/>React App"]
    end
    
    subgraph Server Layer
        AuthServer["🔐 Auth Module"]
        ChatServer["💬 Chat Module"]
        AdminServer["⚙️ Admin Module"]
        ImageServer["🖼️ Image Service"]
    end
    
    subgraph Data Layer
        Database["🗄️ PostgreSQL<br/>Database"]
        Cache["💾 Cache"]
    end
    
    Browser -->|User Input| AuthServer
    Browser -->|Chat Messages| ChatServer
    Browser -->|Admin Actions| AdminServer
    Browser -->|Upload Images| ImageServer
    
    AuthServer -->|Authenticate| Database
    AuthServer -->|Send| EmailService
    
    ChatServer -->|Query History| Database
    ChatServer -->|Save Messages| Database
    ChatServer -->|Request Response| AIService
    ChatServer -->|Cache Data| Cache
    
    AdminServer -->|Query Users| Database
    AdminServer -->|Manage Data| Database
    
    ImageServer -->|Store/Retrieve| Database
    
    Database -->|User Data| AuthServer
    Database -->|Messages| ChatServer
    Cache -->|Cached Data| ChatServer
    
    AIService -->|Response| ChatServer
    EmailService -->|Verification| AuthServer
    
    ChatServer -->|Display| Browser
    AuthServer -->|Auth Token| Browser
    AdminServer -->|Admin Data| Browser
    ImageServer -->|Images| Browser
```

---

## 4. ZERO LEVEL DFD (Context Diagram)

```mermaid
graph TB
    User["👤 Users/Admins<br/>External Entity"]
    AIService["🤖 AI Service<br/>External Entity"]
    EmailService["📧 Email Service<br/>External Entity"]
    
    System["🌐 Edu-Guide-Bot<br/>System"]
    
    D1["💾 User Data<br/>Store"]
    D2["💬 Conversations<br/>Store"]
    D3["⚙️ Settings<br/>Store"]
    
    User -->|Login/Requests| System
    User -->|Chat Input| System
    User -->|Admin Commands| System
    
    System -->|Display Output| User
    System -->|Results/Responses| User
    
    System -->|Auth Request| AIService
    System -->|Chat Query| AIService
    
    AIService -->|Response| System
    
    System -->|Send Emails| EmailService
    EmailService -->|Confirmation| User
    
    System -->|Store/Retrieve| D1
    System -->|Store/Retrieve| D2
    System -->|Store/Retrieve| D3
    
    style System fill:#e1f5e1
    style D1 fill:#fff4e1
    style D2 fill:#fff4e1
    style D3 fill:#fff4e1
    style User fill:#e1f0ff
    style AIService fill:#e1f0ff
    style EmailService fill:#e1f0ff
```

---

## 5. FIRST LEVEL DFD (Main Processes)

```mermaid
graph TB
    User["👤 User/Admin"]
    AIService["🤖 AI Service"]
    EmailService["📧 Email Service"]
    
    P1["P1.0<br/>Authentication<br/>Module"]
    P2["P2.0<br/>Chat Processing<br/>Module"]
    P3["P3.0<br/>User Management<br/>Module"]
    P4["P4.0<br/>Data Management<br/>Module"]
    
    D1["D1: Users"]
    D2["D2: Conversations"]
    D3["D3: Messages"]
    D4["D4: Settings"]
    
    User -->|Credentials| P1
    P1 -->|Verify| D1
    P1 -->|Token| User
    P1 -->|Send Email| EmailService
    EmailService -->|Verify| User
    
    User -->|Message Input| P2
    P2 -->|Query/Store| D2
    P2 -->|Query/Store| D3
    P2 -->|Request| AIService
    AIService -->|Response| P2
    P2 -->|Response| User
    
    User -->|Admin Action| P3
    P3 -->|Access| D1
    P3 -->|Report| User
    
    P1 -->|Settings| P4
    P2 -->|Settings| P4
    P3 -->|Settings| P4
    P4 -->|Store/Retrieve| D4
    
    style P1 fill:#c8e6c9
    style P2 fill:#c8e6c9
    style P3 fill:#c8e6c9
    style P4 fill:#c8e6c9
    style D1 fill:#fff9c4
    style D2 fill:#fff9c4
    style D3 fill:#fff9c4
    style D4 fill:#fff9c4
```

---

## 6. FIRST LEVEL DFD - ADMIN SIDE

```mermaid
graph TB
    Admin["👨‍💼 Admin User"]
    System["🔐 System"]
    
    P3.1["P3.1<br/>User Account<br/>Management"]
    P3.2["P3.2<br/>Chat Monitoring"]
    P3.3["P3.3<br/>System Analytics"]
    P3.4["P3.4<br/>Content<br/>Management"]
    P3.5["P3.5<br/>Settings<br/>Configuration"]
    
    D1["D1: Users"]
    D2["D2: Conversations"]
    D3["D3: Messages"]
    D4["D4: Audit Logs"]
    D5["D5: System Config"]
    
    Admin -->|List/Search/Edit| P3.1
    P3.1 -->|Query/Update| D1
    P3.1 -->|Report| Admin
    
    Admin -->|Monitor Activity| P3.2
    P3.2 -->|Query| D2
    P3.2 -->|Query| D3
    P3.2 -->|Log| D4
    P3.2 -->|Report| Admin
    
    Admin -->|View Statistics| P3.3
    P3.3 -->|Query| D1
    P3.3 -->|Query| D2
    P3.3 -->|Dashboard| Admin
    
    Admin -->|Manage Content| P3.4
    P3.4 -->|Store/Update| D5
    P3.4 -->|Confirmation| Admin
    
    Admin -->|Configure Settings| P3.5
    P3.5 -->|Store| D5
    P3.5 -->|Log| D4
    P3.5 -->|Confirmation| Admin
    
    style P3.1 fill:#ffccbc
    style P3.2 fill:#ffccbc
    style P3.3 fill:#ffccbc
    style P3.4 fill:#ffccbc
    style P3.5 fill:#ffccbc
    style D1 fill:#ffe0b2
    style D2 fill:#ffe0b2
    style D3 fill:#ffe0b2
    style D4 fill:#ffe0b2
    style D5 fill:#ffe0b2
```

---

## 7. FIRST LEVEL DFD - USER/STUDENT SIDE

```mermaid
graph TB
    User["👨‍🎓 User/Student"]
    AIService["🤖 AI Service"]
    EmailService["📧 Email Service"]
    
    P1.1["P1.1<br/>User<br/>Registration"]
    P1.2["P1.2<br/>User Login"]
    P2.1["P2.1<br/>Send Message"]
    P2.2["P2.2<br/>Receive Response"]
    P2.3["P2.3<br/>View History"]
    P4.1["P4.1<br/>Profile<br/>Management"]
    
    D1["D1: Users"]
    D2["D2: Conversations"]
    D3["D3: Messages"]
    D4["D4: User Settings"]
    
    User -->|Registration Info| P1.1
    P1.1 -->|Store| D1
    P1.1 -->|Send Email| EmailService
    EmailService -->|Verify| User
    P1.1 -->|Confirmation| User
    
    User -->|Login Credentials| P1.2
    P1.2 -->|Verify| D1
    P1.2 -->|Token| User
    
    User -->|Type Question| P2.1
    P2.1 -->|Store| D3
    P2.1 -->|Query| D2
    P2.1 -->|Send Query| AIService
    
    AIService -->|Response| P2.2
    P2.2 -->|Store| D3
    P2.2 -->|Display| User
    
    User -->|Request History| P2.3
    P2.3 -->|Query| D2
    P2.3 -->|Query| D3
    P2.3 -->|List| User
    
    User -->|Edit Profile| P4.1
    P4.1 -->|Query/Update| D1
    P4.1 -->|Update| D4
    P4.1 -->|Confirmation| User
    
    style P1.1 fill:#b3e5fc
    style P1.2 fill:#b3e5fc
    style P2.1 fill:#b3e5fc
    style P2.2 fill:#b3e5fc
    style P2.3 fill:#b3e5fc
    style P4.1 fill:#b3e5fc
    style D1 fill:#e0f2f1
    style D2 fill:#e0f2f1
    style D3 fill:#e0f2f1
    style D4 fill:#e0f2f1
```

---

## How to Use These Diagrams

1. **Copy** the complete mermaid code block (including the three backticks)
2. **Paste** into a Mermaid live editor: https://mermaid.live
3. **Modify** as needed
4. **Export** as PNG or SVG for presentations/documents

### Online Mermaid Editors:
- Mermaid Live: https://mermaid.live
- GitHub (paste in markdown): https://github.com
- VS Code with extension: Markdown Preview Mermaid Support

### Export Options:
- Export as PNG/SVG from Mermaid Live
- Screenshot for quick use
- Embed in office documents
- Include in PowerPoint presentations

---

## Notes for Submission

- All diagrams follow standard DFD and ER notation
- Color coding helps distinguish between different components
- Diagrams are suitable for academic and professional documentation
- Can be easily modified to reflect system changes
- Include these in your project documentation submission
