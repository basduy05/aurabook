# Quy Chuẩn Điều Phối Hội Thoại & Bảo Vệ Trải Nghiệm Voice AI (Dialog Agent Guardrails)

Quy chuẩn này áp dụng cho toàn bộ các luồng hội thoại của Voice Agent Hoài My và các API tương tác thông minh tại AuraBook nhằm chống bẫy chào hàng máy móc, đảm bảo tính trung thực và chiều sâu kiến thức.

---

## 1. Nguyên Tắc Trả Lời Trực Tiếp (Q&A First Principle)
- Khi khách hàng đặt câu hỏi tra cứu kiến thức hoặc thông tin tác phẩm (số chương mục, tác giả, năm sáng tác, nhà xuất bản, tóm tắt nội dung, bài học, nguyên tắc, các thỏa ước):
  - **Mục tiêu số 1:** Trả lời TRỰC TIẾP, ĐẦY ĐỦ VÀ CHÍNH XÁC câu hỏi của khách hàng dựa trên dữ liệu thực tế từ Subgraph và Vector Chunks của GraphRAG.
  - **Cấm Tuyệt Đối:** Không đọc bài chào hàng đóng băng (canned sales pitch), không ép giới thiệu 2 phiên bản (Sách Điện Tử 59k / Sách Vật Lý 118k), không hỏi câu "Anh có muốn chọn phiên bản nào để em hỗ trợ không".
  - **Giao Diện Trực Quan (UI Decoupling):** Thẻ sản phẩm (`cards.push({ type: "product", data: book })`) vẫn được gửi về client để hiển thị trực quan trong khung chat, nhưng **tuyệt đối không để việc xuất hiện thẻ sản phẩm làm ô nhiễm hoặc chuyển hướng câu trả lời thoại của AI**.

---

## 2. Phân Tách Rõ Ràng Các Nhánh Ý Định (Intent Disambiguation)
1. **Factual & Content Q&A (`isFactualQuestion`):**
   - Nhận diện các câu hỏi cấu trúc (`bao nhiêu chương`, `mấy chương`, `các phần`), thông tin tác giả/NXB/năm, và nội dung tác phẩm.
   - Luôn nạp thông tin số chương, số từ, và các phần chính vào Context Summary.
   - Trả lời ngắn gọn 2-3 câu, đi thẳng vào trọng tâm, giữ phong thái Hoài My lễ phép ("Dạ... ạ").
2. **Ý Định Mua Hàng (`isPurchaseIntent`):**
   - Chỉ khi khách hàng chủ động nói muốn mua ("mua cuốn này", "cho tôi mua...", "thanh toán thế nào", "giá bao nhiêu"):
   - Tư vấn rõ 2 phiên bản chuẩn giá: Bản Sách Điện Tử (Ebook DRM Readium LCP) đọc ngay trên Web Reader và Bản Sách Vật Lý giao tận tay.
   - Hướng dẫn khách hàng nhấn nút "Thêm vào giỏ" ở thẻ sản phẩm trên giao diện.
3. **Tư Vấn Gợi Ý Đọc Sách (`isGeneralConsultation`):**
   - Khi khách hàng hỏi chung chung chưa rõ gu đọc: Chủ động hỏi nhu cầu, thể loại quan tâm trước khi đề xuất ấn phẩm cụ thể.

---

## 3. Quản Lý Ngữ Cảnh Tinh Gọn Cho Mô Hình Local (Prompt Optimization)
- Không nhồi nhét toàn bộ catalog sách vào prompt khi người dùng chỉ đang hỏi về 1 cuốn sách cụ thể.
- Chỉ nạp các thực thể và trích đoạn liên quan trực tiếp đến tác phẩm đang truy vấn (`[GRAPHRAG TRI THỨC SÁCH]`).
- Duy trì thời gian suy luận (inference time) của mô hình cục bộ dưới 3 giây trên CPU/GPU thông qua việc kiểm soát độ dài prompt dưới 500 tokens.

---

## 4. Cơ Chế Fallback Tri Thức Thực Tế (Zero Hallucination Fallback)
- Mọi câu hỏi Factual Q&A đều có fallback xác định (deterministic fallback) trích xuất trực tiếp từ siêu dữ liệu GraphRAG nếu mô hình ngôn ngữ cục bộ gặp sự cố hoặc timeout:
  - Số chương thực tế trích xuất từ cấu trúc EPUB.
  - Tên tác giả, NXB, năm phát hành từ Node properties.
  - Tuyệt đối không fallback sang bài văn mẫu chào hàng chung chung.
