# Original User Request

## Parameters

[skip-interview]
How this run was launched; not part of the task.

## Initial Request — 2026-10-31T13:35:55Z

Nghiên cứu chi tiết nguyên nhân và trực tiếp chỉnh sửa mã nguồn, cấu hình để khắc phục triệt để các lỗi của các phân hệ AI trong đọc sách, AI tìm kiếm và voice chat. Đảm bảo hệ thống AI không còn gặp lỗi phản hồi, luôn trả lời đúng trọng tâm câu hỏi của người dùng, được grounding chuẩn xác trên dữ liệu có sẵn của hệ thống (cơ sở dữ liệu sách, kho tri thức Dify RAG, tài liệu nghiệp vụ), và xử lý tốt cả câu hỏi hội thoại thông thường lẫn câu hỏi chuyên sâu theo lĩnh vực để đưa vào vận hành thực tế.

Working directory: C:\Users\basduy05\Downloads\aurabook
Integrity mode: development

## Requirements

### R1. Điều tra nguyên nhân và khắc phục lỗi trực tiếp trên mã nguồn
Nghiên cứu chi tiết luồng xử lý và nguyên nhân gây lỗi, trả lời lạc đề ở cả 3 phân hệ: AI đọc sách, AI tìm kiếm và Voice chat. Trực tiếp chỉnh sửa mã nguồn, dịch vụ và cấu hình tương ứng trong dự án để giải quyết triệt để lỗi hoạt động và đảm bảo tính ổn định khi chạy thực tế.

### R2. Grounding câu trả lời dựa trên dữ liệu sẵn có của hệ thống
Cấu hình và tích hợp để các phản hồi của AI liên quan đến sách và nghiệp vụ bắt buộc phải trích xuất, tham chiếu chính xác từ dữ liệu thực tế hiện có trong hệ thống (bao gồm cơ sở dữ liệu sách, kho tri thức RAG trên Dify và các tài liệu nghiệp vụ có sẵn trong dự án), loại bỏ hiện tượng trả lời thiếu căn cứ hoặc bỏ qua dữ liệu nội bộ.

### R3. Năng lực phản hồi toàn diện cho cả câu hỏi thông thường và câu hỏi chuyên môn
Hệ thống AI phải trả lời đúng trọng tâm, tự nhiên và chính xác đối với cả hai nhóm câu hỏi:
- Câu hỏi giao tiếp thông thường (chào hỏi, trao đổi ngôn ngữ tự nhiên không yêu cầu dữ liệu chuyên sâu).
- Câu hỏi chuyên môn/nghiệp vụ gắn liền với lĩnh vực và dữ liệu thực tế của hệ thống.

### R4. Xây dựng bộ kịch bản kiểm thử đánh giá tự động (Automated Evaluation Test Suite)
Thiết lập bộ kịch bản kiểm thử tự động độc lập bao gồm tập dữ liệu câu hỏi kiểm thử đại diện cho cả câu hỏi thông thường và câu hỏi nghiệp vụ tra cứu dữ liệu hệ thống để đo lường và xác minh khách quan chất lượng phản hồi, độ bám sát dữ liệu và độ ổn định của cả 3 phân hệ AI.

## Acceptance Criteria

### Tính chính xác và Bám sát Dữ liệu (Grounding & Accuracy)
- [ ] 100% câu hỏi kiểm thử nghiệp vụ về sách, tác giả, nội dung và chính sách hệ thống được AI phản hồi chính xác và khớp với dữ liệu thực tế trong cơ sở dữ liệu / kho RAG của hệ thống, không sinh thông tin giả mạo (hallucination).
- [ ] 100% câu hỏi giao tiếp thông thường được phản hồi tự nhiên, lịch sự và đúng trọng tâm, không bị từ chối sai hoặc lạc đề.

### Khả năng vận hành và Độ ổn định (Production Reliability)
- [ ] Cả 3 phân hệ (AI đọc sách, AI tìm kiếm, Voice chat) hoàn thành toàn bộ chu trình truy vấn và phản hồi mà không phát sinh unhandled exception, crash hoặc timeout.
- [ ] Dịch vụ Voice chat xử lý luồng âm thanh/hội thoại thời gian thực trơn tru, kết nối thông suốt với dịch vụ RAG và phát âm thanh phản hồi đúng nội dung.

### Kiểm chứng tự động (Automated Verification)
- [ ] Script kiểm thử tự động (evaluation test suite) thực thi thành công toàn bộ kịch bản kiểm thử (test cases) cho cả 3 phân hệ AI và xuất báo cáo kết quả chi tiết với tỷ lệ đạt 100% tiêu chí đề ra.

## Follow-up — 2026-10-31T15:45:02Z

làm tiếp giúp tôi

Context từ phiên trước:
"Nghiên cứu chi tiết nguyên nhân và trực tiếp chỉnh sửa mã nguồn, cấu hình để khắc phục triệt để các lỗi của các phân hệ AI trong đọc sách, AI tìm kiếm và voice chat. Đảm bảo hệ thống AI không còn gặp lỗi phản hồi, luôn trả lời đúng trọng tâm câu hỏi của người dùng, được grounding chuẩn xác trên dữ liệu có sẵn của hệ thống (cơ sở dữ liệu sách, kho tri thức Dify RAG, tài liệu nghiệp vụ), và xử lý tốt cả câu hỏi hội thoại thông thường lẫn câu hỏi chuyên sâu theo lĩnh vực để đưa vào vận hành thực tế.
Working directory: C:\Users\basduy05\Downloads\aurabook"

Tiến độ đã đạt được:
- Milestone 1 (Data Grounding, GraphRAG, PostgreSQL pgvector & nạp 1.597 chunks sách) đã hoàn thành và đạt 100% kiểm thử đối kháng.
- Milestone 2 (AI Đọc Sách & Dify RAG, Intent-Adaptive Prompting, mở rộng context, loại bỏ nuốt lỗi) đã hoàn thành và đạt 100% (11/11 tests pass).
Nhiệm vụ cần tiếp tục:
- Triển khai Milestone 3 (AI Tìm kiếm & Unified Catalog Semantic Retrieval).
- Triển khai Milestone 4 (Voice Chat: STT, TTS, WebSocket, RAG grounding).
- Kiểm thử tổng thể E2E và đánh giá toàn diện.
