from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predict_logic import predict


app = FastAPI()

# # /predict 요청 바디(JSON)를 파싱할 데이터 모델
class PredictReq(BaseModel):
    lat: float
    lon: float
    cog: float
    heading: float
    timepoint: int

# 단순 상태 응답을 위한 함수
@app.get("/health")                         # 헬스체크 엔드포인트 (GET /health)
def health():
    return {"ok": True}                


# 예측 함수 호출 = (사용시점, [(항구ID, 확률)])
@app.post("/predict")
def predict_endpoint(req: PredictReq):
    try:
        used_tp, top3 = predict(req.lat, req.lon, req.cog, req.heading, req.timepoint)
    
    # 모델 파일이 없을 때 & 500 에러 처리
    except FileNotFoundError as e:
        raise HTTPException(500, str(e))
    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {e}")

    # 정상 응답 (JSON)
    return {
        "used_timepoint": used_tp,                        # 사용한 모델 시점
        "topk": [                                         # 상위 3개 항구와 확률
            {"rank": i+1, "portId": pid, "prob": prob}
            for i, (pid, prob) in enumerate(top3)
        ]
    }


# 서버 시작: 터미널에서 아래 입력 + Enter
# cd C:\dima5_project\PredictServer
# "C:\Users\user\anaconda3\python.exe" -m uvicorn main:app --reload

# 웹에서 http://127.0.0.1:8000 검색

# 서버 종료: 터미널에서 Ctrl + C