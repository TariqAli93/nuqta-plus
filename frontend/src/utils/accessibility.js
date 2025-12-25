/**
 * Accessibility utilities
 */

/**
 * Announce message to screen readers
 * @param {String} message - Message to announce
 * @param {String} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management: Focus first focusable element in container
 * @param {HTMLElement} container - Container element
 */
export function focusFirstElement(container) {
  if (!container) return;

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const firstFocusable = container.querySelector(focusableSelectors);
  if (firstFocusable) {
    firstFocusable.focus();
  }
}

/**
 * Trap focus within a container (for modals)
 * @param {HTMLElement} container - Container element
 */
export function trapFocus(container) {
  if (!container) return () => {};

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(container.querySelectorAll(focusableSelectors));
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
}

/**
 * Skip to main content link (for keyboard navigation)
 */
export function setupSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'تخطي إلى المحتوى الرئيسي';
  skipLink.className = 'skip-link';
  skipLink.setAttribute('aria-label', 'تخطي إلى المحتوى الرئيسي');

  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--v-theme-primary);
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    z-index: 10000;
    border-radius: 4px;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Check if element is visible to screen readers
 * @param {HTMLElement} element - Element to check
 */
export function isVisibleToScreenReader(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    element.getAttribute('aria-hidden') !== 'true'
  );
}

