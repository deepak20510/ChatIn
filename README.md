# ChatIn 💬

A modern, real-time chat application built with the MERN stack featuring Socket.IO for instant messaging, beautiful UI with Tailwind CSS, and secure authentication.

![GitHub repo size](https://img.shields.io/github/repo-size/deepak20510/ChatIn)
![GitHub last commit](https://img.shields.io/github/last-commit/deepak20510/ChatIn)
![License](https://img.shields.io/badge/license-ISC-blue)

## ✨ Features

### Real-Time Communication
- **Instant Messaging** - Send and receive messages instantly using Socket.IO
- **Typing Indicators** - See who's online/offline in real-time
- **Image Sharing** - Share images within conversations
- **Message Notifications** - Audio notifications for new messages (toggleable)

### User Authentication & Security
- **JWT-based Authentication** - Secure login and registration system
- **Password Hashing** - Passwords hashed with bcryptjs
- **Cookie-based Sessions** - HTTP-only cookies for enhanced security
- **Rate Limiting** - Arcjet integration for bot protection

### Modern UI/UX
- **Responsive Design** - Fully adaptive layout for mobile, tablet, and desktop
- **Animated Gradient Borders** - Beautiful animated UI elements
- **Glassmorphism Effects** - Modern frosted glass design aesthetic
- **Dark Theme** - Sleek dark mode interface
- **Tab-based Navigation** - Easy switching between Chats and Contacts

### User Experience
- **Optimistic UI Updates** - Instant message feedback with server confirmation
- **Keyboard Shortcuts** - Press `ESC` to close chat windows
- **Sound Effects** - Optional keyboard sounds for immersive typing experience
- **Toast Notifications** - Beautiful feedback for user actions
- **Auto-scroll** - Automatically scrolls to new messages

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI library with latest features |
| Vite 7 | Fast build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| DaisyUI | Component library for Tailwind |
| Zustand | Lightweight state management |
| React Router 7 | Client-side routing |
| Socket.IO Client | Real-time communication |
| Axios | HTTP client |
| React Hot Toast | Toast notifications |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js 4 | Web framework |
| MongoDB | NoSQL database |
| Mongoose 8 | ODM for MongoDB |
| Socket.IO 4 | WebSocket server |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Cloudinary | Image storage & optimization |
| Resend | Email service |
| Arcjet | Bot protection & rate limiting |

## 📁 Project Structure

```
ChatIn/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── BorderAnimatedContainer.jsx
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatList.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ContactList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── NoChatsFound.jsx
│   │   │   ├── NoChatHistoryPlaceholder.jsx
│   │   │   ├── NoConversationPlaceholder.jsx
│   │   │   ├── PageLoader.jsx
│   │   │   ├── ProfileHeader.jsx
│   │   │   ├── UsersLoadingSkeleton.jsx
│   │   │   └── ...
│   │   ├── store/              # Zustand stores
│   │   │   ├── useAuthStore.js # Auth & socket state
│   │   │   └── useChatStore.js # Chat & message state
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities
│   │   ├── pages/              # Route pages
│   │   ├── App.jsx             # Main app component
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Express + Node.js backend
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   └── message.controller.js
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   └── Message.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.route.js
│   │   │   └── message.route.js
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── arcjet.middleware.js
│   │   │   ├── auth.middleware.js
│   │   │   └── socket.auth.middleware.js
│   │   ├── lib/                # Helpers & config
│   │   │   ├── socket.js       # Socket.IO setup
│   │   │   ├── db.js           # MongoDB connection
│   │   │   ├── cloudinary.js   # Cloudinary config
│   │   │   ├── env.js          # Environment variables
│   │   │   ├── arcjet.js       # Arcjet config
│   │   │   └── utils.js        # Utility functions
│   │   ├── emails/             # Email templates
│   │   │   └── emailTemplates.js
│   │   └── server.js           # Entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
├── package.json                # Root package.json (deployment scripts)
└── README.md                   # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud)
- Cloudinary account (for image uploads)
- Resend account (for email notifications)

### 1. Clone the Repository
```bash
git clone https://github.com/deepak20510/ChatIn.git
cd ChatIn
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend Email
RESEND_API_KEY=your_resend_api_key
RESEND_SENDER_EMAIL=onboarding@resend.dev

# Arcjet (Optional - for bot protection)
ARCJET_KEY=your_arcjet_key
```

### 4. Run the Application

#### Development Mode
```bash
# Run backend (from root directory)
cd backend && npm run dev

# Run frontend (in a new terminal)
cd frontend && npm run dev
```

#### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🌟 Key Features Explained

### Real-Time Messaging with Socket.IO
The application uses Socket.IO for bidirectional real-time communication:
- **Connection Management**: Each authenticated user gets a socket connection mapped to their user ID
- **Online Status**: Broadcasts online user list to all connected clients
- **Message Broadcasting**: New messages are instantly delivered to recipients
- **Authentication**: Socket connections are authenticated using JWT tokens from cookies

### Optimistic UI Updates
When sending a message:
1. Message is immediately added to the UI with a temporary ID
2. Message is sent to the server
3. Server confirms and returns the real message with database ID
4. UI updates the temporary message with the real one
5. If the server request fails, the optimistic message is removed

### Responsive Design
The application is fully responsive across all device sizes:
- **Mobile (< 640px)**: Full-screen chat overlay when selecting a conversation
- **Tablet (640px+)**: Side-by-side layout begins
- **Desktop (768px+)**: Full desktop experience with sidebar and chat area

### Security Features
- **JWT Authentication**: Stateless authentication with JSON Web Tokens
- **Password Hashing**: All passwords are hashed using bcryptjs
- **HTTP-only Cookies**: Tokens stored in secure, HTTP-only cookies
- **Rate Limiting**: Arcjet integration protects against bots and abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🔄 API Endpoints

### Authentication Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/check` | Check authentication status |
| PUT | `/api/auth/update-profile` | Update user profile |

### Message Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/contacts` | Get all contacts |
| GET | `/api/messages/chats` | Get user's chat partners |
| GET | `/api/messages/:userId` | Get messages with specific user |
| POST | `/api/messages/send/:userId` | Send message to user |

## 🎨 Customization

### Theming
The application uses Tailwind CSS with custom colors:
- Primary: Cyan (`cyan-500`, `cyan-600`)
- Background: Slate (`slate-800`, `slate-900`)
- Accents: Pink and Cyan gradients

Modify `tailwind.config.js` to change the color scheme.

### Sound Effects
Keyboard sounds are stored in the `/public/sounds/` directory. You can:
- Add new `.mp3` files for different typing sounds
- Enable/disable sounds in the UI
- Toggle sound settings (persisted to localStorage)

## 📱 Mobile Experience

The application provides an excellent mobile experience:
- **Touch-friendly Interface**: All buttons are appropriately sized for touch
- **Swipe Gestures**: Natural mobile interaction patterns
- **Full-screen Chat**: Conversations take up the full screen on mobile
- **Optimized Images**: Images are properly sized for mobile displays
- **Responsive Typography**: Text sizes adapt to screen size

## 🚀 Deployment

### Deploy to Render/Railway/Heroku

1. Set up environment variables in your hosting platform
2. Connect your GitHub repository
3. Configure build command: `npm run build`
4. Configure start command: `npm start`

### MongoDB Atlas Setup
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP or use `0.0.0.0/0` for all IPs
4. Copy the connection string to your `.env` file

### Cloudinary Setup
1. Create an account at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard
3. Add these to your `.env` file

## 🐛 Troubleshooting

### Common Issues

**Socket.IO Connection Fails**
- Ensure `CLIENT_URL` in backend `.env` matches your frontend URL
- Check that CORS is properly configured
- Verify that the server is running

**MongoDB Connection Errors**
- Check your `MONGODB_URI` is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify network connectivity

**Image Uploads Fail**
- Check Cloudinary credentials in `.env`
- Ensure file size limits are configured properly
- Verify that the image format is supported

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Deepak** - [@deepak20510](https://github.com/deepak20510)

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [DaisyUI](https://daisyui.com/) for beautiful components
- [Zustand](https://github.com/pmndrs/zustand) for state management

---

<p align="center">Made with ❤️ and ☕</p>
