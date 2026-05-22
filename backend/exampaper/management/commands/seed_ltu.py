"""
seed_ltu.py — Management command to seed LTU departments and semesters.
Run with: python manage.py seed_ltu
"""

from django.core.management.base import BaseCommand
from exampaper.models import Department, Semester


DEPARTMENTS = [
    {
        'name':        'B.Tech in CS & AI',
        'short_name':  'CS & AI',
        'slug':        'btech-cs-ai',
        'icon':        'fa-laptop-code',
        'color':       '#6366f1',
        'description': 'Bachelor of Technology in Computer Science & Artificial Intelligence',
    },
    {
        'name':        'B.Tech in IT',
        'short_name':  'IT',
        'slug':        'btech-it',
        'icon':        'fa-network-wired',
        'color':       '#10b981',
        'description': 'Bachelor of Technology in Information Technology',
    },
    {
        'name':        'B.Tech in IT Engineering',
        'short_name':  'ITE',
        'slug':        'btech-ite',
        'icon':        'fa-microchip',
        'color':       '#f59e0b',
        'description': 'Bachelor of Technology in Information Technology Engineering',
    },
    {
        'name':        'B.Tech in Civil Engineering',
        'short_name':  'Civil Engg.',
        'slug':        'btech-civil',
        'icon':        'fa-hard-hat',
        'color':       '#ef4444',
        'description': 'Bachelor of Technology in Civil Engineering',
    },
]


class Command(BaseCommand):
    help = 'Seed LTU departments (4) and their 8 semesters each.'

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
