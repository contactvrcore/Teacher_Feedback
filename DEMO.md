# Demo Walkthrough

This guide simulates the entire flow of the NPS Widget.

## 1. Setup
Ensure you have the app running locally:
```bash
npm run dev
```

## 2. Generate Links
Run the script to generate links for a test user:
```bash
# Create a dummy CSV
echo "email,campaign\ntest@demo.com,demo-2025" > test_input.csv

# Generate links
npx ts-node scripts/generate_bulk_links.ts test_input.csv
```
Open `test_input_with_links.csv` and copy the URL for score "5" (column `link_5`).

## 3. Simulate Click
Paste the link into your browser.
- You should be redirected to `http://localhost:3000/thanks?score=5...`
- The page should say "Thank You!".

## 4. Verify Idempotency
Click the **same link again**.
- You should be redirected to `http://localhost:3000/thanks?used=true...`
- The page should say "Feedback Already Recorded".

## 5. Admin Metrics
Query the metrics API (replace KEY with your .env value):
```bash
curl -H "x-admin-api-key: admin-secret-key" http://localhost:3000/api/admin/metrics
```
You should see the count incremented.

## 6. Export CSV
Visit in browser:
`http://localhost:3000/api/admin/export?key=admin-secret-key&campaignId=demo-2025`
It should download a CSV with the recorded vote.

