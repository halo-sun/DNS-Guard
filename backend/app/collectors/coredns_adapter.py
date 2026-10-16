import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..normalization.normalizer import (
    compute_event_fingerprint,
    normalize_domain,
    validate_ip,
    validate_record_type,
    validate_response_code,
)

# Standard CoreDNS log line regex:
# [INFO] 192.168.1.105:53214 - 12450 "A IN google.com. udp 42 false 512" NOERROR qr,rd,ra 64 0.001243s
COREDNS_LINE_REGEX = re.compile(
    r'\[(?P<level>\w+)\]\s+(?P<client_ip>\[?[0-9a-fA-F\.\:]+?\]?)(?::\d+)?\s+-\s+(?P<id>\d+)\s+"(?P<type>\w+)\s+(?P<class>\w+)\s+(?P<domain>[^\s]+)\s+(?P<proto>\w+)\s+(?P<size>\d+)[^"]*"\s+(?P<rcode>\w+)'
)


def parse_coredns_log_line(line: str, source_id: str = "src-coredns-local") -> Optional[Dict[str, Any]]:
    # Extract client IP before port
    # Match pattern: [LEVEL] IP:PORT or [LEVEL] IP -
    try:
        level_part, rest = line.split("]", 1)
        tokens = rest.strip().split()
        ip_port = tokens[0]
        if ":" in ip_port and not ip_port.startswith("["):
            ip_str = ip_port.split(":")[0]
        else:
            ip_str = ip_port.strip("[]")

        client_ip = validate_ip(ip_str)

        # Find query inside quotes
        q_start = line.find('"')
        q_end = line.find('"', q_start + 1)
        if q_start == -1 or q_end == -1:
            return None

        q_content = line[q_start + 1 : q_end].split()
        rtype = validate_record_type(q_content[0])
        raw_domain = q_content[2]
        proto = q_content[3].upper() if len(q_content) > 3 else "UDP"

        norm_domain = normalize_domain(raw_domain)

        # After quote: RCODE
        after_q = line[q_end + 1 :].strip().split()
        raw_rcode = after_q[0] if after_q else "NOERROR"
        rcode = validate_response_code(raw_rcode)

        now_utc = datetime.now(timezone.utc)
        fingerprint = compute_event_fingerprint(now_utc, client_ip, norm_domain, rtype, source_id)

        return {
            "observed_at": now_utc,
            "client_ip": client_ip,
            "client_name": None,
            "original_domain": raw_domain,
            "normalized_domain": norm_domain,
            "record_type": rtype,
            "response_code": rcode,
            "response_details": None,
            "resolver_id": "coredns-sensor",
            "protocol": proto,
            "source_id": source_id,
            "source_type": "coredns",
            "fingerprint": fingerprint,
            "is_demo": False,
        }
    except Exception:
        return None
