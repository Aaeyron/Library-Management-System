from django.db import models
from django.contrib.auth.models import User

# ======================================================
# 📚 BOOK MODEL
# ======================================================
class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    genre = models.CharField(max_length=100, blank=True, null=True)
    available = models.BooleanField(default=True)  # tracks if book can be borrowed

    def __str__(self):
        return self.title


# ======================================================
# 👤 USER PROFILE MODEL
# ======================================================
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('librarian', 'Librarian'),
        ('admin', 'Admin'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')  # users approved by default

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.status}"

    @property
    def is_librarian(self):
        return self.role == "librarian" and self.status == "approved"

    @property
    def is_admin(self):
        return self.role == "admin"


# ======================================================
# 📖 LOAN MODEL
# ======================================================
class Loan(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")  # only one declaration
    borrowed_at = models.DateTimeField(auto_now_add=True)
    returned = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.full_name} - {self.book.title}"

    @property
    def is_active(self):
        return not self.returned

