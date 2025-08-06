# FastAPI 앱 진입점
from fastapi import FastAPI
from pydantic import BaseModel
from predictor import run_prediction

app = FastAPI()
# port_map = load_port_map()  # 서버 시작 시 항구명 로드

class InputData(BaseModel):
    time: int
    latitude: float
    longitude: float
    cog: float
    heading: float

@app.post("/predict")
def predict(data: InputData):
    return run_prediction(data)
