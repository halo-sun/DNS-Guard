from backend.app.detection.engine import (
    DetectionContext,
    DetectionEngine,
    calculate_risk_score,
    calculate_shannon_entropy,
    score_to_severity,
)


class MockEvent:
    def __init__(
        self,
        domain: str,
        record_type: str = "A",
        response_code: str = "NOERROR",
        client_ip: str = "192.168.1.100",
    ):
        self.normalized_domain = domain
        self.record_type = record_type
        self.response_code = response_code
        self.client_ip = client_ip


def test_shannon_entropy():
    # Low entropy (repeated characters)
    assert calculate_shannon_entropy("aaaaaaaa") == 0.0
    # High entropy (random base64 string)
    assert calculate_shannon_entropy("dGhpcyBpcyBhIHRlc3Q") > 3.0


def test_indicator_match_rule():
    engine = DetectionEngine()
    context = DetectionContext(
        recent_events_client=[],
        recent_events_domain=[],
        active_allowlist=set(),
        rule_configs={},
    )
    event = MockEvent("malicious-c2-traffic.ru")
    findings = engine.evaluate(event, context)

    assert any(f.rule_id == "INDICATOR_MATCH" for f in findings)
    score = calculate_risk_score(findings)
    assert score >= 80
    assert score_to_severity(score) == "critical"


def test_tunnel_detection_rule():
    engine = DetectionEngine()
    context = DetectionContext(
        recent_events_client=[],
        recent_events_domain=[],
        active_allowlist=set(),
        rule_configs={},
    )
    long_encoded_subdomain = "dGhpcyBpcyBhIHRlc3QgdHVubmVsIGV4ZmlsdHJhdGlvbg.tunnel.org"
    event = MockEvent(long_encoded_subdomain, record_type="TXT")
    findings = engine.evaluate(event, context)

    assert any(f.rule_id == "DNS_TUNNEL_PATTERN" for f in findings)
    assert any(f.rule_id == "LONG_LABEL" for f in findings)
    score = calculate_risk_score(findings)
    assert score <= 100


def test_allowlist_precedence():
    engine = DetectionEngine()
    # Allowlist includes tunnel.org
    context = DetectionContext(
        recent_events_client=[],
        recent_events_domain=[],
        active_allowlist={"tunnel.org"},
        rule_configs={},
    )
    long_encoded_subdomain = "dGhpcyBpcyBhIHRlc3QgdHVubmVsIGV4ZmlsdHJhdGlvbg.tunnel.org"
    event = MockEvent(long_encoded_subdomain, record_type="TXT")
    findings = engine.evaluate(event, context)

    # Heuristic rules should be suppressed
    assert not any(f.rule_id == "DNS_TUNNEL_PATTERN" for f in findings)
    assert not any(f.rule_id == "LONG_LABEL" for f in findings)


def test_allowlist_does_not_suppress_authoritative_indicator():
    engine = DetectionEngine()
    # Even if malicious domain was in allowlist, authoritative indicator must still trigger!
    context = DetectionContext(
        recent_events_client=[],
        recent_events_domain=[],
        active_allowlist={"malicious-c2-traffic.ru"},
        rule_configs={},
    )
    event = MockEvent("malicious-c2-traffic.ru")
    findings = engine.evaluate(event, context)

    assert any(f.rule_id == "INDICATOR_MATCH" for f in findings)
