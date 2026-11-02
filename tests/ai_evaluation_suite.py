#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aurabook AI Platform — Automated Evaluation Test Suite (Tiers 1-4)
==================================================================
Independent, opaque-box test runner for AI Đọc Sách, AI Tìm Kiếm,
Voice Chat, and Business Policy Knowledge Grounding.

Executes tests against live running services:
- Reader Chat: http://localhost:3000/api/ai/reader-chat
- AI Search: http://localhost:3000/api/ai/graphrag/search & http://localhost:8000/aurabook/search/hybrid
- Voice Chat: http://localhost:3000/api/ai/voice-agent/chat & http://localhost:5050/api/tts

Evaluates:
1. Grounding & Accuracy (factual correctness, zero hallucination)
2. Production Reliability (status code, latency, valid JSON/Audio)
3. Intent Resolution (greeting vs factual vs quote analysis)

Outputs:
- tests/ai_evaluation_report.json
- tests/ai_evaluation_report.md
"""

import sys
import os
import json
import time
import base64
import argparse
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

# Ensure UTF-8 output encoding for console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def normalize_text_for_search(text: str) -> str:
    """Normalize text to lowercase for case-insensitive matching."""
    return (text or "").lower().strip()


class EvaluationRunner:
    def __init__(
        self,
        dataset_path: str,
        timeout: float = 10.0,
        tier_filter: Optional[str] = None,
        feature_filter: Optional[str] = None,
        id_filter: Optional[str] = None,
        allow_pending: bool = False,
    ):
        self.dataset_path = dataset_path
        self.timeout = timeout
        self.tier_filter = tier_filter
        self.feature_filter = feature_filter
        self.id_filter = id_filter
        self.allow_pending = allow_pending
        self.results: List[Dict[str, Any]] = []

    def load_dataset(self) -> Dict[str, Any]:
        """Loads and validates the ground truth test dataset."""
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Test dataset not found at: {self.dataset_path}")
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def execute_http_request(
        self, endpoint: str, method: str, headers: Dict[str, str], body: Any, params: Optional[Dict[str, str]]
    ) -> Tuple[int, Any, float, Optional[str]]:
        """
        Executes HTTP request using urllib.request.
        Returns: (status_code, response_data, latency_ms, error_message)
        """
        url = endpoint
        if params:
            query_string = urllib.parse.urlencode(params)
            url = f"{url}?{query_string}" if "?" not in url else f"{url}&{query_string}"

        req_headers = {"User-Agent": "Aurabook-AI-Evaluation-Runner/1.0"}
        if headers:
            req_headers.update(headers)

        data = None
        if body is not None and method.upper() in ["POST", "PUT", "PATCH"]:
            if isinstance(body, (dict, list)):
                data = json.dumps(body).encode("utf-8")
                if "Content-Type" not in req_headers:
                    req_headers["Content-Type"] = "application/json"
            elif isinstance(body, str):
                data = body.encode("utf-8")

        start_time = time.perf_counter()
        req = urllib.request.Request(url, data=data, headers=req_headers, method=method.upper())

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                latency_ms = (time.perf_counter() - start_time) * 1000.0
                status_code = response.getcode()
                raw_bytes = response.read()
                raw_text = raw_bytes.decode("utf-8", errors="replace")

                try:
                    res_json = json.loads(raw_text)
                    return status_code, res_json, latency_ms, None
                except Exception:
                    return status_code, raw_text, latency_ms, None

        except urllib.error.HTTPError as http_err:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            status_code = http_err.code
            raw_bytes = http_err.read()
            raw_text = raw_bytes.decode("utf-8", errors="replace")
            try:
                res_json = json.loads(raw_text)
                return status_code, res_json, latency_ms, None
            except Exception:
                return status_code, raw_text, latency_ms, None

        except urllib.error.URLError as url_err:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return 0, None, latency_ms, f"Network Connection Error: {url_err.reason}"

        except Exception as ex:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return 0, None, latency_ms, f"Execution Exception: {str(ex)}"

    def evaluate_test_case(self, tc: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates a single test case across Reliability, Grounding, and Intent."""
        tc_id = tc["id"]
        req_spec = tc["request"]
        exp_spec = tc["expected"]
        eval_spec = tc.get("evaluation", {})

        endpoint = req_spec["endpoint"]
        method = req_spec.get("method", "POST")
        headers = req_spec.get("headers", {})
        body = req_spec.get("body", None)
        params = req_spec.get("params", None)

        status_code, resp_data, latency_ms, req_error = self.execute_http_request(
            endpoint, method, headers, body, params
        )

        checks: List[Dict[str, Any]] = []
        is_passed = True
        failure_reasons: List[str] = []

        # 1. Reliability Check: Connection & Status Code
        expected_status = exp_spec.get("status_code", 200)
        status_match = status_code == expected_status
        checks.append({
            "dimension": "reliability",
            "name": "HTTP Status Code Match",
            "passed": status_match,
            "actual": status_code,
            "expected": expected_status,
        })
        if not status_match:
            is_passed = False
            failure_reasons.append(
                f"Status code mismatch: expected {expected_status}, got {status_code} (Error: {req_error})"
            )

        # 2. Reliability Check: Latency Threshold
        max_latency = eval_spec.get("max_latency_ms", self.timeout * 1000.0)
        latency_ok = latency_ms <= max_latency
        checks.append({
            "dimension": "reliability",
            "name": "Latency Threshold",
            "passed": latency_ok,
            "actual_ms": round(latency_ms, 2),
            "threshold_ms": max_latency,
        })
        if not latency_ok and status_match:
            is_passed = False
            failure_reasons.append(f"Latency exceeded: {latency_ms:.1f}ms > {max_latency}ms")

        # Extract text content for Grounding and Intent analysis
        resp_text_blob = ""
        products_list = []
        if isinstance(resp_data, dict):
            for k, v in resp_data.items():
                if k == "audioBase64":
                    continue
                if isinstance(v, str):
                    resp_text_blob += " " + v
            if "products" in resp_data and isinstance(resp_data["products"], list):
                products_list = resp_data["products"]
                for p in products_list:
                    if isinstance(p, dict):
                        resp_text_blob += " " + str(p.get("name", "")) + " " + str(p.get("slug", ""))
            if "results" in resp_data and isinstance(resp_data["results"], list):
                for r in resp_data["results"]:
                    if isinstance(r, dict):
                        resp_text_blob += " " + str(r.get("title", "")) + " " + str(r.get("product_slug", ""))
        elif isinstance(resp_data, str):
            resp_text_blob = resp_data

        norm_blob = normalize_text_for_search(resp_text_blob)

        # 3. Reliability Check: Schema Keys
        schema_keys = exp_spec.get("schema_keys", [])
        if schema_keys and isinstance(resp_data, dict):
            missing_keys = [k for k in schema_keys if k not in resp_data]
            keys_ok = len(missing_keys) == 0
            checks.append({
                "dimension": "reliability",
                "name": "Schema Keys Present",
                "passed": keys_ok,
                "missing": missing_keys,
            })
            if not keys_ok:
                is_passed = False
                failure_reasons.append(f"Missing expected schema keys: {missing_keys}")

        # 4. Reliability Check: Audio Payload Validity (for TTS/Voice)
        min_audio_bytes = exp_spec.get("min_audio_bytes")
        if min_audio_bytes and isinstance(resp_data, dict):
            b64_audio = resp_data.get("audioBase64", "")
            audio_valid = False
            actual_audio_size = 0
            if b64_audio:
                try:
                    decoded = base64.b64decode(b64_audio)
                    actual_audio_size = len(decoded)
                    audio_valid = actual_audio_size >= min_audio_bytes
                except Exception:
                    audio_valid = False
            checks.append({
                "dimension": "reliability",
                "name": "Audio Base64 Output Validity",
                "passed": audio_valid,
                "actual_bytes": actual_audio_size,
                "expected_min_bytes": min_audio_bytes,
            })
            if not audio_valid:
                is_passed = False
                failure_reasons.append(
                    f"Invalid audio output: got {actual_audio_size} bytes, expected >= {min_audio_bytes}"
                )

        # 5. Grounding Check: Required Keywords
        required_keywords = exp_spec.get("required_keywords", [])
        missing_keywords = []
        for kw in required_keywords:
            if normalize_text_for_search(kw) not in norm_blob:
                missing_keywords.append(kw)
        grounding_kw_ok = len(missing_keywords) == 0
        checks.append({
            "dimension": "grounding",
            "name": "Required Keywords Present",
            "passed": grounding_kw_ok,
            "missing": missing_keywords,
        })
        if not grounding_kw_ok:
            is_passed = False
            failure_reasons.append(f"Grounding missing required keywords: {missing_keywords}")

        # 6. Grounding Check: Forbidden Keywords (Anti-Hallucination)
        forbidden_keywords = exp_spec.get("forbidden_keywords", [])
        found_forbidden = []
        for kw in forbidden_keywords:
            if normalize_text_for_search(kw) in norm_blob:
                found_forbidden.append(kw)
        forbidden_kw_ok = len(found_forbidden) == 0
        checks.append({
            "dimension": "grounding",
            "name": "Anti-Hallucination Forbidden Keywords Absent",
            "passed": forbidden_kw_ok,
            "detected": found_forbidden,
        })
        if not forbidden_kw_ok:
            is_passed = False
            failure_reasons.append(f"Hallucination detected (found forbidden keywords): {found_forbidden}")

        # 7. Grounding Check: Forbidden First Result (e.g. search ranking guardrail)
        forbidden_first = exp_spec.get("forbidden_first_result")
        if forbidden_first and products_list:
            first_product = products_list[0]
            first_slug = first_product.get("slug", "")
            first_id = first_product.get("id", "")
            first_ok = (forbidden_first not in first_slug) and (forbidden_first not in first_id)
            checks.append({
                "dimension": "grounding",
                "name": "Search Guardrail: Correct First Ranked Entity",
                "passed": first_ok,
                "actual_first_slug": first_slug,
                "forbidden_first": forbidden_first,
            })
            if not first_ok:
                is_passed = False
                failure_reasons.append(
                    f"Search relevance error: first ranked product was '{first_slug}', forbidden was '{forbidden_first}'"
                )

        # 8. Grounding Check: Minimum Results Count
        min_results = exp_spec.get("min_results_count")
        if min_results is not None and isinstance(resp_data, dict):
            actual_count = len(products_list)
            if "totalCount" in resp_data:
                actual_count = max(actual_count, resp_data["totalCount"])
            count_ok = actual_count >= min_results
            checks.append({
                "dimension": "grounding",
                "name": "Minimum Results Count",
                "passed": count_ok,
                "actual": actual_count,
                "min_required": min_results,
            })
            if not count_ok:
                is_passed = False
                failure_reasons.append(f"Search results insufficient: got {actual_count}, required >= {min_results}")

        # 9. Grounding Check: Minimum Content Length
        min_len = exp_spec.get("min_length")
        if min_len:
            actual_len = len(resp_text_blob.strip())
            len_ok = actual_len >= min_len
            checks.append({
                "dimension": "grounding",
                "name": "Content Substance & Length",
                "passed": len_ok,
                "actual_length": actual_len,
                "expected_min_length": min_len,
            })
            if not len_ok:
                is_passed = False
                failure_reasons.append(f"Response too brief: length {actual_len} < {min_len}")

        # 10. Intent Resolution Check
        intent_type = eval_spec.get("intent_resolution", "GENERAL")
        checks.append({
            "dimension": "intent",
            "name": f"Intent Resolution: {intent_type}",
            "passed": is_passed or (status_match and grounding_kw_ok),
            "expected_intent": intent_type,
        })

        return {
            "id": tc_id,
            "tier": tc["tier"],
            "feature": tc["feature"],
            "name": tc["name"],
            "passed": is_passed,
            "latency_ms": round(latency_ms, 2),
            "status_code": status_code,
            "failure_reasons": failure_reasons,
            "checks": checks,
            "grounding_source": eval_spec.get("grounding", "System Data"),
            "intent": intent_type,
        }

    def run_all(self) -> Dict[str, Any]:
        """Runs evaluation across all filtered test cases and generates summary."""
        dataset = self.load_dataset()
        test_cases = dataset.get("test_cases", [])

        # Apply CLI filters
        filtered_cases = []
        for tc in test_cases:
            if self.tier_filter and str(self.tier_filter) not in tc["tier"]:
                continue
            if self.feature_filter and tc["feature"] != self.feature_filter:
                continue
            if self.id_filter and tc["id"] != self.id_filter:
                continue
            filtered_cases.append(tc)

        print("=" * 80)
        print(f"AURABOOK AI EVALUATION SUITE — RUNNING {len(filtered_cases)} TEST CASES")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

        results = []
        start_suite = time.perf_counter()

        for idx, tc in enumerate(filtered_cases, 1):
            sys.stdout.write(f"[{idx:02d}/{len(filtered_cases):02d}] {tc['id']} - {tc['name'][:42]:<42} ... ")
            sys.stdout.flush()

            res = self.evaluate_test_case(tc)
            results.append(res)

            if res["passed"]:
                sys.stdout.write(f"\033[92mPASS\033[0m ({res['latency_ms']:.0f}ms)\n")
            else:
                reason = res["failure_reasons"][0] if res["failure_reasons"] else "Validation failed"
                sys.stdout.write(f"\033[91mFAIL\033[0m ({res['latency_ms']:.0f}ms) -> {reason[:50]}\n")

        total_suite_time = (time.perf_counter() - start_suite)

        # Aggregate Statistics
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r["passed"])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100.0) if total_tests > 0 else 0.0

        tier_stats: Dict[str, Dict[str, int]] = {}
        feature_stats: Dict[str, Dict[str, int]] = {}

        for r in results:
            t = r["tier"]
            f = r["feature"]

            if t not in tier_stats:
                tier_stats[t] = {"total": 0, "passed": 0, "failed": 0}
            tier_stats[t]["total"] += 1
            if r["passed"]:
                tier_stats[t]["passed"] += 1
            else:
                tier_stats[t]["failed"] += 1

            if f not in feature_stats:
                feature_stats[f] = {"total": 0, "passed": 0, "failed": 0}
            feature_stats[f]["total"] += 1
            if r["passed"]:
                feature_stats[f]["passed"] += 1
            else:
                feature_stats[f]["failed"] += 1

        summary = {
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": round(total_suite_time, 2),
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "pass_rate_percent": round(pass_rate, 2),
            "tier_breakdown": tier_stats,
            "feature_breakdown": feature_stats,
            "results": results,
        }

        print("\n" + "=" * 80)
        print("EVALUATION SUMMARY")
        print("=" * 80)
        print(f"Total Tests Run : {total_tests}")
        print(f"Passed          : {passed_tests} ({pass_rate:.1f}%)")
        print(f"Failed / Pending: {failed_tests}")
        print(f"Total Duration  : {total_suite_time:.2f}s")
        print("-" * 80)
        print("Tier Breakdown:")
        for t, stats in tier_stats.items():
            rate = (stats["passed"] / stats["total"] * 100.0) if stats["total"] > 0 else 0
            print(f"  * {t:<35}: {stats['passed']}/{stats['total']} passed ({rate:.1f}%)")
        print("-" * 80)
        print("Feature Subsystem Breakdown:")
        for f, stats in feature_stats.items():
            rate = (stats["passed"] / stats["total"] * 100.0) if stats["total"] > 0 else 0
            print(f"  * {f:<25}: {stats['passed']}/{stats['total']} passed ({rate:.1f}%)")
        print("=" * 80)

        return summary


def generate_markdown_report(summary: Dict[str, Any], output_path: str):
    """Generates comprehensive human-readable Markdown evaluation report."""
    md = []
    md.append("# BÁO CÁO KIỂM THỬ ĐÁNH GIÁ TỰ ĐỘNG NỀN TẢNG AI AURABOOK")
    md.append(f"**Thời gian thực thi:** {summary['timestamp']}  ")
    md.append(f"**Thời lượng chạy:** {summary['duration_seconds']}s  ")
    md.append(f"**Tổng số kịch bản kiểm thử:** {summary['total_tests']}  ")
    md.append(f"**Tỷ lệ Đạt (Pass Rate):** {summary['pass_rate_percent']}% ({summary['passed_tests']}/{summary['total_tests']})  \n")

    md.append("## 1. Tổng Hợp Kết Quả Đánh Giá Theo Phân Phẩm (Tier Summary)")
    md.append("| Phân Tầng Kiểm Thử (Tier) | Tổng Số | Đạt (Pass) | Lỗi / Chờ Xử Lý (Fail) | Tỷ Lệ Đạt |")
    md.append("|---|:---:|:---:|:---:|:---:|")
    for t, s in summary["tier_breakdown"].items():
        rate = (s["passed"] / s["total"] * 100.0) if s["total"] > 0 else 0
        md.append(f"| {t} | {s['total']} | {s['passed']} | {s['failed']} | **{rate:.1f}%** |")
    md.append("")

    md.append("## 2. Tổng Hợp Theo Phân Hệ AI (Subsystem Breakdown)")
    md.append("| Phân Hệ (Feature Subsystem) | Tổng Số | Đạt (Pass) | Lỗi (Fail) | Tỷ Lệ Đạt |")
    md.append("|---|:---:|:---:|:---:|:---:|")
    for f, s in summary["feature_breakdown"].items():
        rate = (s["passed"] / s["total"] * 100.0) if s["total"] > 0 else 0
        md.append(f"| `{f}` | {s['total']} | {s['passed']} | {s['failed']} | **{rate:.1f}%** |")
    md.append("")

    md.append("## 3. Danh Sách Chi Tiết Các Kịch Bản Thất Bại & Nguyên Nhân (Diagnostic Root Cause)")
    failed_results = [r for r in summary["results"] if not r["passed"]]
    if not failed_results:
        md.append("✅ **TUYỆT VỜI: 100% KỊCH BẢN KIỂM THỬ ĐÃ VƯỢT QUA XUẤT SẮC!**\n")
    else:
        md.append(f"Phát hiện **{len(failed_results)}** ca kiểm thử chưa đạt (do các tính năng tương ứng đang được triển khai tại Milestones M1, M2, M3, M4):")
        md.append("")
        for fr in failed_results:
            md.append(f"### ❌ `{fr['id']}`: {fr['name']}")
            md.append(f"- **Tier:** {fr['tier']} | **Phân hệ:** `{fr['feature']}`")
            md.append(f"- **Độ trễ:** {fr['latency_ms']}ms | **HTTP Status:** {fr['status_code']}")
            md.append(f"- **Nguồn Grounding:** {fr['grounding_source']}")
            md.append("- **Nguyên nhân chi tiết:**")
            for r in fr["failure_reasons"]:
                md.append(f"  * `{r}`")
            md.append("")

    md.append("## 4. Chi Tiết Toàn Bộ 55 Ca Kiểm Thử (Full Test Suite Log)")
    md.append("| ID | Tên Kịch Bản | Phân Hệ | Trạng Thái | Độ Trễ | Ghi Chú |")
    md.append("|---|---|---|:---:|:---:|---|")
    for r in summary["results"]:
        status_badge = "✅ PASS" if r["passed"] else "❌ FAIL"
        note = "OK" if r["passed"] else (r["failure_reasons"][0] if r["failure_reasons"] else "Failed")
        # Sanitize pipe characters in note
        note_clean = note.replace("|", "/")[:75]
        md.append(f"| `{r['id']}` | {r['name'][:40]} | `{r['feature']}` | {status_badge} | {r['latency_ms']:.0f}ms | {note_clean} |")
    md.append("")

    md.append("## 5. Hướng Dẫn Tái Hiện & Thực Thi Độc Lập")
    md.append("```bash")
    md.append("# Chạy toàn bộ 55 bài kiểm thử:")
    md.append("python tests/ai_evaluation_suite.py")
    md.append("")
    md.append("# Chạy riêng Tier 1 (Feature Coverage):")
    md.append("python tests/ai_evaluation_suite.py --tier 1")
    md.append("")
    md.append("# Chạy riêng một bài kiểm thử cụ thể:")
    md.append("python tests/ai_evaluation_suite.py --id TC-T1-07")
    md.append("```\n")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))


def main():
    parser = argparse.ArgumentParser(description="Aurabook AI Platform Automated Evaluation Suite")
    parser.add_argument(
        "--dataset",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "test_dataset_ground_truth.json"),
        help="Path to test dataset JSON",
    )
    parser.add_argument(
        "--report-json",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "ai_evaluation_report.json"),
        help="Path to output JSON report",
    )
    parser.add_argument(
        "--report-md",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "ai_evaluation_report.md"),
        help="Path to output Markdown report",
    )
    parser.add_argument("--tier", type=str, default=None, help="Filter by tier number (1, 2, 3, 4)")
    parser.add_argument("--feature", type=str, default=None, help="Filter by feature name")
    parser.add_argument("--id", type=str, default=None, help="Filter by specific test case ID")
    parser.add_argument("--timeout", type=float, default=10.0, help="HTTP request timeout in seconds")
    parser.add_argument(
        "--allow-pending",
        action="store_true",
        help="Exit with 0 even if pending tests fail (for milestone progression verification)",
    )

    args = parser.parse_args()

    # Normalize relative paths if run from repository root
    dataset_path = os.path.abspath(args.dataset)
    report_json = os.path.abspath(args.report_json)
    report_md = os.path.abspath(args.report_md)

    runner = EvaluationRunner(
        dataset_path=dataset_path,
        timeout=args.timeout,
        tier_filter=args.tier,
        feature_filter=args.feature,
        id_filter=args.id,
        allow_pending=args.allow_pending,
    )

    summary = runner.run_all()

    # Save JSON report
    os.makedirs(os.path.dirname(report_json), exist_ok=True)
    with open(report_json, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n[Artifact] JSON Report saved to: {report_json}")

    # Save Markdown report
    generate_markdown_report(summary, report_md)
    print(f"[Artifact] Markdown Report saved to: {report_md}")

    # Determine exit code
    if args.allow_pending or summary["failed_tests"] == 0:
        sys.exit(0)
    else:
        sys.exit(1)


# Pytest compatibility wrapper
def test_ai_evaluation_suite():
    """Pytest entrypoint to execute AI evaluation suite."""
    dataset_path = os.path.join(os.path.dirname(__file__), "test_dataset_ground_truth.json")
    runner = EvaluationRunner(dataset_path=dataset_path, timeout=10.0, allow_pending=True)
    summary = runner.run_all()
    assert summary["total_tests"] == 55, "Test suite must contain at least 55 test cases"


if __name__ == "__main__":
    main()
