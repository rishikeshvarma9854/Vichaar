# 🎓 KMIT Vichaar - Student Portal

A modern, responsive student portal built with React + Vite for KMIT students to access their academic information, attendance, and more.

## ✨ Features

- **🔐 Secure Authentication** - Login with Netra credentials
- **🎨 Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- **🌙 Dark/Light Theme** - Toggle between themes with smooth transitions
- **📱 Mobile First** - Optimized for all device sizes
- **⚡ Real-time Data** - Live attendance and profile information
- **🔄 Protected Routes** - Secure access to authenticated content
- **📊 Interactive Dashboard** - Comprehensive student overview
- **🚀 Fast Performance** - Built with Vite for optimal speed

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kmit-vichaar
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/               # Utility libraries
│   └── api.ts        # API client
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Integration

The application integrates with the official KMIT API endpoints:

- **Base URL**: `https://kmit-api.teleuniv.in`
- **Authentication**: `/auth/login`
- **Student Profile**: `/sanjaya/getStudentProfile`
- **Attendance**: `/sanjaya/getAttendance`
- **Notices**: `/sanjaya/getUnseenNoticesCountByStudent`

## 🎨 Customization

### Colors
The app uses a comprehensive color system defined in `tailwind.config.js`:

- **Primary**: Blue shades for main actions
- **Secondary**: Purple shades for secondary actions
- **Accent**: Cyan shades for highlights

### Themes
- **Light Theme**: Clean, modern design with subtle shadows
- **Dark Theme**: Deep gradients with glassmorphism effects

## 📱 Responsive Design

- **Mobile**: Optimized for small screens
- **Tablet**: Adaptive layouts for medium screens
- **Desktop**: Full-featured experience for large screens

## 🔒 Security Features

- **Protected Routes**: Authentication required for dashboard access
- **Token Management**: JWT token handling with expiry
- **Secure API Calls**: Proper headers and authentication

## 🚧 Development Roadmap

- [ ] **hCaptcha Integration** - Enhanced security for login
- [ ] **Student Photo Upload** - Profile picture management
- [ ] **Results Module** - Academic performance tracking
- [ ] **Timetable View** - Class schedule display
- [ ] **Export Functionality** - Data export capabilities
- [ ] **Admin Panel** - Faculty management interface
- [ ] **Push Notifications** - Real-time updates
- [ ] **Offline Support** - PWA capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **KMIT** - For providing the official API endpoints
- **React Team** - For the amazing framework
- **Vite Team** - For the fast build tool
- **Tailwind CSS** - For the utility-first CSS framework

## 📞 Support

For support, email rishikesh23@kmit.edu.in or create an issue in the repository.

---

**Built with ❤️ for KMIT students**
