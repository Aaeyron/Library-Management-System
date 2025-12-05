from django.contrib import admin
from .models import Book, UserProfile, Loan

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'genre')
    search_fields = ('title', 'author', 'genre')
    list_filter = ('genre',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email')
    search_fields = ('full_name', 'email')

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'borrowed_at', 'returned')
    list_editable = ('returned',)
    list_filter = ('returned', 'borrowed_at')
    search_fields = ('user__full_name', 'book__title')
