@echo off
echo ========================================
echo   TKMS - Installation and Setup
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Creating uploads directory...
if not exist "public\uploads" mkdir public\uploads

echo.
echo [3/4] Checking MongoDB...
echo Make sure MongoDB is running!
echo - Local: mongod
echo - Or use MongoDB Atlas connection string in .env.local

echo.
echo [4/4] Seeding database...
set /p seed="Run database seed? (y/n): "
if /i "%seed%"=="y" (
    call npm run seed
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start development server:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo Demo Accounts:
echo   Admin: admin@tkms.com / admin123
echo   Employee: employee@tkms.com / employee123
echo.
echo All times are now in Philippine Time (UTC+8)!
echo.
pause
