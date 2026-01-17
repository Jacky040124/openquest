"""Authentication Controller - /auth/* Routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dto.auth_dto import LoginDTO, RegisterDTO, TokenDTO, UserResponseDTO
from ..dto.user_dto import UserPreferenceCreateDTO, UserPreferenceDTO, UserPreferenceUpdateDTO
from ..dao.user_preference_dao import UserPreferenceDAO
from ..services.auth_service import AuthService
from ..utils.dependencies import CurrentUser, DBSession, SupabaseClient

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterDTO, supabase: SupabaseClient) -> UserResponseDTO:
    """Register a new user"""
    try:
        auth_service = AuthService(supabase)
        return auth_service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=TokenDTO)
async def login(data: LoginDTO, supabase: SupabaseClient) -> TokenDTO:
    """Login and get access token"""
    try:
        auth_service = AuthService(supabase)
        return auth_service.login(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
        )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: SupabaseClient = None,
) -> None:
    """Logout current user"""
    auth_service = AuthService(supabase)
    auth_service.logout(credentials.credentials)


@router.get("/me", response_model=UserResponseDTO)
async def get_current_user_info(current_user: CurrentUser) -> UserResponseDTO:
    """Get current user information"""
    return UserResponseDTO(
        id=str(current_user["id"]),
        email=current_user["email"],
        created_at=current_user.get("created_at"),
    )


# User Preferences endpoints (under /auth for user context)
@router.get("/me/preferences", response_model=UserPreferenceDTO | None)
async def get_user_preferences(current_user: CurrentUser, db: DBSession) -> UserPreferenceDTO | None:
    """Get current user's preferences"""
    from uuid import UUID

    user_id = UUID(str(current_user["id"]))
    dao = UserPreferenceDAO(db)
    preference = dao.get_by_user_id(user_id)

    if preference:
        return UserPreferenceDTO.from_model(preference)
    return None


@router.post("/me/preferences", response_model=UserPreferenceDTO, status_code=status.HTTP_201_CREATED)
async def create_user_preferences(
    data: UserPreferenceCreateDTO,
    current_user: CurrentUser,
    db: DBSession,
) -> UserPreferenceDTO:
    """Create user preferences"""
    from uuid import UUID

    user_id = UUID(str(current_user["id"]))
    dao = UserPreferenceDAO(db)

    # Check if preferences already exist
    existing = dao.get_by_user_id(user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User preferences already exist. Use PUT to update.",
        )

    # Convert SkillInputDTO to dict format for storage
    skills_data = [skill.to_skill().to_dict() for skill in data.skills]

    # Convert enums to string values
    project_interests = [p.value for p in data.project_interests]
    issue_interests = [i.value for i in data.issue_interests]

    preference = dao.create_or_update(
        user_id=user_id,
        languages=data.languages,
        skills=skills_data,
        project_interests=project_interests,
        issue_interests=issue_interests,
    )

    return UserPreferenceDTO.from_model(preference)


@router.put("/me/preferences", response_model=UserPreferenceDTO)
async def update_user_preferences(
    data: UserPreferenceUpdateDTO,
    current_user: CurrentUser,
    db: DBSession,
) -> UserPreferenceDTO:
    """Update user preferences (full or partial update)"""
    from uuid import UUID

    user_id = UUID(str(current_user["id"]))
    dao = UserPreferenceDAO(db)

    # Convert SkillInputDTO to dict format if provided
    skills_data = (
        [skill.to_skill().to_dict() for skill in data.skills]
        if data.skills is not None
        else None
    )

    # Convert enums to string values if provided
    project_interests = (
        [p.value for p in data.project_interests]
        if data.project_interests is not None
        else None
    )
    issue_interests = (
        [i.value for i in data.issue_interests]
        if data.issue_interests is not None
        else None
    )

    preference = dao.update_partial(
        user_id=user_id,
        languages=data.languages,
        skills=skills_data,
        project_interests=project_interests,
        issue_interests=issue_interests,
    )

    if preference is None:
        # Create new preferences if none exist
        preference = dao.create_or_update(
            user_id=user_id,
            languages=data.languages or [],
            skills=skills_data or [],
            project_interests=project_interests or [],
            issue_interests=issue_interests or [],
        )

    return UserPreferenceDTO.from_model(preference)
