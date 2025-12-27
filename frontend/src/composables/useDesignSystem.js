/**
 * Design System Composable v2.0
 * Enhanced access to design system tokens and utilities
 */

import { computed } from 'vue';
import { useTheme } from 'vuetify';
import designSystem, { getThemeColor, getColorWithOpacity, getBreakpoint } from '@/design-system';

export function useDesignSystem() {
  const theme = useTheme();

  const isDark = computed(() => theme.current.value.dark);
  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'));

  /**
   * Get theme-aware color value
   */
  const getColor = (colorName) => {
    return getThemeColor(colorName, currentTheme.value);
  };

  /**
   * Get color with opacity
   */
  const getColorOpacity = (colorName, opacity = 1) => {
    return getColorWithOpacity(colorName, opacity, currentTheme.value);
  };

  /**
   * Get CSS variable for spacing
   */
  const getSpacing = (size) => {
    return `var(--ds-spacing-${size})`;
  };

  /**
   * Get CSS variable for border radius
   */
  const getRadius = (size) => {
    return `var(--ds-radius-${size})`;
  };

  /**
   * Get CSS variable for font size
   */
  const getFontSize = (size) => {
    return `var(--ds-font-size-${size})`;
  };

  /**
   * Get CSS variable for font weight
   */
  const getFontWeight = (weight) => {
    return `var(--ds-font-weight-${weight})`;
  };

  /**
   * Get CSS variable for line height
   */
  const getLineHeight = (size) => {
    return `var(--ds-line-height-${size})`;
  };

  /**
   * Get CSS variable for shadow
   */
  const getShadow = (size) => {
    return `var(--ds-shadow-${size})`;
  };

  /**
   * Get CSS variable for z-index
   */
  const getZIndex = (level) => {
    return `var(--ds-z-${level})`;
  };

  /**
   * Get CSS variable for transition
   */
  const getTransition = (speed = 'base') => {
    return `var(--ds-transition-${speed})`;
  };

  /**
   * Get theme-aware text color with opacity
   */
  const getTextColor = (opacity = 1) => {
    if (opacity === 1) {
      return `rgb(var(--v-theme-on-surface))`;
    }
    return `rgba(var(--v-theme-on-surface), ${opacity})`;
  };

  /**
   * Get theme-aware background color
   */
  const getBgColor = () => {
    return `rgb(var(--v-theme-surface))`;
  };

  /**
   * Get theme-aware surface color variant
   */
  const getSurfaceVariant = () => {
    return `rgb(var(--v-theme-surface-variant))`;
  };

  /**
   * Get border color with opacity
   */
  const getBorderColor = (opacity = 0.12) => {
    return `rgba(var(--v-theme-on-surface), ${opacity})`;
  };

  /**
   * Get responsive breakpoint
   */
  const getResponsiveBreakpoint = (name) => {
    return getBreakpoint(name);
  };

  /**
   * Check if current breakpoint matches
   */
  const isBreakpoint = (name) => {
    const breakpoint = getBreakpoint(name);
    return window.matchMedia(`(min-width: ${breakpoint})`).matches;
  };

  /**
   * Get CSS variable for opacity
   */
  const getOpacity = (value) => {
    return `var(--ds-opacity-${value})`;
  };

  /**
   * Generate style object from design tokens
   */
  const createStyle = (tokens) => {
    const style = {};
    
    if (tokens.padding) {
      style.padding = getSpacing(tokens.padding);
    }
    if (tokens.margin) {
      style.margin = getSpacing(tokens.margin);
    }
    if (tokens.radius) {
      style.borderRadius = getRadius(tokens.radius);
    }
    if (tokens.shadow) {
      style.boxShadow = getShadow(tokens.shadow);
    }
    if (tokens.fontSize) {
      style.fontSize = getFontSize(tokens.fontSize);
    }
    if (tokens.fontWeight) {
      style.fontWeight = getFontWeight(tokens.fontWeight);
    }
    if (tokens.color) {
      style.color = getTextColor(tokens.opacity || 1);
    }
    if (tokens.bg) {
      style.backgroundColor = getBgColor();
    }
    if (tokens.transition) {
      style.transition = getTransition(tokens.transition);
    }

    return style;
  };

  return {
    isDark,
    currentTheme,
    designSystem,
    // Color utilities
    getColor,
    getColorOpacity,
    getTextColor,
    getBgColor,
    getSurfaceVariant,
    getBorderColor,
    // Spacing utilities
    getSpacing,
    // Typography utilities
    getFontSize,
    getFontWeight,
    getLineHeight,
    // Layout utilities
    getRadius,
    getShadow,
    getZIndex,
    getOpacity,
    // Transition utilities
    getTransition,
    // Responsive utilities
    getResponsiveBreakpoint,
    isBreakpoint,
    // Style generator
    createStyle,
  };
}
