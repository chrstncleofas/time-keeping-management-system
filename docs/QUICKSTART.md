# TKMS - Quick Start Guide

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd c:\Users\Christian\Desktop\Projects\tkms
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   mongod
   ```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env.local` with your connection string

### 3. Create Upload Directory

```bash
mkdir public\uploads
```

### 4. Seed Initial Users

```bash
npm run seed
```

This will create:
- **Admin**: admin@tkms.com / admin123
- **Employee**: employee@tkms.com / employee123

### 5. Start Development Server

```bash
npm run dev
```

### 6. Open Application

Open http://localhost:3000 in your browser

---

## 📱 How to Use

### For Employees:

1. **Login** with employee credentials
2. **Dashboard** shows your stats
3. **Clock In**:
   - Click "Clock In" button
   - Allow camera access
   - Take photo
   - Confirm
4. **Clock Out**:
   - Click "Clock Out" button
   - Take photo
   - Confirm

### For Admins:

1. **Login** with admin credentials
2. **Dashboard** shows all employee stats
3. **Manage Employees**:
   - Add new employees
   - Edit employee info
   - Deactivate accounts
4. **Set Schedules**:
   - Create custom schedules
   - Assign to employees
   - Set days and times
5. **View Attendance**:
   - Monitor real-time attendance
   - Check time entries
   - View photos

---

## 🎯 Features

✅ Camera capture for time keeping
✅ Admin can set flexible schedules
✅ Real-time attendance tracking
✅ Late/Early detection
✅ Mobile responsive
✅ Secure authentication
✅ Photo storage
✅ Dashboard analytics

---

## 🛠️ Tech Stack

- Next.js 14 (No Vite!)
- TypeScript
- MongoDB + Mongoose ORM
- Tailwind CSS
- JWT Authentication
- react-webcam

---

## 📞 Need Help?

Check:
- README.md - Full documentation
- SETUP_COMPLETE.md - Detailed setup guide
