import joblib
import numpy as np

def run_prediction(data):
    # 1. 클러스터 모델 로딩
    cluster_model_path = f"model/cluster_{data.time}hours.joblib"
    cluster_model = joblib.load(cluster_model_path)

    # 2. 군집 예측
    features = np.array([[data.latitude, data.longitude, data.cog, data.heading]])
    cluster_num = int(cluster_model.predict(features)[0])

    # 3. 인코더 로드 (항구 코드 숫자 → 문자 디코딩용)
    encoder_path = f"model/encoder_c{cluster_num}_{data.time}hours.joblib"
    encoder = joblib.load(encoder_path)

    # 4. 항구 예측 모델 로드
    port_model_path = f"model/port_c{cluster_num}_{data.time}hours.joblib"
    port_model = joblib.load(port_model_path)

    # 5. 예측 확률 계산
    proba = port_model.predict_proba(features)[0]
    top3_indices = np.argsort(proba)[::-1][:3]

    # 6. 디코딩 처리
    # (port_model.classes_는 숫자 클래스라면 → encoder로 디코딩)
    classes_raw = port_model.classes_
    if np.issubdtype(classes_raw.dtype, np.integer):
        decoded_classes = encoder.inverse_transform(classes_raw)
    else:
        decoded_classes = classes_raw  # 이미 문자열이면 그대로 사용

    # 7. 결과 구성
    top3_results = [
        {
            "rank": int(i + 1),
            "portCode": str(classes_raw[idx]),         # 숫자 클래스 (0, 1, 2...)
            "portName": str(decoded_classes[idx]),     # 실제 UN/LOCODE (KRPTK 등)
            "probability": float(round(proba[idx], 4))
        }
        for i, idx in enumerate(top3_indices)
    ]

    return {
        "cluster": int(cluster_num),
        "top3": top3_results
    }
