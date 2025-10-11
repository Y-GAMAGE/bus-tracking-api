# Bus Tracking API - Authentication Module Test Report

## Project Information

**Project** : Bus Tracking API - NTC Sri Lanka 
**Module** : Authentication & Authorization System 
**Student ID** : COBSCCOMP241P-004
**Course** : NB6007CEM - Web API Development 
**Batch** : 24.1P 
**Date** : October 11, 2025 
**Branch Tested** : dev 
**Test Environment** : Local Development 

## Technical Stack

**Runtime** : Node.js v20.14.0 
**Framework** : Express.js 
**Database** : MongoDB Atlas 
**Authentication** : JWT (JSON Web Tokens) 
**Password Hashing** : bcryptjs 
**Server Port** : 3000 
**Base URL** : http://localhost:3000 
**Testing Tool** : Postman 


### TEST 1: User Registration (Public)

**Test ID:** AUTH-001  
**Name:** Register New Admin User  
**Objective:** Create a new admin account and receive JWT token  
**Endpoint:** `POST /api/auth/register`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin_ntc",
  "email": "admin@ntc.lk",
  "password": "admin123",
  "role": "admin",
  "phone": "0771234567",
  "profile": {
    "firstName": "System",
    "lastName": "Administrator"
  }
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "67093f1e5c8d2a3b4c5d6e7f",
      "username": "admin_ntc",
      "email": "admin@ntc.lk",
      "role": "admin",
      "phone": "0771234567",
      "isActive": true,
      "createdAt": "2025-10-11T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Actual Response:** `201 Created`  
**Result:** ✅ **PASSED**  
**Notes:** User created successfully with hashed password and JWT token generated

---

### TEST 2: User Login (Public)

**Test ID:** AUTH-002  
**Name:** Admin User Login  
**Objective:** Authenticate admin user and receive JWT token  
**Endpoint:** `POST /api/auth/login`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@ntc.lk",
  "password": "admin123"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "67093f1e5c8d2a3b4c5d6e7f",
      "username": "admin_ntc",
      "email": "admin@ntc.lk",
      "role": "admin",
      "lastLogin": "2025-10-11T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Authentication successful, lastLogin timestamp updated

---

### TEST 3: Get Current User Profile (Protected)

**Test ID:** AUTH-003  
**Name:** Get Admin Profile  
**Objective:** Retrieve authenticated user's profile information  
**Endpoint:** `GET /api/auth/me`  
**Authentication:** Required (Bearer Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "67093f1e5c8d2a3b4c5d6e7f",
    "username": "admin_ntc",
    "email": "admin@ntc.lk",
    "role": "admin",
    "phone": "0771234567",
    "profile": {
      "firstName": "System",
      "lastName": "Administrator"
    },
    "isActive": true,
    "createdAt": "2025-10-11T10:30:00.000Z",
    "fullName": "System Administrator"
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Profile retrieved successfully, password field excluded

---

### TEST 4: Update User Profile (Protected)

**Test ID:** AUTH-004  
**Name:** Update Admin Profile  
**Objective:** Update authenticated user's profile information  
**Endpoint:** `PUT /api/auth/profile`  
**Authentication:** Required (Bearer Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "phone": "0771234999",
  "profile": {
    "firstName": "System",
    "lastName": "Administrator",
    "address": {
      "street": "NTC Building",
      "city": "Colombo",
      "province": "Western"
    }
  }
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "67093f1e5c8d2a3b4c5d6e7f",
    "username": "admin_ntc",
    "email": "admin@ntc.lk",
    "phone": "0771234999",
    "profile": {
      "firstName": "System",
      "lastName": "Administrator",
      "address": {
        "street": "NTC Building",
        "city": "Colombo",
        "province": "Western"
      }
    },
    "updatedAt": "2025-10-11T10:40:00.000Z"
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Profile updated successfully, sensitive fields (password, role) not modifiable

---

### TEST 5: Change Password (Protected)

**Test ID:** AUTH-005  
**Name:** Change Admin Password  
**Objective:** Update authenticated user's password  
**Endpoint:** `PUT /api/auth/change-password`  
**Authentication:** Required (Bearer Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "admin123new"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Password changed and hashed with bcrypt, old token remains valid until expiry

---

### TEST 6: User Logout (Protected)

**Test ID:** AUTH-006  
**Name:** Admin User Logout  
**Objective:** Logout authenticated user (client-side token removal)  
**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required (Bearer Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful. Please remove token from client."
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Logout successful, JWT invalidation handled client-side

---

### TEST 7: Forgot Password (Public)

**Test ID:** AUTH-007  
**Name:** Request Password Reset Token  
**Objective:** Generate password reset token for user  
**Endpoint:** `POST /api/auth/forgot-password`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@ntc.lk"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset token generated",
  "resetToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "instructions": "Use this token with /reset-password endpoint"
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Reset token generated (SHA256 hashed), expires in 1 hour

---

### TEST 8: Reset Password (Public)

**Test ID:** AUTH-008  
**Name:** Reset User Password with Token  
**Objective:** Reset password using valid reset token  
**Endpoint:** `POST /api/auth/reset-password`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "resetToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "newPassword": "admin123reset"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with new password."
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Password reset successful, reset token cleared from database

---

### TEST 9: Verify Token (Protected)

**Test ID:** AUTH-009  
**Name:** Verify JWT Token Validity  
**Objective:** Validate JWT token and return user information  
**Endpoint:** `GET /api/auth/verify`  
**Authentication:** Required (Bearer Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "userId": "67093f1e5c8d2a3b4c5d6e7f",
    "role": "admin",
    "username": "admin_ntc"
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** Token validated successfully, user data extracted from JWT payload

---








