from fastapi.testclient import TestClient

from backend.app.db.init_db import init_db
from backend.app.main import app

# Ensure database tables and default seed records exist
init_db()

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert data["observe_only"] is True


def test_dashboard_summary_endpoint():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_queries" in data
    assert "severity_distribution" in data
    assert "query_volume_timeline" in data


def test_get_events_endpoint():
    res = client.get("/api/v1/events?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "meta" in data
    assert data["meta"]["page"] == 1


def test_get_rules_endpoint():
    res = client.get("/api/v1/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 8
    rule_ids = [r["rule_id"] for r in rules]
    assert "INDICATOR_MATCH" in rule_ids
    assert "DNS_TUNNEL_PATTERN" in rule_ids


def test_get_sources_endpoint():
    res = client.get("/api/v1/sources")
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 2


def test_demo_ingest_endpoint():
    res = client.post("/api/v1/events/ingest/demo?count=10")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["ingested"] > 0
