from fastapi import FastAPI

app = FastAPI(title="Leafguard Tani API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Leafguard Tani Backend API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
