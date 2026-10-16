import json

from .database import Base, SessionLocal, engine
from .models import DataSourceModel, DetectionRuleModel

DEFAULT_RULES = [
    {
        "rule_id": "INDICATOR_MATCH",
        "name": "Known Threat Indicator Match",
        "category": "Known Threat",
        "description": "Matches observed domain against configured local threat indicators and blocklists.",
        "enabled": True,
        "contribution": 80,
        "threshold": {"exact_match": True},
    },
    {
        "rule_id": "LONG_LABEL",
        "name": "Suspiciously Long DNS Label",
        "category": "Structural Anomaly",
        "description": "Detects subdomains where a single label exceeds length thresholds.",
        "enabled": True,
        "contribution": 15,
        "threshold": {"max_label_length": 45},
    },
    {
        "rule_id": "ENCODED_LABEL",
        "name": "Base32 / Base64 Encoded Label",
        "category": "Structural Anomaly",
        "description": "Detects alphanumeric padding and character frequencies typical of binary payload encoding.",
        "enabled": True,
        "contribution": 20,
        "threshold": {"min_encoded_chars": 18},
    },
    {
        "rule_id": "HIGH_ENTROPY",
        "name": "High Shannon Entropy Subdomain",
        "category": "Structural Anomaly",
        "description": "Evaluates Shannon entropy on subdomain labels indicating algorithmic generation.",
        "enabled": True,
        "contribution": 20,
        "threshold": {"entropy_threshold": 3.8},
    },
    {
        "rule_id": "DNS_TUNNEL_PATTERN",
        "name": "Potential DNS Tunneling Activity",
        "category": "Exfiltration Anomaly",
        "description": "Correlates repeated long encoded labels, TXT/NULL record types, and query volume bursts.",
        "enabled": True,
        "contribution": 35,
        "threshold": {"burst_count": 5, "record_type_weight": 1.5},
    },
    {
        "rule_id": "NXDOMAIN_SPIKE",
        "name": "NXDOMAIN Failure Rate Spike",
        "category": "Failure Anomaly",
        "description": "Flags clients producing abnormally high ratios of non-existent domain resolutions.",
        "enabled": True,
        "contribution": 25,
        "threshold": {"window_seconds": 60, "min_failures": 10, "failure_ratio": 0.5},
    },
    {
        "rule_id": "QUERY_RATE_ANOMALY",
        "name": "Client Query Volume Spike",
        "category": "Volume Anomaly",
        "description": "Flags client endpoints exceeding normal query thresholds in a moving time window.",
        "enabled": True,
        "contribution": 25,
        "threshold": {"queries_per_minute": 250},
    },
    {
        "rule_id": "DGA_PATTERN",
        "name": "Domain Generation Algorithm (DGA) Heuristic",
        "category": "Algorithmic Threat",
        "description": "Flags bursts of distinct pseudorandom subdomains with consistent TLD targets.",
        "enabled": True,
        "contribution": 30,
        "threshold": {"distinct_domains": 8, "window_seconds": 120},
    },
]

DEFAULT_SOURCES = [
    {
        "id": "src-demo-generator",
        "type": "demo",
        "name": "Synthetic Demo Event Generator",
        "enabled": True,
        "health_status": "healthy",
        "config_metadata_json": json.dumps({"seed": "deterministic-v1", "rate": "20/sec"}),
    },
    {
        "id": "src-file-import-1",
        "type": "file_import",
        "name": "CSV / JSON Resolver Log File Importer",
        "enabled": True,
        "health_status": "healthy",
        "config_metadata_json": json.dumps({"accepted_formats": ["csv", "json"]}),
    },
    {
        "id": "src-coredns-local",
        "type": "coredns",
        "name": "Internal CoreDNS Resolver Sensor Adapter",
        "enabled": False,
        "health_status": "offline",
        "last_error": "Sensor daemon connection pending configuration",
        "config_metadata_json": json.dumps({"endpoint": "127.0.0.1:9153"}),
    },
]


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default rules
        for r in DEFAULT_RULES:
            existing = db.query(DetectionRuleModel).filter_by(rule_id=r["rule_id"]).first()
            if not existing:
                rule_obj = DetectionRuleModel(
                    rule_id=r["rule_id"],
                    name=r["name"],
                    category=r["category"],
                    description=r["description"],
                    enabled=r["enabled"],
                    contribution=r["contribution"],
                    threshold_json=json.dumps(r["threshold"]),
                )
                db.add(rule_obj)

        # Seed default data sources
        for s in DEFAULT_SOURCES:
            existing_s = db.query(DataSourceModel).filter_by(id=s["id"]).first()
            if not existing_s:
                src_obj = DataSourceModel(
                    id=s["id"],
                    type=s["type"],
                    name=s["name"],
                    enabled=s["enabled"],
                    health_status=s["health_status"],
                    last_error=s.get("last_error"),
                    config_metadata_json=s.get("config_metadata_json", "{}"),
                )
                db.add(src_obj)

        db.commit()
    finally:
        db.close()
