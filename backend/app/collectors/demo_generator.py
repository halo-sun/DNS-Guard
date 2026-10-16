import random
from datetime import datetime, timezone
from typing import List

from ..normalization.normalizer import compute_event_fingerprint, normalize_domain

NORMAL_DOMAINS = [
    ("google.com", "A", "NOERROR"),
    ("github.com", "AAAA", "NOERROR"),
    ("cloudflare.com", "A", "NOERROR"),
    ("microsoft.com", "A", "NOERROR"),
    ("api.slack.com", "A", "NOERROR"),
    ("registry.npmjs.org", "A", "NOERROR"),
    ("cdn.jsdelivr.net", "CNAME", "NOERROR"),
    ("internal.corp.local", "A", "NOERROR"),
]

SUSPICIOUS_SCENARIOS = [
    {
        "domain": "dGhpcyBpcyBhIHRlc3QgdHVubmVsIGV4ZmlsdHJhdGlvbiBwYXlsb2Fk.tunnel.c2server.org",
        "record_type": "TXT",
        "response_code": "NOERROR",
        "client_ip": "192.168.1.105",
        "client_name": "workstation-04.corp",
    },
    {
        "domain": "malicious-c2-traffic.ru",
        "record_type": "A",
        "response_code": "NXDOMAIN",
        "client_ip": "192.168.1.180",
        "client_name": "guest-device-12",
    },
    {
        "domain": "xqzkpwlb18a99z.biz",
        "record_type": "A",
        "response_code": "NXDOMAIN",
        "client_ip": "192.168.1.180",
        "client_name": "guest-device-12",
    },
    {
        "domain": "98b7a65c4d3e2f109847281947261829.exfil.darkops.io",
        "record_type": "TXT",
        "response_code": "NOERROR",
        "client_ip": "192.168.1.105",
        "client_name": "workstation-04.corp",
    },
]

CLIENT_IPS = [
    ("192.168.1.42", "dev-laptop-09"),
    ("192.168.1.105", "workstation-04.corp"),
    ("192.168.1.180", "guest-device-12"),
    ("10.0.0.15", "app-server-db"),
    ("192.168.1.200", "printer-finance"),
]


def generate_deterministic_demo_batch(count: int = 25) -> List[dict]:
    events = []
    now = datetime.now(timezone.utc)

    for i in range(count):
        # 25% suspicious, 75% normal
        if random.random() < 0.25:
            scenario = random.choice(SUSPICIOUS_SCENARIOS)
            raw_domain = scenario["domain"]
            rtype = scenario["record_type"]
            rcode = scenario["response_code"]
            client_ip = scenario["client_ip"]
            client_name = scenario["client_name"]
        else:
            domain_choice, rtype, rcode = random.choice(NORMAL_DOMAINS)
            raw_domain = domain_choice
            client_ip, client_name = random.choice(CLIENT_IPS)

        norm_domain = normalize_domain(raw_domain)
        fp = compute_event_fingerprint(now, client_ip, norm_domain, rtype, "src-demo-generator")

        events.append(
            {
                "observed_at": now,
                "client_ip": client_ip,
                "client_name": client_name,
                "original_domain": raw_domain,
                "normalized_domain": norm_domain,
                "record_type": rtype,
                "response_code": rcode,
                "response_details": "10.0.4.52" if rcode == "NOERROR" else None,
                "resolver_id": "dns-resolver-01",
                "protocol": "UDP",
                "source_id": "src-demo-generator",
                "source_type": "demo",
                "query_size": random.randint(32, 128),
                "response_size": random.randint(64, 512),
                "duration_ms": round(random.uniform(1.2, 45.0), 2),
                "fingerprint": fp,
                "is_demo": True,
            }
        )

    return events
