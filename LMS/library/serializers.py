from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, UserProfile, Loan


# ======================================================
# 1️⃣ LOAN SERIALIZER (Define FIRST so BookSerializer can use it)
# ======================================================
class LoanSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    book = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "user",
            "book",
            "returned",
            "borrowed_at",
        ]
        read_only_fields = ["borrowed_at"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.user.username,
        }

    def get_book(self, obj):
        return {
            "id": obj.book.id,
            "title": obj.book.title,
            "author": obj.book.author,
            "genre": obj.book.genre,
        }

        
        

# ======================================================
# 2️⃣ BOOK SERIALIZER (LoanSerializer now exists, safe to use)
# ======================================================
class BookSerializer(serializers.ModelSerializer):
    loans = LoanSerializer(many=True, read_only=True)
    current_loan = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = "__all__"

    def get_current_loan(self, obj):
        loan = obj.loans.filter(returned=False).first()
        if loan:
            return {"id": loan.id, "user_id": loan.user.id}
        return None


# ======================================================
# 3️⃣ USER PROFILE SERIALIZER 
# ======================================================
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "password",
            "full_name",
            "email",
            "role",
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        username = user_data.get("username") or validated_data.get("username")
        password = validated_data.pop("password")
        email = validated_data.get("email")
        role = validated_data.pop("role", "user")

        # CREATE DJANGO USER
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # CREATE USER PROFILE
        profile = UserProfile.objects.create(
            user=user,
            role=role,
            **validated_data
        )
        return profile
