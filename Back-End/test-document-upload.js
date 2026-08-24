const axios = require('axios');
const FormData = require('form-data');

async function testDocumentUpload() {
  console.log("=== STARTING DOCUMENT UPLOAD TEST ===");
  const BASE_URL = 'http://localhost:8000';

  // Step 1: Login
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login/teacher`, {
      email: 'teacher@proctorx.com',
      password: 'teacher123'
    });
    token = loginRes.data.token;
  } catch (err) {
    console.error("FAILED to login:", err.response?.data || err.message);
    return;
  }

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Step 2: Upload mock PDF
  console.log("\n1. Uploading a valid PDF document to test indexing pipeline...");
  try {
    const form = new FormData();
    const mockPdfBuffer = Buffer.from("%PDF-1.4 ... binary content representing trees and graphs ...");
    form.append('file', mockPdfBuffer, {
      filename: 'sample_tree_guide.pdf',
      contentType: 'application/pdf'
    });

    const uploadRes = await client.post('/api/ai/documents/upload', form, {
      headers: form.getHeaders()
    });

    console.log("SUCCESS: Document uploaded and indexed successfully!");
    console.log("Response data:", uploadRes.data);
  } catch (err) {
    console.error("FAILED to upload document:", err.response?.data || err.message);
  }

  console.log("\n=== DOCUMENT UPLOAD TEST COMPLETED ===");
}

testDocumentUpload();
