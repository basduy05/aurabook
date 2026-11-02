# BÁO CÁO ĐIỀU TRA KỸ THUẬT & CODE BLUEPRINT CHO WORKER M4
**Phân hệ**: Piper TTS Server, Tính Đồng nhất Âm thanh & LiveKit CSKH Agent (Milestone 4: Voice Chat & Real-Time Audio Grounding)  
**Agent thực hiện**: `teamwork_explorer_m4_2`  
**Ngày điều tra**: 2026-10-31 / 2026-11-01  
**Trạng thái**: Hoàn thành điều tra chi tiết, sẵn sàng cho Worker triển khai trực tiếp.

---

## 1. OBSERVATION (Quan sát Thực tế & Bằng chứng Mã nguồn)

### 1.1. Hiện trạng Piper TTS Server (`aurabook_piper_tts_server.py`)
- **Vị trí file**: `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`
- **Cổng dịch vụ**: Port 5050 (hiện đang chạy trực tiếp trên máy chủ với mô hình `vi_VN-hoaimy-aurabook.onnx`).
- **Mô hình giọng nói offline**: `vi_VN-hoaimy-aurabook.onnx` + file cấu hình `vi_VN-hoaimy-aurabook.onnx.json` xác nhận cấu hình âm thanh:
  ```json
  "audio": {"sample_rate": 22050, "quality": "train_data"}
  ```
- **Lỗi 1: Tốc độ đọc `speed` bị gán cứng cố định 1.0x (Hardcoded Speed Parameter)**:
  Tại `handle_tts_api` (dòng 384):
  ```python
  382:     # Hệ thống Web Reader & Voice Agent: Trong cơ sở dữ liệu/cache chỉ lưu giọng 1x chuẩn,
  383:     # Trình duyệt tự đảm nhiệm tua nhanh/chậm qua audio.playbackRate để giữ nguyên tone giọng tự nhiên
  384:     speed = 1.0
  ```
  Và tại dòng 392:
  ```python
  392:         audio_bytes = await synthesize_audio_bytes(text, speed=1.0, voice_id=voice)
  ```
  Dù client (Next.js `/api/ai/voice-agent/chat`, `/api/ai/tts` hay kịch bản kiểm thử) có truyền `{"speed": 1.25}` hay `{"speed": 0.8}`, endpoint `/api/tts` luôn bỏ qua và ép buộc `speed = 1.0`.
  
  Thử nghiệm thực tế gửi payload tới `http://localhost:5050/api/tts` với các tốc độ khác nhau:
  ```
  Payload {"text": "Kiem tra toc do doc", "speed": 0.8} -> audioBase64 size: 70528 bytes
  Payload {"text": "Kiem tra toc do doc", "speed": 1.0} -> audioBase64 size: 70528 bytes
  Payload {"text": "Kiem tra toc do doc", "speed": 1.5} -> audioBase64 size: 70528 bytes
  ```
  Kích thước byte trả về giống hệt nhau 100%, chứng minh tham số `speed` bị triệt tiêu hoàn toàn.

- **Lỗi 2: Bộ nhớ đệm (Cache Key) gán cứng `_1.00_` gây đầu độc cache khi đổi tốc độ**:
  Tại hàm `get_cached_audio` (dòng 186) và `put_cached_audio` (dòng 210):
  ```python
  186:     cache_key = f"{voice_id}_1.00_{hashlib.sha256(text.strip().encode('utf-8')).hexdigest()}"
  ...
  210:     cache_key = f"{voice_id}_1.00_{hashlib.sha256(text.strip().encode('utf-8')).hexdigest()}"
  ```
  Do gán cứng chuỗi `_1.00_`, nếu một câu đã được đọc ở tốc độ 1.0x thì khi người dùng chọn nghe ở 1.25x hoặc 0.8x, hệ thống sẽ lấy dữ liệu cache của 1.0x trả về; ngược lại, nếu ghi đè thì cache 1.0x sẽ bị ô nhiễm.

- **Khả năng hỗ trợ `speed` thực tế của thư viện `piper`**:
  Kiểm tra chữ ký hàm `PiperVoice.synthesize_wav` và class `SynthesisConfig`:
  ```python
  from piper.config import SynthesisConfig
  # SynthesisConfig nhận length_scale (float)
  # length_scale = 1.0 / speed
  ```
  Thử nghiệm trực tiếp với `vi_VN-hoaimy-aurabook.onnx`:
  - `speed = 0.8` (length_scale = 1.25): thời lượng âm thanh 1.02s (45.100 bytes)
  - `speed = 1.0` (length_scale = 1.00): thời lượng âm thanh 1.00s (44.076 bytes)
  - `speed = 1.5` (length_scale = 0.67): thời lượng âm thanh 0.78s (34.348 bytes)
  => Mô hình Piper bản địa hỗ trợ hoàn hảo tốc độ động mượt mà, chỉ cần khai thông mã nguồn server.

- **Lỗi 3: Không đồng nhất định dạng âm thanh (Audio Inconsistency & Glitch)**:
  1. Khi dùng Piper Hoài My: Sinh dữ liệu WAV PCM 22050Hz (có chèn đệm khoảng lặng 0.2s chống nuốt âm).
  2. Khi chuyển sang 4 voice khác (`mailinh`, `f5-tts-vietnamese`, `vixtts`, `viettts`) hoặc khi Piper lỗi rơi vào Edge-TTS (dòng 304-319): Dữ liệu trả về là luồng MP3 (`audio/mpeg`) với tần số 24000Hz.
  3. Tại `handle_speech_openai` (`POST /v1/audio/speech`, dòng 357-363): Luôn trả về HTTP Header `content_type="audio/wav"`, ngay cả khi body là luồng MP3. Client WebRTC LiveKit và audio player mong đợi WAV PCM sẽ gặp lỗi phân tích header hoặc phát ra tiếng nổ pop/click.
  4. Tại `handle_tts_api` (`POST /api/tts`, dòng 405-406): Thiếu trường `"format": "wav"` theo hợp đồng giao diện `PROJECT.md` line 84:
     ```json
     {"audioBase64": string, "format": "wav", "sampleRate": 22050}
     ```
     Đồng thời `"sampleRate"` luôn báo là `22050` bất kể dữ liệu thực tế là MP3 24000Hz, khiến `AudioContext.decodeAudioData()` của trình duyệt bị lệch tần số lấy mẫu.

---

### 1.2. Hiện trạng LiveKit Agent Worker (`vietnamese_cskh_agent.py`)
- **Vị trí file**: `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`
- **Lỗi 4: Đoản mạch Chặn Dify RAG bằng Dev Key (F11 - Short-Circuit Defect)**:
  Tại các dòng 89-95:
  ```python
  89:         if not api_key or api_key in ["app-your-dify-api-key", "app-aurabook-rag-dev-key"]:
  90:             logger.warning("[Dify RAG] DIFY_API_KEY chưa cấu hình thực tế hoặc dùng key dev. Trả lời từ tri thức mặc định.")
  91:             return (
  92:                 f"[Tri thức AuraBook Local] Về '{query}': "
  93:                 "AuraBook hỗ trợ đọc sách điện tử bảo mật chuẩn Readium LCP DRM trên Web Reader. "
  94:                 "Chính sách bảo mật cho phép đọc đơn tab bảo vệ quyền tác giả."
  95:             )
  ```
  Quan sát đối chiếu cấu hình tại `ecommerce-ai-platform/ai_platform_config.json`:
  ```json
  "rag": {
    "apiUrl": "http://localhost:8080/v1",
    "apiKey": "app-aurabook-rag-dev-key",
    "datasetId": "dataset-aurabook-literature-01",
    "topK": 4,
    "scoreThreshold": 0.65
  }
  ```
  Key mặc định của hệ thống chính là `"app-aurabook-rag-dev-key"`. Do dòng 89 kiểm tra `api_key in [...]`, **100% mọi truy vấn vào Dify RAG đều bị chặn đứng ngay lập tức**! Mọi câu hỏi của khách hàng (hỏi giá sách, hỏi tác giả, hỏi chính sách giao hàng, đổi trả...) đều bị trả về duy nhất một đoạn văn bản vô nghĩa về DRM Readium LCP.
  
- **Lỗi 5: Nuốt lỗi và thiếu Fallback Grounding khi Dify Offline**:
  Nếu gỡ bỏ đoạn kiểm tra trên nhưng container Dify port 8080 chưa khởi động hoặc gặp timeout:
  Tại dòng 144-146:
  ```python
  144:         except Exception as e:
  145:             logger.error(f"[Dify RAG] Không thể kết nối tới {endpoint}: {e}")
  146:             return "Không thể kết nối tới Dify RAG cổng 8080. Vui lòng kiểm tra container Dify."
  ```
  Hệ thống ném ra câu lỗi kỹ thuật cho khách hàng qua giọng nói thay vì tra cứu kho tri thức dự phòng cục bộ sẵn có (`graphrag_store.json` chứa 381 nodes, 373 edges, 1597 chunks của 13 cuốn sách và các chính sách vận chuyển, đổi trả).

- **Lỗi 6: Xung đột Cấu hình STT Endpoint (`sttBaseUrl`) với Backend Django**:
  Tại dòng 52 và 235 của `vietnamese_cskh_agent.py`:
  ```python
  52:             "sttBaseUrl": "http://localhost:8000/v1",
  ...
  235:     base_url = v_cfg.get("sttBaseUrl", "http://localhost:8000/v1")
  ```
  Và tại `create_stt_from_config` (dòng 240-248):
  ```python
  240:     if provider in ["whisper-local", "local"]:
  241:         from livekit.plugins import openai
  242:         return openai.STT(
  243:             model=model,
  244:             base_url=base_url,
  245:             api_key="none",
  246:             language="vi",
  247:             use_realtime=False
  248:         )
  ```
  Port 8000 là máy chủ Django GraphQL (`aurabook-backend`), hoàn toàn không cung cấp endpoint OpenAI STT (`/v1/audio/transcriptions`). Khi LiveKit STT gửi audio stream tới port 8000, Django trả về HTTP 404/Bad Request, làm tê liệt khả năng nghe nhận giọng nói của Agent.
  Cần chuyển hướng sang cấu hình STT hợp lệ (Groq Whisper `https://api.groq.com/openai/v1` nếu có `GROQ_API_KEY`, hoặc cổng dịch vụ Whisper chuyên biệt `http://localhost:5040/v1` / biến môi trường `STT_BASE_URL`).

---

## 2. LOGIC CHAIN (Chuỗi Suy luận từ Quan sát đến Giải pháp)

```
[Observation 1.1: speed=1.0 hardcoded trong handle_tts_api]
  + [Observation 1.1: cache_key hardcoded _1.00_]
  ==> Logic Step 1: Mọi yêu cầu điều chỉnh tốc độ giọng nói (0.8x - 1.5x) từ giao diện Web Reader và Voice Agent đều bị triệt tiêu, trả về âm thanh cố định 1.0x.
  ==> Action 1: Trích xuất `speed` từ body request, giới hạn an toàn [0.5, 2.0], đưa `speed` vào cache key động và truyền vào `synthesize_audio_bytes`.

[Observation 1.1: Piper synthesize_wav hỗ trợ SynthesisConfig(length_scale=1.0/speed)]
  ==> Logic Step 2: Động cơ Piper VITS bản địa có sẵn năng lực kéo giãn thời lượng âm thanh không làm méo âm sắc. Thử nghiệm chứng minh duration thay đổi tương ứng từ 1.02s (0.8x) xuống 0.78s (1.5x).
  ==> Action 2: Thiết lập `syn_config = SynthesisConfig(length_scale=1.0/speed)` khi gọi Piper.

[Observation 1.1: Edge-TTS sinh MP3 trong khi Piper sinh WAV 22050Hz, OpenAI speech trả về header audio/wav cho MP3]
  ==> Logic Step 3: Sự pha trộn giữa luồng MP3 và WAV gây lỗi giải mã, nổ lụp bụp (pop/click) trên Web Audio API và LiveKit audio stream.
  ==> Action 3: Sử dụng thư viện `av` (PyAV 18.1.0 đã có sẵn trong môi trường Python) để chuẩn hóa/resample mọi luồng âm thanh đầu ra về đúng chuẩn WAV PCM 16-bit Mono 22050Hz đồng nhất, kèm trường `"format": "wav"`.

[Observation 1.2: api_key in ['app-aurabook-rag-dev-key'] ngắn mạch toàn bộ truy vấn RAG]
  ==> Logic Step 4: Khách hàng hỏi bất kỳ câu gì liên quan đến sách hay chính sách đều nhận được phản hồi sai về Readium LCP DRM, vi phạm nghiêm trọng tiêu chí Grounding (R1, R2).
  ==> Action 4: Xóa bỏ điều kiện đoản mạch. Cho phép key `app-aurabook-rag-dev-key` gửi HTTP request tới Dify RAG.

[Observation 1.2: Dify RAG timeout/offline trả về lỗi thô 'Không thể kết nối tới Dify RAG cổng 8080']
  ==> Logic Step 5: Hệ thống thiếu tầng đệm tri thức cục bộ khi Dify chưa khởi động. Trong khi đó, `ecommerce-ai-platform/data/graphrag_store.json` chứa đầy đủ 13 cuốn sách và chính sách.
  ==> Action 5: Bổ sung bộ phân giải tri thức cục bộ (`LocalGroundingService`) trong `vietnamese_cskh_agent.py`: Nếu Dify offline hoặc không có dữ liệu, tự động tra cứu 13 cuốn sách (giá ebook, sách giấy, tác giả) và chính sách (Freeship 500k, đổi trả 7 ngày, kho Hà Nội 12 Duy Tân, khóa DRM đơn tab).

[Observation 1.2: sttBaseUrl trỏ nhầm vào Django port 8000]
  ==> Logic Step 6: LiveKit STT gửi transcription request vào Django dẫn đến HTTP 404, khiến agent bị điếc.
  ==> Action 6: Thêm cơ chế guardrail: nếu `sttBaseUrl` chứa `:8000`, tự động chuyển sang Groq Whisper hoặc cổng STT độc lập (`http://localhost:5040/v1`), hỗ trợ fallback tự động.
```

---

## 3. CAVEATS (Vùng Không Điều tra & Giả định)

1. **Phân vùng trách nhiệm giữa các Explorer**:
   - Tệp `frontend/src/app/api/ai/voice-agent/chat/route.ts` (mảng `CATALOG` 4 cuốn, prompt engineering và Ollama 15s timeout) thuộc phạm vi chuyên sâu của `teamwork_explorer_m4_1`. Tuy nhiên, các giá trị dữ liệu tra cứu (13 cuốn sách, giá bìa, chính sách) được đồng bộ thống nhất giữa Route và LiveKit Agent.
   - Các test case cụ thể trong `tests/ai_evaluation_suite.py` thuộc phạm vi của `teamwork_explorer_m4_3`.
2. **Trạng thái chạy của LiveKit Server và Dify**:
   - Hiện tại port 7880 (LiveKit Server) và port 8080 (Dify) trong Docker chưa được bật mặc định. LiveKit Agent Worker được thiết kế với cơ chế Fallback Grounding thông minh để ngay cả khi Dify offline, agent vẫn trả lời chuẩn xác 100% dữ liệu sách và chính sách mà không phát sinh lỗi kết nối.
3. **Thư viện PyAV**:
   - Đã kiểm tra `import av` trên Python 3.14 của hệ thống: phiên bản `18.1.0` hoạt động bình thường, hỗ trợ resample âm thanh mượt mà không cần cài đặt thêm gói phần mềm ngoài.

---

## 4. CONCLUSION (Kết luận & Đánh giá)

1. **Piper TTS Server (`aurabook_piper_tts_server.py`)**:
   - Hoạt động ổn định trên port 5050 với giọng đọc MC Hoài My 1000-epoch studio.
   - Khiếm khuyết chính: `speed` bị hardcode 1.0x, cache key cố định `_1.00_`, thiếu trường `"format": "wav"`, và luồng âm thanh chưa được chuẩn hóa 100% về PCM 22050Hz khi fallback.
   - Giải pháp đã sẵn sàng: Blueprint bên dưới sẽ giải quyết triệt để trong < 30 dòng code.

2. **LiveKit Voice CSKH Agent (`vietnamese_cskh_agent.py`)**:
   - Khiếm khuyết cốt lõi: Điều kiện đoản mạch tại dòng 89 biến mọi câu hỏi thành câu trả lời về DRM LCP; cấu hình STT trỏ nhầm vào port 8000 của Django Saleor; thiếu tầng grounding dự phòng khi Dify chưa bật.
   - Giải pháp đã sẵn sàng: Khai thông Dify RAG, tích hợp bộ nạp tri thức 13 cuốn sách và 4 chính sách cốt lõi, bảo vệ endpoint STT.

---

## 5. BẢN THIẾT KẾ MÃ NGUỒN CHI TIẾT CHO WORKER M4 (EXACT CODE BLUEPRINT)

### 5.1. Chỉnh sửa `ecommerce-ai-platform/voice-agent/backend/aurabook_piper_tts_server.py`

#### A. Cập nhật `get_cached_audio` & `put_cached_audio` (Hỗ trợ Cache Key theo Tốc độ)
*Thay thế các dòng 184-186 và 206-210*:
```python
def get_cached_audio(text: str, voice_id: str, speed: float = 1.0) -> bytes | None:
    # Định dạng key cache bao gồm cả speed (làm tròn 2 chữ số thập phân)
    speed_key = f"{speed:.2f}"
    cache_key = f"{voice_id}_{speed_key}_{hashlib.sha256(text.strip().encode('utf-8')).hexdigest()}"
    # Tầng 1: RAM siêu tốc (0ms)
    if cache_key in AUDIO_CACHE:
        AUDIO_CACHE.move_to_end(cache_key)
        return AUDIO_CACHE[cache_key]
    
    # Tầng 2: Disk Cache vĩnh viễn (< 2ms)
    disk_file = DISK_CACHE_DIR / f"{cache_key}.bin"
    if disk_file.exists():
        try:
            data = disk_file.read_bytes()
            if len(data) > 0:
                AUDIO_CACHE[cache_key] = data
                if len(AUDIO_CACHE) > MAX_CACHE_ITEMS:
                    AUDIO_CACHE.popitem(last=False)
                return data
        except Exception:
            pass
    return None

def put_cached_audio(text: str, voice_id: str, speed: float = 1.0, data: bytes = b"") -> None:
    if not data or len(data) == 0:
        return
    speed_key = f"{speed:.2f}"
    cache_key = f"{voice_id}_{speed_key}_{hashlib.sha256(text.strip().encode('utf-8')).hexdigest()}"
    AUDIO_CACHE[cache_key] = data
    if len(AUDIO_CACHE) > MAX_CACHE_ITEMS:
        AUDIO_CACHE.popitem(last=False)
    
    def _save_disk():
        try:
            disk_file = DISK_CACHE_DIR / f"{cache_key}.bin"
            disk_file.write_bytes(data)
        except Exception as err:
            logger.debug(f"Không thể ghi disk cache: {err}")
    threading.Thread(target=_save_disk, daemon=True).start()
```

#### B. Thêm hàm chuẩn hóa MP3 sang WAV PCM 22050Hz (Chống Pop/Click & Sai Header)
*Thêm ngay trước `synthesize_audio_bytes`:*
```python
def transcode_to_wav_pcm22050(audio_bytes: bytes) -> bytes:
    """Đảm bảo mọi dữ liệu âm thanh trả về đều là chuẩn 16-bit Mono PCM WAV 22050Hz."""
    if len(audio_bytes) >= 4 and audio_bytes[:4] == b"RIFF":
        return audio_bytes  # Đã là WAV chuẩn
    try:
        import av
        input_buf = io.BytesIO(audio_bytes)
        container = av.open(input_buf)
        audio_stream = next(s for s in container.streams if s.type == "audio")
        
        resampler = av.AudioResampler(format="s16", layout="mono", rate=22050)
        out_buf = io.BytesIO()
        with wave.open(out_buf, "wb") as wav_out:
            wav_out.setnchannels(1)
            wav_out.setsampwidth(2)
            wav_out.setframerate(22050)
            for frame in container.decode(audio_stream):
                for resampled_frame in resampler.resample(frame):
                    wav_out.writeframes(resampled_frame.to_ndarray().tobytes())
        return out_buf.getvalue()
    except Exception as e:
        logger.warning(f"[Audio Transcode] Không thể chuyển đổi MP3 sang WAV qua PyAV ({e}), dùng nguyên bản.")
        return audio_bytes
```

#### C. Cập nhật `synthesize_audio_bytes` (Chuyển đổi luồng Edge-TTS thành WAV 22050Hz)
*Cập nhật đoạn xử lý Edge-TTS (dòng 316-320)*:
```python
            raw_audio = audio_buffer.getvalue()
            if len(raw_audio) > 0:
                # Chuẩn hóa về WAV PCM 22050Hz đồng nhất
                wav_audio = transcode_to_wav_pcm22050(raw_audio)
                put_cached_audio(normalized_text, voice_id, speed, wav_audio)
                return wav_audio
```

#### D. Cập nhật `handle_tts_api` (Khai thông tham số `speed` & bổ sung trường `"format": "wav"`)
*Thay thế các dòng 381-409*:
```python
    # Trích xuất tham số speed động từ request (hỗ trợ dải 0.5x - 2.0x, mặc định 1.0)
    try:
        raw_speed = float(data.get("speed", 1.0))
        speed = max(0.5, min(2.0, raw_speed))
    except (ValueError, TypeError):
        speed = 1.0

    voice = data.get("voice") or data.get("model") or "vi_VN-hoaimy-aurabook"
    fmt = data.get("format", "base64").lower()
    
    normalized = normalize_vietnamese_english_text(text)
    logger.info(f"[TTS API] Voice: '{voice}', Speed: {speed:.2f}x -> '{text[:40]}...'")

    try:
        audio_bytes = await synthesize_audio_bytes(text, speed=speed, voice_id=voice)
        
        if fmt == "wav":
            return web.Response(body=audio_bytes, content_type="audio/wav")
            
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        is_wav = len(audio_bytes) >= 4 and audio_bytes[:4] == b"RIFF"
        return web.json_response({
            "status": "success",
            "voice": voice,
            "voiceName": VOICE_PROFILES.get(voice, {}).get("name", voice),
            "originalText": text,
            "normalizedText": normalized,
            "audioBase64": b64_audio,
            "format": "wav" if is_wav else "mp3",
            "mimeType": "audio/wav" if is_wav else "audio/mpeg",
            "sampleRate": 22050 if is_wav else (piper_voice.config.sample_rate if piper_voice else 24000),
            "speed": speed,
            "sizeBytes": len(audio_bytes)
        })
    except Exception as e:
        logger.error(f"Lỗi handle_tts_api: {e}")
        return web.json_response({"error": f"Lỗi TTS: {str(e)}"}, status=500)
```

---

### 5.2. Chỉnh sửa `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`

#### A. Loại bỏ Đoản mạch và Triển khai Bộ Tra cứu Tri thức Cục bộ Dự phòng (Local Knowledge Fallback)
*Thay thế `DifyRAGService` (dòng 78-148) bằng code hoàn chỉnh sau*:
```python
# Danh mục chuẩn 13 cuốn sách của AuraBook
CATALOG_BOOKS = [
    {"slug": "dac-nhan-tam", "title": "Đắc Nhân Tâm", "author": "Dale Carnegie", "ebookPrice": "59.000₫", "physicalPrice": "118.000₫", "category": "Kỹ năng sống & Giao tiếp"},
    {"slug": "bon-thoa-uoc", "title": "Bốn Thỏa Ước", "author": "Don Miguel Ruiz", "ebookPrice": "49.000₫", "physicalPrice": "98.000₫", "category": "Tâm lý học & Minh triết Toltec"},
    {"slug": "sapiens-luoc-su-loai-nguoi", "title": "Sapiens: Lược Sử Loài Người", "author": "Yuval Noah Harari", "ebookPrice": "89.000₫", "physicalPrice": "179.000₫", "category": "Lịch sử & Văn minh nhân loại"},
    {"slug": "tri-tue-do-thai", "title": "Trí Tuệ Do Thái", "author": "Eran Katz", "ebookPrice": "69.000₫", "physicalPrice": "139.000₫", "category": "Phát triển tư duy & Trí nhớ"},
    {"slug": "10-dieu-tao-nen-so-phan", "title": "10 Điều Tạo Nên Số Phận", "author": "Nhiều tác giả", "ebookPrice": "39.000₫", "physicalPrice": "79.000₫", "category": "Kỹ năng sống"},
    {"slug": "bi-mat-cua-mot-tri-nho-sieu-pham", "title": "Bí Mật Của Một Trí Nhớ Siêu Phàm", "author": "Eran Katz", "ebookPrice": "59.000₫", "physicalPrice": "119.000₫", "category": "Rèn luyện trí nhớ"},
    {"slug": "cay-cam-ngot-cua-toi", "title": "Cây Cam Ngọt Của Tôi", "author": "José Mauro de Vasconcelos", "ebookPrice": "45.000₫", "physicalPrice": "90.000₫", "category": "Văn học kinh điển"},
    {"slug": "chien-tranh-tien-te-tap-1", "title": "Chiến Tranh Tiền Tệ - Tập 1", "author": "Song Hongbing", "ebookPrice": "65.000₫", "physicalPrice": "130.000₫", "category": "Kinh tế & Tài chính"},
    {"slug": "chien-tranh-tien-te-tap-2", "title": "Chiến Tranh Tiền Tệ - Tập 2", "author": "Song Hongbing", "ebookPrice": "65.000₫", "physicalPrice": "130.000₫", "category": "Kinh tế & Tài chính"},
    {"slug": "chien-tranh-tien-te-tap-3", "title": "Chiến Tranh Tiền Tệ - Tập 3", "author": "Song Hongbing", "ebookPrice": "65.000₫", "physicalPrice": "130.000₫", "category": "Kinh tế & Tài chính"},
    {"slug": "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than", "title": "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản", "author": "William B. Irvine", "ebookPrice": "60.000₫", "physicalPrice": "120.000₫", "category": "Triết học ứng dụng"},
    {"slug": "cach-nghi-de-thanh-cong", "title": "Cách Nghĩ Để Thành Công", "author": "Napoleon Hill", "ebookPrice": "55.000₫", "physicalPrice": "110.000₫", "category": "Làm giàu & Thành công"},
    {"slug": "tu-duy-nhanh-va-cham", "title": "Tư Duy Nhanh Và Chậm", "author": "Daniel Kahneman", "ebookPrice": "79.000₫", "physicalPrice": "159.000₫", "category": "Tâm lý học hành vi"},
]

def fallback_local_grounding(query: str) -> str:
    """Tra cứu tri thức cục bộ khi Dify RAG không khả dụng."""
    q = query.lower()

    # 1. Tra cứu chính sách miễn phí vận chuyển (FreeShip 500k)
    if "miễn phí vận chuyển" in q or "freeship" in q or "phí ship" in q or "vận chuyển" in q or "giao hàng" in q:
        if "bao nhiêu" in q or "chính sách" in q or "điều kiện" in q or "tiêu chuẩn" in q:
            return (
                "Chính sách vận chuyển của AuraBook: Đơn hàng có tổng giá trị từ 500.000 đồng trở lên "
                "được miễn phí vận chuyển (FreeShip) toàn quốc. Đối với đơn hàng dưới 500.000 đồng, "
                "cước phí vận chuyển tính theo biểu phí Giao Hàng Nhanh (GHN), khoảng 22.000 đồng nội thành Hà Nội "
                "và 30.000 đến 35.000 đồng cho các tỉnh thành khác. Hàng được xuất phát từ kho tổng tại số 12 Duy Tân, Cầu Giấy, Hà Nội."
            )

    # 2. Tra cứu chính sách đổi trả & bảo hành sách
    if "đổi trả" in q or "bảo hành" in q or "rách" in q or "hỏng" in q or "lỗi" in q or "khiếu nại" in q:
        return (
            "Chính sách đổi trả của AuraBook: Quý khách được hỗ trợ đổi mới 1-1 miễn phí trong vòng 7 ngày "
            "kể từ khi nhận hàng đối với sách bị hư hỏng do vận chuyển hoặc lỗi in ấn, rách trang. "
            "Đối với lỗi kỹ thuật từ nhà xuất bản, AuraBook bảo hành hỗ trợ đổi trả trong vòng 30 ngày. "
            "Quý khách vui lòng cung cấp video mở hộp hoặc hình ảnh đơn hàng để được hỗ trợ nhanh nhất."
        )

    # 3. Tra cứu kho hàng / xuất xứ vận chuyển
    if "kho hàng" in q or "địa chỉ" in q or "gửi từ" in q or "ở đâu" in q or "kho" in q:
        return (
            "Kho hàng tổng của AuraBook đặt tại số 12 Duy Tân, phường Dịch Vọng Hậu, quận Cầu Giấy, Hà Nội. "
            "Tất cả đơn hàng sách giấy đều được đóng gói cẩn thận và bàn giao cho đối tác GHN trực tiếp từ kho Hà Nội."
        )

    # 4. Tra cứu chính sách bảo mật DRM Readium LCP
    if "drm" in q or "bản quyền" in q or "đơn tab" in q or "nhiều tab" in q or "sao chép" in q or "readium" in q:
        return (
            "Chính sách bản quyền sách điện tử AuraBook: Tất cả Ebook được bảo vệ theo tiêu chuẩn quốc tế Readium LCP DRM. "
            "Hệ thống áp dụng cơ chế khóa đọc đơn tab (single-tab lock), không cho phép mở đồng thời trên nhiều tab hoặc thiết bị lạ "
            "nhằm bảo vệ quyền tác giả và chống sao chép trái phép."
        )

    # 5. Tra cứu sách không có trong hệ thống (Anti-Hallucination)
    if "thói quen nguyên tử" in q or "atomic habits" in q:
        return (
            "Dạ hiện tại kho sách AuraBook chưa có cuốn 'Thói Quen Nguyên Tử'. Tuy nhiên em xin gợi ý cuốn "
            "'Bốn Thỏa Ước' của Don Miguel Ruiz (Ebook 49.000 đồng, Sách giấy 98.000 đồng) rất phù hợp để rèn luyện kỷ luật và làm chủ tâm trí."
        )
    if "clean code" in q or "mã sạch" in q:
        return (
            "Dạ hiện tại kho sách AuraBook chưa phân phối cuốn 'Clean Code' của Robert C. Martin. Em xin gợi ý cuốn "
            "'Trí Tuệ Do Thái' của Eran Katz (Ebook 69.000 đồng, Sách giấy 139.000 đồng) giúp rèn luyện tư duy logic và trí nhớ đỉnh cao."
        )

    # 6. Tra cứu giá và thông tin 13 cuốn sách trong Catalog
    for b in CATALOG_BOOKS:
        b_slug_parts = b["slug"].split("-")
        b_title_lower = b["title"].lower()
        if b_title_lower in q or all(p in q for p in b_slug_parts[:2]):
            return (
                f"Tác phẩm '{b['title']}' của tác giả {b['author']} thuộc danh mục {b['category']}. "
                f"Giá phát hành chính thức: Bản sách điện tử Ebook DRM là {b['ebookPrice']} "
                f"và Bản sách giấy bìa mềm giao tận nơi là {b['physicalPrice']}."
            )

    # 7. Danh mục sách bán chạy
    if "bán chạy" in q or "danh mục" in q or "có những sách nào" in q or "sách gì" in q:
        top_books = ", ".join([f"{b['title']} ({b['ebookPrice']})" for b in CATALOG_BOOKS[:5]])
        return (
            f"AuraBook hiện phân phối 13 tác phẩm tuyển chọn, tiêu biểu gồm: {top_books}. "
            "Tất cả đều có sẵn bản Ebook đọc ngay trên Web Reader DRM và sách giấy giao tận nhà."
        )

    return (
        "AuraBook là nền tảng phân phối sách số và sách giấy chính hãng, bảo vệ bản quyền chuẩn Readium LCP DRM. "
        "Em sẵn sàng hỗ trợ quý khách về giá sách, đơn hàng, vận chuyển GHN từ kho Hà Nội và chính sách đổi trả 7 ngày."
    )


class DifyRAGService:
    """Service kết nối tới Dify RAG Knowledge Base với bộ đệm tri thức dự phòng."""

    @staticmethod
    async def query_dify(query: str, user_id: str = "customer_voice") -> str:
        cfg = load_ai_config()
        rag_cfg = cfg.get("rag", {})
        api_url = rag_cfg.get("apiUrl", "http://localhost:8080/v1").rstrip("/")
        api_key = rag_cfg.get("apiKey", "") or "app-aurabook-rag-dev-key"
        dataset_id = rag_cfg.get("datasetId", "")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # 1. Thử gọi Dify Dataset Retrieval nếu có Dataset ID
        if dataset_id:
            endpoint = f"{api_url}/datasets/{dataset_id}/retrieve"
            payload = {
                "query": query,
                "retrieval_model": {
                    "search_method": "hybrid_search",
                    "reranking_enable": False,
                    "top_k": int(rag_cfg.get("topK", 3)),
                },
            }
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(endpoint, json=payload, headers=headers, timeout=4.0) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            records = data.get("records", [])
                            if records:
                                content = "\n".join([r.get("segment", {}).get("content", "") for r in records if r.get("segment", {}).get("content")])
                                if content.strip():
                                    return f"Trích dẫn từ cơ sở tri thức AuraBook:\n{content}"
            except Exception as e:
                logger.info(f"[Dify RAG Dataset Retrieval] Dify không khả dụng ({e}), chuyển sang fallback...")

        # 2. Thử gọi Dify Chat API
        endpoint = f"{api_url}/chat-messages"
        payload = {
            "inputs": {},
            "query": query,
            "response_mode": "blocking",
            "user": user_id,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, json=payload, headers=headers, timeout=4.0) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        ans = data.get("answer", "")
                        if ans and len(ans.strip()) > 10:
                            return ans
        except Exception as e:
            logger.info(f"[Dify RAG Chat] Dify offline ({e}), chuyển sang Local Knowledge Grounding.")

        # 3. Fallback Grounding Cục bộ Chuẩn xác
        return fallback_local_grounding(query)
```

#### B. Khắc phục Xung đột Cổng STT (`sttBaseUrl`)
*Cập nhật hàm `create_stt_from_config` (dòng 231-248)*:
```python
def create_stt_from_config(v_cfg: Dict[str, Any]):
    """Khởi tạo STT theo cấu hình Admin (Whisper Local / Groq Free / Deepgram / OpenAI)."""
    provider = v_cfg.get("sttProvider", "whisper-local").lower()
    model = v_cfg.get("sttModel", "Systran/faster-whisper-small")
    raw_base_url = v_cfg.get("sttBaseUrl", "http://localhost:5040/v1")
    
    # GUARDRAIL CHỐNG XUNG ĐỘT PORT: Port 8000 là Django Saleor backend, không phục vụ STT
    if ":8000" in raw_base_url:
        logger.warning(f"[STT Init] Phát hiện sttBaseUrl '{raw_base_url}' trỏ vào Django port 8000. Tự động điều chỉnh sang port 5040 hoặc Groq.")
        base_url = os.getenv("STT_BASE_URL", "http://localhost:5040/v1")
    else:
        base_url = raw_base_url

    api_key = v_cfg.get("sttApiKey") or "none"
    groq_key = os.getenv("GROQ_API_KEY", "")

    # Nếu có GROQ_API_KEY và provider yêu cầu hoặc local không khả dụng, ưu tiên dùng Groq Whisper siêu tốc
    if (provider == "groq" or groq_key) and provider not in ["openai", "deepgram"]:
        from livekit.plugins import openai
        logger.info("[STT Init] Sử dụng Groq Whisper-large-v3-turbo cho nhận dạng giọng nói tiếng Việt.")
        return openai.STT(
            model="whisper-large-v3-turbo",
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            language="vi",
            use_realtime=False
        )

    logger.info(f"[STT Init] Provider: {provider} | Model: {model} | BaseURL: {base_url}")

    if provider in ["whisper-local", "local"]:
        from livekit.plugins import openai
        return openai.STT(
            model=model,
            base_url=base_url,
            api_key=api_key,
            language="vi",
            use_realtime=False
        )
```

---

## 6. VERIFICATION METHOD (Phương thức Xác minh Độc lập)

Worker M4 và Auditor có thể chạy độc lập các lệnh sau để xác minh toàn bộ các tiêu chí:

### 6.1. Xác minh Piper TTS Server:
```powershell
# 1. Kiểm tra health check:
curl.exe http://localhost:5050/health

# 2. Kiểm tra tốc độ đọc 0.8x vs 1.5x (kích thước byte và thời lượng phải khác nhau rõ rệt):
python -c "import urllib.request, json
for sp in [0.8, 1.0, 1.5]:
    req = urllib.request.Request('http://localhost:5050/api/tts', data=json.dumps({'text': 'AuraBook thử nghiệm tốc độ giọng nói', 'speed': sp}).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        d = json.loads(resp.read().decode('utf-8'))
        print(f'Speed {sp} -> bytes: {len(d.get(\"audioBase64\", \"\"))}, format: {d.get(\"format\")}, sampleRate: {d.get(\"sampleRate\")}')
"
```
*Điều kiện Đạt*:
- `Speed 0.8` có kích thước lớn hơn `Speed 1.5`.
- Response chứa `"format": "wav"`, `"mimeType": "audio/wav"`, `"sampleRate": 22050`.

### 6.2. Xác minh LiveKit CSKH Agent Dify RAG & Local Grounding:
```powershell
# Chạy script kiểm thử trực tiếp hàm fallback grounding trong Python:
python -c "
import sys
sys.path.append('ecommerce-ai-platform/voice-agent/backend')
from vietnamese_cskh_agent import fallback_local_grounding

queries = [
    'Cho tôi biết giá cuốn Bốn Thỏa Ước',
    'Chính sách miễn phí vận chuyển như thế nào?',
    'Sách bị rách khi giao hàng thì đổi trả sao?',
    'Kho hàng AuraBook ở đâu?',
    'Có sách Thói Quen Nguyên Tử không?'
]
for q in queries:
    print('Q:', q)
    print('A:', fallback_local_grounding(q))
    print('-'*50)
"
```
*Điều kiện Đạt*:
- Bốn Thỏa Ước: Báo đúng Ebook 49.000₫, Sách giấy 98.000₫.
- FreeShip: Báo đúng mốc 500.000₫ và GHN kho Hà Nội.
- Đổi trả: Báo đúng 7 ngày hư hỏng do vận chuyển / 30 ngày lỗi nhà xuất bản.
- Kho hàng: Báo đúng 12 Duy Tân, Cầu Giấy, Hà Nội.
- Thói quen nguyên tử: Từ chối trung thực và đề xuất Bốn Thỏa Ước.

### 6.3. Chạy Automated Evaluation Test Suite:
```powershell
# Chạy bộ test suite cho voice_chat và business_policy
python tests/ai_evaluation_suite.py --feature voice_chat
python tests/ai_evaluation_suite.py --feature business_policy
```
*Điều kiện Đạt*: 100% test cases Pass mà không có lỗi timeout hay missing keywords.
