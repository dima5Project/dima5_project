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
AIS_TP_PATH      = DATA_DIR / "ais_timepoint.csv"         # vsl별 ais 최신 스냅샷
ROUTE_VSL_PATH   = DATA_DIR / "route.csv"                 # vsl별 전체 항적(시간순)
PSO_PORT_PATH    = DATA_DIR / "pso_route.csv"             # 항구별 대표 경로(시간순 가정)
MEDIAN_DUR_PATH  = DATA_DIR / "median_duration.csv"       # (port_id, median_duration_hr)

_DF_TP_CACHE: Optional[pd.DataFrame] = None
_DF_ROUTE_VSL_CACHE: Optional[pd.DataFrame] = None
_DF_PSO_PORT_CACHE: Optional[pd.DataFrame] = None
_PORT_MEDIAN_CACHE: Optional[Dict[str, float]] = None  # {"KRKPO": 17.5, ...}

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
        cols = set(df.columns)
        # 좌표 컬럼 통합: pso_lat/pso_lon > lat/lon > latitude/longitude
        if {"pso_lat","pso_lon"} <= cols:
            df = df.rename(columns={"pso_lat":"lat","pso_lon":"lon"})
        elif {"lat","lon"} <= cols:
            pass
        elif {"latitude","longitude"} <= cols:
            df = df.rename(columns={"latitude":"lat","longitude":"lon"})
        else:
            raise HTTPException(422, f"pso_route.csv must have (pso_lat,pso_lon) or (lat,lon) or (latitude,longitude). available: {list(df.columns)}")
        df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
        df["lon"] = pd.to_numeric(df["lon"], errors="coerce")
        df = df.dropna(subset=["lat","lon"])
        _DF_PSO_PORT_CACHE = df
    return _DF_PSO_PORT_CACHE

def _load_port_median() -> Dict[str, float]:
    """
    median_duration.csv 로더
    - 정확한 컬럼: 'port_id', 'median_duration_hr'
    - 반환: {PORT_ID: median_hours(float)}
    """
    global _PORT_MEDIAN_CACHE
    if _PORT_MEDIAN_CACHE is not None:
        return _PORT_MEDIAN_CACHE

    if not MEDIAN_DUR_PATH.exists():
        _PORT_MEDIAN_CACHE = {}
        return _PORT_MEDIAN_CACHE

    df = pd.read_csv(MEDIAN_DUR_PATH, engine="python", sep=None)
    df.columns = [_normalize_colname(c) for c in df.columns]

    if "port_id" not in df.columns or "median_duration_hr" not in df.columns:
        raise HTTPException(422, f"median_duration.csv must contain columns ['port_id','median_duration_hr']. available: {list(df.columns)}")

    df = df[["port_id", "median_duration_hr"]].copy()
    df["median_duration_hr"] = pd.to_numeric(df["median_duration_hr"], errors="coerce")
    df = df.dropna(subset=["median_duration_hr"])

    result: Dict[str, float] = {}
    for _, r in df.iterrows():
        pid = _normalize_port_id(r["port_id"])
        result[pid] = float(r["median_duration_hr"])

    _PORT_MEDIAN_CACHE = result
    return _PORT_MEDIAN_CACHE

# -------------------- Helpers ---------------------------
def _nearest_model_tp(tp_float: float) -> int:
    """tp_float <= t+1 이면 t를 반환(정수 스냅)"""
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
    """경로 정리: 정렬 → NaN 제거 → 완전/연속 중복 제거"""
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
    """route.csv에서 vsl_id 전체 항적(시간 오름차순, 중복 제거)"""
    df = _load_df_route_vsl()
    vid = _normalize_vsl_id(vsl_id)
    sub = df[df["vsl_id"].apply(_normalize_vsl_id) == vid]
    return _to_clean_track(sub, lat_col="lat", lon_col="lon", ts_col="time_stamp")

def _get_pso_route_for_port(port_id: str) -> List[Dict[str, float]]:
    """pso_route.csv에서 port_id 대표 경로(시간순 가정, 중복 제거)"""
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

def _attach_eta_top1(preds: List[Dict[str, Any]], actual_tp: float, now_ts: datetime) -> List[Dict[str, Any]]:
    """
    ETA를 Top-1 항구에만 부착.
    - median_duration.csv (port_id, median_duration_hr)
    - eta_hours_left = max(0, median_duration_hr - actual_tp)
    - eta = now + eta_hours_left(hours)
    """
    if not preds:
        return preds
    med = _load_port_median()  # {PORT_ID: hours}
    out = [dict(p) for p in preds]  # shallow copy
    top1 = out[0]
    pid = _normalize_port_id(top1.get("port_id", ""))
    if pid and pid in med:
        hours_left = max(0.0, float(med[pid]) - float(actual_tp))
        eta_dt = now_ts + timedelta(hours=hours_left)
        top1["eta_hours_left"] = round(hours_left, 6)
        top1["eta"] = eta_dt.strftime("%Y-%m-%d %H:%M:%S")
    else:
        top1["eta_hours_left"] = None
        top1["eta"] = None
    # rank 2,3에는 ETA 키 자체를 넣지 않음(원하면 None으로 넣어도 됨)
    return out

# -------------------- Endpoint --------------------------
@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(vsl_id: str = Query(..., description="CSV의 vsl_id")) -> Dict[str, Any]:
    """
    정책:
        - tp == 999 : 409(Conflict) + detail에 도착 항구 pso 경로 동봉 (예측/타임라인/트랙 생성 안 함) \n
        - tp < 3h   : 모델 미실행, 현재 위치만 반환 (predictions/timeline/tracks_topk 비움) \n
        - 3h ≤ tp < 30h : _nearest_model_tp 규칙으로 스냅 후 예측 \n
        - tp ≥ 30h : 29h 모델로 예측 \n
        - timeline은 현재 스냅 시점 제외(과거만) \n
        - 항로: rank1=route.csv, rank2/3=pso_route.csv \n
        - ETA: Top-1만 부착 (median_duration_hr 기준)
    """
    include_current_in_timeline = False

    # 1) vsl_id 스냅샷
    df_tp = _load_df_tp()
    sub_tp = df_tp[df_tp["vsl_id"].apply(_normalize_vsl_id) == _normalize_vsl_id(vsl_id)]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    # 최신 행
    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp_raw = row_latest["time_point"]
    try:
        latest_tp = float(latest_tp_raw)
    except Exception:
        latest_tp = float("nan")

    now_ts = datetime.now()

    # ✅ 999: 도착선박 → 409로 즉시 종료 + pso 경로 detail 동봉
    if int(latest_tp) == 999:
        arrived_pid = _normalize_port_id(row_latest["port_id"])
        pso_track = _get_pso_route_for_port(arrived_pid)
        raise HTTPException(
            status_code=409,
            detail={
                "code": "arrived_ship",
                "message": "time_point=999 (already arrived) – no prediction/routes returned",
                "port_id": arrived_pid,
                "track_source": "pso_route.csv",
                "track_points": len(pso_track),
                "track": pso_track,
            },
        )

    # ✅ < 3h : 모델 미실행, 현재 위치만 반환
    if latest_tp < 3:
        return {
            "vsl_id": str(vsl_id),
            "latest": {
                "time_point": None,  # 모델 미실행
                "actual_time_point": latest_tp,
                "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
                "lat": float(row_latest["lat"]),
                "lon": float(row_latest["lon"]),
                "cog": float(row_latest["cog"]),
                "heading": float(row_latest["heading"]),
                "predictions": [],  # 예측 없음
            },
            "timeline": [],
            "tracks_topk": [],
            "route_vsl": [],  # 레거시 호환: 비움
            "note": "<3h: model skipped; only current position returned"
        }

    # ✅ 스냅 시점 결정
    if latest_tp >= 30:
        snap_tp = 29
    else:
        snap_tp = int(_nearest_model_tp(latest_tp))  # 5/8/11/…/29

    # 2) latest 예측
    lat_c = float(row_latest["lat"]); lon_c = float(row_latest["lon"])
    cog_c = float(row_latest["cog"]); heading_c = float(row_latest["heading"])
    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, snap_tp)

    preds = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i, (pid, p) in enumerate(top3_current)]
    preds = _attach_eta_top1(preds, actual_tp=latest_tp, now_ts=now_ts)  # ETA는 top-1만

    response: Dict[str, Any] = {
        "vsl_id": str(vsl_id),
        "latest": {
            "time_point": int(used_current),                 # 스냅된 정수 (예: 5/8/…/29)
            "actual_time_point": latest_tp,                  # 원래 실수값
            "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "departure_time": (now_ts - timedelta(hours=latest_tp)).strftime("%Y-%m-%d %H:%M:%S"),
            "lat": lat_c, "lon": lon_c, "cog": cog_c, "heading": heading_c,
            "predictions": preds,                            # Top-3 (ETA는 top-1만)
        }
    }

    # 3) timeline (현재 스냅 시점 제외; 정수 TIMEPOINTS로 predict 호출)
    steps = [t for t in TIMEPOINTS if t < snap_tp] if not include_current_in_timeline else [t for t in TIMEPOINTS if t <= snap_tp]
    timeline: List[Dict[str, Any]] = []
    for t in steps:
        row_t = _pick_row_for_t(sub_tp, t)
        lat = float(row_t["lat"]); lon = float(row_t["lon"])
        used_tp, top3 = predict(lat, lon, float(row_t["cog"]), float(row_t["heading"]), int(t))
        preds_t = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i, (pid, p) in enumerate(top3)]
        # (원하면 여기에도 _attach_eta_top1 적용 가능)
        timeline.append({
            "time_point": int(used_tp),
            "time_stamp": str(row_t["time_stamp"]),
            "actual_time_point": float(row_t["time_point"]),
            "lat": lat, "lon": lon, "cog": float(row_t["cog"]), "heading": float(row_t["heading"]),
            "predictions": preds_t
        })
    response["timeline"] = sorted(timeline, key=lambda x: x["time_point"])

    # 4) tracks_topk (rank==1: route.csv, rank>=2: pso_route.csv)
    latest_ports: List[Tuple[int, str]] = [(p["rank"], p["port_id"]) for p in response["latest"]["predictions"]]
    tracks = _get_port_routes_for_ports_with_vsl(latest_ports, vsl_id)
    response["tracks_topk"] = tracks

    return response



# 실행 예:
# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs
