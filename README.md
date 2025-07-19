# SmartBin - Waste Management System

A comprehensive full-stack waste management and pickup scheduling system built with React, TypeScript, Node.js, Express, and MongoDB.

## Features

### Frontend (React + TypeScript)
- **Dual Interface**: Separate dashboards for residents and waste collection authorities
- **Interactive Map**: Real-time bin locations and status monitoring
- **Pickup Scheduling**: Calendar-based pickup request system
- **Issue Reporting**: Report bin problems with geolocation and image uploads
- **Recycling Analytics**: Track recycling performance and environmental impact
- **Responsive Design**: Mobile-first design optimized for all devices

### Backend (Node.js + Express)
- **RESTful API**: Comprehensive API endpoints for all functionality
- **Authentication**: JWT-based authentication with role-based access control
- **File Upload**: Multer-based image and document upload system
- **Email Notifications**: Automated email notifications for important events
- **Data Validation**: Express-validator for request validation
- **Error Handling**: Centralized error handling and logging

### Database (MongoDB)
- **User Management**: Residents, authorities, and admin users
- **Bin Tracking**: Real-time bin status and location monitoring
- **Pickup Requests**: Complete pickup lifecycle management
- **Issue Reports**: Comprehensive issue tracking and resolution
- **Recycling Stats**: Detailed recycling performance analytics

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Development**: Vite, Nodemon, Concurrently

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartbin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/smartbin

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

6. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full

   # Or start them separately:
   # Frontend only
   npm run dev

   # Backend only
   npm run server:dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Bins
- `GET /api/bins` - Get all bins (filtered by user role)
- `GET /api/bins/:id` - Get single bin
- `POST /api/bins` - Create new bin (authority only)
- `PUT /api/bins/:id` - Update bin (authority only)
- `PATCH /api/bins/:id/status` - Update bin status

### Pickup Requests
- `GET /api/pickups` - Get pickup requests
- `GET /api/pickups/:id` - Get single pickup request
- `POST /api/pickups` - Create pickup request
- `PATCH /api/pickups/:id/status` - Update pickup status
- `PATCH /api/pickups/:id/assign` - Assign pickup to driver

### Reports
- `GET /api/reports` - Get reports
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create report
- `PATCH /api/reports/:id/status` - Update report status
- `PATCH /api/reports/:id/resolve` - Resolve report

### Statistics
- `GET /api/stats/recycling` - Get recycling statistics
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/system` - Get system-wide statistics (authority only)

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:type/:filename` - Delete file

## Default Users (after seeding)

### Residents
- **Email**: john@example.com, **Password**: password123
- **Email**: jane@example.com, **Password**: password123

### Authorities
- **Email**: mike@authority.com, **Password**: password123
- **Email**: sarah@authority.com, **Password**: password123

## Project Structure

```
smartbin/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── common/             # Shared components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── schedule/           # Pickup scheduling
│   │   ├── bins/               # Bin management
│   │   ├── reports/            # Issue reporting
│   │   └── recycling/          # Recycling stats
│   ├── contexts/               # React contexts
│   ├── types/                  # TypeScript type definitions
│   └── data/                   # Mock data
├── server/                      # Backend source code
│   ├── models/                 # MongoDB models
│   ├── routes/                 # Express routes
│   ├── middleware/             # Custom middleware
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration files
│   └── scripts/                # Database scripts
└── public/                     # Static assets
```

## Features in Detail

### User Roles
- **Residents**: Schedule pickups, report issues, view recycling stats
- **Authorities**: Manage bins, handle reports, view system analytics
- **Admin**: Full system access and user management

### Bin Management
- Real-time status tracking (empty, half-full, full, overflowing)
- Location-based bin discovery
- Maintenance history tracking
- User assignment management

### Pickup Scheduling
- Calendar-based scheduling interface
- Priority levels (low, medium, high, urgent)
- Driver assignment and route optimization
- Automated notifications and reminders

### Issue Reporting
- Multiple issue types (overflow, damage, maintenance, etc.)
- Photo evidence upload
- Geolocation integration
- Status tracking and resolution workflow

### Analytics & Statistics
- Individual recycling performance tracking
- Environmental impact calculations (CO₂, water, energy saved)
- System-wide analytics for authorities
- Achievement system and leaderboards

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.