import requests
from bs4 import BeautifulSoup
from datetime import datetime
import urllib3
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone
from exampaper.models import Notice

# Suppress insecure request warnings for scraping if ltu.edu.np SSL is misconfigured
urllib3.disable_warnings()

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scrapes notices from ltu.edu.np/notice and populates the Notice model.'

    def handle(self, *args, **kwargs):
        max_pages = 10
        notices_created = 0
        notices_skipped = 0

        for page in range(1, max_pages + 1):
            url = f'https://ltu.edu.np/notice?page={page}'
            self.stdout.write(self.style.NOTICE(f'Fetching notices from {url} ...'))

            try:
                # We use verify=False because sometimes university sites have invalid/expired certificates
                response = requests.get(url, verify=False, timeout=15)
                response.raise_for_status()
            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f'Failed to fetch notices on page {page}: {e}'))
                break

            soup = BeautifulSoup(response.text, 'html.parser')
            
            page_notices_found = 0

            # Looking for notice details links
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                
                # The pattern for notice links is typically /notice-detail/{id}
                if '/notice-detail/' in href:
                    page_notices_found += 1
                    title = a_tag.text.strip()
                    if not title:
                        continue
                    
                    link = f"https://ltu.edu.np{href}" if href.startswith('/') else href

                    # Find the parent div to extract the date
                    # In the HTML structure, the date is often preceding the title in the same wrapper
                    parent = a_tag.parent
                    if parent and parent.parent:
                        parent_text = parent.parent.text.strip()
                    else:
                        parent_text = ""

                    # Try to parse the date from the parent text
                    # Format appears to be like "27 May 2026"
                    date_published = timezone.now().date()
                    parts = parent_text.split('\n')
                    if parts:
                        date_str = parts[0].strip()
                        try:
                            # Attempt to parse '27 May 2026'
                            parsed_date = datetime.strptime(date_str, '%d %B %Y').date()
                            date_published = parsed_date
                        except ValueError:
                            # Fallback if date formatting doesn't match
                            pass

                    # Deduplication logic: Check if a notice with this link or title already exists
                    if Notice.objects.filter(link=link).exists() or Notice.objects.filter(title=title, date_published=date_published).exists():
                        notices_skipped += 1
                        continue
                    
                    # Create the notice
                    Notice.objects.create(
                        title=title,
                        content='Please view the official document from the link provided.',
                        date_published=date_published,
                        link=link
                    )
                    notices_created += 1
                    self.stdout.write(self.style.SUCCESS(f'Created: {title} ({date_published})'))

            if page_notices_found == 0:
                self.stdout.write(self.style.WARNING(f'No notices found on page {page}. Stopping pagination.'))
                break

        self.stdout.write(self.style.SUCCESS(f'\nScraping completed!'))
        self.stdout.write(self.style.NOTICE(f'Notices created: {notices_created}'))
        self.stdout.write(self.style.NOTICE(f'Notices skipped (already exist): {notices_skipped}'))
