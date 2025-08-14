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
    return TIMEPOINTS[-1]  # 전부 초과하면 마지막 시점을 사용

# =============================================
#  해당 시점(tp)의 모델/인코더 묶음을 로드 (없으면 디스크에서 읽어와 캐시에 저장)
#  반환 형태: {"cluster": 1차군집모델, "ports": {c: 2차항구모델}, "encs": {c: 인코더}}
# =============================================
def _load_bundle(tp: int):
    if tp in CACHE:
        return CACHE[tp]

    root = BASE / _tp_dir(tp)

    cluster = joblib.load(root / f"cluster_model_{_tp_dir(tp)}.joblib")

    ports = {}
    encs = {}
    for c in [1, 2, 3, 4, 5, 6, 7]:
        ep = root / "encoder" / f"encoder_c{c}_{_tp_dir(tp)}.joblib"
        mp = root / "port_cluster" / f"port_c{c}_{_tp_dir(tp)}.joblib"
        if ep.exists() and mp.exists():
            encs[c] = joblib.load(ep)
            ports[c] = joblib.load(mp)

    CACHE[tp] = {"cluster": cluster, "ports": ports, "encs": encs}
    return CACHE[tp]

# =============================================
#  차항지 예측의 메인 함수.
#  입력: 위도(lat), 경도(lon), COG, HEADING, 관측시점(tp)
#  출력: (실제로 사용한 시점 used, [(portId, jointProb), ...] 상위 3개)
# =============================================
def predict(lat: float, lon: float, cog: float, heading: float, tp: int):
    used = _nearest(tp)
    bundle = _load_bundle(used)

    x = np.array([[lat, lon, cog, heading]], dtype=float)

    # ----- 1차: 군집 확률 -----
    c_model = bundle["cluster"]
    c_probs = c_model.predict_proba(x)[0]   # shape: (num_clusters,)
    c_labels = c_model.classes_             # e.g., array([1,2,3,...])

    # 군집을 확률 내림차순으로 정렬
    cluster_order = np.argsort(c_probs)[::-1]

    joint = {}  # {port_id: joint_prob}

    def add_candidates(cluster_idx: int, max_ports: int | None):
        """특정 군집에서 상위 max_ports개의 항구 후보를 joint에 추가"""
        c_label = c_labels[cluster_idx]
        if c_label not in bundle["ports"] or c_label not in bundle["encs"]:
            return
        p_cluster = float(c_probs[cluster_idx])

        p_model = bundle["ports"][c_label]
        enc = bundle["encs"][c_label]

        p_probs = p_model.predict_proba(x)[0]
        p_classes = getattr(p_model, "classes_", np.arange(len(p_probs)))

        port_order = np.argsort(p_probs)[::-1]
        if max_ports is not None:
            port_order = port_order[:max_ports]

        for j in port_order:
            label = p_classes[j]
            try:
                port_id = enc.inverse_transform([label])[0]
            except Exception:
                # 인코더 매핑 실패 시, 원시 라벨을 문자열로
                port_id = str(label)

            score = p_cluster * float(p_probs[j])
            # 두 군집에서 같은 항구가 나올 수 있으므로, joint 점수는 최대값으로 유지
            if port_id in joint:
                if score > joint[port_id]:
                    joint[port_id] = score
            else:
                joint[port_id] = score

    # ---- 1차 시도: Top-2 군집 × 각 Top-2 포트 ----
    for idx in cluster_order[:2]:
        add_candidates(int(idx), max_ports=2)

    # ---- 부족하면: 나머지 군집도 Top-2 포트씩 ----
    if len(joint) < 3:
        for idx in cluster_order[2:]:
            add_candidates(int(idx), max_ports=2)
            if len(joint) >= 3:
                break

    # ---- 그래도 부족하면: 상위 군집들에서 max_ports 제한 해제 ----
    if len(joint) < 3:
        for idx in cluster_order[:2]:
            add_candidates(int(idx), max_ports=None)  # 해당 군집의 모든 클래스 후보 고려
            if len(joint) >= 3:
                break

    # 최종 정렬 후 상위 3개 반환 (가능하면 3개, 그 미만이면 있는 만큼)
    topk = sorted(joint.items(), key=lambda x: x[1], reverse=True)[:3]
    return used, [(str(pid), float(prob)) for pid, prob in topk]
