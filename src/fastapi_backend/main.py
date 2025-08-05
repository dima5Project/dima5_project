from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def hello():
    return {"message": "Hello from FastAPI"}

# main.py에 추가
@app.get("/ping")
def ping():
    return {"ping": "pong"}