import AuthLayout from "@/app/components/auth/AuthLayout";
import ForgotPasswordForm from "@/app/components/auth/forgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
