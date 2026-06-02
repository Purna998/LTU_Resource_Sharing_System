from exampaper.models import SubjectResource

count = 0
for r in SubjectResource.objects.filter(file_size_bytes__isnull=True):
    if r.file:
        try:
            r.file_size_bytes = r.file.size
            r.save(update_fields=['file_size_bytes'])
            count += 1
            print(f"Updated {r.id}")
        except Exception as e:
            print(f'Error on {r.id}: {e}')
print(f'Updated {count} records.')
