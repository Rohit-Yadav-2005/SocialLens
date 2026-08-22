"""Shape of error responses returned by the global exception handlers in main.py."""

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error_code: str
    message: str
