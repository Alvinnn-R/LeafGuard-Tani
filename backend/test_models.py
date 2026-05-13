"""Test: Cek model mana yang benar-benar bisa generateContent + JSON."""
from dotenv import load_dotenv
load_dotenv()

import os
from google import genai
from google.genai import types

# Pakai key 2 karena key 1 sudah habis kuota
api_key = os.getenv("GEMINI_API_KEY_2") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)
print(f"Using key ending: ...{api_key[-8:]}")

models_to_test = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]

for model in models_to_test:
    try:
        response = client.models.generate_content(
            model=model,
            contents='Jawab dalam JSON: {"test": true}',
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=32,
                response_mime_type="application/json",
            ),
        )
        text = response.text[:50] if response.text else "(empty)"
        print(f"  OK {model:40s} -> {text}")
    except Exception as e:
        err = str(e)[:120]
        print(f"  FAIL {model:40s} -> {err}")
