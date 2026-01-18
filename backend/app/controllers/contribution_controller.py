"""Contribution Analysis Controller - /contributions/* Routes"""

import logging

from fastapi import APIRouter, HTTPException, status

from ..dto.contribution_dto import (
    ContributionAnalysisDTO,
    ContributionAnalysisQueryDTO,
)
from ..services.contribution_service import ContributionService
from ..utils.dependencies import CurrentUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contributions", tags=["Contributions"])


@router.post("/analyze", response_model=ContributionAnalysisDTO)
async def analyze_contributions(
    query: ContributionAnalysisQueryDTO,
    current_user: CurrentUser,  # Require authentication
) -> ContributionAnalysisDTO:
    """
    Analyze repository contributions and generate heatmap data.
    
    This endpoint provides repository observability insights:
    - **Heatmap**: Shows where developer effort is concentrated
    - **Neglected Modules**: Identifies modules with low activity
    - **Specializations**: Shows which contributors focus on which areas
    
    **Request body:**
    - **repo_url**: GitHub repository URL (required)
    - **days_back**: Number of days to analyze (default: 90, max: 365)
    
    **Response includes:**
    - Heatmap matrix (contributors × modules) with effort scores
    - List of neglected modules (no activity in last 30 days)
    - Contributor specializations (top 3 modules per contributor)
    - Summary statistics
    """
    try:
        service = ContributionService()
        analysis = await service.analyze_repository(
            repo_url=query.repo_url, days_back=query.days_back
        )

        return ContributionAnalysisDTO(**analysis)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to analyze contributions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to analyze repository contributions: {str(e)}",
        )

