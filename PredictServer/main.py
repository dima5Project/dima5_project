# main.py
from typing import Optional, List, Dict, Any, Literal
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query

from predict_logic import predict, TIMEPOINTS

app = FastAPI(title="Port Prediction API")

# ==== 데이터 경로 & 캐시 ====
BASE_DIR = Path(__file__).resolve().parent
AIS_TP_PATH  = BASE_DIR / "data" / "ais_timepoint.csv"  # vsl_id별 시점별 스냅샷(예측 입력용)
AIS_ALL_PATH = BASE_DIR / "data" / "ais_all.csv"        # 항로(트랙) 전체

_DF_TP_CACHE: Optional[pd.DataFrame] = None
_DF_ALL_CACHE: Optional[pd.DataFrame] = None

def _load_df_tp() -> pd.DataFrame:
    global _DF_TP_CACHE
    if _DF_TP_CACHE is None:
        if not AIS_TP_PATH.exists():
            raise HTTPException(500, f"CSV not found: {AIS_TP_PATH}")
        _DF_TP_CACHE = pd.read_csv(AIS_TP_PATH, parse_dates=["time_stamp"])
    return _DF_TP_CACHE

def _load_df_all() -> pd.DataFrame:
    global _DF_ALL_CACHE
    if _DF_ALL_CACHE is None:
        if not AIS_ALL_PATH.exists():
            raise HTTPException(500, f"CSV not found: {AIS_ALL_PATH}")
        # 모든 행의 시간축이 필요하므로 파싱
        _DF_ALL_CACHE = pd.read_csv(AIS_ALL_PATH, parse_dates=["time_stamp"])
    return _DF_ALL_CACHE

def _nearest_model_tp(tp_float: float) -> int:
    # 1시간 룰: tp <= t+1 → t, 그 외 다음
    for t in TIMEPOINTS:
        if tp_float <= t + 1:
            return t
    return TIMEPOINTS[-1]

def _pick_row_for_t(sub: pd.DataFrame, t: int) -> pd.Series:
    # t 이하면서 가장 큰 값(없으면 전체 중 최단거리)
    s = sub["time_point"].astype(float)
    mask = s <= t
    if mask.any():
        idx = s[mask].idxmax()
    else:
        idx = (s.sub(t).abs()).idxmin()
    return sub.loc[idx]

def _round_prob(v: float, nd=6) -> float:
    try: return round(float(v), nd)
    except: return float(v)

@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(
    vsl_id: str = Query(..., description="CSV의 vsl_id"),
    include: Literal["both","latest","timeline"] = Query("both"),
    include_current_in_timeline: bool = Query(False, description="타임라인에 현재 모델 시점을 포함할지"),
    current_timestamp: Optional[str] = Query(None, description="YYYY-MM-DD HH:MM:SS (사용자 입력 시각)")
) -> Dict[str, Any]:
    """
    반환:
    - latest: 현재 위치(마지막 행) + 현재 모델 예측(Top-3)
      * matched_row.time_stamp는 current_timestamp가 있으면 그 값으로 덮어씀
      * atd: current_timestamp - latest_time_point(시간)

    - timeline: 5/8/11/…(현재모델 이하) 각 시점의 '근접 행' + 해당 시점 모델 예측(Top-3)

    - track: ais_all.csv에서 동일 vsl_id의 전체 항로(시간순)
        [ {time_stamp, lat, lon}, ... ]
    """
    # ---- 1) 데이터 필터링 ----
    df_tp  = _load_df_tp()
    sub_tp = df_tp[df_tp["vsl_id"].astype(str).str.strip() == str(vsl_id).strip()]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    # 최신 행(마지막 time_point)
    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp  = float(row_latest["time_point"])
    current_model_tp = _nearest_model_tp(latest_tp)

    # ---- 2) latest(현재) 카드 ----
    response: Dict[str, Any] = {"vsl_id": str(vsl_id)}

    if include in ("both", "latest"):
        lat_c = float(row_latest["lat"]); lon_c = float(row_latest["lon"])
        cog_c = float(row_latest["cog"]); heading_c = float(row_latest["heading"])

        used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, latest_tp)

        # current_timestamp 처리
        ts_actual: datetime = pd.to_datetime(row_latest["time_stamp"]).to_pydatetime()
        if current_timestamp:
            try:
                ts_display = datetime.strptime(current_timestamp, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                raise HTTPException(422, "current_timestamp must be 'YYYY-MM-DD HH:MM:SS'")
        else:
            ts_display = ts_actual  # 입력이 없으면 실제 값을 그대로

        # ATD = 입력시각 - latest_tp(시간)
        atd = ts_display - timedelta(hours=latest_tp)

        response["latest"] = {
            "time_point": int(used_current),            # 현재 사용된 모델 시점(정수)
            "actual_time_point": latest_tp,             # 최신 행의 실측 tp(소수)
            "time_stamp": ts_display.strftime("%Y-%m-%d %H:%M:%S"),
            "atd": atd.strftime("%Y-%m-%d %H:%M:%S"),
            "lat": lat_c, "lon": lon_c, "cog": cog_c, "heading": heading_c,
            "predictions": [
                {"rank": i+1, "port_id": pid, "prob": _round_prob(p)}
                for i, (pid, p) in enumerate(top3_current)
            ]
        }

    # ---- 3) timeline(이전 시점들) ----
    if include in ("both", "timeline"):
        steps = [t for t in TIMEPOINTS if (t < current_model_tp) or (include_current_in_timeline and t <= current_model_tp)]
        timeline: List[Dict[str, Any]] = []
        for t in steps:
            row_t = _pick_row_for_t(sub_tp, t)
            lat = float(row_t["lat"]); lon = float(row_t["lon"])
            cog = float(row_t["cog"]); heading = float(row_t["heading"])
            used_tp, top3 = predict(lat, lon, cog, heading, t)  # 모델은 t로 고정

            timeline.append({
                "time_point": int(used_tp),                    # 카드 제목에 쓰는 t(정수)
                "time_stamp": str(row_t["time_stamp"]),
                "actual_time_point": float(row_t["time_point"]),  # 선택된 행의 tp(소수)
                "lat": lat, "lon": lon, "cog": cog, "heading": heading,
                "predictions": [
                    {"rank": i+1, "port_id": pid, "prob": _round_prob(p)}
                    for i, (pid, p) in enumerate(top3)
                ]
            })
        # 오름차순(5→8→11…)
        timeline = sorted(timeline, key=lambda x: x["time_point"])
        response["timeline"] = timeline

    # ---- latest 만든 뒤 (response["latest"]["predictions"]가 준비된 상태) ----
    # 예: predictions = [{"rank":1,"port_id":"JPHKT","prob":0.65}, ...]
    latest_ports = [(p["rank"], p["port_id"]) for p in response["latest"]["predictions"]]
    # 옵션: 너무 포인트가 많으면 샘플링, 없으면 None
    MAX_TRACK_POINTS = 200  # 필요시 조절, 또는 쿼리파라미터로 뺄 수 있음

    response["tracks_topk"] = _get_tracks_for_ports(vsl_id, latest_ports, max_points=MAX_TRACK_POINTS)


    return response


# TOP-K 항구 트랙 묶어서 불러오기
# === main.py 안 (_load_df_all 아래 근처에 추가) ===
from typing import Iterable, Tuple

def _get_track_for_port(vsl_id: str, port_id: str, max_points: int | None = None) -> list[dict]:
    """
    ais_all.csv에서 (vsl_id AND port_id) 조건으로 행로를 시간순으로 반환.
    max_points가 주어지면 앞뒤로 고르게 샘플링(간단 decimate).
    """
    df_all = _load_df_all()
    sub = df_all[
        (df_all["vsl_id"].astype(str).str.strip() == str(vsl_id).strip()) &
        (df_all["port_id"].astype(str).str.strip() == str(port_id).strip())
    ]
    if sub.empty:
        return []

    sub = sub.sort_values("time_stamp")
    lat = sub["lat"].astype(float).to_numpy()
    lon = sub["lon"].astype(float).to_numpy()
    ts  = sub["time_stamp"].astype(str).to_numpy()

    # 필요 시 간단 샘플링(균등 인덱스)
    if max_points and len(sub) > max_points:
        idx = np.linspace(0, len(sub) - 1, max_points, dtype=int)
        lat, lon, ts = lat[idx], lon[idx], ts[idx]

    return [{"time_stamp": t, "lat": float(a), "lon": float(b)} for t, a, b in zip(ts, lat, lon)]

def _get_tracks_for_ports(vsl_id: str, ports: Iterable[Tuple[int, str]], max_points: int | None = None) -> list[dict]:
    """
    ports: [(rank, port_id), ...] 형태.
    각 port_id 별로 트랙을 뽑아 [{rank, port_id, track:[...]}, ...] 로 반환.
    """
    out = []
    for rank, pid in ports:
        track = _get_track_for_port(vsl_id, pid, max_points=max_points)
        out.append({"rank": rank, "port_id": pid, "track": track})
    return out




# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs
