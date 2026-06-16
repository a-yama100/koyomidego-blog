#!/usr/bin/env python3
"""
Void of Course Moon Calculator
Calculates when the Moon makes its last major aspect before changing signs.
Usage: python scripts/generate_void_times.py --year 2026 --upload
"""

import argparse
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone, date

JST = timezone(timedelta(hours=9))

from skyfield.api import load
from skyfield.almanac import find_discrete

ts = load.timescale()
eph = load("de421.bsp")

earth = eph["earth"]
moon_body = eph["moon"]
sun = eph["sun"]
mercury = eph["mercury"]
venus = eph["venus"]
mars = eph["mars"]
jupiter = eph["jupiter barycenter"]
saturn = eph["saturn barycenter"]
uranus = eph["uranus barycenter"]
neptune = eph["neptune barycenter"]
pluto = eph["pluto barycenter"]

# Modern void-of-course: the Moon's last Ptolemaic aspect before changing signs is
# measured against ALL other planets, including the modern outer planets. Omitting
# Uranus/Neptune/Pluto makes the void period start far too early (a later aspect to
# an outer planet is missed), which is what common VOC tables actually use.
PLANETS = [sun, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto]

# Major aspects (degrees)
ASPECTS = [0, 60, 90, 120, 180]  # conjunction, sextile, square, trine, opposition
ASPECT_ORB = 1.0  # degree orb for exact aspect


def moon_longitude(t):
    """Tropical ecliptic longitude of the Moon, in degrees.

    Western astrology uses the tropical zodiac, whose 0 deg Aries is the vernal
    equinox *of date*. The longitude must therefore be referred to the ecliptic and
    equinox of date (epoch=t); the J2000 frame is off by accumulated precession
    (~0.36 deg by 2026 ~= 40 min of Moon motion), enough to shift sign-ingress times.
    """
    astrometric = earth.at(t).observe(moon_body)
    _, lon, _ = astrometric.apparent().ecliptic_latlon(epoch=t)
    return lon.degrees


def planet_longitude(planet, t):
    """Tropical ecliptic longitude of a planet, in degrees (ecliptic of date)."""
    astrometric = earth.at(t).observe(planet)
    _, lon, _ = astrometric.apparent().ecliptic_latlon(epoch=t)
    return lon.degrees


def get_zodiac_sign(longitude):
    """Return zodiac sign index (0-11) for a given longitude"""
    return int(longitude / 30) % 12


def find_moon_sign_changes(year):
    """Find all times when Moon changes zodiac sign"""
    t0 = ts.utc(year, 1, 1)
    t1 = ts.utc(year + 1, 1, 1)

    # Sample every 2 hours for a year
    hours = int(366 * 24 / 2)
    times = []
    signs = []

    for i in range(hours + 1):
        t = ts.utc(year, 1, 1, i * 2)
        lon = moon_longitude(t)
        sign = get_zodiac_sign(lon)
        times.append(t)
        signs.append(sign)

    # Find sign changes
    changes = []
    for i in range(1, len(signs)):
        if signs[i] != signs[i-1]:
            # Refine to within ~1 minute using binary search
            t_start = times[i-1]
            t_end = times[i]
            for _ in range(15):  # 15 iterations = ~0.5 second precision
                jd_mid = (t_start.tt + t_end.tt) / 2
                t_mid = ts.tt_jd(jd_mid)
                mid_sign = get_zodiac_sign(moon_longitude(t_mid))
                if mid_sign == signs[i-1]:
                    t_start = t_mid
                else:
                    t_end = t_mid

            changes.append({
                "time": t_end,
                "from_sign": signs[i-1],
                "to_sign": signs[i],
            })

    return changes


def _aspect_offset(planet, target, jd):
    """Signed angle (deg, in [-180,180]) between the Moon-planet separation and an
    aspect target. Zero exactly at the aspect."""
    t = ts.tt_jd(jd)
    diff = (moon_longitude(t) - planet_longitude(planet, t)) - target
    return ((diff + 180) % 360) - 180


def _refine_aspect(planet, target, lo_jd, hi_jd):
    """Bisect to the instant the aspect is exact, given a bracket with a sign change."""
    flo = _aspect_offset(planet, target, lo_jd)
    for _ in range(40):  # ~sub-second precision
        mid = (lo_jd + hi_jd) / 2
        fmid = _aspect_offset(planet, target, mid)
        if (flo <= 0 <= fmid) or (flo >= 0 >= fmid):
            hi_jd = mid
        else:
            lo_jd, flo = mid, fmid
    return ts.tt_jd((lo_jd + hi_jd) / 2)


def find_last_aspect_before(sign_change_time, sign_start_time_approx):
    """Find the exact instant of the Moon's last major aspect before leaving its sign.

    Searches backwards from the sign change in coarse steps to locate the most recent
    aspect bracket, then bisects within that bracket for an accurate time. Aspects are
    checked against all planets in PLANETS (incl. the outer planets).
    """
    t_end = sign_change_time

    # Go back up to 3 days (Moon stays in a sign ~2.5 days)
    search_hours = 72
    step_minutes = 15
    steps = int(search_hours * 60 / step_minutes)

    for step in range(steps):
        jd = t_end.tt - (step * step_minutes) / (24 * 60)
        t = ts.tt_jd(jd)

        jd_prev = t_end.tt - ((step + 1) * step_minutes) / (24 * 60)
        t_prev = ts.tt_jd(jd_prev)

        m_lon = moon_longitude(t)
        m_lon_prev = moon_longitude(t_prev)

        for planet in PLANETS:
            p_lon = planet_longitude(planet, t)
            p_lon_prev = planet_longitude(planet, t_prev)

            diff = (m_lon - p_lon) % 360
            diff_prev = (m_lon_prev - p_lon_prev) % 360

            for aspect_angle in ASPECTS:
                # An aspect can occur on either side of the body (e.g. sextile at
                # +60 and -60 == 300), so check both target separations.
                for target in [aspect_angle, 360 - aspect_angle if aspect_angle > 0 else -1]:
                    if target < 0:
                        continue

                    d1 = (diff_prev - target) % 360
                    d2 = (diff - target) % 360
                    if d1 > 180:
                        d1 -= 360
                    if d2 > 180:
                        d2 -= 360

                    # Sign change with small magnitude => aspect crossed in this bracket.
                    if ((d1 <= 0 <= d2) or (d1 >= 0 >= d2)) and abs(d1) < 5 and abs(d2) < 5:
                        # First crossing found going backwards is the last aspect;
                        # refine its exact time before returning.
                        return _refine_aspect(planet, target, jd_prev, jd)

    return None


def calculate_void_times(year):
    """Calculate all Void of Course Moon periods for a year"""
    print(f"  Finding Moon sign changes for {year}...")
    changes = find_moon_sign_changes(year)
    print(f"  Found {len(changes)} sign changes")
    
    void_times = []
    
    print(f"  Calculating last aspects...")
    for i, change in enumerate(changes):
        if i % 50 == 0:
            print(f"    Processing {i}/{len(changes)}...")
        
        sign_change_time = change["time"]
        
        # Find last major aspect before this sign change
        last_aspect = find_last_aspect_before(sign_change_time, None)
        
        if last_aspect is not None:
            start_dt = last_aspect.utc_datetime().astimezone(JST)
            end_dt = sign_change_time.utc_datetime().astimezone(JST)
            
            # Only include if void period is between 1 minute and 48 hours
            duration_hours = (end_dt - start_dt).total_seconds() / 3600
            if 0.02 < duration_hours < 48:
                void_times.append({
                    "start_at": start_dt.isoformat(),
                    "end_at": end_dt.isoformat(),
                })
    
    print(f"  Found {len(void_times)} void periods")
    return void_times


def upload_void_times(void_times, year):
    """Upload void times to Supabase"""
    import httpx
    
    url = None
    key = None
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip().strip('"')
                    v = v.strip().strip('"')
                    if k == "NEXT_PUBLIC_SUPABASE_URL":
                        url = v
                    elif k == "SUPABASE_SERVICE_ROLE_KEY":
                        key = v
    
    if not url or not key:
        print("ERROR: Supabase credentials not found")
        sys.exit(1)
    
    rest_url = url + "/rest/v1"
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    with httpx.Client(timeout=30) as client:
        # Delete existing void times for the year
        print(f"  Deleting existing void times for {year}...")
        client.delete(
            rest_url + f"/koyomi_void_times?start_at=gte.{year}-01-01T00:00:00&start_at=lte.{year}-12-31T23:59:59",
            headers=headers
        )
        
        # Insert in batches
        print(f"  Inserting {len(void_times)} void times...")
        for i in range(0, len(void_times), 50):
            batch = void_times[i:i+50]
            r = client.post(rest_url + "/koyomi_void_times", headers=headers, json=batch)
            if r.status_code >= 400:
                print(f"  ERROR: {r.status_code} {r.text[:200]}")
                return
    
    print("  Upload complete!")


def save_void_json(void_times, year):
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, f"koyomi_void_times_{year}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(void_times, f, ensure_ascii=False, indent=2)
    print(f"  Saved to data/koyomi_void_times_{year}.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Void of Course Moon times")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--upload", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    
    void_times = calculate_void_times(args.year)
    
    if args.json or not args.upload:
        save_void_json(void_times, args.year)
    
    if args.upload:
        upload_void_times(void_times, args.year)
