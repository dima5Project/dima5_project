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

    used = _nearest(tp)                                             # 1) 사용할 모델 시점 결정
    bundle = _load_bundle(used)                                     # 2) 해당 시점 모델/인코더 묶음 로드

    x = np.array([[lat, lon, cog, heading]], dtype=float)           # 3) 입력을 2D 배열로 준비 (모델 입력 형태)

    c_model = bundle["cluster"]                                     # 4) 1차 군집 모델 꺼내기
    c_probs = c_model.predict_proba(x)[0]                           # 5) 각 군집에 대한 예측 확률 벡터 (shape: [n_clusters])
    c_labels = c_model.classes_                                     # 6) 군집 라벨(예: [1,2,3,4,6,7]) → 확률 벡터와 같은 순서

    top_c_idx = np.argsort(c_probs)[-2:][::-1]                      # 7) 군집 확률 상위 2개 인덱스 (내림차순)

    joint = {}                                                      # 8) 항구별 joint 확률(군집*항구)을 저장할 딕셔너리

    for idx in top_c_idx:                                           # 9) 상위 2개 군집 각각에 대해
        c_label = c_labels[idx]                                     #   9-1) 군집 라벨값 (예: 3)
        p_cluster = float(c_probs[idx])                             #   9-2) 해당 군집의 확률

        if c_label not in bundle["ports"] or c_label not in bundle["encs"]:
            continue                                                #   9-3) 모델/인코더 없으면 스킵

        p_model = bundle["ports"][c_label]                          #   9-4) 해당 군집의 2차 항구 모델
        enc = bundle["encs"][c_label]                               #   9-5) 해당 군집의 인코더(LabelEncoder)

        p_probs = p_model.predict_proba(x)[0]                       #   9-6) 군집 내부 항구들의 확률 벡터
        p_classes = getattr(p_model, "classes_", np.arange(len(p_probs)))  # 9-7) 항구 라벨(확률 벡터 열 순서와 동일)

        top_p_idx = np.argsort(p_probs)[-2:][::-1]                  #   9-8) 항구 확률 상위 2개 인덱스

        for j in top_p_idx:                                         #   9-9) 상위 2개 항구 각각에 대해
            label = p_classes[j]                                    #       항구 라벨(인코딩 값)
            try:
                port_id = enc.inverse_transform([label])[0]         #       인코더로 원래 항구 ID 복원
            except Exception:
                port_id = str(label)                                #       실패하면 문자열로 강제 변환

            score = p_cluster * float(p_probs[j])                   #       joint 확률 = 군집확률 × 항구확률

            if port_id in joint:                                    #       같은 항구가 여러 군집에서 등장할 수 있으니
                joint[port_id] = max(joint[port_id], score)         #       더 큰 joint 값으로 업데이트
            else:
                joint[port_id] = score                              #       처음 나오면 그대로 저장

    top3 = sorted(joint.items(), key=lambda x: x[1], reverse=True)[:3]  # 10) joint 상위 3개 추림
    return used, [(str(pid), float(prob)) for pid, prob in top3]        # 11) (사용시점, [(항구ID, 확률)]) 형태로 반환
