# API Contract: Blood Inventory Management

Base Path: `/api/v1/bc/inventory`

---

## 1. Endpoints

### 1.1 List Inventory (BC-UC-12, BC-UC-17)
- **Method**: `GET /api/v1/bc/inventory`
- **Query Params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10)
  - `search` (string, optional, matches `bagCode`)
  - `bloodType` (string, optional)
  - `status` (string, optional)
  - `sort` (string, default: `expiryDate:asc`)
- **Response 200**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d5ec49f1b2c81184a7e123",
        "bagCode": "BB-2026-0451",
        "bloodType": "O+",
        "volumeMl": 350,
        "collectionDate": "2026-07-01T00:00:00.000Z",
        "expiryDate": "2026-08-12T00:00:00.000Z",
        "storageLocation": "Shelf A-2",
        "status": "Available"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    },
    "summary": {
      "totalBags": 45,
      "availableBags": 38,
      "totalVolumeMl": 14250,
      "nearExpiryCount": 4,
      "lowStockTypesCount": 2
    }
  }
  ```

### 1.2 Get Blood Bag Detail (BC-UC-13)
- **Method**: `GET /api/v1/bc/inventory/:bagId`
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d5ec49f1b2c81184a7e123",
      "bagCode": "BB-2026-0451",
      "bloodType": "O+",
      "volumeMl": 350,
      "collectionDate": "2026-07-01T00:00:00.000Z",
      "expiryDate": "2026-08-12T00:00:00.000Z",
      "storageLocation": "Shelf A-2",
      "shelfPosition": "A-2-4",
      "temperatureCelsius": 4,
      "status": "Available",
      "testResults": {
        "hiv": "Negative",
        "hbv": "Negative",
        "hcv": "Negative",
        "syphilis": "Negative",
        "verifiedAt": "2026-07-02T10:00:00.000Z"
      },
      "statusHistory": []
    }
  }
  ```

### 1.3 Update Status (BC-UC-13)
- **Method**: `PUT /api/v1/bc/inventory/:bagId/status`
- **Request Body**:
  ```json
  {
    "status": "Reserved",
    "reason": "Reserved for emergency surgery at Cho Ray Hospital"
  }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "message": "Status updated successfully",
    "data": { ... }
  }
  ```

### 1.4 Stock In Batch (BC-UC-14)
- **Method**: `POST /api/v1/bc/inventory/stock-in`
- **Request Body**:
  ```json
  {
    "entries": [
      {
        "bloodType": "O+",
        "volumeMl": 350,
        "collectionDate": "2026-07-27T00:00:00.000Z",
        "expiryDate": "2026-09-07T00:00:00.000Z",
        "storageLocation": "Donor Center Unit 1"
      }
    ]
  }
  ```
- **Response 201**:
  ```json
  {
    "success": true,
    "message": "Successfully stocked in 1 blood bag(s)",
    "data": [ ... ]
  }
  ```

### 1.5 Stock Out Batch (BC-UC-15)
- **Method**: `POST /api/v1/bc/inventory/stock-out`
- **Request Body**:
  ```json
  {
    "bagIds": ["60d5ec49f1b2c81184a7e123"],
    "reason": "Dispatch",
    "notes": "Dispatched to Emergency Department"
  }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "message": "Successfully stocked out 1 blood bag(s)",
    "updatedCount": 1
  }
  ```

### 1.6 Get Statistics (BC-UC-16)
- **Method**: `GET /api/v1/bc/inventory/statistics`
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "summaryCards": {
        "totalUnits": 120,
        "availableUnits": 98,
        "nearExpiryUnits": 6,
        "lowStockTypesCount": 1
      },
      "byBloodType": [
        { "bloodType": "O+", "totalUnits": 35, "volumeMl": 12250, "nearExpiry": 2, "status": "Sufficient" },
        { "bloodType": "AB-", "totalUnits": 2, "volumeMl": 700, "nearExpiry": 1, "status": "Critical" }
      ]
    }
  }
  ```
