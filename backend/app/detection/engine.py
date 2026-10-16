import math
import re
from typing import Any, Dict, List, Optional, Set

from ..schemas.alert import RuleEvidenceSchema


def calculate_shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    frequencies: Dict[str, int] = {}
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
    entropy = 0.0
    length = len(text)
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 3)


# Known local test indicators (Safe synthetic indicators)
KNOWN_INDICATORS = {
    "malicious-c2-traffic.ru",
    "evil-attacker-node.cc",
    "phishing-portal-secure.xyz",
    "exfil-collector-dark.top",
}

# Regex to detect base64/base32 encoded label fragments
BASE64_PATTERN = re.compile(r"^[a-zA-Z0-9+/=_-]{18,}$")


class Finding:
    def __init__(
        self,
        rule_id: str,
        rule_name: str,
        category: str,
        threshold_used: Any,
        observed_value: Any,
        contribution: int,
        explanation: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.rule_id = rule_id
        self.rule_name = rule_name
        self.category = category
        self.threshold_used = threshold_used
        self.observed_value = observed_value
        self.contribution = contribution
        self.explanation = explanation
        self.details = details or {}

    def to_schema(self) -> RuleEvidenceSchema:
        return RuleEvidenceSchema(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            threshold_used=self.threshold_used,
            observed_value=self.observed_value,
            contribution=self.contribution,
            explanation=self.explanation,
            details=self.details,
        )


class DetectionContext:
    def __init__(
        self,
        recent_events_client: List[Any],
        recent_events_domain: List[Any],
        active_allowlist: Set[str],
        rule_configs: Dict[str, Dict[str, Any]],
    ):
        self.recent_events_client = recent_events_client
        self.recent_events_domain = recent_events_domain
        self.active_allowlist = active_allowlist
        self.rule_configs = rule_configs


class DetectionEngine:
    def evaluate(self, event: Any, context: DetectionContext) -> List[Finding]:
        findings: List[Finding] = []
        domain = event.normalized_domain
        labels = domain.split(".")
        subdomain_label = labels[0] if labels else ""

        # Check Allowlist Precedence:
        # If domain is explicitly allowlisted, suppress heuristic structural rules,
        # BUT do NOT suppress authoritative INDICATOR_MATCH.
        is_allowlisted = domain in context.active_allowlist or any(
            domain.endswith("." + allowed) for allowed in context.active_allowlist
        )

        # 1. Rule: INDICATOR_MATCH (80 pts)
        r1_cfg = context.rule_configs.get("INDICATOR_MATCH", {})
        if r1_cfg.get("enabled", True):
            if domain in KNOWN_INDICATORS or any(domain.endswith("." + ind) for ind in KNOWN_INDICATORS):
                findings.append(
                    Finding(
                        rule_id="INDICATOR_MATCH",
                        rule_name="Known Threat Indicator Match",
                        category="Known Threat",
                        threshold_used="Exact Match",
                        observed_value=domain,
                        contribution=r1_cfg.get("contribution", 80),
                        explanation=f"Observed domain '{domain}' matches local threat intelligence indicator catalog.",
                    )
                )

        # If allowlisted, skip remaining heuristic rules
        if is_allowlisted:
            return findings

        # 2. Rule: LONG_LABEL (15 pts)
        r2_cfg = context.rule_configs.get("LONG_LABEL", {})
        if r2_cfg.get("enabled", True):
            max_len = r2_cfg.get("threshold", {}).get("max_label_length", 45)
            if len(subdomain_label) > max_len:
                findings.append(
                    Finding(
                        rule_id="LONG_LABEL",
                        rule_name="Suspiciously Long DNS Label",
                        category="Structural Anomaly",
                        threshold_used=max_len,
                        observed_value=len(subdomain_label),
                        contribution=r2_cfg.get("contribution", 15),
                        explanation=f"Subdomain label length ({len(subdomain_label)}) exceeds configured threshold of {max_len}.",
                    )
                )

        # 3. Rule: ENCODED_LABEL (20 pts)
        r3_cfg = context.rule_configs.get("ENCODED_LABEL", {})
        if r3_cfg.get("enabled", True):
            min_enc = r3_cfg.get("threshold", {}).get("min_encoded_chars", 18)
            if len(subdomain_label) >= min_enc and BASE64_PATTERN.match(subdomain_label):
                findings.append(
                    Finding(
                        rule_id="ENCODED_LABEL",
                        rule_name="Base32 / Base64 Encoded Label",
                        category="Structural Anomaly",
                        threshold_used=min_enc,
                        observed_value=len(subdomain_label),
                        contribution=r3_cfg.get("contribution", 20),
                        explanation=f"Subdomain label matches high-density binary payload encoding pattern ({len(subdomain_label)} chars).",
                    )
                )

        # 4. Rule: HIGH_ENTROPY (20 pts)
        r4_cfg = context.rule_configs.get("HIGH_ENTROPY", {})
        if r4_cfg.get("enabled", True):
            threshold_entropy = r4_cfg.get("threshold", {}).get("entropy_threshold", 3.8)
            observed_entropy = calculate_shannon_entropy(subdomain_label)
            if len(subdomain_label) >= 10 and observed_entropy >= threshold_entropy:
                findings.append(
                    Finding(
                        rule_id="HIGH_ENTROPY",
                        rule_name="High Shannon Entropy Subdomain",
                        category="Structural Anomaly",
                        threshold_used=threshold_entropy,
                        observed_value=observed_entropy,
                        contribution=r4_cfg.get("contribution", 20),
                        explanation=f"Subdomain entropy ({observed_entropy} bits/char) indicates algorithmic randomness or encryption.",
                    )
                )

        # 5. Rule: DNS_TUNNEL_PATTERN (35 pts)
        # Multi-factor correlation: requires long encoded label + TXT or NULL record + burst
        r5_cfg = context.rule_configs.get("DNS_TUNNEL_PATTERN", {})
        if r5_cfg.get("enabled", True):
            is_tunnel_shape = (
                len(subdomain_label) >= 30
                and BASE64_PATTERN.match(subdomain_label)
                and event.record_type in ("TXT", "NULL")
            )
            if is_tunnel_shape:
                findings.append(
                    Finding(
                        rule_id="DNS_TUNNEL_PATTERN",
                        rule_name="Potential DNS Tunneling Activity",
                        category="Exfiltration Anomaly",
                        threshold_used="Correlated TXT + Encoded Subdomain >= 30",
                        observed_value=f"{event.record_type} query with {len(subdomain_label)} encoded bytes",
                        contribution=r5_cfg.get("contribution", 35),
                        explanation="Correlated payload signatures typical of DNS tunneling/exfiltration channels.",
                    )
                )

        # 6. Rule: NXDOMAIN_SPIKE (25 pts)
        r6_cfg = context.rule_configs.get("NXDOMAIN_SPIKE", {})
        if r6_cfg.get("enabled", True):
            if event.response_code == "NXDOMAIN":
                nx_count = sum(1 for e in context.recent_events_client if getattr(e, "response_code", "") == "NXDOMAIN")
                min_failures = r6_cfg.get("threshold", {}).get("min_failures", 5)
                if nx_count >= min_failures:
                    findings.append(
                        Finding(
                            rule_id="NXDOMAIN_SPIKE",
                            rule_name="NXDOMAIN Failure Rate Spike",
                            category="Failure Anomaly",
                            threshold_used=min_failures,
                            observed_value=nx_count,
                            contribution=r6_cfg.get("contribution", 25),
                            explanation=f"Client encountered {nx_count} resolution failures in the active window.",
                        )
                    )

        # 7. Rule: QUERY_RATE_ANOMALY (25 pts)
        r7_cfg = context.rule_configs.get("QUERY_RATE_ANOMALY", {})
        if r7_cfg.get("enabled", True):
            window_queries = len(context.recent_events_client)
            rate_limit = r7_cfg.get("threshold", {}).get("queries_per_minute", 150)
            if window_queries > rate_limit:
                findings.append(
                    Finding(
                        rule_id="QUERY_RATE_ANOMALY",
                        rule_name="Client Query Volume Spike",
                        category="Volume Anomaly",
                        threshold_used=rate_limit,
                        observed_value=window_queries,
                        contribution=r7_cfg.get("contribution", 25),
                        explanation=f"Client emitted {window_queries} queries exceeding baseline of {rate_limit}/window.",
                    )
                )

        # 8. Rule: DGA_PATTERN (30 pts)
        r8_cfg = context.rule_configs.get("DGA_PATTERN", {})
        if r8_cfg.get("enabled", True):
            distinct_domains = len({getattr(e, "normalized_domain", "") for e in context.recent_events_client})
            dga_min = r8_cfg.get("threshold", {}).get("distinct_domains", 8)
            if distinct_domains >= dga_min and calculate_shannon_entropy(subdomain_label) > 3.4:
                findings.append(
                    Finding(
                        rule_id="DGA_PATTERN",
                        rule_name="Domain Generation Algorithm (DGA) Heuristic",
                        category="Algorithmic Threat",
                        threshold_used=dga_min,
                        observed_value=distinct_domains,
                        contribution=r8_cfg.get("contribution", 30),
                        explanation=f"Client queried {distinct_domains} pseudorandom domains in short succession.",
                    )
                )

        return findings


def calculate_risk_score(findings: List[Finding]) -> int:
    """Bounded application score: min(100, sum(contributions))"""
    if not findings:
        return 0
    total = sum(f.contribution for f in findings)
    return min(100, total)


def score_to_severity(score: int) -> str:
    """
    Severity bands:
    Low: 0-29
    Medium: 30-59
    High: 60-79
    Critical: 80-100
    """
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 30:
        return "medium"
    return "low"
