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
  const queries = [
    "muốn quan tâm đến sách công nghệ",
    "tư vấn giúp tôi sách công nghệ",
    "sách liên quan đến công nghệ"
  ];

  for (const q of queries) {
    console.log(`\n============================`);
    console.log(`TEST QUERY: "${q}"`);
    console.log(`============================`);
    const res = await testQuery(q);
    console.log(`- activeModel:`, res.activeModel);
    console.log(`- text:`, res.text);
    console.log(`- thinking:`, res.thinking);
    console.log(`- cards count:`, res.cards?.length || 0);
    if (res.cards?.length) {
      console.log(`- card title:`, res.cards[0]?.data?.title, `| slug:`, res.cards[0]?.data?.slug);
    }
  }
}

main().catch(console.error);
