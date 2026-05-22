from django.core.management.base import BaseCommand
from exampaper.models import Department, Semester, Subject, SubjectResource, Notice
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Aggressively populates LTU database with 4 B.Tech departments, 8 semesters each, and sample subjects/resources.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Wiping old data...')
        Department.objects.all().delete()

        self.stdout.write('Populating Lumbini Technological University (LTU) data...')

        departments_data = [
            {'name': 'B.Tech in Computer Science & Artificial Intelligence', 'short': 'CS & AI', 'icon': 'Monitor'},
            {'name': 'B.Tech in Information Technology', 'short': 'IT', 'icon': 'Laptop'},
            {'name': 'B.Tech in IT Engineering', 'short': 'IT Eng', 'icon': 'Cpu'},
            {'name': 'B.Tech in Civil Engineering', 'short': 'Civil Eng', 'icon': 'HardHat'},
        ]

        semester_names = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth']

        for dept_info in departments_data:
            dept = Department.objects.create(
                name=dept_info['name'],
                short_name=dept_info['short'],
                description=f"Welcome to the {dept_info['name']} department of Lumbini Technological University. Find all your syllabuses, notes, and past papers here.",
                icon_name=dept_info['icon']
            )

            for i, sem_name in enumerate(semester_names, start=1):
                sem = Semester.objects.create(
                    department=dept,
                    name=f"{sem_name} Semester",
                    number=i
                )

                # Add some highly realistic subjects for the first 2 semesters to show depth
                if i == 1:
                    subs = [
                        ('Engineering Mathematics I', f'MTH101_{dept.short_name}'),
                        ('C Programming', f'CSC101_{dept.short_name}'),
                        ('Digital Logic', f'CSC102_{dept.short_name}'),
                        ('Physics for Engineers', f'PHY101_{dept.short_name}'),
                        ('Communication Skills', f'ENG101_{dept.short_name}')
                    ]
                elif i == 2:
                    subs = [
                        ('Engineering Mathematics II', f'MTH102_{dept.short_name}'),
                        ('Object Oriented Programming', f'CSC103_{dept.short_name}'),
                        ('Microprocessor & Assembly', f'CSC104_{dept.short_name}'),
                        ('Database Management Systems', f'CSC105_{dept.short_name}')
                    ]
                else:
                    # Generic for 3-8 just to populate
                    subs = [
                        (f'Core Subject A {sem_name}', f'COR{i}1_{dept.short_name}'),
                        (f'Core Subject B {sem_name}', f'COR{i}2_{dept.short_name}'),
                    ]

                for sub_name, code in subs:
                    subject = Subject.objects.create(
                        semester=sem,
                        name=sub_name,
                        code=code,
                        credit_hours=3,
                        objective=f"To understand the fundamental concepts of {sub_name}."
                    )

                    # Add comprehensive resources acting like HamroCSIT
                    # 1. Syllabus
                    res_syl = SubjectResource.objects.create(
                        subject=subject, title=f'{sub_name} Syllabus (Official)', resource_type='syllabus', contributor='LTU Admin'
                    )
                    res_syl.file.save(f'{code}_syllabus.pdf', ContentFile(b"Mock PDF Content: Syllabus"))

                    # 2. Notes
                    res_note1 = SubjectResource.objects.create(
                        subject=subject, title=f'Unit 1-3 Complete Notes', resource_type='note', contributor='Aashish (Topper)'
                    )
                    res_note1.file.save(f'{code}_notes_1.pdf', ContentFile(b"Mock PDF Content: Notes"))

                    res_note2 = SubjectResource.objects.create(
                        subject=subject, title=f'Unit 4-6 Handwritten Notes', resource_type='note', contributor='Sneha'
                    )
                    res_note2.file.save(f'{code}_notes_2.pdf', ContentFile(b"Mock PDF Content: Notes"))

                    # 3. Old Questions
                    for year in [2078, 2079, 2080]:
                        res_oq = SubjectResource.objects.create(
                            subject=subject, title=f'{year} Regular Exam Paper', resource_type='old_question', year=year, contributor='LTU Admin'
                        )
                        res_oq.file.save(f'{code}_{year}_q.pdf', ContentFile(b"Mock PDF Content: Old Question"))

                        # 4. Solutions to old questions
                        if year == 2080:
                            res_sol = SubjectResource.objects.create(
                                subject=subject, title=f'{year} Regular Paper Solution', resource_type='solution', year=year, contributor='Exam Committee'
                            )
                            res_sol.file.save(f'{code}_{year}_sol.pdf', ContentFile(b"Mock PDF Content: Solution"))

                    # 5. Lab Reports / Assignments
                    if 'Programming' in sub_name or 'Logic' in sub_name or 'Database' in sub_name:
                        res_lab = SubjectResource.objects.create(
                            subject=subject, title=f'Complete Lab Manual & Report Format', resource_type='lab_report', contributor='Lab Assistant'
                        )
                        res_lab.file.save(f'{code}_lab.pdf', ContentFile(b"Mock PDF Content: Lab Report"))

        # Global Notices
        Notice.objects.create(title='LTU First Semester Result Published', content='The results for all B.Tech First Semester students have been published. Check the portal.', department=None)
        Notice.objects.create(title='Academic Calendar 2081/82', content='The official academic calendar for the upcoming session has been finalized.', department=None)

        self.stdout.write(self.style.SUCCESS('Successfully populated LTU data with enormous depth!'))
