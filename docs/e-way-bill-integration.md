# E-Way Bill Integration

## What is included
- Admin form for entering e-way bill data
- Backend API routes for:
  - generate
  - cancel
  - update vehicle number
  - extend validity
  - update Part B
  - fetch details
  - print/download
- Credential storage for portal username, password, GSTIN, and base URL

## Environment variables
Set these before using real portal calls:

- EWAY_BILL_API_BASE_URL
- EWAY_BILL_ENCRYPTION_KEY
- EWAY_BILL_ENCRYPTION_IV

Example:

```env
EWAY_BILL_API_BASE_URL=https://ewaybillgst.gov.in
EWAY_BILL_ENCRYPTION_KEY=replace-with-a-secure-32-byte-key
EWAY_BILL_ENCRYPTION_IV=replace-with-a-16-byte-iv
```

## How to use
1. Open the admin e-way bill page.
2. Enter the portal credentials and GSTIN under Portal Credentials.
3. Click Save Credentials.
4. Fill the e-way bill form and click Submit.

> The current implementation uses the portal endpoint shape expected for the e-way bill gateway and will send real requests once valid credentials and a reachable base URL are supplied.
