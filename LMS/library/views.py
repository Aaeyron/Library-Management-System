from rest_framework import viewsets, status
from .models import Book, UserProfile, Loan
from .serializers import BookSerializer, UserProfileSerializer, LoanSerializer
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction

# ======================================================
# 📚 BOOK VIEWSET
# ======================================================
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer


# ======================================================
# 👤 USER PROFILE VIEWSET (REGISTER + APPROVAL SYSTEM)
# ======================================================
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    # 🔹 CREATE NEW USER / LIBRARIAN
    def create(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email", "")
        full_name = request.data.get("full_name", "")
        role = request.data.get("role", "user")

        if not username or not password:
            return Response({"message": "Username and password are required"}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({"message": "Username already exists"}, status=400)
        if UserProfile.objects.filter(email=email).exists():
            return Response({"message": "Email already exists"}, status=400)

        # Create Django User
        user = User.objects.create_user(username=username, password=password, email=email)
        status_value = "pending" if role == "librarian" else "approved"

        # Create UserProfile
        profile = UserProfile.objects.create(
            user=user,
            full_name=full_name,
            email=email,
            role=role,
            status=status_value,
        )

        serializer = self.get_serializer(profile)
        data = serializer.data
        data.update({"username": username, "role": role, "status": status_value})

        if role == "librarian":
            return Response(
                {"message": "Librarian registration submitted for approval", "profile": data},
                status=201
            )
        return Response(data, status=201)

    # 🔹 GET PENDING LIBRARIANS
    @action(detail=False, methods=["get"])
    def pending_librarians(self, request):
        pending = UserProfile.objects.filter(role="librarian", status="pending")
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    # 🔹 APPROVE LIBRARIAN
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        try:
            librarian = UserProfile.objects.get(pk=pk, role="librarian", status="pending")
            librarian.status = "approved"
            librarian.save()
            return Response({"message": f"{librarian.full_name} approved as Librarian"})
        except UserProfile.DoesNotExist:
            return Response({"message": "Librarian not found or already processed"}, status=404)

    # 🔹 DECLINE LIBRARIAN
    @action(detail=True, methods=["post"], url_path="decline")
    def decline(self, request, pk=None):
        try:
            librarian = UserProfile.objects.get(pk=pk, role="librarian", status="pending")
            librarian.status = "declined"
            librarian.save()
            return Response({"message": f"{librarian.full_name}'s application declined"})
        except UserProfile.DoesNotExist:
            return Response({"message": "Librarian not found or already processed"}, status=404)

    # 🔹 PROMOTE USER TO LIBRARIAN
    @action(detail=True, methods=['patch'], url_path='promote')
    def promote(self, request, pk=None):
        user = self.get_object()
        if user.role == "user":
            user.role = "librarian"
            user.save()
            return Response({"success": True, "role": user.role})
        return Response({"success": False, "message": "User is already a librarian"}, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DEMOTE LIBRARIAN TO USER
    @action(detail=True, methods=['patch'], url_path='demote')
    def demote(self, request, pk=None):
        user = self.get_object()
        if user.role == "librarian":
            user.role = "user"
            user.save()
            return Response({"success": True, "role": user.role})
        return Response({"success": False, "message": "User is already a user"}, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 OVERRIDE DESTROY TO RETURN BOOKS AND DELETE USER
    def destroy(self, request, *args, **kwargs):
        user_profile = self.get_object()

        # Transaction ensures atomicity
        with transaction.atomic():
            # Return all active loans
            active_loans = Loan.objects.filter(user=user_profile, returned=False)
            for loan in active_loans:
                loan.returned = True
                loan.book.available = True
                loan.book.save()
                loan.save()

            # Delete linked Django User and UserProfile
            if user_profile.user:
                user_profile.user.delete()
            user_profile.delete()

        return Response(
            {"message": f"User '{user_profile.full_name}' deleted and their borrowed books returned."},
            status=200
        )


# ======================================================
# 📖 LOAN VIEWSET (DIRECT BORROW FOR USERS)
# ======================================================
class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer

    @action(detail=False, methods=['post'])
    def borrow_book(self, request):
        user_id = request.data.get('user_id')
        book_id = request.data.get('book_id')
        if not user_id or not book_id:
            return Response({"error": "Missing user_id or book_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = UserProfile.objects.get(id=user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

        if not book.available:
            return Response({"error": "Book is not available"}, status=status.HTTP_400_BAD_REQUEST)

        # Directly create loan without approval workflow
        loan = Loan.objects.create(
            user=user,
            book=book,
            borrowed_at=timezone.now(),
            returned=False
        )
        book.available = False
        book.save()

        return Response({"message": "Book borrowed successfully!", "loan_id": loan.id}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def borrowed_books(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"message": "user_id is required"}, status=400)
        borrowed = Loan.objects.filter(user__id=user_id, returned=False)
        serializer = self.get_serializer(borrowed, many=True)
        return Response(serializer.data)


# ======================================================
# 🔐 LOGIN ENDPOINT
# ======================================================
@api_view(["POST"])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"message": "Username and password required"}, status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"message": "Invalid credentials"}, status=401)

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return Response({"message": "User profile not found"}, status=404)

    # ✅ Block pending and declined librarians
    if profile.role == "librarian":
        if profile.status == "pending":
            return Response({"message": "Your librarian application is still pending approval."}, status=403)
        elif profile.status == "declined":
            return Response({"message": "Your librarian registration was declined. You cannot log in."}, status=403)


    data = {
        "id": profile.id,
        "username": user.username,
        "full_name": profile.full_name,
        "email": profile.email,
        "role": profile.role,
        "status": profile.status,
    }
    return Response({"user": data}, status=200)


# 🔹 RETURN BOOK ENDPOINT
@api_view(["POST"])
def return_book(request):
    loan_id = request.data.get("loan_id")
    if not loan_id:
        return Response({"error": "Loan ID missing."}, status=400)

    try:
        loan = Loan.objects.get(id=loan_id, returned=False)
    except Loan.DoesNotExist:
        return Response({"error": "Loan not found or already returned."}, status=404)

    # Mark loan as returned
    loan.returned = True
    loan.save()

    # Restore book availability
    loan.book.available = True
    loan.book.save()

    return Response({"message": "Book returned successfully!"}, status=200)
