from fastapi import FastAPI
from pydantic import BaseModel
from predict_logic import predict


app = FastAPI()

class PredictReq(BaseModel):
    lat: float
    lon: float
    cog: float
    heading: float
    timepoint: int

@app.post("/predict")
def predict_endpoint(req: PredictReq):

    # predict()는 (used_timepoint:int, List[Tuple[portId, prob]])를 돌려주도록 구현
    used_tp, top3 = predict(req.lat, req.lon, req.cog, req.heading, req.timepoint)
    
    # 표준화된 JSON으로 리턴
    return {
        "used_timepoint": used_tp,
        "topk": [
            {"rank": i+1, "portId": pid, "prob": float(p)}
            for i, (pid, p) in enumerate(top3[:3])
        ]
    }