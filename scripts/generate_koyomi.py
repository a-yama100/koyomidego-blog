#!/usr/bin/env python3
"""
Koyomi Data Generator - Auto-calculate all calendar data
Usage: python scripts/generate_koyomi.py --year 2026
"""

import argparse
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone
from typing import Optional

# === Timezone ===
JST = timezone(timedelta(hours=9))

# === 1. Eto (Heavenly Stems + Earthly Branches) ===
JIKKAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
JUNISHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# Reference: 2026-01-01 is Kinoe-Tatsu (甲辰) = index 40
# Actually let's use a known reference: 2024-01-01 = 甲子 day? No.
# Known: 2026-02-01 = 丙午 (from user data)
# 丙=2, 午=6 => eto_index = ?
# Eto cycles every 60 days. 丙午 is index 42 (2*6 pattern)
# Actually eto index: find i where JIKKAN[i%10]=丙(2) and JUNISHI[i%12]=午(6)
# i%10=2, i%12=6 => i=42
# So 2026-02-01 has eto_index=42
# Reference date: 2026-02-01, eto_offset=42

REFERENCE_DATE = date(2026, 2, 1)
REFERENCE_ETO_INDEX = 42

def get_eto_index(d):
    delta = (d - REFERENCE_DATE).days
    return (REFERENCE_ETO_INDEX + delta) % 60

def get_eto_name(d):
    idx = get_eto_index(d)
    return JIKKAN[idx % 10] + JUNISHI[idx % 12]

def get_junishi(d):
    idx = get_eto_index(d)
    return JUNISHI[idx % 12]

def get_jikkan(d):
    idx = get_eto_index(d)
    return JIKKAN[idx % 10]


# === 2. Lunar Calendar (simplified Astronomical) ===
# We use skyfield for accurate lunar phases
try:
    from skyfield.api import load
    from skyfield.almanac import moon_phases
    HAS_SKYFIELD = True
except ImportError:
    HAS_SKYFIELD = False
    print("WARNING: skyfield not available. Lunar phases will be approximate.")


def get_lunar_phases_for_year(year):
    """Return dict of date -> phase_name for new/full/quarter moons"""
    if not HAS_SKYFIELD:
        return {}

    ts = load.timescale()
    eph = load('de421.bsp')

    t0 = ts.utc(year, 1, 1)
    t1 = ts.utc(year + 1, 1, 1)

    from skyfield.almanac import find_discrete
    f = moon_phases(eph)
    t, y = find_discrete(t0, t1, f)

    phase_names = {0: '新月', 1: '上弦', 2: '満月', 3: '下弦'}
    result = {}
    for ti, yi in zip(t, y):
        dt = ti.utc_datetime().astimezone(JST)
        d = dt.date()
        result[d] = phase_names[yi]

    return result


# === 3. Solar Terms (Nijushi Sekki) ===
def get_solar_terms_for_year(year):
    if not HAS_SKYFIELD:
        return {}
    ts = load.timescale()
    eph = load('de421.bsp')
    earth, sun = eph['earth'], eph['sun']
    TERM_NAMES = [
        '小寒', '大寒', '立春', '雨水', '啓蟄', '春分', '清明', '穀雨',
        '立夏', '小満', '芒種', '夏至', '小暑', '大暑', '立秋', '処暑',
        '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
    ]
    result = {}
    for month in range(1, 13):
        for day in range(1, 32):
            try:
                d = date(year, month, day)
            except ValueError:
                continue
            t = ts.utc(year, month, day, 12)
            astrometric = earth.at(t).observe(sun)
            deg = astrometric.apparent().ecliptic_latlon()[1].degrees
            prev_d = d - timedelta(days=1)
            t_prev = ts.utc(prev_d.year, prev_d.month, prev_d.day, 12)
            deg_prev = earth.at(t_prev).observe(sun).apparent().ecliptic_latlon()[1].degrees
            for i in range(24):
                boundary = i * 15
                dp, dc = deg_prev % 360, deg % 360
                if dp > 350 and dc < 10: dc += 360
                if dp < 10 and dc > 350: dp += 360
                if dp < boundary <= dc or dp <= boundary < dc:
                    term_idx = int(((boundary - 285) / 15) % 24)
                    result[d] = TERM_NAMES[term_idx]
    return result


# === 4. Rokuyo (六曜) ===
# Rokuyo is determined by (lunar_month + lunar_day) % 6
# We need lunar calendar conversion

def gregorian_to_lunar_approx(d):
    """Approximate lunar date using astronomical new moon.
    Returns (lunar_month, lunar_day) tuple.
    This is simplified - for production, use a proper lunar calendar library.
    """
    # Use synodic month approximation
    # Known: 2026-02-17 = lunar 1/1 (from user data: 旧正月)
    LUNAR_EPOCH = date(2026, 2, 17)  # = Lunar 2026 1/1
    SYNODIC_MONTH = 29.53059

    delta = (d - LUNAR_EPOCH).days

    if delta >= 0:
        lunar_month_offset = int(delta / SYNODIC_MONTH)
        lunar_day = int(delta - lunar_month_offset * SYNODIC_MONTH) + 1
        lunar_month = (lunar_month_offset % 12) + 1
    else:
        # Before epoch - go backwards
        abs_delta = abs(delta)
        lunar_month_offset = int(abs_delta / SYNODIC_MONTH)
        remaining = abs_delta - lunar_month_offset * SYNODIC_MONTH
        lunar_day = int(SYNODIC_MONTH - remaining) + 1
        lunar_month = 12 - (lunar_month_offset % 12)
        if lunar_month <= 0:
            lunar_month += 12

    if lunar_day < 1:
        lunar_day = 1
    if lunar_day > 30:
        lunar_day = 30

    return (lunar_month, lunar_day)


ROKUYO = ['先勝', '友引', '先負', '仏滅', '大安', '赤口']

def get_rokuyo(d):
    lm, ld = gregorian_to_lunar_approx(d)
    return ROKUYO[(lm + ld - 2) % 6]


# === 5. Lucky Days ===

def get_lucky_days(d, eto_name, junishi, jikkan, lunar_month, solar_terms_map, ichiryumanbai_boundaries=None):
    lucky = []

    # 寅の日
    if junishi == '寅':
        lucky.append('寅の日')

    # 巳の日
    if junishi == '巳':
        lucky.append('巳の日')
        # 己巳の日 (tsuchinoto-mi)
        if jikkan == '己':
            lucky.append('己巳の日')

    # 辰の日
    if junishi == '辰':
        lucky.append('辰の日')

    # 甲子の日
    if eto_name == '甲子':
        lucky.append('甲子の日')

    # 一粒万倍日
    if is_ichiryuu_manbai(d, lunar_month, junishi, ichiryumanbai_boundaries=ichiryumanbai_boundaries):
        lucky.append('一粒万倍日')

    # 天赦日
    if is_tensha(d, solar_terms_map, eto_name):
        lucky.append('天赦日')

    return lucky


def compute_ichiryumanbai_boundaries(solar_terms_map):
    """Pre-compute effective setsugetsu boundaries for ichiryumanbai.
    Uses a 1-day shift from official solar term dates based on JST transition time.
    If transition < 02:00, shift to previous day with is_shifted=False (no overlap).
    Otherwise, shift to previous day with is_shifted=True (overlap allowed).
    """
    from datetime import timedelta, timezone
    JST = timezone(timedelta(hours=9))

    node_terms_order = ['小寒','立春','啓蟄','清明','立夏','芒種',
                        '小暑','立秋','白露','寒露','立冬','大雪']
    TERM_LONS = {
        '小寒':285,'立春':315,'啓蟄':345,'清明':15,
        '立夏':45,'芒種':75,'小暑':105,'立秋':135,
        '白露':165,'寒露':195,'立冬':225,'大雪':255,
    }

    node_dates_orig = []
    for term in node_terms_order:
        for dt, name in solar_terms_map.items():
            if name == term:
                node_dates_orig.append((term, dt))
                break
    node_dates_orig.sort(key=lambda x: x[1])

    effective_dates = []
    try:
        from skyfield.api import load as _load
        _ts = _load.timescale()
        _eph = _load('de421.bsp')
        _earth = _eph['earth']
        _sun = _eph['sun']

        for term, orig_dt in node_dates_orig:
            tgt = TERM_LONS.get(term)
            if tgt is not None:
                t0 = _ts.utc(orig_dt.year, orig_dt.month, orig_dt.day - 1, -9)
                t1 = _ts.utc(orig_dt.year, orig_dt.month, orig_dt.day + 1, -9)
                for _ in range(50):
                    tm = _ts.tt_jd((t0.tt + t1.tt) / 2)
                    ast = _earth.at(tm).observe(_sun)
                    _, lon, _ = ast.apparent().ecliptic_latlon()
                    diff = (lon.degrees - tgt) % 360
                    if diff < 180 and diff > 0:
                        t1 = tm
                    else:
                        t0 = tm
                exact_jst = tm.utc_datetime().astimezone(JST)
                if exact_jst.date() == orig_dt and exact_jst.hour < 1:
                    # 境界を前日に移動するが、is_shifted=Falseにして重複判定を無効化する
                    effective_dates.append((term, orig_dt - timedelta(days=1), False))
                else:
                    # 通常のシフト（重複判定あり）
                    effective_dates.append((term, orig_dt - timedelta(days=1), True))
            else:
                effective_dates.append((term, orig_dt - timedelta(days=1), True))
    except Exception:
        effective_dates = [(n, dt - timedelta(days=1), True) for n, dt in node_dates_orig]

    effective_dates.sort(key=lambda x: x[1])
    return effective_dates


def is_ichiryuu_manbai(d, lunar_month, junishi, ichiryumanbai_boundaries=None):
    if ichiryumanbai_boundaries is None:
        return False
    rules = {
        '小寒': ['子', '卯'], '立春': ['丑', '午'], '啓蟄': ['寅', '酉'], '清明': ['子', '卯'],
        '立夏': ['卯', '辰'], '芒種': ['巳', '午'], '小暑': ['午', '酉'], '立秋': ['子', '未'],
        '白露': ['卯', '申'], '寒露': ['午', '酉'], '立冬': ['酉', '戌'], '大雪': ['亥', '子'],
    }
    current_period = '大雪'
    current_idx = -1
    for i, bound in enumerate(ichiryumanbai_boundaries):
        name, dt = bound[0], bound[1]
        if dt <= d:
            current_period, current_idx = name, i
        else:
            break
    if current_period in rules and junishi in rules[current_period]:
        return True
    if current_idx >= 0:
        _, b_dt, is_shifted = ichiryumanbai_boundaries[current_idx]
        if b_dt == d and is_shifted:
            prev_name = ichiryumanbai_boundaries[current_idx - 1][0] if current_idx > 0 else '大雪'
            if prev_name in rules and junishi in rules[prev_name]:
                return True
    return False
    rules = {
        '小寒': ['子', '卯'], '立春': ['丑', '午'], '啓蟄': ['寅', '酉'], '清明': ['子', '卯'],
        '立夏': ['卯', '辰'], '芒種': ['巳', '午'], '小暑': ['午', '酉'], '立秋': ['子', '未'],
        '白露': ['卯', '申'], '寒露': ['午', '酉'], '立冬': ['酉', '戌'], '大雪': ['亥', '子'],
    }
    current_period = '大雪'
    current_idx = -1
    for i, bound in enumerate(ichiryumanbai_boundaries):
        name, dt = bound[0], bound[1]
        if dt <= d:
            current_period, current_idx = name, i
        else:
            break
    if current_period in rules and junishi in rules[current_period]:
        return True
    if current_idx >= 0:
        _, b_dt, is_shifted = ichiryumanbai_boundaries[current_idx]
        if b_dt == d and is_shifted:
            prev_name = ichiryumanbai_boundaries[current_idx - 1][0] if current_idx > 0 else '大雪'
            if prev_name in rules and junishi in rules[prev_name]:
                return True
    return False

    rules = {
        '小寒': ['子', '卯'],
        '立春': ['丑', '午'],
        '啓蟄': ['寅', '酉'],
        '清明': ['子', '卯'],
        '立夏': ['卯', '辰'],
        '芒種': ['巳', '午'],
        '小暑': ['午', '酉'],
        '立秋': ['子', '未'],
        '白露': ['卯', '申'],
        '寒露': ['午', '酉'],
        '立冬': ['酉', '戌'],
        '大雪': ['亥', '子'],
    }

    current_period = '大雪'
    current_idx = -1
    for i, bound in enumerate(ichiryumanbai_boundaries):
        name, dt = bound[0], bound[1]
        if dt <= d:
            current_period = name
            current_idx = i
        else:
            break

    if current_period in rules and junishi in rules[current_period]:
        return True

    if current_idx >= 0:
        _, b_dt, is_shifted = ichiryumanbai_boundaries[current_idx]
        if b_dt == d and is_shifted:
            prev_name = ichiryumanbai_boundaries[current_idx - 1][0] if current_idx > 0 else '大雪'
            if prev_name in rules and junishi in rules[prev_name]:
                return True

    return False

def is_tensha(d, solar_terms_map, eto_name):
    """天赦日: Best day of the year, based on season + eto
    春(立春-立夏前): 戊寅
    夏(立夏-立秋前): 甲午
    秋(立秋-立冬前): 戊申
    冬(立冬-立春前): 甲子
    """
    # Determine season based on solar terms
    season = get_season(d, solar_terms_map)

    tensha_eto = {
        'spring': '戊寅',  # 戊寅
        'summer': '甲午',  # 甲午
        'autumn': '戊申',  # 戊申
        'winter': '甲子',  # 甲子
    }

    return eto_name == tensha_eto.get(season, '')


def get_season(d, solar_terms_map):
    """Determine season based on solar terms dates"""
    year = d.year

    # Find key solar term dates
    risshun = None  # 立春
    rikka = None    # 立夏
    risshu = None   # 立秋
    ritto = None    # 立冬

    for dt, name in solar_terms_map.items():
        if name == '立春':
            risshun = dt
        elif name == '立夏':
            rikka = dt
        elif name == '立秋':
            risshu = dt
        elif name == '立冬':
            ritto = dt

    if risshun and rikka and risshu and ritto:
        if risshun <= d < rikka:
            return 'spring'
        elif rikka <= d < risshu:
            return 'summer'
        elif risshu <= d < ritto:
            return 'autumn'
        else:
            return 'winter'

    # Fallback by month
    m = d.month
    if 2 <= m <= 4:
        return 'spring'
    elif 5 <= m <= 7:
        return 'summer'
    elif 8 <= m <= 10:
        return 'autumn'
    else:
        return 'winter'


# === 6. Unlucky Days ===

def get_unlucky_days(d, lunar_month, lunar_day):
    unlucky = []
    if is_fuseijoubi(lunar_month, lunar_day):
        unlucky.append('不成就日')
    return unlucky


def is_fuseijoubi(lunar_month, lunar_day):
    """不成就日: 8-day cycle based on lunar month
    Each lunar month starts the cycle on a specific day.
    Month 1,7: starts on 3rd, then every 8 days (3,11,19,27)
    Month 2,8: starts on 2nd (2,10,18,26)
    Month 3,9: starts on 1st (1,9,17,25)
    Month 4,10: starts on 4th (4,12,20,28)
    Month 5,11: starts on 5th (5,13,21,29)
    Month 6,12: starts on 6th (6,14,22,30)
    """
    start_days = {
        1: 3, 2: 2, 3: 1, 4: 4, 5: 5, 6: 6,
        7: 3, 8: 2, 9: 1, 10: 4, 11: 5, 12: 6,
    }
    if lunar_month not in start_days:
        return False
    start = start_days[lunar_month]
    return (lunar_day - start) % 8 == 0


# === 7. Japanese Holidays ===

def get_holidays(year):
    """Fetch holidays from holidays-jp API"""
    import httpx
    try:
        r = httpx.get("https://holidays-jp.github.io/api/v1/date.json", timeout=10)
        data = r.json()
        holidays = {}
        for k, v in data.items():
            if k.startswith(str(year)):
                from datetime import date as d_cls
                parts = k.split("-")
                holidays[d_cls(int(parts[0]), int(parts[1]), int(parts[2]))] = v
        print(f"  Fetched {len(holidays)} holidays from API for {year}")
        return holidays
    except Exception as e:
        print(f"  WARNING: Could not fetch holidays API: {e}")
        return _get_holidays_fallback(year)


def _get_holidays_fallback(year):
    """Fallback holidays if API is unavailable"""
    holidays = {}
    holidays[date(year, 1, 1)] = '元日'
    holidays[date(year, 2, 11)] = '建国記念の日'
    holidays[date(year, 2, 23)] = '天皇誕生日'
    holidays[date(year, 4, 29)] = '昭和の日'
    holidays[date(year, 5, 3)] = '憲法記念日'
    holidays[date(year, 5, 4)] = 'みどりの日'
    holidays[date(year, 5, 5)] = 'こどもの日'
    holidays[date(year, 8, 11)] = '山の日'
    holidays[date(year, 11, 3)] = '文化の日'
    holidays[date(year, 11, 23)] = '勤労感謝の日'
    return holidays



# === 8. Score Calculation ===

def calculate_scores(d, lucky_days, unlucky_days, rokuyo, lunar_phase):
    """Calculate scores for each category based on lucky days"""
    scores = {}

    base = 50
    lucky_bonus = {
        '一粒万倍日': {'overall': 20, 'business': 25, 'finance': 25, 'moving': 15, 'marriage': 15, 'travel': 10},
        '天赦日': {'overall': 30, 'business': 30, 'finance': 25, 'moving': 25, 'marriage': 30, 'travel': 20},
        '寅の日': {'overall': 10, 'business': 10, 'finance': 20, 'moving': 5, 'marriage': -10, 'travel': 25},
        '巳の日': {'overall': 10, 'business': 10, 'finance': 25, 'moving': 5, 'marriage': 5, 'travel': 5},
        '己巳の日': {'overall': 15, 'business': 15, 'finance': 35, 'moving': 5, 'marriage': 5, 'travel': 5},
        '辰の日': {'overall': 10, 'business': 15, 'finance': 20, 'moving': 10, 'marriage': 5, 'travel': 10},
        '甲子の日': {'overall': 15, 'business': 20, 'finance': 20, 'moving': 10, 'marriage': 20, 'travel': 10},
    }

    rokuyo_bonus = {
        '大安': {'overall': 10, 'business': 8, 'finance': 8, 'moving': 15, 'marriage': 20, 'travel': 10},
        '友引': {'overall': 3, 'business': 3, 'finance': 3, 'moving': 0, 'marriage': -5, 'travel': 3},
        '先勝': {'overall': 2, 'business': 5, 'finance': 2, 'moving': 2, 'marriage': 2, 'travel': 2},
        '先負': {'overall': 0, 'business': 0, 'finance': 0, 'moving': 0, 'marriage': 0, 'travel': 0},
        '仏滅': {'overall': -5, 'business': -3, 'finance': -3, 'moving': -5, 'marriage': -15, 'travel': -3},
        '赤口': {'overall': -3, 'business': -2, 'finance': -2, 'moving': -3, 'marriage': -5, 'travel': -2},
    }

    categories = ['overall', 'business', 'finance', 'moving', 'marriage', 'travel']

    for cat in categories:
        score = base

        # Add lucky day bonuses
        for ld in lucky_days:
            if ld in lucky_bonus:
                score += lucky_bonus[ld].get(cat, 0)

        # Add rokuyo bonus
        if rokuyo in rokuyo_bonus:
            score += rokuyo_bonus[rokuyo].get(cat, 0)

        # Unlucky day penalty
        if '不成就日' in unlucky_days:
            penalty = (score - base) * 0.5
            score = base + int(penalty * 0.5)

        # Lunar phase bonus
        if lunar_phase == '新月':
            if cat in ['business', 'overall']:
                score += 5
        elif lunar_phase == '満月':
            if cat in ['marriage', 'overall']:
                score += 5

        # Clamp
        score = max(0, min(100, score))

        # Build reason
        reasons = []
        if lucky_days:
            reasons.extend(lucky_days)
        if rokuyo == '大安':
            reasons.append('大安')
        if unlucky_days:
            reasons.extend(unlucky_days)
        if lunar_phase:
            reasons.append(lunar_phase)

        reason = '+'.join(reasons) if reasons else None

        if score != base or lucky_days or rokuyo == '大安':
            scores[cat] = {'score': score, 'reason': reason}

    return scores


# === MAIN ===

def generate_year_data(year):
    print(f"Generating koyomi data for {year}...")

    # Pre-compute expensive lookups
    print("  Computing lunar phases...")
    lunar_phases = get_lunar_phases_for_year(year)

    print("  Computing solar terms...")
    solar_terms = get_solar_terms_for_year(year)

    print("  Computing ichiryumanbai boundaries...")
    ichiryu_bounds = compute_ichiryumanbai_boundaries(solar_terms)

    print("  Getting holidays...")
    holidays = get_holidays(year)

    events = []
    all_scores = []

    start = date(year, 1, 1)
    end = date(year, 12, 31)
    d = start

    while d <= end:
        eto_name = get_eto_name(d)
        junishi = get_junishi(d)
        jikkan = get_jikkan(d)
        lunar_month, lunar_day = gregorian_to_lunar_approx(d)
        rokuyo = get_rokuyo(d)
        lunar_phase = lunar_phases.get(d)
        solar_term = solar_terms.get(d)
        holiday = holidays.get(d)

        lucky_days = get_lucky_days(d, eto_name, junishi, jikkan, lunar_month, solar_terms, ichiryumanbai_boundaries=ichiryu_bounds)
        unlucky_days = get_unlucky_days(d, lunar_month, lunar_day)

        notes = holiday

        event = {
            'date': d.isoformat(),
            'rokuyo': rokuyo,
            'lucky_days': lucky_days,
            'unlucky_days': unlucky_days,
            'lunar_phase': lunar_phase,
            'solar_term': solar_term,
            'eto': eto_name,
            'notes': notes,
        }
        events.append(event)

        # Scores
        day_scores = calculate_scores(d, lucky_days, unlucky_days, rokuyo, lunar_phase)
        for cat, data in day_scores.items():
            all_scores.append({
                'date': d.isoformat(),
                'category': cat,
                'score': data['score'],
                'reason': data['reason'],
            })

        d += timedelta(days=1)

    return events, all_scores


def upload_to_supabase(events, scores):
    """Upload data to Supabase via REST API"""
    import httpx
    
    url = None
    key = None
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8-sig') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip().strip('"')
                    v = v.strip().strip('"')
                    if k == 'NEXT_PUBLIC_SUPABASE_URL':
                        url = v
                    elif k == 'SUPABASE_SERVICE_ROLE_KEY':
                        key = v

    if not url or not key:
        print("ERROR: Supabase credentials not found in .env.local")
        sys.exit(1)

    rest_url = url + '/rest/v1'
    headers = {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }

    year = events[0]['date'][:4]

    # Delete existing data
    print(f"  Deleting existing data for {year}...")
    with httpx.Client(timeout=30) as client:
        client.delete(
            rest_url + '/koyomi_events?date=gte.' + year + '-01-01&date=lte.' + year + '-12-31',
            headers=headers
        )
        client.delete(
            rest_url + '/koyomi_scores?date=gte.' + year + '-01-01&date=lte.' + year + '-12-31',
            headers=headers
        )

        # Insert events in batches
        print(f"  Inserting {len(events)} events...")
        for i in range(0, len(events), 50):
            batch = events[i:i+50]
            r = client.post(rest_url + '/koyomi_events', headers=headers, json=batch)
            if r.status_code >= 400:
                print(f"  ERROR inserting events batch {i}: {r.status_code} {r.text[:200]}")
                return

        # Insert scores in batches
        print(f"  Inserting {len(scores)} scores...")
        for i in range(0, len(scores), 100):
            batch = scores[i:i+100]
            r = client.post(rest_url + '/koyomi_scores', headers=headers, json=batch)
            if r.status_code >= 400:
                print(f"  ERROR inserting scores batch {i}: {r.status_code} {r.text[:200]}")
                return

    print("  Upload complete!")

def save_to_json(events, scores, year):
    """Save to local JSON for debugging"""
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, f'koyomi_events_{year}.json'), 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    with open(os.path.join(output_dir, f'koyomi_scores_{year}.json'), 'w', encoding='utf-8') as f:
        json.dump(scores, f, ensure_ascii=False, indent=2)

    print(f"  Saved to data/koyomi_events_{year}.json and data/koyomi_scores_{year}.json")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate koyomi data')
    parser.add_argument('--year', type=int, default=2026, help='Year to generate')
    parser.add_argument('--upload', action='store_true', help='Upload to Supabase')
    parser.add_argument('--json', action='store_true', help='Save as JSON')
    args = parser.parse_args()

    events, scores = generate_year_data(args.year)

    print(f"Generated {len(events)} events, {len(scores)} scores")

    if args.json:
        save_to_json(events, scores, args.year)

    if args.upload:
        upload_to_supabase(events, scores)
    elif not args.json:
        # Default: save JSON
        save_to_json(events, scores, args.year)
        print("Use --upload to push to Supabase, or --json to save locally")
