from typing import Optional, List, Dict, Any, Tuple, Iterable
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from predict_logic import predict, TIMEPOINTS

# -------------------- FastAPI & CORS --------------------
app = FastAPI(title="Port Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 필요 시 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Paths & Caches --------------------
BASE_DIR = Path(__file__).resolve().parent
AIS_TP_PATH    = BASE_DIR / "data" / "ais_timepoint.csv"  # vsl별 스냅샷
PSO_ROUTE_PATH = BASE_DIR / "data" / "pso_route.csv"      # 항구별 대표경로(각 100점, 시간순)

_DF_TP_CACHE: Optional[pd.DataFrame] = None
_DF_PSO_CACHE: Optional[pd.DataFrame] = None

# -------------------- Normalize Utils -------------------
def _normalize_colname(name: str) -> str:
    if name is None:
        return ""
    return str(name).replace("\ufeff", "").strip().lower()

def _normalize_vsl_id(val: str) -> str:
    if val is None:
        return ""
    return (
        str(val).strip()
        .replace("\ufeff", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("\t", "")
        .lower()
    )

def _normalize_port_id(val: str) -> str:
    if val is None:
        return ""
    return (
        str(val).strip()
        .replace("\ufeff", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("\t", "")
        .upper()
    )

# -------------------- Safe CSV Loader -------------------
def _read_csv_clean(path: Path, required_cols: List[str]) -> pd.DataFrame:
    """
    - 구분자 자동 추론(sep=None, engine='python')
    - 헤더 정규화(BOM 제거, strip, lower)
    - 동의어 일부 매핑
    - 존재하는 수치/시간 컬럼만 안전 변환
    """
    if not path.exists():
        raise HTTPException(500, f"CSV not found: {path}")

    df = pd.read_csv(path, engine="python", sep=None)
    original_cols = list(df.columns)
    df.columns = [_normalize_colname(c) for c in original_cols]

    synonyms = {
        "timestamp": "time_stamp",
        "time": "time_stamp",
        "longitude": "lon",
        "latitude": "lat",
    }
    for k, v in synonyms.items():
        if k in df.columns and v not in df.columns:
            df = df.rename(columns={k: v})

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(
            422,
            f"Missing required columns in {path.name}: {missing} | available: {list(df.columns)}"
        )

    if "time_stamp" in df.columns:
        df["time_stamp"] = pd.to_datetime(df["time_stamp"], errors="coerce")
    for num_col in ("lat", "lon", "pso_lat", "pso_lon", "time_point"):
        if num_col in df.columns:
            df[num_col] = pd.to_numeric(df[num_col], errors="coerce")

    return df

def _load_df_tp() -> pd.DataFrame:
    """AIS 스냅샷 로딩 (vsl_id별 최신 위치/특징)"""
    global _DF_TP_CACHE
    if _DF_TP_CACHE is None:
        _DF_TP_CACHE = _read_csv_clean(
            AIS_TP_PATH,
            required_cols=["port_id", "vsl_id", "time_stamp", "time_point", "lat", "lon", "cog", "heading"],
        )
    return _DF_TP_CACHE

def _load_df_pso() -> pd.DataFrame:
    """항구별 대표경로 로딩 (port_id, pso_lat, pso_lon) — 이미 시간순, 각 항구 100행"""
    global _DF_PSO_CACHE
    if _DF_PSO_CACHE is None:
        _DF_PSO_CACHE = _read_csv_clean(
            PSO_ROUTE_PATH,
            required_cols=["port_id", "pso_lat", "pso_lon"],
        )
    return _DF_PSO_CACHE

# -------------------- Helpers ---------------------------
def _nearest_model_tp(tp_float: float) -> int:
    for t in TIMEPOINTS:
        if tp_float <= t + 1:
            return t
    return TIMEPOINTS[-1]

def _pick_row_for_t(sub: pd.DataFrame, t: int) -> pd.Series:
    s = sub["time_point"].astype(float)
    mask = s <= t
    if mask.any():
        idx = s[mask].idxmax()
    else:
        idx = (s.sub(t).abs()).idxmin()
    return sub.loc[idx]

def _round_prob(v: float, nd: int = 6) -> float:
    try:
        return round(float(v), nd)
    except Exception:
        return float(v)

# -------------------- PSO Routes ------------------------
def _get_pso_route_for_port(port_id: str) -> List[Dict[str, float]]:
    """
    pso_route.csv에서 port_id에 해당하는 대표경로(이미 시간순, 각 항구 100행)를 그대로 반환.
    출력 포맷: [{"lat": float, "lon": float}, ...]  ← time_stamp 없음
    """
    df = _load_df_pso()
    pid_norm = _normalize_port_id(port_id)
    sub = df[df["port_id"].apply(_normalize_port_id) == pid_norm].copy()

    if sub.empty:
        return []

    sub["pso_lat"] = pd.to_numeric(sub["pso_lat"], errors="coerce")
    sub["pso_lon"] = pd.to_numeric(sub["pso_lon"], errors="coerce")
    sub = sub.dropna(subset=["pso_lat", "pso_lon"])

    out: List[Dict[str, float]] = [
        {"lat": float(r["pso_lat"]), "lon": float(r["pso_lon"])}
        for _, r in sub.iterrows()
    ]
    return out

def _get_pso_routes_for_ports(ports: Iterable[Tuple[int, str]]) -> List[Dict[str, Any]]:
    """
    ports: [(rank, port_id), ...]
    반환: [{"rank": rank, "port_id": pid, "track": [{"lat","lon"}, ...]}, ...]
    """
    out: List[Dict[str, Any]] = []
    for rank, pid in ports:
        route = _get_pso_route_for_port(pid)
        out.append({"rank": rank, "port_id": pid, "track": route})
    return out

# -------------------- Endpoint --------------------------
@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(
    vsl_id: str = Query(..., description="CSV의 vsl_id"),
) -> Dict[str, Any]:

    # 항상 both + 타임라인에 현재 모델 시점 포함
    include_current_in_timeline = True

    # 1) vsl_id 행 필터
    df_tp = _load_df_tp()
    vsl_id_clean = _normalize_vsl_id(vsl_id)
    sub_tp = df_tp[df_tp["vsl_id"].apply(_normalize_vsl_id) == vsl_id_clean]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    # 최신 행 및 모델 시점
    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp  = float(row_latest["time_point"])
    current_model_tp = _nearest_model_tp(latest_tp)

    response: Dict[str, Any] = {"vsl_id": str(vsl_id)}

    # 2) latest 카드 (항상 생성)
    lat_c = float(row_latest["lat"]); lon_c = float(row_latest["lon"])
    cog_c = float(row_latest["cog"]); heading_c = float(row_latest["heading"])

    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, latest_tp)
    preds = [
        {"rank": i + 1, "port_id": pid, "prob": _round_prob(p)}
        for i, (pid, p) in enumerate(top3_current)
    ]

    now_ts = datetime.now()
    departure_ts = now_ts - timedelta(hours=latest_tp)

    response["latest"] = {
        "time_point": int(used_current),
        "actual_time_point": latest_tp,
        "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),             # 서버 현재시각
        "departure_time": departure_ts.strftime("%Y-%m-%d %H:%M:%S"),   # 현재시각 - latest_tp(hours)
        "lat": lat_c, "lon": lon_c, "cog": cog_c, "heading": heading_c, # 현재 위치/특징
        "predictions": preds,
    }

    # 3) timeline (항상 생성 + 현재 모델 시점 포함)
    steps = [t for t in TIMEPOINTS if (t < current_model_tp) or (include_current_in_timeline and t <= current_model_tp)]
    timeline: List[Dict[str, Any]] = []
    for t in steps:
        row_t = _pick_row_for_t(sub_tp, t)
        lat = float(row_t["lat"]); lon = float(row_t["lon"])
        cog = float(row_t["cog"]); heading = float(row_t["heading"])
        used_tp, top3 = predict(lat, lon, cog, heading, t)

        preds_t = [
            {"rank": i + 1, "port_id": pid, "prob": _round_prob(p)}
            for i, (pid, p) in enumerate(top3)
        ]

        timeline.append({
            "time_point": int(used_tp),
            "time_stamp": str(row_t["time_stamp"]),
            "actual_time_point": float(row_t["time_point"]),
            "lat": lat, "lon": lon, "cog": cog, "heading": heading,
            "predictions": preds_t
        })
    timeline = sorted(timeline, key=lambda x: x["time_point"])
    response["timeline"] = timeline

    # 4) Top-3 항구 대표경로(pso_route.csv) — time_stamp 없이 lat/lon만
    latest_ports: List[Tuple[int, str]] = []
    if response["latest"]["predictions"]:
        latest_ports = [(p["rank"], p["port_id"]) for p in response["latest"]["predictions"]]
    response["tracks_topk"] = _get_pso_routes_for_ports(latest_ports)

    return response







# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs

