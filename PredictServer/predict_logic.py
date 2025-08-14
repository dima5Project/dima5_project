import joblib
import numpy as np
from pathlib import Path

# 모델 시점 리스트 & 파일 경로
TIMEPOINTS = [5, 8, 11, 14, 17, 20, 23, 26, 29]
BASE = Path(__file__).resolve().parent / "models"

# 한번 로드한 모델/인코더를 메모리에 캐싱해서 재사용하기 위한 딕셔너리
CACHE = {}

# =============================================
# 정수 시점을 '5hours' 처럼 폴더명으로 바꿔줌
# =============================================
def _tp_dir(tp: int) -> str:
    return f"{tp}hours"


# =============================================
# 현재 timepoint 값으로 가장 가까운 모델 시점을 계산
#   - t ~ t+1 이내면 t, 그 이상이면 다음 시점 사용
# =============================================
def _nearest(tp: int) -> int:
    for t in TIMEPOINTS:
        if tp <= t + 1:
            return t
    return TIMEPOINTS[-1] # 전부 초과하면 마지막 시점을 사용


# =============================================
#  해당 시점(tp)의 모델/인코더 묶음을 로드 (없으면 디스크에서 읽어와 캐시에 저장)
#  반환 형태: {"cluster": 1차군집모델, "ports": {c: 2차항구모델}, "encs": {c: 인코더}}
# =============================================

def _load_bundle(tp: int):

    if tp in CACHE:                    # 이미 캐시에 있으면
        return CACHE[tp]               # 그대로 재사용

    root = BASE / _tp_dir(tp)          # 예: PredictServer/models/5hours

    # 1차 군집 모델 파일명 규칙: cluster_model_{tp}hours.joblib
    cluster = joblib.load(root / f"cluster_model_{_tp_dir(tp)}.joblib")  # 1차 군집 모델 로드

    ports = {}                         # 군집별 2차 항구 모델 저장 딕셔너리
    encs = {}                          # 군집별 인코더(LabelEncoder) 저장 딕셔너리

    # 파일명 규칙이 c1~c7이므로 1..7을 돌며 해당 군집의 모델/인코더를 시도 로드
    for c in [1, 2, 3, 4, 5, 6, 7]:

        ep = root / "encoder" / f"encoder_c{c}_{_tp_dir(tp)}.joblib"      # 인코더 경로
        mp = root / "port_cluster" / f"port_c{c}_{_tp_dir(tp)}.joblib"    # 2차 항구 모델 경로
        if ep.exists() and mp.exists():  # 두 파일이 모두 있으면만 로드
            encs[c] = joblib.load(ep)    # 인코더 로드 후 저장
            ports[c] = joblib.load(mp)   # 2차 항구 모델 로드 후 저장

    CACHE[tp] = {"cluster": cluster, "ports": ports, "encs": encs}  # 캐시에 묶음 저장
    return CACHE[tp]                                                # 로드 결과 반환



# =============================================
#  차항지 예측의 메인 함수.
#  입력: 위도(lat), 경도(lon), COG, HEADING, 관측시점(tp)
#  출력: (실제로 사용한 시점 used, [(portId, jointProb), ...] 상위 3개)
# =============================================

def predict(lat: float, lon: float, cog: float, heading: float, tp: int):
    used = _nearest(tp)
    bundle = _load_bundle(used)

    x = np.array([[lat, lon, cog, heading]], dtype=float)

    c_model = bundle["cluster"]
    c_probs = c_model.predict_proba(x)[0]
    c_labels = c_model.classes_

    top_c_idx = np.argsort(c_probs)[-2:][::-1]
    joint = {}

    for idx in top_c_idx:
        c_label = c_labels[idx]
        p_cluster = float(c_probs[idx])

        if c_label not in bundle["ports"] or c_label not in bundle["encs"]:
            continue

        p_model = bundle["ports"][c_label]
        enc = bundle["encs"][c_label]

        p_probs = p_model.predict_proba(x)[0]
        p_classes = getattr(p_model, "classes_", np.arange(len(p_probs)))

        top_p_idx = np.argsort(p_probs)[-2:][::-1]

        for j in top_p_idx:
            label = p_classes[j]
            try:
                port_id = enc.inverse_transform([label])[0]
            except Exception:
                port_id = str(label)

            score = p_cluster * float(p_probs[j])
            joint[port_id] = max(joint.get(port_id, 0), score)

    # joint가 비어 있으면 빈 리스트 반환
    if not joint:
        return used, []

    top3 = sorted(joint.items(), key=lambda x: x[1], reverse=True)[:3]
    return used, [(str(pid), float(prob)) for pid, prob in top3]
