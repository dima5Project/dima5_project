from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from predict_logic import predict, TIMEPOINTS

# -------------------- FastAPI & CORS --------------------
app = FastAPI(title="Port Prediction API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Paths & Caches --------------------
BASE_DIR        = Path(__file__).resolve().parent
AIS_TP_PATH     = BASE_DIR / "data" / "ais_timepoint.csv"  # vsl별 스냅샷
ROUTE_VSL_PATH  = BASE_DIR / "data" / "route.csv"          # vsl별 전체 항적(시간순)
PSO_PORT_PATH   = BASE_DIR / "data" / "pso_route.csv"      # 항구별 대표 경로(각 항구 100행, 시간순)

_DF_TP_CACHE: Optional[pd.DataFrame] = None
_DF_ROUTE_VSL_CACHE: Optional[pd.DataFrame] = None
_DF_PSO_PORT_CACHE: Optional[pd.DataFrame] = None

# -------------------- Normalize -------------------------
def _normalize_colname(s: str) -> str:
    return "" if s is None else str(s).replace("\ufeff", "").strip().lower()

def _normalize_vsl_id(s: str) -> str:
    return "" if s is None else str(s).strip().replace("\ufeff","").replace("\n","").replace("\r","").replace("\t","").lower()

def _normalize_port_id(s: str) -> str:
    return "" if s is None else str(s).strip().replace("\ufeff","").replace("\n","").replace("\r","").replace("\t","").upper()

# -------------------- CSV Loader ------------------------
def _read_csv_clean(path: Path, required_cols: List[str]) -> pd.DataFrame:
    if not path.exists():
        raise HTTPException(500, f"CSV not found: {path}")
    df = pd.read_csv(path, engine="python", sep=None)
    df.columns = [_normalize_colname(c) for c in df.columns]

    # 동의어 매핑
    synonyms = {"timestamp": "time_stamp", "time": "time_stamp", "longitude": "lon", "latitude": "lat"}
    for k, v in synonyms.items():
        if k in df.columns and v not in df.columns:
            df = df.rename(columns={k: v})

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(422, f"Missing required columns in {path.name}: {missing} | available: {list(df.columns)}")

    if "time_stamp" in df.columns:
        df["time_stamp"] = pd.to_datetime(df["time_stamp"], errors="coerce")
    for num_col in ("lat", "lon", "pso_lat", "pso_lon", "time_point"):
        if num_col in df.columns:
            df[num_col] = pd.to_numeric(df[num_col], errors="coerce")
    return df

def _load_df_tp() -> pd.DataFrame:
    global _DF_TP_CACHE
    if _DF_TP_CACHE is None:
        _DF_TP_CACHE = _read_csv_clean(
            AIS_TP_PATH,
            required_cols=["port_id","vsl_id","time_stamp","time_point","lat","lon","cog","heading"],
        )
    return _DF_TP_CACHE

def _load_df_route_vsl() -> pd.DataFrame:
    global _DF_ROUTE_VSL_CACHE
    if _DF_ROUTE_VSL_CACHE is None:
        _DF_ROUTE_VSL_CACHE = _read_csv_clean(
            ROUTE_VSL_PATH,
            required_cols=["port_id","vsl_id","time_stamp","lat","lon","cog","heading"],
        )
    return _DF_ROUTE_VSL_CACHE

def _load_df_pso_port() -> pd.DataFrame:
    global _DF_PSO_PORT_CACHE
    if _DF_PSO_PORT_CACHE is None:
        df = _read_csv_clean(PSO_PORT_PATH, required_cols=["port_id"])
        # 좌표 컬럼 통일
        if "pso_lat" in df.columns and "pso_lon" in df.columns:
            df = df.rename(columns={"pso_lat":"lat","pso_lon":"lon"})
        elif not ("lat" in df.columns and "lon" in df.columns):
            raise HTTPException(422, f"pso_route.csv must have (pso_lat,pso_lon) or (lat,lon). available: {list(df.columns)}")
        df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
        df["lon"] = pd.to_numeric(df["lon"], errors="coerce")
        df = df.dropna(subset=["lat","lon"])
        _DF_PSO_PORT_CACHE = df
    return _DF_PSO_PORT_CACHE

# -------------------- Helpers ---------------------------
def _nearest_model_tp(tp_float: float) -> int:
    for t in TIMEPOINTS:
        if tp_float <= t + 1:
            return t
    return TIMEPOINTS[-1]

def _pick_row_for_t(sub: pd.DataFrame, t: int) -> pd.Series:
    s = sub["time_point"].astype(float)
    mask = s <= t
    idx = s[mask].idxmax() if mask.any() else (s.sub(t).abs()).idxmin()
    return sub.loc[idx]

def _round_prob(v: float, nd: int=6) -> float:
    try: return round(float(v), nd)
    except Exception: return float(v)

def _to_clean_track(sub: pd.DataFrame, lat_col="lat", lon_col="lon", ts_col: Optional[str]="time_stamp") -> List[Dict[str,float]]:
    if lat_col not in sub.columns or lon_col not in sub.columns:
        return []
    sub = sub.copy()
    sub[lat_col] = pd.to_numeric(sub[lat_col], errors="coerce")
    sub[lon_col] = pd.to_numeric(sub[lon_col], errors="coerce")
    sub = sub.dropna(subset=[lat_col, lon_col])
    if ts_col and ts_col in sub.columns:
        sub = sub.sort_values(ts_col).drop_duplicates(subset=[lat_col, lon_col, ts_col], keep="first")
    else:
        sub = sub.drop_duplicates(subset=[lat_col, lon_col], keep="first")
    pts, prev = [], None
    for _, r in sub.iterrows():
        cur = (float(r[lat_col]), float(r[lon_col]))
        if prev is None or cur != prev:
            pts.append({"lat": cur[0], "lon": cur[1]})
            prev = cur
    return pts

# -------------------- Tracks 생성 ------------------------
def _get_route_for_vsl(vsl_id: str) -> List[Dict[str, float]]:
    df = _load_df_route_vsl()
    vid = _normalize_vsl_id(vsl_id)
    sub = df[df["vsl_id"].apply(_normalize_vsl_id) == vid]
    return _to_clean_track(sub, lat_col="lat", lon_col="lon", ts_col="time_stamp")

def _get_pso_route_for_port(port_id: str) -> List[Dict[str, float]]:
    df = _load_df_pso_port()
    pid = _normalize_port_id(port_id)
    sub = df[df["port_id"].apply(_normalize_port_id) == pid]
    ts_col = "time_stamp" if "time_stamp" in sub.columns else None
    return _to_clean_track(sub, lat_col="lat", lon_col="lon", ts_col=ts_col)

def _get_port_routes_for_ports_with_vsl(latest_ports: List[Tuple[int, str]], vsl_id: str) -> List[Dict[str, Any]]:
    """
    Top-K 항구 항로 생성.
    - rank == 1 → 현재 선박의 실제 항로(route.csv 기반) 사용 (tracks_topk에 단 1회)
    - rank >= 2 → pso_route.csv(항구 대표 경로) 사용
    """
    out: List[Dict[str, Any]] = []
    route_vsl_track = _get_route_for_vsl(vsl_id)

    seen_rank1 = False
    for rank, pid in latest_ports:
        if rank == 1:
            if seen_rank1:
                continue
            out.append({"rank": 1, "port_id": pid, "track": route_vsl_track})
            seen_rank1 = True
        else:
            out.append({"rank": rank, "port_id": pid, "track": _get_pso_route_for_port(pid)})
    return out

# -------------------- Endpoint --------------------------
@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(vsl_id: str = Query(..., description="CSV의 vsl_id")) -> Dict[str, Any]:

    include_current_in_timeline = False  # 현재 시점은 latest에만

    # 1) vsl_id 스냅샷
    df_tp = _load_df_tp()
    sub_tp = df_tp[df_tp["vsl_id"].apply(_normalize_vsl_id) == _normalize_vsl_id(vsl_id)]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    # 최신 행/모델 시점
    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp  = float(row_latest["time_point"])
    current_model_tp = _nearest_model_tp(latest_tp)

    response: Dict[str, Any] = {"vsl_id": str(vsl_id)}

    # 2) latest
    lat_c = float(row_latest["lat"]); lon_c = float(row_latest["lon"])
    cog_c = float(row_latest["cog"]); heading_c = float(row_latest["heading"])
    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, latest_tp)
    preds = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i, (pid, p) in enumerate(top3_current)]

    now_ts = datetime.now()
    response["latest"] = {
        "time_point": int(used_current),
        "actual_time_point": latest_tp,
        "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
        "lat": lat_c, "lon": lon_c, "cog": cog_c, "heading": heading_c,
        "departure_time": (now_ts - timedelta(hours=latest_tp)).strftime("%Y-%m-%d %H:%M:%S"),
        "predictions": preds,
    }

    # 3) timeline (현재 시점 제외)
    steps = [t for t in TIMEPOINTS if t < current_model_tp] if not include_current_in_timeline else [t for t in TIMEPOINTS if t <= current_model_tp]
    timeline: List[Dict[str, Any]] = []
    for t in steps:
        row_t = _pick_row_for_t(sub_tp, t)
        lat = float(row_t["lat"]); lon = float(row_t["lon"])
        used_tp, top3 = predict(lat, lon, float(row_t["cog"]), float(row_t["heading"]), t)
        preds_t = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i, (pid, p) in enumerate(top3)]
        timeline.append({
            "time_point": int(used_tp),
            "time_stamp": str(row_t["time_stamp"]),
            "actual_time_point": float(row_t["time_point"]),
            "lat": lat, "lon": lon, "cog": float(row_t["cog"]), "heading": float(row_t["heading"]),
            "predictions": preds_t
        })
    response["timeline"] = sorted(timeline, key=lambda x: x["time_point"])

    # 4) tracks_topk (Top-1은 route.csv 기반, 단 1회; Top-2/3은 pso_route.csv)
    latest_ports: List[Tuple[int, str]] = [(p["rank"], p["port_id"]) for p in response["latest"]["predictions"]]
    response["tracks_topk"] = _get_port_routes_for_ports_with_vsl(latest_ports, vsl_id)

    # ★ route_vsl은 응답에 포함하지 않음 (요청사항)
    return response



# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs