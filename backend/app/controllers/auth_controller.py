"""Authentication Controller - /auth/* Routes"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dao.user_preference_dao import UserPreferenceDAO
from ..dto.auth_dto import LoginDTO, RegisterDTO, TokenDTO, UserResponseDTO
from ..dto.user_dto import (
    UserPreferenceCreateDTO,
    UserPreferenceDTO,
    UserPreferenceUpdateDTO,
)
from ..services.auth_service import AuthService
from ..utils.dependencies import CurrentUser, SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post(
    "/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED
)
async def register(data: RegisterDTO, supabase: SupabaseClient) -> UserResponseDTO:
    """
    Register a new user.
    
    **Request body:**
    - **email**: Valid email address (required)
    - **password**: Password string (required, minimum 6 characters)
    
    **Note:** If email confirmation is enabled in Supabase, the user will need to
    confirm their email before they can log in.
    """
    try:
        auth_service = AuthService(supabase)
        return auth_service.register(data)
    except ValueError as e:
        # Validation errors (password too short, email already exists, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Log the full error for debugging
        logger.error(f"Registration error: {e}", exc_info=True)
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
@router.get("/me/preferences", response_model=UserPreferenceDTO)
async def get_user_preferences(
    current_user: CurrentUser,
    supabase: SupabaseClient,
) -> UserPreferenceDTO:
    """
    Get current user's preferences.

    Returns the user's preferences including:
    - Languages they're interested in
    - Skills with familiarity levels
    - Project interests (webapp, mobile, etc.)
    - Issue interests (bug_fix, feature, etc.)

    Raises 404 if preferences have not been set yet.
    """
    from uuid import UUID

    try:
        user_id = UUID(str(current_user["id"]))
        dao = UserPreferenceDAO(supabase)
        preference = dao.get_by_user_id(user_id)

        if not preference:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found. Please create preferences first.",
            )

        return UserPreferenceDTO.from_model(preference)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID format: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user preferences: {str(e)}",
        )


@router.post(
    "/me/preferences",
    response_model=UserPreferenceDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_preferences(
    data: UserPreferenceCreateDTO,
    current_user: CurrentUser,
    supabase: SupabaseClient,
) -> UserPreferenceDTO:
    """
    Create user preferences.

    Creates a new preference profile for the authenticated user. All fields are optional
    and can be empty lists for initial setup.

    **Request body fields (all optional, can be empty):**
    - `languages`: List of programming languages (e.g., ["Python", "JavaScript"])
    - `skills`: List of skills with familiarity levels
    - `project_interests`: List of project types (e.g., ["webapp", "mobile"])
    - `issue_interests`: List of issue types (e.g., ["bug_fix", "feature"])

    **Example request:**
    ```json
    {
      "languages": ["Python", "TypeScript"],
      "skills": [
        {
          "name": "python",
          "familiarity": "beginner",
          "category": "programming_language"
        },
        {
          "name": "react",
          "familiarity": "intermediate",
          "category": "framework"
        }
      ],
      "project_interests": ["webapp", "api"],
      "issue_interests": ["bug_fix", "feature"]
    }
    ```

    **Note:** If preferences already exist, returns 409 Conflict. Use PUT to update existing preferences.
    """
    from uuid import UUID

    try:
        user_id = UUID(str(current_user["id"]))
        dao = UserPreferenceDAO(supabase)

        # Check if preferences already exist
        existing = dao.get_by_user_id(user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User preferences already exist. Use PUT /me/preferences to update.",
            )

        # Convert SkillInputDTO to dict format for storage
        skills_data = [skill.to_skill().to_dict() for skill in data.skills]

        # Convert enums to string values
        project_interests = [p.value for p in data.project_interests]
        issue_interests = [i.value for i in data.issue_interests]

        # Create new preferences
        preference = dao.create_or_update(
            user_id=user_id,
            languages=data.languages,
            skills=skills_data,
            project_interests=project_interests,
            issue_interests=issue_interests,
        )

        return UserPreferenceDTO.from_model(preference)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user preferences: {str(e)}",
        )


@router.put("/me/preferences", response_model=UserPreferenceDTO)
async def update_user_preferences(
    data: UserPreferenceUpdateDTO,
    current_user: CurrentUser,
    supabase: SupabaseClient,
) -> UserPreferenceDTO:
    """
    Update user preferences (partial update).

    Allows updating one or more preference fields. Fields not provided (None) will remain unchanged.
    Empty lists ([]) will clear that field.

    **Request body fields (all optional):**
    - `languages`: List of programming languages (e.g., ["Python", "JavaScript"])
    - `skills`: List of skills with familiarity levels
    - `project_interests`: List of project types (e.g., ["webapp", "mobile"])
    - `issue_interests`: List of issue types (e.g., ["bug_fix", "feature"])

    **Example - Update only languages:**
    ```json
    {
      "languages": ["Python", "TypeScript"]
    }
    ```

    **Example - Clear languages and update skills:**
    ```json
    {
      "languages": [],
      "skills": [
        {
          "name": "python",
          "familiarity": "intermediate",
          "category": "programming_language"
        }
      ]
    }
    ```
    """
    from uuid import UUID

    try:
        user_id = UUID(str(current_user["id"]))
        dao = UserPreferenceDAO(supabase)

        # Check if at least one field is provided for update
        has_updates = (
            data.languages is not None
            or data.skills is not None
            or data.project_interests is not None
            or data.issue_interests is not None
        )

        if not has_updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field must be provided for update.",
            )

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

        # Try partial update first
        preference = dao.update_partial(
            user_id=user_id,
            languages=data.languages,
            skills=skills_data,
            project_interests=project_interests,
            issue_interests=issue_interests,
        )

        # If preferences don't exist, create new ones with provided data
        if preference is None:
            preference = dao.create_or_update(
                user_id=user_id,
                languages=data.languages if data.languages is not None else [],
                skills=skills_data if skills_data is not None else [],
                project_interests=project_interests
                if project_interests is not None
                else [],
                issue_interests=issue_interests if issue_interests is not None else [],
            )

        return UserPreferenceDTO.from_model(preference)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user preferences: {str(e)}",
        )
