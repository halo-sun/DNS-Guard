from backend.app.collectors.coredns_adapter import parse_coredns_log_line
from backend.app.collectors.file_importer import parse_csv_or_json_content


def test_parse_csv_import():
    csv_bytes = b"domain,client_ip,record_type,response_code\ngoogle.com,192.168.1.50,A,NOERROR\nbad.com,invalid_ip,A,NOERROR\n"
    valid, errors = parse_csv_or_json_content(csv_bytes, "test.csv", "src-test")

    assert len(valid) == 1
    assert valid[0]["normalized_domain"] == "google.com"
    assert valid[0]["client_ip"] == "192.168.1.50"
    assert len(errors) == 1
    assert "Invalid IP" in errors[0]["error"]


def test_parse_json_import():
    json_bytes = b'[{"domain": "github.com", "client_ip": "10.0.0.1", "record_type": "AAAA"}]'
    valid, errors = parse_csv_or_json_content(json_bytes, "test.json", "src-test")

    assert len(valid) == 1
    assert valid[0]["normalized_domain"] == "github.com"
    assert valid[0]["client_ip"] == "10.0.0.1"
    assert len(errors) == 0


def test_parse_coredns_log_line():
    line = '[INFO] 192.168.1.105:53214 - 12450 "A IN google.com. udp 42 false 512" NOERROR qr,rd,ra 64 0.001243s'
    result = parse_coredns_log_line(line)

    assert result is not None
    assert result["client_ip"] == "192.168.1.105"
    assert result["normalized_domain"] == "google.com"
    assert result["record_type"] == "A"
    assert result["response_code"] == "NOERROR"
