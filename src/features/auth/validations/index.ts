import { z } from "zod";
import {
  blockedSignupEmailMessage,
  isBlockedSignupEmail,
} from "@/lib/auth/email-policy";

const signInEmailField = z
  .string()
  .email({ message: "Please enter a valid email address" });

const signupEmailField = signInEmailField.refine(
  (value) => !isBlockedSignupEmail(value),
  {
    message: blockedSignupEmailMessage,
  },
);

export const passwordMin8 = z
  .string()
  .min(8, {
    message: "Password must be at least 8 characters long",
  })
  .max(100);

export const authSchema = z.object({
  email: signInEmailField,
  password: z.string().min(1, { message: "Password is required" }).max(100),
});

export const signupSchema = z.object({
  email: signupEmailField,
  name: z.string(),
  password: passwordMin8,
});

export const forgotPasswordEmailSchema = z.object({
  email: signInEmailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordMin8,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
