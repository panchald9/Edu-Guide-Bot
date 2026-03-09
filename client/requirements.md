## Packages
react-markdown | Rendering educational content and bot responses
remark-gfm | GitHub Flavored Markdown support for tables and code blocks
framer-motion | Smooth animations for message bubbles and transitions
date-fns | Formatting timestamps
clsx | Conditional class names
tailwind-merge | Merging tailwind classes safely

## Notes
- Authentication is handled via Replit Auth (/api/login, /api/auth/user)
- Chat messages are streamed via SSE from POST /api/conversations/:id/messages
- Layout requires a split-screen landing page and a dashboard-style chat interface
