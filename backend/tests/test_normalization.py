import pytest

from backend.app.normalization.normalizer import (
    NormalizationError,
    normalize_domain,
    validate_ip,
    validate_record_type,
    validate_response_code,
)


def test_normalize_domain_strips_trailing_dot():
    assert normalize_domain("google.com.") == "google.com"
    assert normalize_domain("API.GITHUB.COM.") == "api.github.com"


def test_normalize_domain_lowercases():
    assert normalize_domain("TUNNEL.C2SERVER.ORG") == "tunnel.c2server.org"


def test_normalize_domain_rejects_empty_or_excessive():
    with pytest.raises(NormalizationError):
        normalize_domain("")

    with pytest.raises(NormalizationError):
        normalize_domain("a" * 254 + ".com")

    with pytest.raises(NormalizationError):
        normalize_domain("a." + "b" * 64 + ".com")


def test_validate_ip():
    assert validate_ip("192.168.1.1") == "192.168.1.1"
    assert validate_ip("2001:db8::1") == "2001:db8::1"
    with pytest.raises(NormalizationError):
        validate_ip("invalid-ip-999.999.999.999")


def test_validate_record_type():
    assert validate_record_type("a") == "A"
    assert validate_record_type("txt") == "TXT"
    assert validate_record_type("unknown_type") == "A"  # fallback


def test_validate_response_code():
    assert validate_response_code("noerror") == "NOERROR"
    assert validate_response_code("nxdomain") == "NXDOMAIN"
    assert validate_response_code("weird_rcode") == "NOERROR"  # fallback
