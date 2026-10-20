import { Link, useLocation, useNavigate } from "react-router";
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
import { useState } from "react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { sanitizeText } from "@/utils/sanitize";
import { validateEmail } from "@/utils/validation";

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const { signIn, isSubmittingSignIn, isErrorSignIn, signInError } =
    useUserAccount();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginFormErrors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) nextErrors.email = emailError;
    if (!formData.password) nextErrors.password = "Password is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    signIn(
      {
        email: sanitizeText(formData.email, 254),
        password: formData.password,
      },
      {
        onSuccess: () => {
          const from = (location.state as { from?: string } | null)?.from;
          navigate(from ?? "/", { replace: true });
        },
      },
    );
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
      noValidate
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="m@example.com"
            maxLength={254}
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          {errors.email && (
            <FieldError id="login-email-error">{errors.email}</FieldError>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            placeholder="Enter your password"
            onChange={handleChange}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
          />
          {errors.password && (
            <FieldError id="login-password-error">
              {errors.password}
            </FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmittingSignIn}>
            {isSubmittingSignIn ? "Login..." : "Login"}
          </Button>
        </Field>
        <FieldGroup>
          {isErrorSignIn && (
            <FieldError className="text-center">
              {signInError?.message}
            </FieldError>
          )}
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </FieldGroup>
      </FieldGroup>
    </form>
  );
}
