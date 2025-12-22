# TKMS - IBAYTECH CORP Implementation Summary

## 🎨 Theme & Branding

### IBAYTECH Color Scheme
- **Primary Blue**: `#0066ff` - Main brand color
- **Red Accent**: `#ff0000` - Secondary brand color  
- **White**: Clean, professional background

### Updates
- ✅ Updated Tailwind config with IBAYTECH colors
- ✅ Redesigned login page with IBAYTECH branding
- ✅ Custom toast notifications with brand colors
- ✅ Email templates with IBAYTECH branding

---

## 👤 Enhanced Employee Fields

### New User Model Includes:
```typescript
interface IUser {
  // Basic Info
  email: string
  password: string
  firstName: string
  middleName?: string        // NEW
  lastName: string
  
  // Employment
  role: 'admin' | 'employee'
  employeeId?: string         // Format: ibay-XXXX (4 digits)
  
  // Personal Info
  birthday?: Date             // NEW
  gender?: 'male' | 'female' | 'other'  // NEW
  age?: number                // NEW - Auto-calculated
  
  // Contact
  mobileNumber?: string       // NEW - Optional
  
  // Government IDs (All Optional)
  sss?: string                // NEW
  philhealth?: string         // NEW
  pagibig?: string            // NEW
  tin?: string                // NEW - Tax Identification Number
  
  // Profile
  photoUrl?: string           // NEW - For responsive images
  
  // Leave Management
  leaveCredits: number        // NEW - Default 5, Max 30
  isActive: boolean
  
  createdAt: Date
  updatedAt: Date
}
```

### Employee ID Format
- **Format**: `ibay-XXXX` (e.g., `ibay-1234`, `ibay-5678`)
- **Range**: 1000-9999 (4 digits)
- **Auto-generated** using utility function

---

## 📅 Leave Management System

### Leave Request Features
1. **Employee can:**
   - File leave requests with type, dates, and reason
   - View their own leave history
   - Check remaining leave credits
   - Cancel pending requests

2. **Admin can:**
   - View all leave requests
   - Approve/reject with admin notes
   - Set leave credits (0-30 days) per employee
   - View leave history for all employees

### Leave Types
- Sick Leave
- Vacation Leave
- Emergency Leave
- Personal Leave
- Other

### Automatic Features
- ✅ Leave credits deducted upon approval
- ✅ Email notifications to admin on new requests
- ✅ Email notifications to employee on approval/rejection
- ✅ Validation for sufficient leave credits
- ✅ Date validation (end date after start date)

---

## 🚫 Absence Management

### Admin Features
- Mark employee as absent for specific date
- Add reason and notes
- Track absence history
- View absences per employee

### API Endpoints
- `GET /api/absence` - Get absences
- `POST /api/absence` - Mark absence (Admin only)

---

## 📧 Email Notification System

### Setup (Optional)
Email notifications require SMTP configuration in `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Email Templates
All emails include IBAYTECH branding with:
- Professional header with ibaytech logo styling
- Color-coded content (blue primary, red accent)
- Responsive HTML design
- Clear call-to-action buttons

### Email Triggers
1. **Leave Request Submitted**
   - To: All active admins
   - Contains: Employee name, leave type, dates, reason

2. **Leave Request Approved**
   - To: Employee
   - Contains: Leave details, approval confirmation

3. **Leave Request Rejected**
   - To: Employee
   - Contains: Leave details, admin notes (if provided)

---

## 🗄️ Database Models

### New Models Created
1. **Leave Model** (`src/lib/models/Leave.ts`)
   - Stores leave requests
   - Tracks status (pending, approved, rejected)
   - Links to user and includes admin notes

2. **Absence Model** (`src/lib/models/Absence.ts`)
   - Admin-marked absences
   - Includes reason and notes
   - Links to user and marking admin

### Updated Models
1. **User Model** (`src/lib/models/User.ts`)
   - Added all new personal/employment fields
   - Includes leave credits tracking
   - Optional government ID fields

---

## 🛠️ API Routes

### Leave Management
- `GET /api/leave` - Get leaves (all for admin, own for employee)
- `POST /api/leave` - Create leave request
- `PATCH /api/leave/[id]` - Approve/reject leave (Admin)
- `DELETE /api/leave/[id]` - Delete pending leave

### Absence Management
- `GET /api/absence` - Get absences
- `POST /api/absence` - Mark absence (Admin only)

---

## 📊 Seed Data

### Created Accounts

**Admin Account:**
- Email: `admin@ibaytech.com`
- Password: `admin123`
- Leave Credits: 30 days

**Employee Accounts (5):**
All employees use password: `employee123`

1. **Juan Santos Dela Cruz**
   - Email: juan.delacruz@ibaytech.com
   - Employee ID: ibay-XXXX (random)
   - Gender: Male, Age: 34
   - Leave Credits: 5 days

2. **Maria Garcia Santos**
   - Email: maria.santos@ibaytech.com
   - Employee ID: ibay-XXXX (random)
   - Gender: Female, Age: 29
   - Leave Credits: 5 days

3. **Pedro Luna Reyes**
   - Email: pedro.reyes@ibaytech.com
   - Employee ID: ibay-XXXX (random)
   - Gender: Male, Age: 36
   - Leave Credits: 5 days

4. **Ana Cruz Mendoza**
   - Email: ana.mendoza@ibaytech.com
   - Employee ID: ibay-XXXX (random)
   - Gender: Female, Age: 32
   - Leave Credits: 5 days

5. **Jose Ramos Torres**
   - Email: jose.torres@ibaytech.com
   - Employee ID: ibay-XXXX (random)
   - Gender: Male, Age: 39
   - Leave Credits: 5 days

**All employees have:**
- Default schedule: Mon-Sat, 8:00 AM - 5:00 PM
- 5 leave credits
- Complete personal information (birthday, gender, age, mobile)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Update `.env.local` with:
- MongoDB connection (already configured)
- Email SMTP settings (optional)

### 3. Seed Database
```bash
pnpm run seed
```

### 4. Start Development Server
```bash
pnpm run dev
```

### 5. Access Application
Open http://localhost:3000

---

## 🎯 Key Features Implemented

### ✅ Completed Features
1. ✅ IBAYTECH theme and branding throughout
2. ✅ Enhanced employee profile with all required fields
3. ✅ Employee ID generator (ibay-XXXX format)
4. ✅ Leave management system
5. ✅ Leave credits tracking (5 default, 30 max)
6. ✅ Absence marking by admin
7. ✅ Email notifications (with IBAYTECH branding)
8. ✅ Custom toast notifications
9. ✅ Real login/logout functionality
10. ✅ Admin can manage employee schedules
11. ✅ Admin can set leave credits per employee
12. ✅ API routes for all features
13. ✅ Seed script with 5 sample employees

### 🎨 UI/UX Updates
- Modern, professional design
- IBAYTECH color scheme
- Responsive layouts
- Custom branded toast notifications
- Professional email templates

### 🔐 Security
- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- Protected API routes

---

## 📱 Next Steps for Full UI

To complete the system, you'll need to create/update:

1. **Admin Dashboard**
   - Employee management UI with all new fields
   - Leave requests management UI
   - Absence marking UI
   - Leave credits management UI

2. **Employee Dashboard**
   - Leave request form
   - Leave history view
   - Profile view/edit with all fields
   - Absence history view

3. **Profile Photo Upload**
   - Image upload component
   - Image optimization
   - Responsive image display

4. **Schedule Management UI**
   - Admin can assign schedules per employee
   - Visual schedule calendar

---

## 🛠️ Utilities Created

### Employee Utils (`src/lib/utils/employee.ts`)
- `generateEmployeeId()` - Generate ibay-XXXX format ID
- `isValidEmployeeId()` - Validate employee ID format
- `calculateAge()` - Calculate age from birthday

### Email Utils (`src/lib/utils/email.ts`)
- `sendEmail()` - Send emails via nodemailer
- `emailTemplates` - Branded email templates for all scenarios

---

## 📝 Notes

- Email notifications are optional and won't break functionality if not configured
- All optional fields in employee profile can be left blank
- System is fully functional with real authentication and database
- All APIs are protected with authentication middleware
- Leave credits are automatically deducted upon approval
- Employee IDs are auto-generated during account creation

---

## 🎉 Summary

The TKMS system is now fully functional with:
- **IBAYTECH branding** throughout
- **Complete employee profiles** with all requested fields
- **Leave management** with credits and email notifications
- **Absence tracking** for admin
- **Real authentication** and secure APIs
- **5 sample employees** ready for testing
- **Professional email notifications** with brand styling

All core functionality is implemented. The system is ready for UI development to provide user-friendly interfaces for all features! 🚀
