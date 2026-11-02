import urllib.request, json

test_queries = [
    ("TC-T1-16", "Chính sách miễn phí vận chuyển của AuraBook như thế nào?"),
    ("TC-T1-17", "Sách giấy mua về bị lỗi thì có được đổi trả không và trong bao lâu?"),
    ("TC-T1-18", "Tôi đã mua ebook và mở đọc rồi thì có được hoàn tiền không?"),
    ("TC-T1-19", "Kho hàng AuraBook ở đâu và sách được gửi từ đâu?"),
    ("TC-T2-16", "Tra cứu đơn hàng mã vận đơn GHN99999999VN"),
    ("TC-T2-17", "Đơn hàng của tôi giá 499.000₫ gửi về Cầu Giấy Hà Nội có được miễn phí ship không?"),
    ("TC-T2-18", "Tôi đã nhận sách được 45 ngày rồi, giờ muốn đổi trả vì không thích có được không?"),
    ("TC-T3-03", "Cuốn sách Bốn Thỏa Ước có mấy chương và thỏa ước thứ nhất là gì?"),
    ("TC-T3-04", "Tôi mua đơn hàng sách giấy trị giá 600.000₫ gửi về Cầu Giấy Hà Nội thì cước vận chuyển là bao nhiêu?"),
    ("TC-T3-05", "Đơn hàng sách giấy 200.000₫ giao tại Hà Nội thì phí ship là bao nhiêu?"),
    ("TC-T4-02", "Sách Đắc Nhân Tâm tôi nhận được bị móp gáy bìa và rách góc do bưu tá giao, bên bạn giải quyết thế nào?"),
    ("TC-T4-03", "Tại sao tôi mở sách đọc trên máy tính thì màn hình báo 'Phiên đọc đang hoạt động ở thẻ khác' và không đọc được?"),
    ("TC-T4-05", "Nếu tôi mua 3 cuốn Sapiens sách giấy tổng cộng 567.000₫ thì có được miễn phí vận chuyển từ kho Hà Nội về Đà Nẵng không?"),
]

for tc_id, q in test_queries:
    req = urllib.request.Request(
        'http://localhost:3000/api/ai/voice-agent/chat',
        data=json.dumps({'query': q}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        print(f"[{tc_id}] Q: {q}")
        print(f"       A: {data.get('text', '')}")
        print(f"       Thinking: {data.get('thinking', '')}")
        print()
    except Exception as e:
        print(f"[{tc_id}] Error: {e}")
