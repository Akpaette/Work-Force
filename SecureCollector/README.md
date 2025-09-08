# 🏛️ SecureCollector - Church Staff Database System

> **A modern, secure, and user-friendly church staff management platform with QR-enabled ID cards**

## 🎉 **Welcome to Your Enterprise-Grade Solution!**

SecureCollector is a **complete church staff database system** that provides:
- ✅ **Comprehensive staff records** with all essential fields
- ✅ **Department-based organization** (General Overseers, Pastors, Evangelists, etc.)
- ✅ **Professional ID card generation** with QR codes
- ✅ **Role-based security** with 5-tier permissions
- ✅ **Modern responsive design** for all devices
- ✅ **Data export capabilities** (CSV, PDF, batch operations)

## 🚀 **Quick Start**

### **Option 1: Automated Setup (Recommended)**
```powershell
# Run the automated setup script
./quick-start.ps1
```

### **Option 2: Manual Setup**
```bash
# 1. Install Node.js from https://nodejs.org/
# 2. Install dependencies
npm install
npm install bcrypt @types/bcrypt jspdf html2canvas papaparse jspdf-autotable

# 3. Setup environment
cp .env.example .env
# Edit .env with your database connection

# 4. Setup database
npm run db:push

# 5. Start the application
npm run dev
```

## 📁 **Project Structure**

```
SecureCollector/
├── client/              # 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and configurations
│   └── index.html       # Entry point
├── server/              # 🔧 Backend (Express + Node.js)
│   ├── index.ts         # Main server
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   ├── security.ts      # Security utilities
│   └── db.ts           # Database connection
├── shared/              # 🔗 Shared code
│   └── schema.ts       # Database schemas & validation
├── attached_assets/     # 📎 Static files (logos, etc.)
└── migrations/         # 🗄️ Database migrations
```

## 🌟 **Key Features**

### **👥 Staff Management**
- Complete CRUD operations for staff records
- Comprehensive data fields (personal, education, emergency contacts)
- Profile photo uploads with drag-and-drop
- Status management (active, inactive, released, retired)

### **🗂️ Department Organization**
- **General Overseers** (Purple theme)
- **Church Executives** (Blue theme)
- **Pastors** (Green theme)
- **Evangelists** (Orange theme)
- **Administrative Staff** (Indigo theme)
- **Other Workers** (Gray theme)

### **🆔 Professional ID Cards**
- Automatic generation for each staff member
- Standard credit card size (85.6mm × 54mm)
- QR codes linking to staff profiles
- Downloadable as PNG, PDF, or printable
- Church branding with department colors

### **📱 QR Code Integration**
- Mobile-responsive profile pages
- Direct profile access via QR scanning
- Staff verification system
- Mobile-optimized interface

### **🔐 Advanced Security**
- 5-tier role-based permissions
- Encrypted sensitive data storage
- Session-based authentication
- Comprehensive audit logging
- Password hashing with bcrypt

### **📊 Admin Dashboard**
- Real-time statistics
- Department management
- Recent activity monitoring
- Export capabilities

### **📤 Data Export**
- CSV export with field selection
- Professional PDF reports
- Batch ID card generation
- Privacy controls for sensitive data

## 🔧 **Available Scripts**

```bash
# Development
npm run dev          # Start development server with HMR
npm run check        # TypeScript type checking

# Production
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:push     # Push schema changes to database
```

## 🌐 **Application URLs**

- **Development**: http://localhost:3000 (with HMR)
- **Production**: http://localhost:5000 (serves API + frontend)
- **API Endpoints**: http://localhost:5000/api/*

## 👤 **Default Admin Access**

```
Username: admin@seedofchrist.org
Password: 5646
```
⚠️ **Change these credentials immediately in production!**

## 🗄️ **Database Setup**

### **Local PostgreSQL**
```bash
# Install PostgreSQL
# Create database
createdb church_staff_db

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/church_staff_db
```

### **Cloud PostgreSQL (Recommended)**
- **Neon**: https://neon.tech (Free tier)
- **Supabase**: https://supabase.com (Free tier)
- **Railway**: https://railway.app (Simple deployment)

## 🚀 **Deployment Options**

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

### **Railway**
```bash
# Connect to Railway and deploy
railway login
railway init
railway up
```

### **Docker**
```bash
docker build -t church-staff-db .
docker run -p 5000:5000 --env-file .env church-staff-db
```

## 📚 **Documentation**

- **[WARP.md](./WARP.md)** - Development guide for AI assistants
- **[PROJECT_RESTORATION_GUIDE.md](./PROJECT_RESTORATION_GUIDE.md)** - Complete setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[REFINEMENT_PLAN.md](./REFINEMENT_PLAN.md)** - Feature analysis and enhancements

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation

### **Backend**
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **bcrypt** for password hashing
- **Zod** for validation

### **Additional Features**
- **QR Code Generation** with qrcode library
- **PDF Export** with jsPDF
- **CSV Export** with PapaParse
- **Image Processing** with html2canvas
- **File Uploads** with secure validation

## 🔒 **Security Features**

- **Password Hashing**: bcrypt with salt rounds
- **Data Encryption**: AES-256 for sensitive fields
- **Role Permissions**: Granular access control
- **Session Management**: Secure token-based auth
- **Input Validation**: Comprehensive Zod schemas
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📱 **Mobile Support**

- **Responsive Design**: Works on all screen sizes
- **Touch Interactions**: Optimized for mobile use
- **QR Code Scanning**: Camera-friendly QR codes
- **Progressive Web App**: Fast loading and caching

## 🤝 **Support**

For technical support or questions:
1. Check the documentation files in the project
2. Review the troubleshooting section in PROJECT_RESTORATION_GUIDE.md
3. Ensure all dependencies are properly installed
4. Verify database connection configuration

## 📄 **License**

This project is licensed under the MIT License.

## 🎉 **Congratulations!**

You now have a **professional-grade church staff management system** ready for production use. This enterprise-level solution includes everything needed to manage your church staff efficiently and securely.

**Happy managing! 🚀**
