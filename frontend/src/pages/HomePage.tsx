import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { SubscriptionConfirmationDialog } from "@/components/SubscriptionConfirmationDialog";
import { SelectFieldDialog } from "@/components/SelectFieldDialog";
import { subscribeToNewsletter } from "@/api/api";

export function HomePage() {
  // State for dialogs
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isSelectFieldDialogOpen, setIsSelectFieldDialogOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSelectFieldSave = async (email: string, field: string) => {
    try {
      const response = await subscribeToNewsletter({ email, field });
      console.log("Subscription successful:", response);
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("구독에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSelectFieldDialogOpen(false);
      setSubmittedEmail("");
    }
  };

  // Handler for when email is submitted from the Hero section input
  const handleHeroSubscribe = (email: string) => {
    setSubmittedEmail(email);
    setIsConfirmationDialogOpen(true);
  };

  const handleConfirmationSuccess = () => {
    setIsConfirmationDialogOpen(false);
    setIsSelectFieldDialogOpen(true);
  };

  const handleConfirmationDialogClose = (open: boolean) => {
    setIsConfirmationDialogOpen(open);
    if (!open) {
      setSubmittedEmail("");
    }
  };

  return (
    <>
      <main>
        <div className="text-sm text-gray-500">
          <Hero confirmationEmail={handleHeroSubscribe} />
        </div>
        <Features />
      </main>

      <SubscriptionConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        onOpenChange={handleConfirmationDialogClose}
        email={submittedEmail}
        onConfirm={handleConfirmationSuccess}
      />

      <SelectFieldDialog
        isOpen={isSelectFieldDialogOpen}
        onOpenChange={setIsSelectFieldDialogOpen}
        email={submittedEmail}
        onSave={handleSelectFieldSave}
      />
    </>
  );
}
