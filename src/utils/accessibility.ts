/**
 * Accessibility utilities for WCAG compliance
 */

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableElements.some((selector) => element.matches(selector));
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
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
  }

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
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
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsWCAGContrast(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);

  if (level === 'AAA') {
    return largeText ? ratio >= 4.5 : ratio >= 7;
  }

  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Add skip to main content link
 */
export function addSkipLink(): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';

  document.body.insertBefore(skipLink, document.body.firstChild);

  return skipLink;
}

/**
 * Ensure proper heading hierarchy
 */
export function validateHeadingHierarchy(): {
  valid: boolean;
  issues: string[];
} {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const issues: string[] = [];

  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));

    if (index === 0 && level !== 1) {
      issues.push('Page should start with an h1 heading');
    }

    if (level > previousLevel + 1) {
      issues.push(
        `Heading level skipped: ${heading.tagName} follows h${previousLevel} (should be h${previousLevel + 1})`
      );
    }

    previousLevel = level;
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check for missing alt text on images
 */
export function validateImageAltText(): {
  valid: boolean;
  issues: string[];
} {
  const images = Array.from(document.querySelectorAll('img'));
  const issues: string[] = [];

  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image ${index + 1} is missing alt attribute: ${img.src}`);
    } else if (img.alt === '' && !img.hasAttribute('role')) {
      // Empty alt is okay for decorative images, but should have role="presentation"
      issues.push(
        `Image ${index + 1} has empty alt text but no role="presentation": ${img.src}`
      );
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check for proper form labels
 */
export function validateFormLabels(): {
  valid: boolean;
  issues: string[];
} {
  const inputs = Array.from(
    document.querySelectorAll('input:not([type="hidden"]), select, textarea')
  );
  const issues: string[] = [];

  inputs.forEach((input, index) => {
    const id = input.id;
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    if (!id && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Form input ${index + 1} has no associated label or aria-label`);
      return;
    }

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Form input with id="${id}" has no associated label`);
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Run all accessibility checks
 */
export function runAccessibilityAudit(): {
  passed: number;
  failed: number;
  issues: Array<{ category: string; issues: string[] }>;
} {
  const checks = [
    { category: 'Heading Hierarchy', check: validateHeadingHierarchy },
    { category: 'Image Alt Text', check: validateImageAltText },
    { category: 'Form Labels', check: validateFormLabels },
  ];

  const results = checks.map(({ category, check }) => {
    const result = check();
    return {
      category,
      valid: result.valid,
      issues: result.issues,
    };
  });

  const passed = results.filter((r) => r.valid).length;
  const failed = results.filter((r) => !r.valid).length;
  const issues = results.filter((r) => !r.valid);

  return { passed, failed, issues };
}

/**
 * Log accessibility audit results
 */
export function logAccessibilityAudit(): void {
  const audit = runAccessibilityAudit();

  console.group('♿ Accessibility Audit');
  console.log(`Passed: ${audit.passed} checks`);
  console.log(`Failed: ${audit.failed} checks`);

  if (audit.issues.length > 0) {
    console.group('Issues Found:');
    audit.issues.forEach(({ category, issues }) => {
      console.group(category);
      issues.forEach((issue) => console.warn(issue));
      console.groupEnd();
    });
    console.groupEnd();
  } else {
    console.log('✅ No accessibility issues found!');
  }

  console.groupEnd();
}
