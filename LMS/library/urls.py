from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, UserProfileViewSet, LoanViewSet, login_user, return_book

# ✅ add return_loan
router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'users', UserProfileViewSet)
router.register(r'loans', LoanViewSet)

urlpatterns = [
    # Router handles all standard viewset URLs
     path('api/loans/return_book/', return_book, name='return_book'),

    # Login endpoint
    path('api/login/', login_user, name='login'),

    # Extra paths for librarian applications (if needed)
    path(
        'api/users/applications/',
        UserProfileViewSet.as_view({'get': 'pending_librarians'}),
        name='list_applications'
    ),
    path(
        'api/users/applications/<int:pk>/approve/',
        UserProfileViewSet.as_view({'post': 'approve'}),
        name='approve_application'
    ),
    path(
        'api/users/applications/<int:pk>/decline/',
        UserProfileViewSet.as_view({'post': 'decline'}),
        name='decline_application'
    ),

    path('api/', include(router.urls)),
]
