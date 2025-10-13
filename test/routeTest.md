

```markdown
# Bus Tracking API - Route Management Module Test Report


| **Project**  Bus Tracking API - NTC Sri Lanka 
| **Module** | Route Management System |
| **Student ID** : COBSCCOMP241P-004
| **Course** | NB6007CEM - Web API Development |
| **Batch** | 24.1P |
| **Date** | October 12, 2025 |
| **Branch Tested** | test|
| **Test Environment** | Local Development |

## Technical Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js v20.14.0 |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT (JSON Web Tokens) |
| **Server Port** | 3000 |
| **Base URL** | http://localhost:3000 |
| **Testing Tool** | Postman |

---

## Test Endpoints Overview

| Category | Count |
|----------|-------|
| **Total Endpoints** | 6 |
| **Public Endpoints** | 3 (Get All, Get Single, Search) |
| **Protected Endpoints** | 3 (Create, Update, Delete) |

---

## Detailed Test Cases

### TEST 1: Create New Route (Protected - Admin/Operator)

**Test ID:** ROUTE-001  
**Name:** Create Gampola-Colombo Express Route  
**Objective:** Create a new inter-provincial route with all stops  
**Endpoint:** `POST /api/routes`  
**Authentication:** Required (Admin or Operator Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "routeId": "GMP-CMB-001",
  "name": "Gampola - Colombo Central Express",
  "origin": {
    "city": "Gampola",
    "terminal": "Gampola Bus Stand",
    "coordinates": {
      "lat": 7.1644,
      "lng": 80.5742
    }
  },
  "destination": {
    "city": "Colombo",
    "terminal": "Colombo Central Bus Stand",
    "coordinates": {
      "lat": 6.9271,
      "lng": 79.8612
    }
  },
  "distance": 116,
  "estimatedDuration": 250,
  "stops": [
    {
      "name": "Gampola",
      "coordinates": {
        "lat": 7.1644,
        "lng": 80.5742
      },
      "sequence": 1,
      "estimatedArrivalOffset": 0,
      "stopDuration": 5
    },
    {
      "name": "Weligalla",
      "coordinates": {
        "lat": 7.1450,
        "lng": 80.5600
      },
      "sequence": 2,
      "estimatedArrivalOffset": 15,
      "stopDuration": 3
    },
    {
      "name": "Gelioya",
      "coordinates": {
        "lat": 7.1300,
        "lng": 80.5500
      },
      "sequence": 3,
      "estimatedArrivalOffset": 25,
      "stopDuration": 3
    },
    {
      "name": "Peradeniya",
      "coordinates": {
        "lat": 7.2583,
        "lng": 80.5981
      },
      "sequence": 4,
      "estimatedArrivalOffset": 35,
      "stopDuration": 5
    },
    {
      "name": "Pilimathalawa",
      "coordinates": {
        "lat": 7.2800,
        "lng": 80.5400
      },
      "sequence": 5,
      "estimatedArrivalOffset": 50,
      "stopDuration": 3
    },
    {
      "name": "Kadugannawa",
      "coordinates": {
        "lat": 7.2500,
        "lng": 80.5200
      },
      "sequence": 6,
      "estimatedArrivalOffset": 70,
      "stopDuration": 5
    },
    {
      "name": "Mawanella",
      "coordinates": {
        "lat": 7.2544,
        "lng": 80.4436
      },
      "sequence": 7,
      "estimatedArrivalOffset": 90,
      "stopDuration": 5
    },
    {
      "name": "Kegalle",
      "coordinates": {
        "lat": 7.2523,
        "lng": 80.3436
      },
      "sequence": 8,
      "estimatedArrivalOffset": 110,
      "stopDuration": 10
    },
    {
      "name": "Warakapola",
      "coordinates": {
        "lat": 7.2275,
        "lng": 80.2006
      },
      "sequence": 9,
      "estimatedArrivalOffset": 130,
      "stopDuration": 5
    },
    {
      "name": "Nittambuwa",
      "coordinates": {
        "lat": 7.1400,
        "lng": 80.0900
      },
      "sequence": 10,
      "estimatedArrivalOffset": 150,
      "stopDuration": 5
    },
    {
      "name": "Yakkala",
      "coordinates": {
        "lat": 7.0800,
        "lng": 80.0350
      },
      "sequence": 11,
      "estimatedArrivalOffset": 170,
      "stopDuration": 3
    },
    {
      "name": "Kadawatha",
      "coordinates": {
        "lat": 7.0008,
        "lng": 79.9533
      },
      "sequence": 12,
      "estimatedArrivalOffset": 185,
      "stopDuration": 5
    },
    {
      "name": "Kiribathgoda",
      "coordinates": {
        "lat": 6.9800,
        "lng": 79.9300
      },
      "sequence": 13,
      "estimatedArrivalOffset": 200,
      "stopDuration": 5
    },
    {
      "name": "Kelaniya",
      "coordinates": {
        "lat": 6.9553,
        "lng": 79.9219
      },
      "sequence": 14,
      "estimatedArrivalOffset": 215,
      "stopDuration": 5
    },
    {
      "name": "Peliyagoda",
      "coordinates": {
        "lat": 6.9686,
        "lng": 79.8836
      },
      "sequence": 15,
      "estimatedArrivalOffset": 230,
      "stopDuration": 3
    },
    {
      "name": "Colombo Central Bus Stand",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      },
      "sequence": 16,
      "estimatedArrivalOffset": 250,
      "stopDuration": 0
    }
  ],
  "fare": {
    "normal": 180,
    "semiExpress": 220,
    "express": 260,
    "luxury": 320
  },
  "frequency": "Every 45 minutes",
  "category": "inter-provincial",
  "operatingHours": {
    "start": "04:30",
    "end": "21:30"
  },
  "status": "operational"
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "_id": "67093f1e5c8d2a3b4c5d6e8a",
    "routeId": "GMP-CMB-001",
    "name": "Gampola - Colombo Central Express",
    "origin": {
      "city": "Gampola",
      "terminal": "Gampola Bus Stand",
      "coordinates": {
        "lat": 7.1644,
        "lng": 80.5742
      }
    },
    "destination": {
      "city": "Colombo",
      "terminal": "Colombo Central Bus Stand",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "distance": 116,
    "estimatedDuration": 250,
    "stops": [...],
    "fare": {
      "normal": 180,
      "semiExpress": 220,
      "express": 260,
      "luxury": 320
    },
    "frequency": "Every 45 minutes",
    "category": "inter-provincial",
    "status": "operational",
    "isActive": true,
    "createdAt": "2025-10-11T12:00:00.000Z",
    "direction": "Gampola → Colombo"
  }
}
```

**Actual Response:** `201 Created`  
**Result:** ✅ **PASSED**  
**Notes:** 
- Route created successfully with 16 stops
- All stop sequences validated correctly
- Fare structure for all bus types configured
- Operating hours set for early morning to night service

---

### TEST 2: Get All Routes (Public)

**Test ID:** ROUTE-002  
**Name:** Retrieve All Routes  
**Objective:** Get list of all available routes  
**Endpoint:** `GET /api/routes`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67093f1e5c8d2a3b4c5d6e8a",
      "routeId": "GMP-CMB-001",
      "name": "Gampola - Colombo Central Express",
      "origin": {
        "city": "Gampola",
        "terminal": "Gampola Bus Stand"
      },
      "destination": {
        "city": "Colombo",
        "terminal": "Colombo Central Bus Stand"
      },
      "distance": 116,
      "estimatedDuration": 250,
      "fare": {
        "normal": 180,
        "semiExpress": 220,
        "express": 260,
        "luxury": 320
      },
      "frequency": "Every 45 minutes",
      "status": "operational",
      "category": "inter-provincial",
      "direction": "Gampola → Colombo"
    }
  ]
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** 
- All routes retrieved successfully
- Public access working (no token required)
- Response includes essential route information
- Virtual field 'direction' populated correctly

---

### TEST 3: Get Single Route by Route ID (Public)

**Test ID:** ROUTE-003  
**Name:** Get Route by Route ID  
**Objective:** Retrieve specific route details including all stops  
**Endpoint:** `GET /api/routes/route/GMP-CMB-001`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "67093f1e5c8d2a3b4c5d6e8a",
    "routeId": "GMP-CMB-001",
    "name": "Gampola - Colombo Central Express",
    "origin": {
      "city": "Gampola",
      "terminal": "Gampola Bus Stand",
      "coordinates": {
        "lat": 7.1644,
        "lng": 80.5742
      }
    },
    "destination": {
      "city": "Colombo",
      "terminal": "Colombo Central Bus Stand",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "distance": 116,
    "estimatedDuration": 250,
    "stops": [
      {
        "name": "Gampola",
        "coordinates": { "lat": 7.1644, "lng": 80.5742 },
        "sequence": 1,
        "estimatedArrivalOffset": 0,
        "stopDuration": 5
      },
      {
        "name": "Weligalla",
        "coordinates": { "lat": 7.1450, "lng": 80.5600 },
        "sequence": 2,
        "estimatedArrivalOffset": 15,
        "stopDuration": 3
      },
      ... (all 16 stops)
    ],
    "fare": {
      "normal": 180,
      "semiExpress": 220,
      "express": 260,
      "luxury": 320
    },
    "frequency": "Every 45 minutes",
    "category": "inter-provincial",
    "operatingHours": {
      "start": "04:30",
      "end": "21:30"
    },
    "status": "operational",
    "isActive": true,
    "direction": "Gampola → Colombo"
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** 
- Route retrieved successfully by routeId
- All 16 stops returned with complete details
- Fare structure for all bus types included
- Operating hours displayed correctly

---

### TEST 4: Search Routes by Origin and Destination (Public)

**Test ID:** ROUTE-004  
**Name:** Search Routes  
**Objective:** Find routes between two cities  
**Endpoint:** `GET /api/routes/search?origin=Gampola&destination=Colombo`  
**Authentication:** None Required (Public)

**Request Headers:**
```
Content-Type: application/json
```

**Query Parameters:**
```
origin=Gampola
destination=Colombo
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67093f1e5c8d2a3b4c5d6e8a",
      "routeId": "GMP-CMB-001",
      "name": "Gampola - Colombo Central Express",
      "origin": {
        "city": "Gampola",
        "terminal": "Gampola Bus Stand"
      },
      "destination": {
        "city": "Colombo",
        "terminal": "Colombo Central Bus Stand"
      },
      "distance": 116,
      "estimatedDuration": 250,
      "fare": {
        "normal": 180,
        "semiExpress": 220,
        "express": 260,
        "luxury": 320
      },
      "frequency": "Every 45 minutes",
      "status": "operational"
    }
  ]
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** 
- Search functionality working correctly
- Case-insensitive search implemented
- Found 1 route matching criteria
- Useful for passenger route planning

---

### TEST 5: Update Route (Protected - Admin/Operator)

**Test ID:** ROUTE-005  
**Name:** Update Route Details  
**Objective:** Update route information (duration and ID)  
**Endpoint:** `PUT /api/routes/route/GMP-CMB-001`  
**Authentication:** Required (Admin or Operator Token)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "routeId": "GMP-CMB-019",
  "estimatedDuration": 240
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Route updated successfully",
  "data": {
    "_id": "67093f1e5c8d2a3b4c5d6e8a",
    "routeId": "GMP-CMB-019",
    "name": "Gampola - Colombo Central Express",
    "origin": {
      "city": "Gampola",
      "terminal": "Gampola Bus Stand"
    },
    "destination": {
      "city": "Colombo",
      "terminal": "Colombo Central Bus Stand"
    },
    "distance": 116,
    "estimatedDuration": 240,
    "fare": {
      "normal": 180,
      "semiExpress": 220,
      "express": 260,
      "luxury": 320
    },
    "frequency": "Every 45 minutes",
    "updatedAt": "2025-10-11T12:30:00.000Z"
  }
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** 
- Route ID updated from GMP-CMB-001 to GMP-CMB-019
- Estimated duration reduced from 250 to 240 minutes
- Other route details preserved
- Update timestamp recorded

---

### TEST 6: Delete Route (Protected - Admin Only)

**Test ID:** ROUTE-006  
**Name:** Delete Route  
**Objective:** Remove route from system  
**Endpoint:** `DELETE /api/routes/route/GMP-CMB-019`  
**Authentication:** Required (Admin Token Only)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {{admin_token}}
```

**Request Body:** None

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

**Actual Response:** `200 OK`  
**Result:** ✅ **PASSED**  
**Notes:** 
- Route deleted successfully
- Admin-only access enforced
- Route no longer appears in get all routes

---




