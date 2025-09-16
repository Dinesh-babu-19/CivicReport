# Citizen Reporting System

A full-stack web application that allows citizens to report community issues and track their resolution progress. Built with React, Node.js, Express, and MongoDB.

## Features

### Citizen Features
- **Submit Reports**: Upload photos, auto-capture location, and provide detailed descriptions
- **View Issues**: Interactive map and list views with filtering capabilities
- **Track Issues**: Personal dashboard to monitor submitted reports and status updates
- **Real-time Updates**: Get notified when issue status changes

### Admin Features (Future)
- **Issue Management**: Update issue status and add comments
- **Analytics**: View response times, backlog, and category breakdowns
- **Department Assignment**: Assign issues to specific departments

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- React Hook Form with Zod validation
- Leaflet for interactive maps
- Shadcn/ui component library

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- Express Validator for input validation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd citizen-reporting-system
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://jessiemounika367:jessie123@cluster0.ufpruga.mongodb.net/citizen-reporting
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

5. **Seed the database with sample data**
   ```bash
   cd server
   node scripts/seedData.js
   ```

6. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Demo Credentials

The seeded database includes sample users:

### Citizens
- **Email**: john@example.com | **Password**: password123
- **Email**: jane@example.com | **Password**: password123
- **Email**: mike@example.com | **Password**: password123

### Admins
- **Email**: sarah@example.com | **Password**: password123 (Admin1)
- **Email**: david@example.com | **Password**: password123 (Admin2)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Issues
- `POST /api/issues` - Submit new issue
- `GET /api/issues` - Get all issues (with filters)
- `GET /api/issues/:id` - Get issue details
- `GET /api/issues/user/:userId` - Get user's issues
- `PATCH /api/issues/:id/status` - Update issue status (Admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

## Database Schema

### Users
- user_id, name, email, password_hash, role, department_id, created_at

### Issues
- issue_id, citizen_id, category, description, photo_url, latitude, longitude, status, assigned_to, created_at, updated_at

### IssueUpdates
- update_id, issue_id, updated_by, status, comment, created_at

### Notifications
- notification_id, user_id, issue_id, message, is_read, created_at

### Departments
- department_id, name, location_zone

## Project Structure

```
citizen-reporting-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── pages/          # Page components
│   │   └── main.tsx        # App entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── scripts/            # Database seeding scripts
│   └── server.js           # Server entry point
└── README.md
```

## Features Implemented

✅ **Authentication System**
- User registration and login
- JWT token-based authentication
- Protected routes

✅ **Issue Management**
- Submit issues with photos and location
- View issues in map and list formats
- Filter issues by category and status
- Track issue status updates

✅ **User Dashboard**
- Personal issue tracking
- Community issue overview
- Notification system

✅ **Interactive Map**
- Leaflet integration
- Issue markers with status colors
- Popup details for each issue

✅ **File Upload**
- Photo upload for issues
- Image preview and validation

✅ **Responsive Design**
- Mobile-friendly interface
- Modern UI with Tailwind CSS

## Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Admin panel for issue management
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with external mapping services
- [ ] Bulk issue operations
- [ ] Issue assignment to departments
- [ ] Performance metrics and reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

