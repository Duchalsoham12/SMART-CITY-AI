"""
SmartCityAI - Assistant Hallucination Guard
Validates that generated natural language outputs contain zero fabricated numbers,
contain required internal citations, and adhere strictly to non-causal epistemic laws.
"""

import math
import re
from typing import Any, List, Set, Tuple
from ml.assistant.schemas import AssistantResponse, FactGraph
from ml.xai.causal_guard import CausalGuard


class HallucinationGuard:
    """Rigorous audit gate preventing numerical fabrication and ungrounded claims."""

    # Numbers permissible by default (standard formatting, confidence levels, horizons)
    ALLOWED_SYSTEM_NUMBERS: Set[float] = {
        1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 10.0, 15.0, 24.0, 30.0, 90.0, 95.0, 2.5
    }

    @classmethod
    def extract_numbers_from_text(cls, text: str) -> List[float]:
        """Extracts all floating point and integer numerical tokens from text."""
        # Remove date-like patterns or explicit version numbers like v1.4, v2.1 to avoid false triggers
        cleaned = re.sub(r"v\d+\.\d+", "", text)
        cleaned = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", "", cleaned)
        cleaned = re.sub(r"\[Source:[^\]]+\]", "", cleaned)  # Ignore numbers inside citations (e.g. station IDs)

        tokens = re.findall(r"[-+]?\b\d+\.?\d*\b", cleaned)
        extracted = []
        for t in tokens:
            try:
                extracted.append(float(t))
            except ValueError:
                continue
        return extracted

    @classmethod
    def collect_grounded_numbers(cls, fact_graph: FactGraph) -> Set[float]:
        """Extracts all authorized numerical quantities from the FactGraph."""
        grounded: Set[float] = set(cls.ALLOWED_SYSTEM_NUMBERS)

        for fact in fact_graph.facts:
            # Check fact value
            if isinstance(fact.value, (int, float)):
                grounded.add(float(fact.value))
                grounded.add(round(float(fact.value), 1))
                grounded.add(round(float(fact.value), 2))
                grounded.add(abs(float(fact.value)))
                grounded.add(round(abs(float(fact.value)), 1))
                grounded.add(round(abs(float(fact.value)), 2))
            elif isinstance(fact.value, str):
                # Check for embedded numbers in string facts like SHAP values (+0.28)
                nums = re.findall(r"[-+]?\d+\.?\d*", fact.value)
                for n in nums:
                    try:
                        val = float(n)
                        grounded.add(val)
                        grounded.add(abs(val))
                    except ValueError:
                        pass

            # Check uncertainty bounds
            if fact.uncertainty_bounds:
                for b in fact.uncertainty_bounds:
                    grounded.add(float(b))
                    grounded.add(round(float(b), 1))
                    grounded.add(round(float(b), 2))

        return grounded

    @classmethod
    def audit_numerical_grounding(cls, text: str, fact_graph: FactGraph) -> Tuple[bool, List[float]]:
        """
        Verifies that every number mentioned in the generated text exists in the FactGraph.
        Returns:
            passed: True if zero fabricated numbers detected.
            hallucinated_numbers: List of ungrounded numbers found.
        """
        if fact_graph.is_empty:
            # If facts are empty, text should contain zero statistics
            text_numbers = cls.extract_numbers_from_text(text)
            ungrounded = [n for n in text_numbers if n not in cls.ALLOWED_SYSTEM_NUMBERS]
            return (len(ungrounded) == 0, ungrounded)

        grounded = cls.collect_grounded_numbers(fact_graph)
        text_numbers = cls.extract_numbers_from_text(text)

        ungrounded = []
        for num in text_numbers:
            # Check if num is close to any grounded number within small rounding delta
            is_match = any(math.isclose(num, g, abs_tol=0.15) for g in grounded)
            if not is_match:
                ungrounded.append(num)

        return (len(ungrounded) == 0, ungrounded)

    @classmethod
    def audit_and_sanitize(cls, response: AssistantResponse, fact_graph: FactGraph) -> AssistantResponse:
        """
        Comprehensive audit pass:
        1. Numerical grounding verification
        2. Causal language sanitization
        3. Mandatory citation presence
        """
        # 1. Numerical audit
        grounding_ok, ungrounded_nums = cls.audit_numerical_grounding(response.answer_text, fact_graph)

        # 2. Causal language audit & sanitization
        sanitized_text, was_causal = CausalGuard.sanitize_explanation_text(response.answer_text)

        # 3. Citation check
        citation_ok = True
        if not fact_graph.is_empty and fact_graph.facts:
            citation_ok = "[Source:" in response.answer_text

        # 4. Final verification status
        audit_passed = grounding_ok and citation_ok

        if not audit_passed:
            # If ungrounded numbers detected, record audit failure and append warning
            response.hallucination_audit_passed = False
            response.answer_text = (
                f"{sanitized_text}\n\n"
                f"[SECURITY AUDIT ALERT: Numerical hallucination gate flagged ungrounded values: {ungrounded_nums}. "
                f"These values were not present in the verified FactGraph.]"
            )
        else:
            response.hallucination_audit_passed = True
            response.answer_text = sanitized_text

        return response
