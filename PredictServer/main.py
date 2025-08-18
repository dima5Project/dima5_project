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
BASE_DIR         = Path(__file__).resolve().parent
DATA_DIR         = BASE_DIR / "data"
AIS_TP_PATH      = DATA_DIR / "ais_timepoint.csv"
ROUTE_VSL_PATH   = DATA_DIR / "route.csv"
PSO_PORT_PATH    = DATA_DIR / "pso_route.csv"
MEDIAN_DUR_PATH  = DATA_DIR / "median_duration.csv"

_DF_TP_CACHE: Optional[pd.DataFrame] = None
_DF_ROUTE_VSL_CACHE: Optional[pd.DataFrame] = None
_DF_PSO_PORT_CACHE: Optional[pd.DataFrame] = None
_PORT_MEDIAN_CACHE: Optional[Dict[str, float]] = None

# -------------------- Normalize -------------------------
def _normalize_colname(s: str) -> str:
    return "" if s is None else str(s).replace("\ufeff", "").strip().lower()

def _normalize_vsl_id(s: str) -> str:
    return "" if s is None else (
        str(s).strip()
        .replace("\ufeff","").replace("\n","").replace("\r","").replace("\t","")
        .lower()
    )

def _normalize_port_id(s: str) -> str:
    return "" if s is None else (
        str(s).strip()
        .replace("\ufeff","").replace("\n","").replace("\r","").replace("\t","")
        .replace(" ","")
        .upper()
    )

# -------------------- CSV Loader ------------------------
def _read_csv_clean(path: Path, required_cols: List[str]) -> pd.DataFrame:
    if not path.exists():
        raise HTTPException(500, f"CSV not found: {path}")
    df = pd.read_csv(path, engine="python", sep=None)
    df.columns = [_normalize_colname(c) for c in df.columns]

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
        cols = set(df.columns)
        if {"pso_lat","pso_lon"} <= cols:
            df = df.rename(columns={"pso_lat":"lat","pso_lon":"lon"})
        elif {"latitude","longitude"} <= cols:
            df = df.rename(columns={"latitude":"lat","longitude":"lon"})
        df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
        df["lon"] = pd.to_numeric(df["lon"], errors="coerce")
        df = df.dropna(subset=["lat","lon"])
        _DF_PSO_PORT_CACHE = df
    return _DF_PSO_PORT_CACHE

def _load_port_median() -> Dict[str, float]:
    global _PORT_MEDIAN_CACHE
    if _PORT_MEDIAN_CACHE is not None:
        return _PORT_MEDIAN_CACHE
    if not MEDIAN_DUR_PATH.exists():
        _PORT_MEDIAN_CACHE = {}
        return _PORT_MEDIAN_CACHE
    df = pd.read_csv(MEDIAN_DUR_PATH, engine="python", sep=None)
    df.columns = [_normalize_colname(c) for c in df.columns]
    if "port_id" not in df.columns or "median_duration_hr" not in df.columns:
        raise HTTPException(422, f"median_duration.csv must contain ['port_id','median_duration_hr']")
    result: Dict[str, float] = {}
    for _, r in df.iterrows():
        pid = _normalize_port_id(r["port_id"])
        result[pid] = float(r["median_duration_hr"])
    _PORT_MEDIAN_CACHE = result
    return _PORT_MEDIAN_CACHE

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
    return _to_clean_track(sub, "lat","lon","time_stamp")

def _get_pso_route_for_port(port_id: str) -> List[Dict[str, float]]:
    df = _load_df_pso_port()
    pid = _normalize_port_id(port_id)
    sub = df[df["port_id"].apply(_normalize_port_id) == pid]
    ts_col = "time_stamp" if "time_stamp" in sub.columns else None
    return _to_clean_track(sub, "lat","lon", ts_col)

def _get_port_routes_for_ports_with_vsl(latest_ports: List[Tuple[int, str]], vsl_id: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    route_vsl_track = _get_route_for_vsl(vsl_id)
    seen_rank1 = False
    for rank, pid in latest_ports:
        if rank == 1:
            if seen_rank1: continue
            out.append({"rank": 1, "port_id": pid, "track": route_vsl_track})
            seen_rank1 = True
        else:
            out.append({"rank": rank, "port_id": pid, "track": _get_pso_route_for_port(pid)})
    return out

# -------------------- ETA Helper ------------------------
def _attach_eta_to_preds(preds: List[Dict[str, Any]], actual_tp: float, now_ts: datetime) -> List[Dict[str, Any]]:
    med = _load_port_median()
    out: List[Dict[str, Any]] = []
    for p in preds:
        pid = _normalize_port_id(p["port_id"])
        rec = dict(p)
        if pid in med:
            hours_left = max(0.0, float(med[pid]) - float(actual_tp))
            eta_dt = now_ts + timedelta(hours=hours_left)
            rec["eta_hours_left"] = round(hours_left, 6)
            rec["eta"] = eta_dt.strftime("%Y-%m-%d %H:%M:%S")
        out.append(rec)
    return out

# -------------------- Endpoint --------------------------
@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(vsl_id: str = Query(...)) -> Dict[str, Any]:
    """
    정책:
        - tp == 999 : 409 + 도착 항구 pso 경로 (예측/타임라인/트랙 없음)
        - tp < 3h   : 모델 미실행, 현재 위치만 반환
        - 3h ≤ tp < 30h : _nearest_model_tp 규칙
        - tp ≥ 30h : 29h 모델
        - timeline: 현재 시점 제외
        - 항로: rank1=route.csv, rank2/3=pso_route.csv
        - ETA: latest.predictions rank1~3에만 부착
    """
    df_tp = _load_df_tp()
    sub_tp = df_tp[df_tp["vsl_id"].apply(_normalize_vsl_id) == _normalize_vsl_id(vsl_id)]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp = float(row_latest["time_point"])
    now_ts = datetime.now()

    # ✅ 999
    if int(latest_tp) == 999:
        arrived_pid = _normalize_port_id(row_latest["port_id"])
        pso_track = _get_pso_route_for_port(arrived_pid)
        raise HTTPException(
            409,
            detail={
                "code": "arrived_ship",
                "port_id": arrived_pid,
                "track": pso_track
            }
        )

    # ✅ < 3h
    if latest_tp < 3:
        return {
            "vsl_id": vsl_id,
            "latest": {
                "actual_time_point": latest_tp,
                "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
                "lat": float(row_latest["lat"]),
                "lon": float(row_latest["lon"]),
                "cog": float(row_latest["cog"]),
                "heading": float(row_latest["heading"]),
                "predictions": []
            },
            "timeline": [],
            "tracks_topk": []
        }

    # ✅ 모델 시점 결정
    snap_tp = 29 if latest_tp >= 30 else _nearest_model_tp(latest_tp)

    # latest predictions + ETA
    lat_c, lon_c = float(row_latest["lat"]), float(row_latest["lon"])
    cog_c, heading_c = float(row_latest["cog"]), float(row_latest["heading"])
    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, snap_tp)

    preds = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i,(pid,p) in enumerate(top3_current)]
    preds = _attach_eta_to_preds(preds, actual_tp=latest_tp, now_ts=now_ts)

    response = {
        "vsl_id": vsl_id,
        "latest": {
            "used_time_point": used_current,
            "actual_time_point": latest_tp,
            "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "lat": lat_c, "lon": lon_c, "cog": cog_c, "heading": heading_c,
            "predictions": preds
        }
    }

    # timeline
    timeline = []
    for t in [x for x in TIMEPOINTS if x < snap_tp]:
        row_t = _pick_row_for_t(sub_tp, t)
        used_tp, top3 = predict(float(row_t["lat"]), float(row_t["lon"]),
                                float(row_t["cog"]), float(row_t["heading"]), int(t))
        preds_t = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i,(pid,p) in enumerate(top3)]
        timeline.append({
            "time_point": int(used_tp),
            "time_stamp": str(row_t["time_stamp"]),
            "actual_time_point": float(row_t["time_point"]),
            "lat": float(row_t["lat"]), "lon": float(row_t["lon"]),
            "cog": float(row_t["cog"]), "heading": float(row_t["heading"]),
            "predictions": preds_t
        })
    response["timeline"] = sorted(timeline, key=lambda x: x["time_point"])

    # tracks
    latest_ports: List[Tuple[int, str]] = [(p["rank"], p["port_id"]) for p in response["latest"]["predictions"]]
    response["tracks_topk"] = _get_port_routes_for_ports_with_vsl(latest_ports, vsl_id)

    return response


# 실행 예:
# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs
