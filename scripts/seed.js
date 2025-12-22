require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tkms';

console.log('Connecting to MongoDB...');

// Helper function to generate employee ID
function generateEmployeeId() {
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `ibay-${randomNum}`;
}

async function createInitialUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
      email: String,
      password: String,
      firstName: String,
      middleName: String,
      lastName: String,
      role: String,
      employeeId: String,
      birthday: Date,
      gender: String,
      age: Number,
      mobileNumber: String,
      sss: String,
      philhealth: String,
      pagibig: String,
      tin: String,
      photoUrl: String,
      leaveCredits: Number,
      isActive: Boolean,
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Hash passwords
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const employeePassword = await bcrypt.hash('employee123', 10);

    // Create Super Admin User
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@ibaytech.com' });
    if (!existingSuperAdmin) {
      await User.create({
        email: 'superadmin@ibaytech.com',
        password: superAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super-admin',
        leaveCredits: 30,
        isActive: true,
      });
      console.log('Super Admin user created');
      console.log('Email: superadmin@ibaytech.com');
      console.log('Password: superadmin123');
    } else {
      console.log('Super Admin user already exists');
    }

    // Create Admin User
    const existingAdmin = await User.findOne({ email: 'admin@ibaytech.com' });
    if (!existingAdmin) {
      await User.create({
        email: 'admin@ibaytech.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        leaveCredits: 30,
        isActive: true,
      });
      console.log('✅ Admin user created');
      console.log('   Email: admin@ibaytech.com');
      console.log('   Password: admin123');
    } else {
      console.log('⚠️  Admin user already exists');
    }

    // Create Employee Users
    const employees = [
      {
        email: 'juan.delacruz@ibaytech.com',
        firstName: 'Juan',
        middleName: 'Santos',
        lastName: 'Dela Cruz',
        birthday: new Date('1990-05-15'),
        gender: 'male',
        age: 34,
        mobileNumber: '+639171234567',
      },
      {
        email: 'maria.santos@ibaytech.com',
        firstName: 'Maria',
        middleName: 'Garcia',
        lastName: 'Santos',
        birthday: new Date('1995-08-20'),
        gender: 'female',
        age: 29,
        mobileNumber: '+639189876543',
      },
      {
        email: 'pedro.reyes@ibaytech.com',
        firstName: 'Pedro',
        middleName: 'Luna',
        lastName: 'Reyes',
        birthday: new Date('1988-03-10'),
        gender: 'male',
        age: 36,
        mobileNumber: '+639205551234',
      },
      {
        email: 'ana.mendoza@ibaytech.com',
        firstName: 'Ana',
        middleName: 'Cruz',
        lastName: 'Mendoza',
        birthday: new Date('1992-11-25'),
        gender: 'female',
        age: 32,
        mobileNumber: '+639177654321',
      },
      {
        email: 'jose.torres@ibaytech.com',
        firstName: 'Jose',
        middleName: 'Ramos',
        lastName: 'Torres',
        birthday: new Date('1985-07-08'),
        gender: 'male',
        age: 39,
        mobileNumber: '+639189998888',
      },
    ];

    const ScheduleSchema = new mongoose.Schema({
      userId: String,
      days: [String],
      timeIn: String,
      timeOut: String,
      isActive: Boolean,
    }, { timestamps: true });

    const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

    for (const empData of employees) {
      const existingEmployee = await User.findOne({ email: empData.email });
      if (!existingEmployee) {
        const employee = await User.create({
          ...empData,
          password: employeePassword,
          role: 'employee',
          employeeId: generateEmployeeId(),
          leaveCredits: 5,
          isActive: true,
        });

        // Create default schedule for employee (Mon-Sat, 8am-5pm)
        await Schedule.create({
          userId: employee._id.toString(),
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          timeIn: '08:00',
          timeOut: '17:00',
          isActive: true,
        });

        console.log(`✅ Employee created: ${empData.firstName} ${empData.lastName} (${empData.email})`);
      }
    }

    console.log('\n🎉 Initial setup complete!');
    console.log('\nYou can now login with:');
    console.log('Super Admin: superadmin@ibaytech.com / superadmin123');
    console.log('Admin: admin@ibaytech.com / admin123');
    console.log('Employee: [any employee email] / employee123');
    console.log('\nAll employees have 5 leave credits by default.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB');
  }
}

createInitialUsers();
