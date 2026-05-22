/**
 * main.js — LTU Exam Paper Portal
 * jQuery-powered interactions + vanilla JS utilities
 */

$(document).ready(function () {

    /* ─────────────────────────────────────────
       1. NAVBAR: Sticky shadow + hamburger
    ───────────────────────────────────────── */
    const $navbar = $('#navbar');
    const $hamburger = $('#hamburger');
    const $navLinks = $('#navLinks');

    // Add shadow on scroll
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 20) {
            $navbar.addClass('scrolled');
        } else {
            $navbar.removeClass('scrolled');
        }
    });

    // Mobile hamburger toggle
    $hamburger.on('click', function () {
        $(this).toggleClass('open');
        $navLinks.toggleClass('open');
    });

    // Close nav when link is clicked
    $navLinks.find('a').on('click', function () {
        $hamburger.removeClass('open');
        $navLinks.removeClass('open');
    });

    // Close nav when clicking outside
    $(document).on('click', function (e) {
        if (!$navbar.is(e.target) && $navbar.has(e.target).length === 0) {
            $hamburger.removeClass('open');
            $navLinks.removeClass('open');
        }
    });


    /* ─────────────────────────────────────────
       2. FILTER BAR STICKY TOP offset
    ───────────────────────────────────────── */
    function updateFilterSticky() {
        const navH = $navbar.outerHeight() || 68;
        $('.filter-bar').css('top', navH + 'px');
    }
    updateFilterSticky();
    $(window).on('resize', updateFilterSticky);


    /* ─────────────────────────────────────────
       3. SMOOTH COUNT-UP ANIMATION (Hero stats)
    ───────────────────────────────────────── */
    function animateCount($el) {
        const target = parseInt($el.data('target'), 10);
        if (!target) return;
        let current = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(function () {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            $el.text(current.toLocaleString());
        }, 25);
    }

    // Trigger on Intersection Observer
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).find('[data-target]').each(function () {
                        animateCount($(this));
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.hero-stats, .stats').forEach(function (el) {
            observer.observe(el);
        });
    }


    /* ─────────────────────────────────────────
       4. PAPER ROW — hover lift effect
    ───────────────────────────────────────── */
    $(document).on('mouseenter', '.paper-row', function () {
        $(this).css('transform', 'translateX(6px)');
    }).on('mouseleave', '.paper-row', function () {
        $(this).css('transform', 'translateX(0)');
    });


    /* ─────────────────────────────────────────
       5. SEARCH: Real-time autocomplete hint
    ───────────────────────────────────────── */
    var searchTimer;
    var $heroInput = $('#heroSearchInput');

    if ($heroInput.length) {
        $heroInput.on('input', function () {
            clearTimeout(searchTimer);
            var q = $(this).val().trim();
            if (q.length > 0) {
                searchTimer = setTimeout(function () {
                    // Brief visual feedback (shake if empty)
                }, 300);
            }
        });
    }


    /* ─────────────────────────────────────────
       6. AJAX: Dynamic subject dropdown (Dept→Sem→Subject)
         Used on search page when both dept & sem are selected
    ───────────────────────────────────────── */
    function loadSubjects(deptSlug, semNum, $targetSelect) {
        if (!$targetSelect || !$targetSelect.length) return;

        if (!deptSlug && !semNum) {
            $targetSelect.html('<option value="">All Subjects</option>');
            return;
        }

        $.get('/api/subjects/', { department: deptSlug, semester: semNum })
            .done(function (data) {
                var options = '<option value="">All Subjects</option>';
                $.each(data.subjects, function (i, s) {
                    options += `<option value="${s.slug}">[${s.code}] ${s.name}</option>`;
                });
                $targetSelect.html(options);
            })
            .fail(function () {
                console.warn('Failed to load subjects');
            });
    }

    var $deptSelect = $('[name="department"]');
    var $semSelect = $('[name="semester"]');
    var $subSelect = $('[name="subject"]');

    if ($subSelect.length) {
        function triggerSubjectLoad() {
            loadSubjects($deptSelect.val(), $semSelect.val(), $subSelect);
        }
        $deptSelect.on('change', triggerSubjectLoad);
        $semSelect.on('change', triggerSubjectLoad);
    }


    /* ─────────────────────────────────────────
       7. DOWNLOAD BUTTON: Loading state
    ───────────────────────────────────────── */
    $(document).on('click', 'a[href*="/download/"]', function () {
        var $btn = $(this);
        var originalHTML = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Downloading...');
        setTimeout(function () {
            $btn.html(originalHTML);
        }, 3000);
    });


    /* ─────────────────────────────────────────
       8. BACK TO TOP Button
    ───────────────────────────────────────── */
    // Inject button
    $('body').append('<button id="backToTop" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>');

    var $backBtn = $('#backToTop');

    $backBtn.on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 400);
    });

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 400) {
            $backBtn.addClass('visible');
        } else {
            $backBtn.removeClass('visible');
        }
    });


    /* ─────────────────────────────────────────
       9. CARD ENTRANCE ANIMATION (Intersection Observer)
    ───────────────────────────────────────── */
    if ('IntersectionObserver' in window) {
        var cardObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry, index) {
                if (entry.isIntersecting) {
                    setTimeout(function () {
                        entry.target.classList.add('anim-in');
                    }, index * 80);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.dept-card, .semester-card, .subject-card, .paper-row, .paper-card, .step-card').forEach(function (el) {
            el.classList.add('anim-ready');
            cardObserver.observe(el);
        });
    }


    /* ─────────────────────────────────────────
       10. FILTER FORM: Auto-submit on change
    ───────────────────────────────────────── */
    // Papers page — auto submit on select change
    $('#yearSelect, #typeSelect').on('change', function () {
        $(this).closest('form').submit();
    });

}); // end document.ready


/* ─────────────────────────────────────────
   INLINE CSS for back-to-top + animations
   (injected at runtime to avoid extra file)
───────────────────────────────────────── */
(function injectDynamicCSS() {
    var css = `
        /* Back to Top */
        #backToTop {
            position: fixed;
            bottom: 28px;
            right: 28px;
            z-index: 999;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: var(--primary);
            color: white;
            border: none;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 14px rgba(99,102,241,.45);
        }
        #backToTop.visible {
            opacity: 1;
            transform: translateY(0);
        }
        #backToTop:hover {
            background: var(--primary-dark);
            transform: translateY(-3px);
        }

        /* Card entrance animation */
        .anim-ready {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .anim-in {
            opacity: 1;
            transform: translateY(0);
        }

        /* Paper row hover override (smooth) */
        .paper-row {
            transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
    `;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
})();
