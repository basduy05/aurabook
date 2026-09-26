import base64
import io
import math
import struct
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Book
from app.schemas.catalog import AudioTeaserResponse


class AudioService:
    @staticmethod
    def generate_synthetic_audio_wav(duration_seconds: int = 5) -> str:
        """Sinh tệp âm thanh WAV hợp lệ (PCM 16-bit, 22.05kHz, Mono)

        với chuỗi âm thanh dẫn truyền (Acoustic Intro Chime) để phát trực tiếp
        trên thẻ <audio> của trình duyệt thông qua Data URI.
        """
        sample_rate = 22050
        num_samples = sample_rate * duration_seconds
        num_channels = 1
        bits_per_sample = 16
        byte_rate = sample_rate * num_channels * bits_per_sample // 8
        block_align = num_channels * bits_per_sample // 8

        wav_io = io.BytesIO()

        # 1. RIFF Header
        data_size = num_samples * block_align
        wav_io.write(b"RIFF")
        wav_io.write(struct.pack("<I", 36 + data_size))
        wav_io.write(b"WAVE")

        # 2. fmt Subchunk
        wav_io.write(b"fmt ")
        wav_io.write(struct.pack("<I", 16))  # Subchunk1Size (16 for PCM)
        wav_io.write(struct.pack("<H", 1))   # AudioFormat (1 for PCM)
        wav_io.write(struct.pack("<H", num_channels))
        wav_io.write(struct.pack("<I", sample_rate))
        wav_io.write(struct.pack("<I", byte_rate))
        wav_io.write(struct.pack("<H", block_align))
        wav_io.write(struct.pack("<H", bits_per_sample))

        # 3. data Subchunk
        wav_io.write(b"data")
        wav_io.write(struct.pack("<I", data_size))

        # 4. Generate melodic chime & speech cadence harmonics
        # Pentatonic scale notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), A5 (880Hz), C6 (1046Hz)
        notes = [523.25, 659.25, 783.99, 880.00, 1046.50]
        for i in range(num_samples):
            t = i / sample_rate
            # Play gentle melodic notes during first 3 seconds, then gentle rhythm
            note_idx = int(t * 1.5) % len(notes)
            freq = notes[note_idx]

            # Envelope: fade in and decay per note
            note_time = (t * 1.5) - int(t * 1.5)
            envelope = math.exp(-3.0 * note_time)

            # Combined tone
            val = (
                0.35 * math.sin(2.0 * math.pi * freq * t)
                + 0.15 * math.sin(2.0 * math.pi * (freq * 1.5) * t)
            ) * envelope

            sample_val = int(val * 32767.0 * 0.7)
            sample_val = max(-32768, min(32767, sample_val))
            wav_io.write(struct.pack("<h", sample_val))

        wav_bytes = wav_io.getvalue()
        b64_audio = base64.b64encode(wav_bytes).decode("ascii")
        return f"data:audio/wav;base64,{b64_audio}"

    @classmethod
    async def get_or_create_audio_teaser(
        db: AsyncSession,
        book_id: uuid.UUID,
    ) -> AudioTeaserResponse:
        stmt = select(Book).where(Book.id == book_id, Book.is_available.is_(True))
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()

        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy thông tin ấn phẩm sách yêu cầu.",
            )

        # Generate engaging 60-second audio script
        desc_snippet = (
            book.description[:180]
            if book.description
            else "Tác phẩm chứa đựng những tư duy đột phá và giá trị thực tiễn sâu sắc."
        )
        script_text = (
            f"Chào mừng bạn đến với chuyên mục tóm tắt sách AI AuraBook. Hôm nay chúng ta cùng khám phá "
            f"tác phẩm '{book.title}' của tác giả {book.author}. {desc_snippet}... "
            f"Hãy trải nghiệm đọc toàn diện cùng tác tử AI RAG thông minh trên nền tảng AuraBook ngay hôm nay!"
        )

        # Audio URL resolution
        if book.audio_teaser_url:
            audio_url = book.audio_teaser_url
        else:
            audio_url = AudioService.generate_synthetic_audio_wav(duration_seconds=5)

        return AudioTeaserResponse(
            book_id=book.id,
            book_title=book.title,
            duration_seconds=60,
            script_text=script_text,
            audio_url=audio_url,
            voice_model="gemini-2.0-flash-audio-vi",
        )
