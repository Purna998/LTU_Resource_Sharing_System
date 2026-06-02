import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resourcesharing.settings')
django.setup()

from django.contrib.auth import get_user_model

def setup_superuser():
    User = get_user_model()
    username = 'purnaacharya'
    email = 'admin@example.com'
    
    # Try to get password from env var, otherwise fallback to the requested default
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'HamroUni@123')

    if not User.objects.filter(username=username).exists():
        print(f"Creating superuser {username}...")
        # create_superuser automatically hashes the password and saves the user
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser {username} created successfully!")
    else:
        print(f"Superuser {username} already exists. Force updating password to ensure it is correct...")
        u = User.objects.get(username=username)
        u.set_password(password)
        u.save()
        print("Password updated successfully!")

if __name__ == '__main__':
    setup_superuser()
