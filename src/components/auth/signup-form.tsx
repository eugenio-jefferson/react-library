import { Link } from "react-router";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { sanitizeText } from "@/utils/sanitize";
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/utils/validation";

interface SignupFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [createdAccount, setCreatedAccount] = useState(false);

  const {
    signUp,
    isSubmittingSignUp,
    isSuccessSignUp,
    isErrorSignUp,
    signUpError,
  } = useUserAccount();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors((current) => ({ ...current, [name]: undefined }));

    if (createdAccount) setCreatedAccount(false);
  };

  const validate = (): SignupFormErrors => {
    const nextErrors: SignupFormErrors = {};
    const fullNameError = validateFullName(formData.fullName);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validatePasswordConfirmation(
      formData.password,
      formData.confirmPassword,
    );

    if (fullNameError) nextErrors.fullName = fullNameError;
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;
    if (confirmPasswordError) nextErrors.confirmPassword = confirmPasswordError;

    return nextErrors;
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    signUp({
      email: sanitizeText(formData.email, 254),
      password: formData.password,
      name: sanitizeText(formData.fullName, 100),
    });
  };

  useEffect(() => {
    const handleCreatedAccount = () => {
      if (isSuccessSignUp) {
        setCreatedAccount(true);
      }

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    };

    handleCreatedAccount();
  }, [isSuccessSignUp]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
      noValidate
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            name="fullName"
            maxLength={100}
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "name-error" : undefined}
            className="bg-background"
          />
          {errors.fullName && (
            <FieldError id="name-error">{errors.fullName}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            name="email"
            maxLength={254}
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="bg-background"
          />
          <FieldDescription id="email-description">
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
          {errors.email && (
            <FieldError id="email-error">{errors.email}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            name="password"
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : "password-description"
            }
            className="bg-background"
          />
          <FieldDescription id="password-description">
            Must be at least {MIN_PASSWORD_LENGTH} characters long.
          </FieldDescription>
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            required
            name="confirmPassword"
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? "confirm-password-error"
                : "confirm-password-description"
            }
            className="bg-background"
          />
          <FieldDescription id="confirm-password-description">
            Please confirm your password.
          </FieldDescription>
          {errors.confirmPassword && (
            <FieldError id="confirm-password-error">
              {errors.confirmPassword}
            </FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmittingSignUp || createdAccount}>
            {isSubmittingSignUp
              ? "Creating Account..."
              : createdAccount
                ? "Check Your Email"
                : "Create Account"}
          </Button>
          {isErrorSignUp && (
            <FieldError className="text-center">
              {signUpError?.message}
            </FieldError>
          )}
          {isSuccessSignUp && (
            <FieldGroup>
              <FieldDescription className="text-green-500 text-center font-medium py-2">
                Account created successfully!
              </FieldDescription>
              <FieldDescription className="text-green-500 text-center font-black">
                Please check your email to verify your account.
              </FieldDescription>
            </FieldGroup>
          )}
        </Field>
        <Field>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
