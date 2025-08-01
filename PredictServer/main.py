# Package Import
import pandas as pd # type: ignore
import numpy as np # type: ignore
import joblib # type: ignore
import os

# FastAPI 관련 package import
from fastapi import FastAPI # type: ignore
import uvicorn # type: ignore
from pydantic import BaseModel # type: ignore
from fastapi.responses import JSONResponse # type: ignore

# 모든 모델과 인코더를 저장할 딕셔너리
from predict_logic import predict_top_ports
models = {}
encoders = {}

# 타임 포인트 리스트
time_points = {5, 8, 11, 14, 17, 20, 23, 26, 29}

# 모델과 인코더 불러오기
def loader(base_path='PredictServer/models'):
    all_models = {}

    for hour_dir in os.listdir(base_path):
        hour_path = os.path.join(base_path, hour_dir) # PredictServer/models/5hours
        if not os.path.isdir(hour_path):
            continue

        hour_key = hour_dir.replace('hours', '')

        # 시점대의 모델 불러오기
        cluster_model_path = os.path.join(hour_path, f"cluster_model_{hour_key}hours.joblib")
        cluster_model = joblib.load(cluster_model_path)

        # 인코더 불러오기
        encoder_path = os.path.join(hour_path, 'encoder') # PredictServer/models/5hours/encoder
        encoders = {}
        for file in os.listdir(encoder_path):
            cluster_id = file.split('_')[1]
            encoders[cluster_id] = joblib.load(os.path.join(encoder_path, file))
        
        # 군집별 모델 불러오기
        model_path = os.path.join(hour_path, 'port_cluster')
        models = {}
        for file in os.listdir(model_path):
            cluster_id = file.split('_')[1]
            models[cluster_id] = joblib.load(os.path.join(model_path, file))
        
        # 하나의 시점에 대해 모두 저장
        all_models[hour_key] = {
            'cluster_model': cluster_model,
            'encoders' : encoders,
            'models' : models
        }

    return all_models

# Model 생성: 사용자가 입력값을 받는 모델
class UserInput(BaseModel):
    hour: int
    lat: float
    lon: float
    cog: float
    heading: float
    


app = FastAPI()

@app.post(path="/api/port", status_code=201)
def predict_port(item: UserInput):
    hour = item.hour
    lat = item.lat
    lon = item.lon
    cog = item.cog
    heading = item.heading

    result = predict_top_ports(lat, lon, cog, heading, hour, all_models)
    return JSONResponse(content=result)  


if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=8080)