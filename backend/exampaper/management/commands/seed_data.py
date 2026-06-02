"""
seed_data.py — Management command to seed base departments and semesters.
Run with: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from exampaper.models import Department, Semester


DEPARTMENTS = [
    {
        'name':        'Computer Science & Engineering',
        'short_name':  'CS & E',
        'slug':        'cse',
        'icon_name':   'Monitor',
        'description': 'Department of Computer Science & Engineering',
    },
    {
        'name':        'Information Technology',
        'short_name':  'IT',
        'slug':        'it',
        'icon_name':   'Laptop',
        'description': 'Department of Information Technology',
    },
    {
        'name':        'Electrical Engineering',
        'short_name':  'EE',
        'slug':        'ee',
        'icon_name':   'Cpu',
        'description': 'Department of Electrical Engineering',
    },
    {
        'name':        'Civil Engineering',
        'short_name':  'Civil',
        'slug':        'civil',
        'icon_name':   'HardHat',
        'description': 'Department of Civil Engineering',
    },
]


class Command(BaseCommand):
    help = 'Seed base departments (4) and their 8 semesters each.'

    def handle(self, *args, **kwargs):
        dept_created  = 0
        sem_created   = 0

        for dept_data in DEPARTMENTS:
            dept, created = Department.objects.get_or_create(
                slug=dept_data['slug'],
                defaults=dept_data,
            )
            if created:
                dept_created += 1
                self.stdout.write(self.style.SUCCESS(f'  Created department: {dept.name}'))
            else:
                self.stdout.write(f'  Exists: {dept.name}')

            # Create 8 semesters
            for num in range(1, 9):
                sem, s_created = Semester.objects.get_or_create(
                    department=dept,
                    number=num,
                )
                if s_created:
                    sem_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {dept_created} departments and {sem_created} semesters created.'
        ))
