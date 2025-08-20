from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import os
import pymysql

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from predict_logic import predict, TIMEPOINTS

# =========================
# 0) 환경 변수 (.env) 로드
# =========================
# predict.env 예:
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=root
# DB_NAME=portcast
load_dotenv("predict.env")

# =========================
# 1) DB 헬퍼 (PyMySQL)
# =========================
def get_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "portcast"),
        port=int(os.getenv("DB_PORT", "3306")),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )

def _quantize_prob(p: float) -> str:
    """DECIMAL(5,2)에 맞춰 반올림 문자열로 변환."""
    return str(Decimal(str(p)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def _ensure_eta_str(eta_str: Optional[str]) -> str:
    """eta가 None/빈값이면 현재 시각으로 대체. 형식이 틀리면 경고 로그 후 현재 시각."""
    if eta_str and eta_str.strip():
        try:
            datetime.strptime(eta_str, "%Y-%m-%d %H:%M:%S")
            return eta_str
        except ValueError:
            print(f"[WARN] Invalid ETA format: {eta_str} -> using now()")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def save_top1_raw(*, eta_str: Optional[str], lat: float, lon: float,
            vsl_id: str, top1_port: str, top1_prob: float, user_id: str) -> int:
    """
    result_save에 1건 저장하고 save_seq 반환.
    테이블 스키마:
        save_seq PK AI, eta NOT NULL, lat DECIMAL(15,10), lon DECIMAL(15,10),
        search_vsl, top1_port, top1_pred DECIMAL(5,2), user_id (FK predict_user.user_id)
    """
    sql = """
    INSERT INTO result_save
        (eta, lat, lon, vsl_id, top1_port, top1_pred, user_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                [
                    _ensure_eta_str(eta_str),
                    Decimal(str(lat)),  # DECIMAL(15,10) 안전 변환
                    Decimal(str(lon)),
                    vsl_id,
                    top1_port,
                    _quantize_prob(float(top1_prob)),  # DECIMAL(5,2)
                    user_id,
                ],
            )
        conn.commit()
        with conn.cursor() as cur2:
            cur2.execute("SELECT LAST_INSERT_ID() AS id")
            rid = cur2.fetchone()["id"]
        return rid
    finally:
        conn.close()

# =========================
# 2) FastAPI & CORS
# =========================
app = FastAPI(title="Port Prediction API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 필요시 도메인으로 좁히기
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 3) Paths & Caches
# =========================
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

# =========================
# 4) Normalize helpers
# =========================
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

# =========================
# 5) CSV Loader
# =========================
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

# =========================
# 6) 예측 보조 함수들
# =========================
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

# =========================
# 7) Tracks 생성
# =========================
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

# =========================
# 8) ETA Helper
# =========================
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

# =========================
# 9) "현재 시점" 예측만 계산 (저장에 재사용)
# =========================
def _predict_latest_for_vsl(vsl_id: str) -> Dict[str, Any]:
    """GET과 동일한 규칙으로 '현재 시점' 예측만 계산."""
    df_tp = _load_df_tp()
    sub_tp = df_tp[df_tp["vsl_id"].apply(_normalize_vsl_id) == _normalize_vsl_id(vsl_id)]
    if sub_tp.empty:
        raise HTTPException(404, f"No rows in ais_timepoint.csv for vsl_id={vsl_id}")

    row_latest = sub_tp.loc[sub_tp["time_point"].idxmax()]
    latest_tp = float(row_latest["time_point"])
    now_ts = datetime.now()

    if int(latest_tp) == 999:
        raise HTTPException(409, detail={"code": "arrived_ship", "port_id": _normalize_port_id(row_latest["port_id"])})

    if latest_tp < 3:
        return {
            "time_point": latest_tp,
            "lat": float(row_latest["lat"]),
            "lon": float(row_latest["lon"]),
            "predictions": []  # 저장 불가(모델 미실행)
        }

    snap_tp = 29 if latest_tp >= 30 else _nearest_model_tp(latest_tp)
    lat_c, lon_c = float(row_latest["lat"]), float(row_latest["lon"])
    cog_c, heading_c = float(row_latest["cog"]), float(row_latest["heading"])
    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, snap_tp)

    preds = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i,(pid,p) in enumerate(top3_current)]
    preds = _attach_eta_to_preds(preds, actual_tp=latest_tp, now_ts=now_ts)

    return {
        "time_point": latest_tp,
        "lat": lat_c,
        "lon": lon_c,
        "used_time_point": used_current,
        "predictions": preds
    }

# =========================
# 10) 예측 API
# =========================
@app.get("/predict_map_by_vsl")
def predict_map_by_vsl(
    vsl_id: str = Query(..., description="검색할 선박 ID")
) -> Dict[str, Any]:
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

    # ✅ 999 (도착)
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

    # ✅ < 3h (예측 안 하고 위치만)
    if latest_tp < 3:
        return {
            "vsl_id": vsl_id,
            "status": "timepoint less than 3hours",            # NEW: 상태 플래그
            "latest": {
                "used_time_point": None,     # NEW: 스키마 통일
                "actual_time_point": float(latest_tp),
                "time_stamp": now_ts.strftime("%Y-%m-%d %H:%M:%S"),
                "lat": float(row_latest["lat"]),
                "lon": float(row_latest["lon"]),
                "cog": float(row_latest["cog"]),
                "heading": float(row_latest["heading"]),
                "predictions": []            # 그대로
            },
            "note": "tp<3h: only current position returned"  # 선택
        }

    # ✅ 모델 시점 결정
    snap_tp = 29 if latest_tp >= 30 else _nearest_model_tp(latest_tp)

    # latest predictions + ETA
    lat_c, lon_c = float(row_latest["lat"]), float(row_latest["lon"])
    cog_c, heading_c = float(row_latest["cog"]), float(row_latest["heading"])
    used_current, top3_current = predict(lat_c, lon_c, cog_c, heading_c, snap_tp)

    preds = [{"rank": i+1, "port_id": pid, "prob": _round_prob(p)} for i,(pid,p) in enumerate(top3_current)]
    preds = _attach_eta_to_preds(preds, actual_tp=latest_tp, now_ts=now_ts)

    response: Dict[str, Any] = {
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
    timeline: List[Dict[str, Any]] = []
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

# =========================
# 11) 저장 버튼용 API (JSON 본문 없이 쿼리만)
# =========================
@app.post("/save_by_vsl")
def save_by_vsl(
    vsl_id: str = Query(..., description="저장할 선박 ID"),
    user_id: str = Query(..., description="predict_user.user_id 과 일치")
):
    """
    화면에서 '저장' 버튼 누를 때 호출.
    바디 없이 /save_by_vsl?vsl_id=...&user_id=... 만으로 저장 수행.
    """
    latest = _predict_latest_for_vsl(vsl_id)
    top1 = next((p for p in latest["predictions"] if p.get("rank") == 1), None)
    if not top1:
        raise HTTPException(400, "Top-1 예측이 없어 저장할 수 없습니다.(tp<3h 이거나 예측없음)")

    try:
        save_id = save_top1_raw(
            eta_str=top1.get("eta"),
            lat=latest["lat"],
            lon=latest["lon"],
            vsl_id=vsl_id,
            top1_port=top1["port_id"],
            top1_prob=float(top1["prob"]),
            user_id=user_id
        )
        return {
            "ok": True,
            "save_seq": save_id,
            "saved": {
                "vsl_id": vsl_id,
                "user_id": user_id,
                "top1_port": top1["port_id"],
                "top1_prob": float(top1["prob"]),
                "eta": top1.get("eta")
            }
        }
    except pymysql.err.IntegrityError as e:
        msg = e.args[1] if len(e.args) > 1 else str(e)
        # (예) 1452: Cannot add or update a child row: a foreign key constraint fails
        raise HTTPException(400, f"Integrity error: {msg}")

# =========================
# 12) (옵션) DB 헬스체크
# =========================
@app.get("/health/db")
def health_db():
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            return {"ok": True}
    except Exception as e:
        raise HTTPException(500, f"DB error: {e}")

# 실행 예:
# cd C:\dima5_project\PredictServer
# python -m uvicorn main:app --reload
# http://127.0.0.1:8000/docs
# http://127.0.0.1:8000/predict_map_by_vsl?vsl_id=193342ef-09db-3821-b67f-c4c0fa27418e
# http://127.0.0.1:8000/predict_map_by_vsl?vsl_id=${vslIdToFetch}