import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { SubscriptionConfirmationDialog } from "@/components/SubscriptionConfirmationDialog";
import { SelectFieldDialog } from "@/components/SelectFieldDialog";
import { SubscribeCompleteDialog } from "@/components/SubscribeCompleteDialog";
import {
  emailRequestVerification,
  codeVerification,
  subscribeToNewsletter
} from "@/api/api";

export function HomePage() {
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isSelectFieldDialogOpen, setIsSelectFieldDialogOpen] = useState(false);
  const [isSubscribeCompleteDialogOpen, setIsSubscribeCompleteDialogOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

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
      await emailRequestVerification({ email });
      setIsConfirmationDialogOpen(true);
    } catch (error) {
      console.error("Email verification request failed:", error);
      alert("메일 전송에 실패했습니다. 다시 시도해주세요.");
      setSubmittedEmail("");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true);
    setVerificationError("");
    try {
      await codeVerification({ email: submittedEmail, code });
      
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
      await subscribeToNewsletter({ email, field });
      setIsSelectFieldDialogOpen(false);
      setIsSubscribeCompleteDialogOpen(true);
      setSubmittedEmail("");
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("구독에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleConfirmationDialogClose = (open: boolean) => {
    setIsConfirmationDialogOpen(open);
    if (!open) {
      setSubmittedEmail("");
      setVerificationError("");
    }
  };

  const handleSelectFieldDialogClose = (open: boolean) => {
    setIsSelectFieldDialogOpen(open);
    if (!open) {
      setSubmittedEmail("");
    }
  };

  const handleSubscribeCompleteDialogClose = (open: boolean) => {
      setIsSubscribeCompleteDialogOpen(open);
      if (!open) {
          setSubmittedEmail("");
          setVerificationError("");
      }
  };

  const handleSubscribeCompleteConfirm = () => { 
      setIsSubscribeCompleteDialogOpen(false); 
      setSubmittedEmail("");
      setVerificationError("");
  };

  const handleSubscribeCompleteCancel = () => { 
      setIsSubscribeCompleteDialogOpen(false); 
      setSubmittedEmail("");
      setVerificationError("");
  };

  return (
    <>
      <main>
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
