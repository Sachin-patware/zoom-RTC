const EMAIL_PATTERN = /\S+@\S+\.\S+/;

export function validateName(value) {
  if (!value.trim()) {
    return "Please enter your full name.";
  }

  if (value.trim().length < 2) {
    return "Name should be at least 2 characters.";
  }

  return "";
}

export function validateEmail(value) {
  if (!value.trim()) {
    return "Please enter your email address.";
  }

  if (!EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validatePassword(value) {
  if (!value.trim()) {
    return "Please enter your password.";
  }

  if (value.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}

export function validateOtp(value) {
  if (!value.trim()) {
    return "Enter the 6 digit OTP sent to your email.";
  }

  if (!/^\d{6}$/.test(value.trim())) {
    return "OTP must be exactly 6 digits.";
  }

  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword.trim()) {
    return "Please confirm your password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return "";
}
