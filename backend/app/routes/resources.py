from fastapi import APIRouter, Depends

from app.core import firestore_service, resources_data
from app.core.auth import verify_token
from app.models import ErrorNotebookUpdate, ResourcesSummaryResponse

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/summary", response_model=ResourcesSummaryResponse)
async def get_resources_summary(user_id: str = Depends(verify_token)):
    return resources_data.resources_summary(user_id)


@router.patch("/error-notebook/{notebook_id}", response_model=ResourcesSummaryResponse)
async def update_error_notebook_item(
    notebook_id: str,
    body: ErrorNotebookUpdate,
    user_id: str = Depends(verify_token),
):
    firestore_service.set_error_notebook_status(user_id, notebook_id, body.resolved, body.note)
    return resources_data.resources_summary(user_id)
