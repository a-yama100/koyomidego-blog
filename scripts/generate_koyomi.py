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
# 二十四節気 occur when the Sun's *apparent* ecliptic longitude, referred to the
# true equinox/ecliptic of date, reaches a multiple of 15 degrees. The frame must
# be "of date" (not J2000) — precession is ~0.36 deg by 2026 (~8.7 hours of solar
# motion), enough to push a term across a JST day boundary. The term is recorded on
# the JST calendar date of that instant.
TERM_BY_LON = {
    315: '立春', 330: '雨水', 345: '啓蟄', 0: '春分', 15: '清明', 30: '穀雨',
    45: '立夏', 60: '小満', 75: '芒種', 90: '夏至', 105: '小暑', 120: '大暑',
    135: '立秋', 150: '処暑', 165: '白露', 180: '秋分', 195: '寒露', 210: '霜降',
    225: '立冬', 240: '小雪', 255: '大雪', 270: '冬至', 285: '小寒', 300: '大寒',
}


def _sun_apparent_lon(ts, earth, sun, jd):
    """Apparent geocentric ecliptic longitude of the Sun (of date), in degrees."""
    t = ts.tt_jd(jd)
    return earth.at(t).observe(sun).apparent().ecliptic_latlon(epoch=t)[1].degrees


def _find_lon_crossing(lon_fn, target, lo, hi):
    """Bisection: time (TT JD) at which lon_fn rises through `target` degrees."""
    for _ in range(60):
        mid = (lo + hi) / 2
        diff = (lon_fn(mid) - target) % 360
        if 0 < diff < 180:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def _scan_longitude_crossings(year, targets, lon_fn):
    """Yield (jst_instant, target) for each crossing of every value in `targets`
    (degrees) during a span comfortably covering the given year."""
    ts = load.timescale()
    t0 = ts.utc(year - 1, 11, 1).tt
    t1 = ts.utc(year + 1, 2, 1).tt
    step = 0.5
    prev_t = t0
    prev_lon = lon_fn(t0)
    t = t0 + step
    while t <= t1:
        cur_lon = lon_fn(t)
        for target in targets:
            a, b = prev_lon % 360, cur_lon % 360
            if a > 350 and b < 10:
                b += 360
            if a < 10 and b > 350:
                a += 360
            for cand in (target, target + 360):
                if a < cand <= b or a <= cand < b:
                    jd = _find_lon_crossing(lon_fn, target, prev_t, t)
                    inst = ts.tt_jd(jd).utc_datetime().astimezone(JST)
                    yield inst, target
        prev_t, prev_lon = t, cur_lon
        t += step


def get_solar_terms_for_year(year):
    if not HAS_SKYFIELD:
        return {}
    ts = load.timescale()
    eph = load('de421.bsp')
    earth, sun = eph['earth'], eph['sun']
    lon_fn = lambda jd: _sun_apparent_lon(ts, earth, sun, jd)

    result = {}
    for inst, target in _scan_longitude_crossings(year, list(range(0, 360, 15)), lon_fn):
        if inst.year == year:
            result[inst.date()] = TERM_BY_LON[target]
    return result


# === 4. Lunar calendar (旧暦) — accurate, from astronomical new moons ===
# A lunar month begins on the JST date of the new moon (朔). Its number is set by
# the 中気 (major solar term) it contains: 冬至→11月, 大寒→12月, 雨水→正月, ...
# A month with no 中気 is a leap month (閏月) and keeps the previous month's number.
# This is the standard Japanese rule and is what 六曜 / 旧暦日 are built from.

# 中気 longitude -> lunar month number
CHUKI_MONTH = {
    270: 11, 300: 12, 330: 1, 0: 2, 30: 3, 60: 4,
    90: 5, 120: 6, 150: 7, 180: 8, 210: 9, 240: 10,
}


def _new_moon_dates(year):
    """JST dates of every new moon in a span covering the year."""
    from skyfield.almanac import find_discrete, moon_phases
    ts = load.timescale()
    eph = load('de421.bsp')
    t0 = ts.utc(year - 1, 11, 1)
    t1 = ts.utc(year + 2, 2, 1)
    t, phase = find_discrete(t0, t1, moon_phases(eph))
    return [ti.utc_datetime().astimezone(JST).date()
            for ti, ph in zip(t, phase) if ph == 0]


def _chuki_dates(year):
    """List of (jst_date, lunar_month_number) for the 12 中気 across the span."""
    ts = load.timescale()
    eph = load('de421.bsp')
    earth, sun = eph['earth'], eph['sun']
    lon_fn = lambda jd: _sun_apparent_lon(ts, earth, sun, jd)
    out = []
    for inst, target in _scan_longitude_crossings(year, list(CHUKI_MONTH.keys()), lon_fn):
        out.append((inst.date(), CHUKI_MONTH[target]))
    return out


def build_lunar_months(year):
    """Ordered list of (start_date, next_start_date, month_no, is_leap) covering year."""
    if not HAS_SKYFIELD:
        return []
    starts = _new_moon_dates(year)
    chukis = _chuki_dates(year)
    months = []
    prev_no = None
    for i in range(len(starts) - 1):
        s, e = starts[i], starts[i + 1]
        inside = [mn for (cd, mn) in chukis if s <= cd < e]
        if inside:
            no, leap = inside[0], False
        else:
            no, leap = prev_no, True
        months.append((s, e, no, leap))
        prev_no = no
    return months


def lunar_date(d, lunar_months):
    """Return (lunar_month, lunar_day, is_leap) for a Gregorian date."""
    for s, e, no, leap in lunar_months:
        if s <= d < e:
            return (no, (d - s).days + 1, leap)
    return (1, 1, False)  # outside covered span (should not happen within `year`)


# === 5. Rokuyo (六曜) ===
# Determined by (lunar_month + lunar_day) % 6; the cycle resets at each new lunar
# month, which is why 六曜 appears to "jump" on 旧暦 1日.
ROKUYO = ['先勝', '友引', '先負', '仏滅', '大安', '赤口']

def get_rokuyo(lunar_month, lunar_day):
    return ROKUYO[(lunar_month + lunar_day - 2) % 6]


# === 5. Lucky Days ===

def get_lucky_days(d, eto_name, junishi, jikkan, solar_terms_map, ichiryumanbai_boundaries=None):
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
    if is_ichiryuu_manbai(d, junishi, ichiryumanbai_boundaries):
        lucky.append('一粒万倍日')

    # 天赦日
    if is_tensha(d, solar_terms_map, eto_name):
        lucky.append('天赦日')

    return lucky


def compute_ichiryumanbai_boundaries(solar_terms_map):
    """Ordered (setsu_name, date) boundaries for 一粒万倍日.

    The 節月 used by 一粒万倍日 begins on its 節入り (節気) date. With solar terms now
    computed in the correct ecliptic-of-date frame, the boundary is simply the 節 date
    — no artificial 1-day shift is needed. Dates before the first boundary (小寒) fall
    in 子月, handled by the '大雪' default in is_ichiryuu_manbai.
    """
    node_terms = ['小寒', '立春', '啓蟄', '清明', '立夏', '芒種',
                  '小暑', '立秋', '白露', '寒露', '立冬', '大雪']
    bounds = [(name, dt) for dt, name in solar_terms_map.items() if name in node_terms]
    bounds.sort(key=lambda x: x[1])
    return bounds


def is_ichiryuu_manbai(d, junishi, ichiryumanbai_boundaries=None):
    """一粒万倍日: the day's 十二支 matches the rule for the current 節月."""
    if not ichiryumanbai_boundaries:
        return False
    rules = {
        '小寒': ['子', '卯'], '立春': ['丑', '午'], '啓蟄': ['寅', '酉'], '清明': ['子', '卯'],
        '立夏': ['卯', '辰'], '芒種': ['巳', '午'], '小暑': ['午', '酉'], '立秋': ['子', '未'],
        '白露': ['卯', '申'], '寒露': ['午', '酉'], '立冬': ['酉', '戌'], '大雪': ['亥', '子'],
    }
    period = '大雪'  # 子月 (大雪～小寒前); also covers early January before 小寒
    for name, dt in ichiryumanbai_boundaries:
        if dt <= d:
            period = name
        else:
            break
    return junishi in rules.get(period, [])


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

    print("  Building lunar calendar (旧暦)...")
    lunar_months = build_lunar_months(year)

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
        lunar_month, lunar_day, _lunar_leap = lunar_date(d, lunar_months)
        rokuyo = get_rokuyo(lunar_month, lunar_day)
        lunar_phase = lunar_phases.get(d)
        solar_term = solar_terms.get(d)
        holiday = holidays.get(d)

        lucky_days = get_lucky_days(d, eto_name, junishi, jikkan, solar_terms, ichiryumanbai_boundaries=ichiryu_bounds)
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
