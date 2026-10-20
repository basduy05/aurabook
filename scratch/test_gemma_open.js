const http = require("http");

async function testQuery(query) {
  const postData = JSON.stringify({
    query: query,
    customerName: "Duy",
    customerGender: "Anh",
    topic: "Tư vấn chọn sách & Sách bán chạy",
    model: "gemma2:2b",
    contactMethod: "chat",
  });

  return new Promise((resolve, reject) => {
    const req = http.request(
      "http://localhost:3000/api/ai/voice-agent/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 15000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            resolve({ raw, status: res.statusCode });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const q = "tôi muốn đọc một cuốn sách để truyền cảm hứng vào buổi tối";
  console.log(`\n============================`);
  console.log(`TEST OPEN QUERY WITH GEMMA: "${q}"`);
  console.log(`============================`);
  const res = await testQuery(q);
  console.log(`- activeModel:`, res.activeModel);
  console.log(`- text:`, res.text);
  console.log(`- thinking:`, res.thinking);
}

main().catch(console.error);
