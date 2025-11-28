import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { SubscriptionConfirmationDialog } from "@/components/SubscriptionConfirmationDialog";
import { SelectFieldDialog } from "@/components/SelectFieldDialog";
import { SubscribeCompleteDialog } from "@/components/SubscribeCompleteDialog"; // New import
import {
  emailRequestVerification,
  codeVerification,
  subscribeToNewsletter,
  generateQuestion
} from "@/api/api";

export function HomePage() {
  // State for dialogs
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isSelectFieldDialogOpen, setIsSelectFieldDialogOpen] = useState(false);
  const [isSubscribeCompleteDialogOpen, setIsSubscribeCompleteDialogOpen] = useState(false); // New state
  const [submittedEmail, setSubmittedEmail] = useState("");

  // State for API calls
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSendEmail = async (email: string) => {
    setSubmittedEmail(email);
    setIsSendingEmail(true);

    try {
      const response = await emailRequestVerification({ email });
      console.log("Email verification request successful:", response);
      setIsConfirmationDialogOpen(true);
    } catch (error) {
      console.error("Email verification request failed:", error);
      alert("메일 전송에 실패했습니다. 다시 시도해주세요.");
      setSubmittedEmail(""); // Clear email on failure
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    setVerificationError("");
    try {
      const response = await codeVerification({ email: submittedEmail, code });
      console.log("Code verification successful:", response);
      
      // Close confirmation dialog and open next step
      setIsConfirmationDialogOpen(false);
      setIsSelectFieldDialogOpen(true);
    } catch (error) {
      console.error("Code verification failed:", error);
      setVerificationError("인증번호가 올바르지 않거나 만료되었습니다.");
    }
    finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSelectFieldSave = async (email: string, field: string) => {
    try {
      const response = await subscribeToNewsletter({
        email,
        field,
      });
      console.log("Subscription successful:", response);
      setIsSubscribeCompleteDialogOpen(true); // Open complete dialog on success
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("구독에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSelectFieldDialogOpen(false);
      setSubmittedEmail(""); // Clear email after the final step
    }
  };

  const handleConfirmationDialogClose = (open: boolean) => {
    setIsConfirmationDialogOpen(open);
    if (!open) {
      // If the dialog is closed without confirming, reset.
      setSubmittedEmail("");
      setVerificationError("");
    }
  };

  const handleSelectFieldDialogClose = (open: boolean) => {
    setIsSelectFieldDialogOpen(open);
    if (!open) {
      // If the dialog is closed without saving, reset.
      setSubmittedEmail("");
    }
  };

  // New handlers for SubscribeCompleteDialog
  const handleSubscribeCompleteDialogClose = (open: boolean) => {
      setIsSubscribeCompleteDialogOpen(open);
      if (!open) {
          // Reset all relevant states if dialog is closed
          setSubmittedEmail("");
          setVerificationError("");
      }
  };

  const handleSubscribeCompleteConfirm = () => { // "다시 시작하기" (Start again)
      setIsSubscribeCompleteDialogOpen(false); // Close this dialog
      // Reset all states to allow a new subscription
      setSubmittedEmail("");
      setVerificationError("");
      // No explicit action needed for Hero as it resets its email input on submit.
  };

  const handleSubscribeCompleteCancel = () => { // "홈으로 가기" (Go to home)
      setIsSubscribeCompleteDialogOpen(false); // Close this dialog
      // Reset all states, similar to confirm for now.
      setSubmittedEmail("");
      setVerificationError("");
      // Future: Could implement navigation to an actual home page here.
  };

  const handeleGenerateQuestion = async () => {
    try {
      const response = await generateQuestion();
      console.log("Question Generation successful:", response);
    } catch (error) {
      console.error("Question Generation failed:", error);
      alert("질문 생성에 실패했습니다. 다시 시도해주세요.");
    } 
  }

  return (
    <>
      <main>
        <button onClick={handeleGenerateQuestion}>ai질문 생성</button>
        <div className="text-sm text-gray-500">
          <Hero
            confirmationEmail={handleSendEmail}
            isSendingEmail={isSendingEmail}
          />
        </div>
        <Features />
      </main>

      <SubscriptionConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        onOpenChange={handleConfirmationDialogClose}
        email={submittedEmail}
        onConfirm={handleVerifyCode}
        isLoading={isVerifyingCode}
        errorMessage={verificationError}
      />

      <SelectFieldDialog
        isOpen={isSelectFieldDialogOpen}
        onOpenChange={handleSelectFieldDialogClose}
        email={submittedEmail}
        onSave={handleSelectFieldSave}
      />

      {/* New SubscribeCompleteDialog */}
      <SubscribeCompleteDialog
        isOpen={isSubscribeCompleteDialogOpen}
        onOpenChange={handleSubscribeCompleteDialogClose}
        onConfirm={handleSubscribeCompleteConfirm}
        onCancle={handleSubscribeCompleteCancel}
      />
    </>
  );
}
