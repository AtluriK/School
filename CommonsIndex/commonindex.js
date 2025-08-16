
  // === Set total tasks per lesson page here ===
  const TASKS_PER_LESSON = 30; // change this number once to your actual tasks count per lesson

  // If you have a fixed header height (px), set it here; else 0
  const fixedHeaderHeight = 0;

  // Accordion toggle functionality
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      const isOpen = parent.classList.contains('open');

      // Close all others
      document.querySelectorAll('.accordion-item.open').forEach(item => {
        if (item !== parent) item.classList.remove('open');
      });

      // Toggle current
      if (!isOpen) parent.classList.add('open');
      else parent.classList.remove('open');

      // Update aria-expanded
      header.setAttribute('aria-expanded', !isOpen);

      // Scroll after layout update
      setTimeout(() => {
        parent.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (fixedHeaderHeight > 0) {
          window.scrollBy({ top: -fixedHeaderHeight, behavior: 'smooth' });
        }
      }, 300);
    });

    // Keyboard support for accessibility
    header.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Iterate over each category
    const categories = Array.from(document.querySelectorAll('.accordion-item'));
    let anyLessonDone = false;

    categories.forEach(category => {
      const lessonLinks = category.querySelectorAll('.accordion-content a.lesson-link');

      lessonLinks.forEach((link, idx) => {
        let href = link.getAttribute('href');
        if (!href) return;
        let prefix = href.split('/').pop().replace('.html', '').toLowerCase();

        // Store prefix and index as dataset
        link.dataset.prefix = prefix;
        link.dataset.index = idx.toString();

        // Check localStorage for completion
        // Use TASKS_PER_LESSON to check tasks per lesson dynamically
        // So, for each lesson link, check if ALL tasks are done:
        let lessonCompleted = true;
        for(let i=0; i < TASKS_PER_LESSON; i++){
          if(localStorage.getItem(`${prefix}TaskDone${i}`) !== "true"){
            lessonCompleted = false;
            break;
          }
        }

        const checkmark = link.querySelector('.checkmark');
        if (lessonCompleted && checkmark) {
          checkmark.hidden = false;
          checkmark.textContent = '✓';
          anyLessonDone = true; // Mark that at least one lesson is done
        }
      });

      // Check if all lessons in this category are done
      const allDone = Array.from(category.querySelectorAll('.accordion-content a.lesson-link')).every(link => {
        let href = link.getAttribute('href');
        if (!href) return false;
        let prefix = href.split('/').pop().replace('.html', '').toLowerCase();

        // Check ALL tasks per lesson
        for(let i=0; i < TASKS_PER_LESSON; i++){
          if(localStorage.getItem(`${prefix}TaskDone${i}`) !== "true"){
            return false;
          }
        }
        return true;
      });

      // If all done, add green checkmark next to category title
      if (allDone) {
        const header = category.querySelector('.accordion-header .title');
        if (header && !header.querySelector('.category-checkmark')) {
          const catCheckmark = document.createElement('span');
          catCheckmark.className = 'category-checkmark';
          catCheckmark.textContent = '✓';
          catCheckmark.style.color = '#22c55e'; // green
          catCheckmark.style.marginLeft = '0.4rem';
          catCheckmark.style.fontWeight = '700';
          header.appendChild(catCheckmark);
        }
      }
    });

    // Only open and scroll to first incomplete category if at least one lesson done
    if (anyLessonDone) {
      for (const category of categories) {
        const lessonLinks = category.querySelectorAll('.accordion-content a.lesson-link');

        const allDone = Array.from(lessonLinks).every(link => {
          let href = link.getAttribute('href');
          if (!href) return false;
          let prefix = href.split('/').pop().replace('.html', '').toLowerCase();

          // Check all tasks per lesson
          for(let i=0; i < TASKS_PER_LESSON; i++){
            if(localStorage.getItem(`${prefix}TaskDone${i}`) !== "true"){
              return false;
            }
          }
          return true;
        });

        if (!allDone) {
          // Open this incomplete category
          if (!category.classList.contains('open')) {
            category.classList.add('open');
            const header = category.querySelector('.accordion-header');
            if (header) header.setAttribute('aria-expanded', 'true');

            // Scroll it exactly to viewport top
            const elementTop = category.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: elementTop - fixedHeaderHeight,
              behavior: 'smooth'
            });
          }
          break; // only first incomplete category
        }
      }
    }
    // else do nothing (user scrolls manually)
  });