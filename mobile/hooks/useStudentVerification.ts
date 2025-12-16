import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient, verificationApi } from "../utils/api";

interface University {
  _id: string;
  name: string;
  city?: string;
  state?: string;
  logo?: string;
}

interface EmailCheckResult {
  isValid: boolean;
  isStudent: boolean;
  university: University | null;
  message: string;
  isAcademicDomain?: boolean;
}

interface VerificationStatus {
  studentEmail: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  hasPendingVerification: boolean;
  pendingExpires: string | null;
  hasUniversity: boolean;
}

export const useStudentVerification = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);

  // Check email against university database
  const checkEmailMutation = useMutation({
    mutationFn: (email: string) => verificationApi.checkEmail(api, email),
    onSuccess: (response) => {
      setEmailCheckResult(response.data);
    },
  });

  // Start verification process
  const startVerificationMutation = useMutation({
    mutationFn: (studentEmail: string) => verificationApi.start(api, studentEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verificationStatus"] });
    },
  });

  // Verify with token/code
  const verifyMutation = useMutation({
    mutationFn: (token: string) => verificationApi.verify(api, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verificationStatus"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  // Resend verification email
  const resendMutation = useMutation({
    mutationFn: () => verificationApi.resend(api),
  });

  // Cancel pending verification
  const cancelMutation = useMutation({
    mutationFn: () => verificationApi.cancel(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verificationStatus"] });
      setEmailCheckResult(null);
    },
  });

  // Get current verification status
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["verificationStatus"],
    queryFn: () => verificationApi.getStatus(api),
    select: (response): VerificationStatus => response.data,
  });

  // Check email
  const checkEmail = async (email: string) => {
    try {
      const result = await checkEmailMutation.mutateAsync(email);
      return result.data as EmailCheckResult;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to check email");
    }
  };

  // Start verification
  const startVerification = async (studentEmail: string) => {
    try {
      const result = await startVerificationMutation.mutateAsync(studentEmail);
      return result.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to start verification");
    }
  };

  // Complete verification
  const verify = async (token: string) => {
    try {
      const result = await verifyMutation.mutateAsync(token);
      return result.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Verification failed");
    }
  };

  // Resend verification email
  const resend = async () => {
    try {
      const result = await resendMutation.mutateAsync();
      return result.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to resend verification");
    }
  };

  // Cancel verification
  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to cancel verification");
    }
  };

  return {
    // State
    emailCheckResult,
    status,
    statusLoading,

    // Loading states
    isCheckingEmail: checkEmailMutation.isPending,
    isStartingVerification: startVerificationMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isResending: resendMutation.isPending,
    isCancelling: cancelMutation.isPending,

    // Actions
    checkEmail,
    startVerification,
    verify,
    resend,
    cancel,
    refetchStatus,
    clearEmailCheck: () => setEmailCheckResult(null),
  };
};

export default useStudentVerification;
