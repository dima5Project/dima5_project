import joblib
import numpy as np
from pathlib import Path

# 모델 시점 리스트
TIMEPOINTS = [5, 8, 11, 14, 17, 20, 23, 26, 29]

# =============================================
# 현재 timepoint 값으로 가장 가까운 모델 시점을 계산
#   - 기준: 1시간 이내 → 해당 모델, 초과 시 → 다음 모델
# =============================================

def get_nearest_timepoint(tp: int):

    for t in TIMEPOINTS:
        if tp <= t + 1:  # 예: 5~6 → 5모델, 6~8 → 8모델 : t ~ t+1 이내면 t, 그 이상이면 다음
            return t
    return TIMEPOINTS[-1]  # 마지막 시점

# =============================================
# 시점별 모델 및 인코더 불러오기
# =============================================

def load_model_files(tp: int):

    model_dir = Path(f"./models/{tp}")
    cluster_model = joblib.load(model_dir / "cluster_model.joblib")

    cluster_models = {}
    encoders = {}

    for cluster_id in range(1, 8):
        model_path = model_dir / f"port_model_{cluster_id}.joblib"
        encoder_path = model_dir / f"encoder_{cluster_id}.joblib"
        if model_path.exists() and encoder_path.exists():
            cluster_models[cluster_id] = joblib.load(model_path)
            encoders[cluster_id] = joblib.load(encoder_path)

    return cluster_model, cluster_models, encoders


# =============================================
# 1. 시점 결정
# 2. 모델 / 인코더 로드
# 3. 1차 군집 -> 2차 항구 예측
# =============================================

def predict(lat, lon, cog, heading, tp):

    nearest_tp = get_nearest_timepoint(tp)
    cluster_model, cluster_models, encoders = load_model_files(nearest_tp)

    user_input = np.array([[lat, lon, cog, heading]])
    cluster_probs = cluster_model.predict_proba(user_input)[0]
    cluster_labels = cluster_model.classes_

    final_probs_joint = {}
    top2_idx = np.argsort(cluster_probs)[-2:][::-1]

    for i in top2_idx:
        prob_cluster = cluster_probs[i]
        cluster_id = cluster_labels[i]

        if cluster_id not in cluster_models:
            continue

        model = cluster_models[cluster_id]
        le = encoders[cluster_id]

        port_probs = model.predict_proba(user_input)[0]
        port_names = le.inverse_transform(np.arange(len(port_probs)))

        top2_ports_idx = np.argsort(port_probs)[-2:][::-1]
        for j in top2_ports_idx:
            joint_prob = prob_cluster * port_probs[j]
            final_probs_joint[port_names[j]] = joint_prob

    sorted_joint = sorted(final_probs_joint.items(), key=lambda x: x[1], reverse=True)[:3]
    return {"timepoint": nearest_tp, "predictions": sorted_joint}
