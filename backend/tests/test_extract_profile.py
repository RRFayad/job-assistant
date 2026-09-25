from fastapi.testclient import TestClient

import main
from auth.auth import get_current_user
from auth.subscription import require_subscription_plan
from db.models import SubscriptionPlan, User

fake_user = User(id=1, clerk_id="test", email="test@example.com", role="user")
main.app.dependency_overrides[get_current_user] = lambda: fake_user
main.app.dependency_overrides[require_subscription_plan(SubscriptionPlan.BASIC)] = (
    lambda: None
)

client = TestClient(main.app)


def test_extract_returns_a_populated_profile() -> None:
    response = client.post(
        "/profile/extract",
        files={"file": ("resume.pdf", b"fake pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["header"]["fullName"]
    assert len(body["sections"]) > 0


def test_extract_rejects_a_file_over_the_size_limit() -> None:
    oversized = b"x" * (10 * 1024 * 1024 + 1)

    response = client.post(
        "/profile/extract",
        files={"file": ("resume.pdf", oversized, "application/pdf")},
    )

    assert response.status_code == 413
