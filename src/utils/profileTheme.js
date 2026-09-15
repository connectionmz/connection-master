const createProfileThemeTokens = (theme) => ({
  background: theme.palette.background.default,
  surface: theme.palette.background.paper,
  primary: theme.palette.primary.main,
  primaryDark: theme.palette.primary.dark,
  primaryLight: theme.palette.primary.light,
  primaryContrast: theme.palette.primary.contrastText,
  selected: theme.palette.action.selected,
  hover: theme.palette.action.hover,
  text: theme.palette.text.primary,
  textSecondary: theme.palette.text.secondary,
  textDisabled: theme.palette.text.disabled,
  divider: theme.palette.divider,
  success: theme.palette.success.main,
  error: theme.palette.error.main,
  warning: theme.palette.warning.main,
});

export { createProfileThemeTokens };
