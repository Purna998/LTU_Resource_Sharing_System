from django.core.management.base import BaseCommand
from exampaper.models import Department, Semester, Subject, SubjectResource, Notice
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Populates the database with HamroCSIT style sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating CSIT sample data...')
        
        # Department
        csit, _ = Department.objects.get_or_create(
            name='B.Sc. Computer Science and Information Technology',
            defaults={
                'short_name': 'CSIT',
                'description': 'B.Sc. CSIT is a 4-year degree blending computer science and IT.',
                'icon_name': 'Monitor'
            }
        )

        bca, _ = Department.objects.get_or_create(
            name='Bachelor of Computer Application',
            defaults={'short_name': 'BCA', 'icon_name': 'Laptop'}
        )

        # Semesters for CSIT
        sem1, _ = Semester.objects.get_or_create(department=csit, number=1, defaults={'name': 'First Semester'})
        sem2, _ = Semester.objects.get_or_create(department=csit, number=2, defaults={'name': 'Second Semester'})

        # Subjects for CSIT Sem 1
        dl, _ = Subject.objects.get_or_create(
            semester=sem1, 
            code='CSC109', 
            defaults={'name': 'Introduction to Information Technology', 'credit_hours': 3}
        )
        cprog, _ = Subject.objects.get_or_create(
            semester=sem1,
            code='CSC110', 
            defaults={'name': 'C Programming', 'credit_hours': 3}
        )
        math1, _ = Subject.objects.get_or_create(
            semester=sem1, 
            code='MTH112', 
            defaults={'name': 'Mathematics I', 'credit_hours': 3}
        )

        # Subjects for CSIT Sem 2
        dmath, _ = Subject.objects.get_or_create(
            semester=sem2,
            code='MTH163', 
            defaults={'name': 'Discrete Structure', 'credit_hours': 3}
        )
        oop, _ = Subject.objects.get_or_create(
            semester=sem2,
            code='CSC160', 
            defaults={'name': 'Object Oriented Programming', 'credit_hours': 3}
        )

        # Resources for C Programming
        if not SubjectResource.objects.filter(subject=cprog, title='Complete C Notes by Ram').exists():
            res1 = SubjectResource.objects.create(
                subject=cprog,
                title='Complete C Notes by Ram',
                resource_type='note',
                contributor='Ram Nepal',
                is_approved=True,
            )
            res1.file.save('c_notes.pdf', ContentFile(b"Dummy PDF Content"))

        if not SubjectResource.objects.filter(subject=cprog, title='2079 Regular Exam Paper').exists():
            res2 = SubjectResource.objects.create(
                subject=cprog,
                title='2079 Regular Exam Paper',
                resource_type='old_question',
                year=2079,
                contributor='Admin',
                is_approved=True,
            )
            res2.file.save('2079_regular.pdf', ContentFile(b"Dummy Question Paper"))

        if not SubjectResource.objects.filter(subject=cprog, title='C Programming Syllabus').exists():
            res3 = SubjectResource.objects.create(
                subject=cprog,
                title='C Programming Syllabus',
                resource_type='syllabus',
                contributor='TU',
                is_approved=True,
            )
            res3.file.save('syllabus.pdf', ContentFile(b"Syllabus Content"))

        # Notices
        Notice.objects.get_or_create(
            title='B.Sc. CSIT First Semester Exam Routine Published',
            defaults={
                'department': csit,
                'content': 'The exam for First Semester will start from Mankshir 12.'
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully populated CSIT sample data'))
