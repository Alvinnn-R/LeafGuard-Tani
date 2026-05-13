"""Test: Buktikan multi API key rotation bekerja."""
from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from services.gemini import _init_clients, _call_gemini_with_fallback, _is_retryable_error
from prompts.system import MODEL_CHAIN

# Reset clients agar init ulang
import services.gemini as gm
gm._clients = []

clients = _init_clients()
print(f"Jumlah API key terdeteksi: {len(clients)}")
print(f"Model chain: {MODEL_CHAIN}")
print()

# Test: panggil dengan prompt sederhana
async def test():
    try:
        result = await _call_gemini_with_fallback(
            system_prompt="Kamu adalah asisten. Jawab dalam JSON format: {\"status\": \"ok\", \"message\": \"test berhasil\"}",
            content_parts=["Jawab dalam JSON."],
        )
        print(f"BERHASIL! Response: {result[:200]}")
    except Exception as e:
        print(f"GAGAL: {e}")

asyncio.run(test())
