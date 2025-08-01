# Package Import
import pandas as pd
import numpy as np
import joblib

# FastAPI 관련 package import
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# 모든 모델과 인코더를 저장할 딕셔너리
models = {}
encoders = {}

# 타임 포인트 리스트
time_points = {5, 8, 11, 14, 17, 20, 23, 26, 29}
