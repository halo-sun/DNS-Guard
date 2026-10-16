import csv
import io
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from ..normalization.normalizer import (
    compute_event_fingerprint,
    normalize_domain,
    validate_ip,
    validate_record_type,
    validate_response_code,
)


def parse_csv_or_json_content(
    content_bytes: bytes,
    filename: str,
    source_id: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parses CSV or JSON raw bytes into normalized event dictionaries and error rows.
    Returns: (valid_records, error_records)
    """
    valid: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    text = content_bytes.decode("utf-8", errors="replace")

    if filename.endswith(".json") or text.strip().startswith("["):
        try:
            items = json.loads(text)
            if not isinstance(items, list):
                errors.append({"row": 1, "error": "JSON input must be an array of event objects."})
                return valid, errors

            for i, raw in enumerate(items, start=1):
                try:
                    event = _normalize_dict_row(raw, source_id)
                    valid.append(event)
                except Exception as e:
                    errors.append({"row": i, "error": str(e)})
        except Exception as e:
            errors.append({"row": 1, "error": f"Invalid JSON format: {str(e)}"})
    else:
        # Parse CSV
        reader = csv.DictReader(io.StringIO(text))
        for row_idx, row in enumerate(reader, start=2):
            try:
                # Flexible header aliases
                domain_val = row.get("domain") or row.get("query") or row.get("qname") or ""
                ip_val = row.get("client_ip") or row.get("client") or row.get("ip") or ""
                record_type_val = row.get("record_type") or row.get("type") or row.get("qtype") or "A"
                rcode_val = row.get("response_code") or row.get("rcode") or "NOERROR"
                ts_val = row.get("timestamp") or row.get("observed_at") or None

                raw_dict = {
                    "domain": domain_val,
                    "client_ip": ip_val,
                    "record_type": record_type_val,
                    "response_code": rcode_val,
                    "observed_at": ts_val,
                    "client_name": row.get("client_name") or row.get("hostname"),
                    "response_details": row.get("response_details") or row.get("answers"),
                    "protocol": row.get("protocol") or "UDP",
                }
                event = _normalize_dict_row(raw_dict, source_id)
                valid.append(event)
            except Exception as e:
                errors.append({"row": row_idx, "error": str(e)})

    return valid, errors


def _normalize_dict_row(raw: Dict[str, Any], source_id: str) -> Dict[str, Any]:
    raw_domain = raw.get("domain", "")
    norm_domain = normalize_domain(raw_domain)
    client_ip = validate_ip(raw.get("client_ip", ""))
    rtype = validate_record_type(raw.get("record_type", "A"))
    rcode = validate_response_code(raw.get("response_code", "NOERROR"))

    # Parse observed timestamp or default to now
    ts_val = raw.get("observed_at")
    if ts_val:
        if isinstance(ts_val, (int, float)):
            observed_at = datetime.fromtimestamp(ts_val, tz=timezone.utc)
        elif isinstance(ts_val, str):
            try:
                observed_at = datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
            except ValueError:
                observed_at = datetime.now(timezone.utc)
        else:
            observed_at = datetime.now(timezone.utc)
    else:
        observed_at = datetime.now(timezone.utc)

    fingerprint = compute_event_fingerprint(observed_at, client_ip, norm_domain, rtype, source_id)

    return {
        "observed_at": observed_at,
        "client_ip": client_ip,
        "client_name": raw.get("client_name"),
        "original_domain": raw_domain,
        "normalized_domain": norm_domain,
        "record_type": rtype,
        "response_code": rcode,
        "response_details": raw.get("response_details"),
        "resolver_id": raw.get("resolver_id", "core-resolver-01"),
        "protocol": raw.get("protocol", "UDP").upper(),
        "source_id": source_id,
        "source_type": "file_import",
        "fingerprint": fingerprint,
        "is_demo": False,
    }
