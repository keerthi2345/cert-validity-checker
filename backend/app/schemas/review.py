from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    decision: Literal["approve", "reject"]
    comments: Optional[str] = Field(
        default=None,
        max_length=1000
    )