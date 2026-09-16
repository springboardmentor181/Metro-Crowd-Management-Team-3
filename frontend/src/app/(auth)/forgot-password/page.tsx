import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/forgotPasswordForm";

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
